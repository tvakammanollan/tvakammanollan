import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { writeTolerant } from "./schema-tolerant.server";
import type { Database } from "@/integrations/supabase/types";
import { selectQuestionsFor, insertMatchQuestions } from "./match.server";
import { limits } from "./rate-limit";
import { assertRateLimit } from "./rate-limit.server";

const MatchTypeSchema = z.enum(["verbal", "math"]);

function eloField(t: "verbal" | "math") {
  return t === "verbal" ? "elo_verbal" : "elo_math";
}

async function getMyElo(userId: string, t: "verbal" | "math"): Promise<number> {
  const field = eloField(t);
  const { data } = await supabaseAdmin.from("users").select(field).eq("id", userId).single();
  return (data as Record<string, number> | null)?.[field] ?? 1000;
}

export const joinRankedQueue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ match_type: MatchTypeSchema }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    assertRateLimit(`mm:${userId}`, limits.matchmaking);
    const elo = await getMyElo(userId, data.match_type);

    // Upsert queue entry (player_id is unique)
    const { error } = await supabaseAdmin.from("matchmaking_queue").upsert(
      {
        player_id: userId,
        match_type: data.match_type,
        player_elo: elo,
        status: "waiting",
        match_id: null,
        joined_at: new Date().toISOString(),
      },
      { onConflict: "player_id" },
    );
    if (error) throw error;

    return { ok: true, elo };
  });

export const cancelRankedQueue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    await supabaseAdmin
      .from("matchmaking_queue")
      .delete()
      .eq("player_id", userId)
      .eq("status", "waiting");
    return { ok: true };
  });

export const pollRankedMatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        match_type: MatchTypeSchema,
        elo_range: z.number().int().min(50).max(2000).default(200),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;

    // 1. Check own row — maybe paired by someone else already.
    const { data: ownRow } = await supabaseAdmin
      .from("matchmaking_queue")
      .select("status, match_id, player_elo")
      .eq("player_id", userId)
      .maybeSingle();

    if (!ownRow) {
      return { status: "expired" as const };
    }
    if (ownRow.status === "matched" && ownRow.match_id) {
      return { status: "matched" as const, match_id: ownRow.match_id };
    }

    const myElo = ownRow.player_elo;
    const minElo = Math.max(0, myElo - data.elo_range);
    const maxElo = myElo + data.elo_range;

    // 2. Look for an opponent.
    const { data: candidates } = await supabaseAdmin
      .from("matchmaking_queue")
      .select("player_id, player_elo, joined_at")
      .eq("match_type", data.match_type)
      .eq("status", "waiting")
      .neq("player_id", userId)
      .gte("player_elo", minElo)
      .lte("player_elo", maxElo)
      .order("joined_at", { ascending: true })
      .limit(10);

    const opponent = (candidates ?? [])
      .slice()
      .sort((a, b) => Math.abs(a.player_elo - myElo) - Math.abs(b.player_elo - myElo))[0];

    if (!opponent) {
      return { status: "waiting" as const, min_elo: minElo, max_elo: maxElo };
    }

    // 3. Deterministic creator: lower uuid (lex) creates the match.
    const isCreator = userId < opponent.player_id;
    if (!isCreator) {
      // Opponent will create. Wait for our row to flip.
      return { status: "waiting" as const, min_elo: minElo, max_elo: maxElo };
    }

    // 4. Create the match (admin) and questions, then atomically pair both queue rows.
    const questions = await selectQuestionsFor(data.match_type, userId);

    // `started_at` är valfri tills migrationen körts — se schema-tolerant.server.
    const { data: match, error: insErr } = await writeTolerant(
      {
        match_type: data.match_type,
        player1_id: userId,
        player2_id: opponent.player_id,
        status: "active",
        is_bot_match: false,
        is_ranked: true,
        // Rankad match är spelbar direkt — båda står redan i kön.
        started_at: new Date().toISOString(),
      },
      ["started_at"],
      (payload) =>
        supabaseAdmin
          .from("matches")
          .insert(payload as Database["public"]["Tables"]["matches"]["Insert"])
          .select("id")
          .single(),
    );
    if (insErr || !match) throw insErr ?? new Error("Could not create match");

    await insertMatchQuestions(match.id, questions);

    const { data: paired, error: pairErr } = await supabaseAdmin.rpc("pair_ranked_match", {
      p_creator: userId,
      p_opponent: opponent.player_id,
      p_match_id: match.id,
    });
    if (pairErr) throw pairErr;

    if (!paired) {
      // Race lost — clean up the match we created.
      await supabaseAdmin.from("match_questions").delete().eq("match_id", match.id);
      await supabaseAdmin.from("matches").delete().eq("id", match.id);
      return { status: "waiting" as const, min_elo: minElo, max_elo: maxElo };
    }

    return { status: "matched" as const, match_id: match.id };
  });
