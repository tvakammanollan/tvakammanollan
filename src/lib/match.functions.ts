import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import {
  selectQuestionsFor,
  generateRoomCode,
  calcBotElo,
  insertMatchQuestions,
  simulateBotMatch,
  processMatchResultServer,
} from "./match.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { checkMatchQuota } from "./match-abuse";
import { limits } from "./rate-limit";
import { assertRateLimit } from "./rate-limit.server";
import type { Database } from "@/integrations/supabase/types";

export const createMatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        match_type: z.enum(["verbal", "math"]),
        mode: z.enum(["bot", "private"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const eloField = data.match_type === "verbal" ? "elo_verbal" : "elo_math";

    // Billigt första lager (per isolat) — bromsar ren hamring.
    assertRateLimit(`match:${userId}`, limits.matchCreate);

    // Riktiga kvoten: räknas ur `matches`, precis som forumets. Gäller ALLA
    // lägen, botmatcher inkluderade — undantaget för bot var hålet som lät
    // fyra konton odla 20–300 matcher var på ett dygn (se `match-abuse.ts`).
    const now = Date.now();
    const hourAgo = new Date(now - 60 * 60 * 1000).toISOString();
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

    const { count: lastDay, error: quotaErr } = await supabaseAdmin
      .from("matches")
      .select("id", { count: "exact", head: true })
      .eq("player1_id", userId)
      .gte("created_at", dayAgo);
    if (quotaErr) {
      console.error("[match] kunde inte läsa dygnskvot:", quotaErr.message);
      throw new Error("Kunde inte starta matchen. Försök igen.");
    }

    let lastHour = 0;
    if ((lastDay ?? 0) > 0) {
      const { count, error } = await supabaseAdmin
        .from("matches")
        .select("id", { count: "exact", head: true })
        .eq("player1_id", userId)
        .gte("created_at", hourAgo);
      if (error) {
        console.error("[match] kunde inte läsa timkvot:", error.message);
        throw new Error("Kunde inte starta matchen. Försök igen.");
      }
      lastHour = count ?? 0;
    }

    const quota = checkMatchQuota(lastHour, lastDay ?? 0);
    if (!quota.ok) throw new Error(quota.message);

    // 30s cooldown mellan matchskapande för att förhindra automatiserad spam.
    // Gäller bara private rooms — bot-matcher tillåts utan cooldown eftersom
    // gäst-flödet (Hitta match → bot) annars stuprör direkt vid retry.
    // Volymkvoten ovan täcker botläget i stället.
    if (data.mode === "private") {
      const { data: lastMatch } = await supabaseAdmin
        .from("matches")
        .select("created_at")
        .eq("player1_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (lastMatch?.created_at) {
        const ageMs = Date.now() - new Date(lastMatch.created_at).getTime();
        if (ageMs < 30_000) {
          const wait = Math.ceil((30_000 - ageMs) / 1000);
          throw new Error(`Vänta ${wait} sek innan du startar nästa match.`);
        }
      }
    }

    const { data: user } = await supabaseAdmin
      .from("users")
      .select(eloField)
      .eq("id", userId)
      .single();

    const playerElo = (user as Record<string, number> | null)?.[eloField] ?? 1000;

    if (data.mode === "bot") {
      const botElo = calcBotElo(playerElo);
      const questions = await selectQuestionsFor(data.match_type, userId);

      const { data: match, error } = await supabaseAdmin
        .from("matches")
        .insert({
          match_type: data.match_type,
          player1_id: userId,
          status: "active",
          is_bot_match: true,
          bot_elo: botElo,
          // Botmatchen är spelbar i samma stund raden finns.
          started_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error || !match) throw error ?? new Error("Could not create match");

      await insertMatchQuestions(match.id, questions);

      return { match_id: match.id, bot_elo: botElo };
    }

    // Private room
    const room_code = await generateRoomCode();
    const { data: match, error } = await supabaseAdmin
      .from("matches")
      .insert({
        match_type: data.match_type,
        player1_id: userId,
        status: "waiting",
        is_bot_match: false,
        room_code,
      })
      .select()
      .single();
    if (error || !match) throw error ?? new Error("Could not create room");

    return { match_id: match.id, room_code };
  });

export const joinMatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ room_code: z.string().min(3).max(10) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const code = data.room_code.toUpperCase();

    const { data: match, error } = await supabaseAdmin
      .from("matches")
      .select("*")
      .eq("room_code", code)
      .eq("status", "waiting")
      .maybeSingle();
    if (error) throw error;
    if (!match) throw new Error("Rummet finns inte eller har redan startat.");
    if (match.player1_id === userId) throw new Error("Du kan inte gå med i ditt eget rum.");
    if (match.player2_id) throw new Error("Rummet är redan fullt.");

    const questions = await selectQuestionsFor(match.match_type as "verbal" | "math", userId);
    await insertMatchQuestions(match.id, questions);

    const { error: updErr } = await supabaseAdmin
      .from("matches")
      // Klockan startar här — inte när rummet öppnades. Väntetiden i rummet
      // är inte speltid och ska inte redovisas som sådan.
      .update({ player2_id: userId, status: "active", started_at: new Date().toISOString() })
      .eq("id", match.id);
    if (updErr) throw updErr;

    return { match_id: match.id };
  });

