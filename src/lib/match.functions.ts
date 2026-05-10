import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import {
  selectQuestionsFor,
  generateRoomCode,
  calcBotElo,
  insertMatchQuestions,
  simulateBotScore,
  simulateBotSubmitDelaySec,
  processMatchResultServer,
} from "./match.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

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

    const { data: user } = await supabaseAdmin
      .from("users")
      .select(eloField)
      .eq("id", userId)
      .single();

    const playerElo = ((user as Record<string, number> | null)?.[eloField]) ?? 1000;

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

    const questions = await selectQuestionsFor(
      match.match_type as "verbal" | "math",
      userId,
    );
    await insertMatchQuestions(match.id, questions);

    const { error: updErr } = await supabaseAdmin
      .from("matches")
      .update({ player2_id: userId, status: "active" })
      .eq("id", match.id);
    if (updErr) throw updErr;

    return { match_id: match.id };
  });

export const submitMatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ matchId: z.string().uuid() }).parse(input),
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

    // Count score for this user
    const { data: answers } = await supabaseAdmin
      .from("match_answers")
      .select("is_correct")
      .eq("match_id", data.matchId)
      .eq("user_id", userId);
    const score = (answers ?? []).filter((a) => a.is_correct).length;

    const update: Record<string, unknown> = {};
    if (isP1) {
      update.player1_score = score;
      update.player1_submitted_at = new Date().toISOString();
    } else {
      update.player2_score = score;
      update.player2_submitted_at = new Date().toISOString();
    }

    await supabaseAdmin.from("matches").update(update).eq("id", data.matchId);

    // If bot match, simulate bot now
    if (match.is_bot_match) {
      const botScore = simulateBotScore(match.bot_elo ?? 1000);
      const delay = simulateBotSubmitDelaySec(match.bot_elo ?? 1000);
      const submittedAt = new Date(
        new Date(match.created_at).getTime() + delay * 1000,
      ).toISOString();
      await supabaseAdmin
        .from("matches")
        .update({
          player2_score: botScore,
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
  .inputValidator((input: unknown) =>
    z.object({ matchId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    return processMatchResultServer(data.matchId);
  });
