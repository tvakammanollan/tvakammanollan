import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type WordQuestion = {
  id: string;
  question_text: string;
  options: { id: string; text: string }[];
  correct_answer: string;
  source: string | null;
};

export const fetchWordBatch = createServerFn({ method: "GET" })
  .inputValidator(
    (data: {
      count?: number;
      exclude?: string[];
      excludeCorrectForUserId?: string;
      sourceFilter?: "all" | "hp" | "list";
      difficulties?: number[];
    }) =>
      z
        .object({
          count: z.number().int().min(1).max(50).optional().default(20),
          exclude: z.array(z.string().uuid()).optional().default([]),
          excludeCorrectForUserId: z.string().uuid().optional(),
          sourceFilter: z.enum(["all", "hp", "list"]).optional().default("all"),
          difficulties: z.array(z.number().int().min(1).max(3)).optional().default([]),
        })
        .parse(data ?? {}),
  )
  .handler(async ({ data }) => {
    const supabase = supabaseAdmin;
    let excludeIds = new Set(data.exclude);
    if (data.excludeCorrectForUserId) {
      const { data: correctRows } = await supabase
        .from("user_word_correct")
        .select("question_id")
        .eq("user_id", data.excludeCorrectForUserId);
      for (const r of correctRows ?? []) excludeIds.add(r.question_id as string);
    }
    let query = supabase
      .from("questions")
      .select("id,question_text,options,correct_answer,source,difficulty")
      .eq("category", "ORD")
      .limit(10000);
    if (data.sourceFilter === "hp") query = query.not("source", "is", null);
    else if (data.sourceFilter === "list") query = query.is("source", null);
    if (data.difficulties.length > 0) query = query.in("difficulty", data.difficulties);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    const filtered = (rows ?? []).filter(
      (r: { id: string }) => !excludeIds.has(r.id as string),
    );
    for (let i = filtered.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
    }
    return {
      questions: filtered.slice(0, data.count) as unknown as WordQuestion[],
    };
  });

export const getWordProgress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const [{ count: total }, { count: correct }] = await Promise.all([
      supabaseAdmin
        .from("questions")
        .select("id", { count: "exact", head: true })
        .eq("category", "ORD"),
      supabaseAdmin
        .from("user_word_correct")
        .select("question_id", { count: "exact", head: true })
        .eq("user_id", userId),
    ]);
    return { correctCount: correct ?? 0, totalCount: total ?? 0, userId };
  });

export const countOrdQuestions = createServerFn({ method: "GET" }).handler(
  async () => {
    const supabase = supabaseAdmin;
    const { count, error } = await supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("category", "ORD");
    if (error) throw new Error(error.message);
    return { count: count ?? 0 };
  },
);

export const getOrdFilterCounts = createServerFn({ method: "GET" }).handler(
  async () => {
    const supabase = supabaseAdmin;
    const head = (q: ReturnType<typeof supabase.from>) =>
      q.select("id", { count: "exact", head: true });
    const base = () => supabase.from("questions").eq("category", "ORD");
    const [all, hp, list, easy, mid, hard] = await Promise.all([
      head(base()),
      head(base().not("source", "is", null)),
      head(base().is("source", null)),
      head(base().eq("difficulty", 1)),
      head(base().eq("difficulty", 2)),
      head(base().eq("difficulty", 3)),
    ]);
    return {
      all: all.count ?? 0,
      hp: hp.count ?? 0,
      list: list.count ?? 0,
      easy: easy.count ?? 0,
      medium: mid.count ?? 0,
      hard: hard.count ?? 0,
    };
  },
);

// Record one practice answer for the signed-in user.
export const recordOrdAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { correct: boolean; questionId?: string }) =>
    z
      .object({
        correct: z.boolean(),
        questionId: z.string().uuid().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    // Mark this question as "correctly answered" for this user (idempotent).
    if (data.correct && data.questionId) {
      await supabaseAdmin
        .from("user_word_correct")
        .upsert(
          { user_id: userId, question_id: data.questionId },
          { onConflict: "user_id,question_id", ignoreDuplicates: true },
        );
    }
    const { data: existing } = await supabaseAdmin
      .from("ord_practice_stats")
      .select("correct_count, total_count")
      .eq("user_id", userId)
      .maybeSingle();

    const newTotal = (existing?.total_count ?? 0) + 1;
    const newCorrect = (existing?.correct_count ?? 0) + (data.correct ? 1 : 0);

    const { error } = await supabaseAdmin
      .from("ord_practice_stats")
      .upsert(
        {
          user_id: userId,
          correct_count: newCorrect,
          total_count: newTotal,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    if (error) throw new Error(error.message);
    return { correct_count: newCorrect, total_count: newTotal };
  });

export type OrdLeaderboardRow = {
  rank: number;
  user_id: string;
  username: string;
  correct_count: number;
  total_count: number;
  accuracy: number;
};

// Returns top 100 + the signed-in user's row (whether or not they're in top).
export const fetchOrdLeaderboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data, error } = await supabaseAdmin.rpc("get_ord_leaderboard");
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as OrdLeaderboardRow[];
    const top = rows.slice(0, 100);
    const me = rows.find((r) => r.user_id === userId) ?? null;
    return { top, me };
  });