/**
 * Svaren som klienten skickar med inlämningen.
 *
 * De sparas löpande under matchen också (`persistAnswer`), men den vägen går
 * via klientens egen Supabase-anslutning och kan misslyckas tyst: en RLS-miss,
 * ett tappat nät eller en flik som sövs ger ett `console.error` som ingen ser
 * och noll rader i `match_answers`. Resultatet blev "0/8" bredvid åtta svarade
 * frågor. Med svaren i inlämningen skrivs de en gång till, med service role,
 * i samma anrop som rättar dem.
 *
 * `is_correct` kommer aldrig härifrån — den räknas alltid ur `correct_answer`
 * på servern. Bara *vilket* alternativ som valdes är klientens att bestämma.
 */
const submittedAnswersSchema = z
  .array(
    z.object({
      question_id: z.string().uuid(),
      selected_answer: z.string().max(8).nullable(),
      time_spent_seconds: z.number().int().min(0).max(3600).nullable().optional(),
    }),
  )
  .max(64)
  .optional();

export const submitMatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ matchId: z.string().uuid(), answers: submittedAnswersSchema }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const { data: match, error } = await supabaseAdmin
      .from("matches")
      .select("*")
      .eq("id", data.matchId)
      .single();
    if (error || !match) throw error ?? new Error("Match not found");

    const isP1 = match.player1_id === userId;
    const isP2 = match.player2_id === userId;
    if (!isP1 && !isP2) throw new Error("Inte din match");

    // En färdigräknad match skrivs aldrig om. Utan spärren kunde en andra
    // inlämning (omladdning, dubbelklick, auto-inlämning som krockar med den
    // manuella) simulera boten en gång till EFTER att vinnaren avgjorts: raden
    // fick en ny motståndarpoäng medan `winner_id` stod kvar från den gamla.
    // Resultatsidan visade då en vinnare som inte stämde med poängen — eller
    // "oavgjort" bredvid 6–3.
    if (match.status === "finished") {
      return { ok: true, result: { alreadyFinished: true as const } };
    }

    const alreadySubmitted = isP1 ? match.player1_submitted_at : match.player2_submitted_at;
    if (alreadySubmitted) {
      // Egen inlämning finns redan. Rör inte poängen — försök bara räkna klart,
      // ifall motparten hann in emellan.
      const result = await processMatchResultServer(data.matchId);
      return { ok: true, result };
    }

    // Frågorna som faktiskt hör till matchen. Klientens svar sållas mot den
    // här listan — annars kunde vem som helst skicka in svar på frågor som
    // inte ingår, eller på en annan spelares match.
    const { data: matchQuestionRows } = await supabaseAdmin
      .from("match_questions")
      .select("question_id")
      .eq("match_id", data.matchId);
    const matchQuestionIds = new Set((matchQuestionRows ?? []).map((r) => r.question_id));

    if (data.answers && data.answers.length > 0) {
      const rows = data.answers
        .filter((a) => matchQuestionIds.has(a.question_id))
        .map((a) => ({
          match_id: data.matchId,
          user_id: userId,
          question_id: a.question_id,
          selected_answer: a.selected_answer,
          // Räknas om nedan ur facit — värdet här är bara en platshållare.
          is_correct: false,
          time_spent_seconds: a.time_spent_seconds ?? null,
        }));
      if (rows.length > 0) {
        const { error: upsertErr } = await supabaseAdmin
          .from("match_answers")
          .upsert(rows, { onConflict: "match_id,user_id,question_id" });
        if (upsertErr) {
          // Loggas men stoppar inte inlämningen: det som redan hunnit sparas
          // under matchen rättas ändå nedan.
          console.error("[match] kunde inte spara inskickade svar:", upsertErr.message);
        }
      }
    }

    // Recompute correctness server-side; never trust client-supplied is_correct
    const { data: answers } = await supabaseAdmin
      .from("match_answers")
      .select("id, question_id, selected_answer, questions:question_id(correct_answer)")
      .eq("match_id", data.matchId)
      .eq("user_id", userId);

    let score = 0;
    for (const a of answers ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const correct = (a as any).questions?.correct_answer ?? null;
      const isCorrect = a.selected_answer != null && a.selected_answer === correct;
      if (isCorrect) score += 1;
      // Persist authoritative is_correct value
      if (a.selected_answer != null || a.id) {
        await supabaseAdmin.from("match_answers").update({ is_correct: isCorrect }).eq("id", a.id);
      }
    }

    const update: Record<string, unknown> = {};
    if (isP1) {
      update.player1_score = score;
      update.player1_submitted_at = new Date().toISOString();
    } else {
      update.player2_score = score;
      update.player2_submitted_at = new Date().toISOString();
    }

    await supabaseAdmin
      .from("matches")
      .update(update as Database["public"]["Tables"]["matches"]["Update"])
      .eq("id", data.matchId);

    // If bot match, simulate bot now using per-question category accuracy.
    // Bara en gång: `player2_submitted_at` är boten som redan spelat.
    if (match.is_bot_match && !match.player2_submitted_at) {
      const { data: mqRows } = await supabaseAdmin
        .from("match_questions")
        .select("question_id, questions:question_id(category)")
        .eq("match_id", data.matchId);
      const botQs = (mqRows ?? []).map((row) => ({
        id: row.question_id as string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        category: ((row as any).questions?.category ?? "ORD") as string,
      }));
      const sim = simulateBotMatch(match.bot_elo ?? 1000, botQs);
      console.log("[bot] sim", {
        botElo: match.bot_elo,
        score: sim.score,
        submitTimeSeconds: sim.submitTimeSeconds,
        correctIds: sim.correctQuestionIds,
      });
      const submittedAt = new Date(
        new Date(match.started_at ?? match.created_at).getTime() + sim.submitTimeSeconds * 1000,
      ).toISOString();
      await supabaseAdmin
        .from("matches")
        .update({
          player2_score: sim.score,
          player2_submitted_at: submittedAt,
        })
        .eq("id", data.matchId);
    }

    // Try to process result (will no-op if both haven't submitted)
    const result = await processMatchResultServer(data.matchId);
    return { ok: true, result };
  });

export const processMatchResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ matchId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: m } = await supabaseAdmin
      .from("matches")
      .select("player1_id, player2_id")
      .eq("id", data.matchId)
      .single();
    if (!m || (m.player1_id !== userId && m.player2_id !== userId)) {
      throw new Response("Forbidden", { status: 403 });
    }
    // `force`: resultatsidan frågar när den väntat färdigt. Har motparten
    // aldrig lämnat in räknas matchen på det som hann sparas (se
    // FORCE_FINISH_AFTER_MS) i stället för att bli stående för evigt.
    return processMatchResultServer(data.matchId, { force: true });
  });
