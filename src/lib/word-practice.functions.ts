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
  definition: string | null;
  definition_source: string | null;
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
      .select("id,question_text,options,correct_answer,source,difficulty,definition,definition_source")
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
    const base = () =>
      supabase
        .from("questions")
        .select("id", { count: "exact", head: true })
        .eq("category", "ORD");
    const [all, hp, list, easy, mid, hard] = await Promise.all([
      base(),
      base().not("source", "is", null),
      base().is("source", null),
      base().eq("difficulty", 1),
      base().eq("difficulty", 2),
      base().eq("difficulty", 3),
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

    const MASTERY_STREAK = 5; // consecutive correct reviews to graduate a word

    if (data.questionId) {
      if (data.correct) {
        await supabaseAdmin
          .from("user_word_correct")
          .upsert(
            { user_id: userId, question_id: data.questionId },
            { onConflict: "user_id,question_id", ignoreDuplicates: true },
          );
        // SM-2 update for previously-failed words
        const { data: failed } = await supabaseAdmin
          .from("user_word_failed")
          .select("review_streak, interval_days, ease_factor")
          .eq("user_id", userId)
          .eq("question_id", data.questionId)
          .maybeSingle();
        if (failed) {
          const newStreak = (failed.review_streak as number) + 1;
          if (newStreak >= MASTERY_STREAK) {
            // Word mastered — remove from failed list
            await supabaseAdmin
              .from("user_word_failed")
              .delete()
              .eq("user_id", userId)
              .eq("question_id", data.questionId);
          } else {
            const ef = Math.min(2.5, (failed.ease_factor as number) + 0.1);
            const newInterval = Math.min(Math.round((failed.interval_days as number) * ef), 180);
            const nextReview = new Date(Date.now() + newInterval * 86400_000).toISOString();
            await supabaseAdmin
              .from("user_word_failed")
              .update({ review_streak: newStreak, interval_days: newInterval, ease_factor: ef, next_review_at: nextReview })
              .eq("user_id", userId)
              .eq("question_id", data.questionId);
          }
        }
      } else {
        // Wrong answer — fetch existing row for fail_count and reset SR
        const { data: existing } = await supabaseAdmin
          .from("user_word_failed")
          .select("fail_count, ease_factor")
          .eq("user_id", userId)
          .eq("question_id", data.questionId)
          .maybeSingle();
        const ef = Math.max(1.3, ((existing?.ease_factor as number) ?? 2.5) - 0.3);
        const nextReview = new Date(Date.now() + 86400_000).toISOString();
        await supabaseAdmin
          .from("user_word_failed")
          .upsert(
            {
              user_id: userId,
              question_id: data.questionId,
              fail_count: ((existing?.fail_count as number) ?? 0) + 1,
              review_streak: 0,
              ease_factor: ef,
              interval_days: 1,
              last_failed_at: new Date().toISOString(),
              next_review_at: nextReview,
            },
            { onConflict: "user_id,question_id" },
          );
      }
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

// Fetch words the user has previously failed, sorted by due date (spaced repetition).
export const fetchFailedWordBatch = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { count?: number }) =>
    z.object({ count: z.number().int().min(1).max(50).optional().default(20) }).parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: failedRows } = await supabaseAdmin
      .from("user_word_failed")
      .select("question_id, fail_count, next_review_at, review_streak")
      .eq("user_id", userId)
      .order("next_review_at", { ascending: true })
      .limit(data.count);

    if (!failedRows || failedRows.length === 0) return { questions: [] };

    const ids = failedRows.map((r: { question_id: string }) => r.question_id);
    const { data: rows, error } = await supabaseAdmin
      .from("questions")
      .select("id,question_text,options,correct_answer,source,difficulty,definition,definition_source")
      .in("id", ids);
    if (error) throw new Error(error.message);

    // Preserve order from failedRows (due first)
    const byId = new Map((rows ?? []).map((r: { id: string }) => [r.id, r]));
    const questions = failedRows
      .map((fr: { question_id: string }) => byId.get(fr.question_id))
      .filter(Boolean);

    return { questions: questions as unknown as WordQuestion[] };
  });

// Count how many words this user has in their failed-words list.
export const getFailedWordCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { count } = await supabaseAdmin
      .from("user_word_failed")
      .select("question_id", { count: "exact", head: true })
      .eq("user_id", userId);
    return { count: count ?? 0 };
  });

export type FailedWordEntry = {
  question_id: string;
  question_text: string;
  fail_count: number;
  review_streak: number;
  interval_days: number;
  next_review_at: string;
  last_failed_at: string;
};

// Full list of failed words with question text and SR progress.
export const getFailedWordsList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: rows } = await supabaseAdmin
      .from("user_word_failed")
      .select("question_id, fail_count, review_streak, interval_days, next_review_at, last_failed_at")
      .eq("user_id", userId)
      .order("next_review_at", { ascending: true });
    if (!rows || rows.length === 0) return { words: [] as FailedWordEntry[] };

    const ids = rows.map((r: { question_id: string }) => r.question_id);
    const { data: questions } = await supabaseAdmin
      .from("questions")
      .select("id, question_text")
      .in("id", ids);

    const textById = new Map((questions ?? []).map((q: { id: string; question_text: string }) => [q.id, q.question_text]));
    const MASTERY_STREAK = 5;
    const words: FailedWordEntry[] = rows.map((r: {
      question_id: string; fail_count: number; review_streak: number;
      interval_days: number; next_review_at: string; last_failed_at: string;
    }) => ({
      question_id: r.question_id,
      question_text: (textById.get(r.question_id) ?? "").toLowerCase(),
      fail_count: r.fail_count,
      review_streak: r.review_streak,
      interval_days: r.interval_days,
      next_review_at: r.next_review_at,
      last_failed_at: r.last_failed_at,
      mastery_streak: MASTERY_STREAK,
    }));
    return { words };
  });

export type OrdLeaderboardRow = {
  rank: number;
  user_id: string;
  username: string;
  correct_count: number;
  total_count: number;
  accuracy: number;
};

// Returns top N + (optionally) a given user's row, whether or not they're in top.
// PUBLIC — no auth required, exactly like the verbal/math `fetchLeaderboard`.
// The leaderboard page is viewable by logged-out visitors, so requiring auth here
// caused a 401 that crashed the client with a "reading 'filter'" TypeError.
// The signed-in user's id is passed as an optional arg purely to highlight their row.
export const fetchOrdLeaderboard = createServerFn({ method: "GET" })
  .inputValidator((data: { user_id?: string } | undefined) =>
    z.object({ user_id: z.string().uuid().optional() }).parse(data ?? {}),
  )
  .handler(async ({ data }) => {
    const userId = data.user_id ?? null;
    // Hämta från ord_practice_stats (redan aggregerad per användare).
    // Bypass RPC + filter — alla som har minst 1 svar syns.
    const { data: stats, error } = await supabaseAdmin
      .from("ord_practice_stats")
      .select("user_id, correct_count, total_count")
      .gte("total_count", 1)
      .order("correct_count", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);

    const statsRows = (stats ?? []) as Array<{
      user_id: string;
      correct_count: number;
      total_count: number;
    }>;

    const userIds = statsRows.map((s) => s.user_id);
    const nameMap = new Map<string, string>();
    if (userIds.length) {
      const { data: us } = await supabaseAdmin
        .from("users")
        .select("id, username")
        .in("id", userIds);
      for (const u of us ?? [])
        nameMap.set(u.id as string, (u.username as string) ?? "");
    }

    const top: OrdLeaderboardRow[] = statsRows
      .map((s) => ({
        rank: 0,
        user_id: s.user_id,
        username: nameMap.get(s.user_id) ?? "",
        correct_count: s.correct_count,
        total_count: s.total_count,
        accuracy:
          s.total_count > 0
            ? Math.round((s.correct_count * 100) / s.total_count)
            : 0,
      }))
      .slice(0, 100)
      .map((r, i) => ({ ...r, rank: i + 1 }));

    // Fetch "me" row separately if not in top — from samma stats-tabell.
    let me: OrdLeaderboardRow | null = userId
      ? (top.find((r) => r.user_id === userId) ?? null)
      : null;
    if (!me && userId) {
      const { data: meRow } = await supabaseAdmin
        .from("ord_practice_stats")
        .select("correct_count, total_count")
        .eq("user_id", userId)
        .maybeSingle();
      if (meRow) {
        const correct = (meRow.correct_count as number) ?? 0;
        const total = (meRow.total_count as number) ?? 0;
        me = {
          rank: 0,
          user_id: userId,
          username: "",
          correct_count: correct,
          total_count: total,
          accuracy: total > 0 ? Math.round((correct * 100) / total) : 0,
        };
      }
    }
    return { top, me };
  });
