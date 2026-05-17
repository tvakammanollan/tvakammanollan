import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface RecentMatch {
  id: string;
  match_type: string;
  is_bot_match: boolean;
  player1_score: number | null;
  player2_score: number | null;
  winner_id: string | null;
  player1_id: string;
  player2_id: string | null;
  p1_name: string | null;
  p2_name: string | null;
  bot_elo?: number | null;
}

export interface LandingStats {
  totalMatches: number;
  totalPlayers: number;
  /** Best-effort "online now" — players who finished a match in the last 15 min. */
  activePlayers: number;
  /** Matches finished in the last minute — for the "live" feel. */
  matchesPerMin: number;
  /** Highest verbal ELO across all users right now. */
  topVerbalElo: number;
  /** Highest math ELO across all users right now. */
  topMathElo: number;
  recent: RecentMatch[];
}

export const getLandingStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<LandingStats> => {
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const oneMinAgo = new Date(Date.now() - 60 * 1000).toISOString();

    // Wrap each query so a single failure (RLS, network, missing col) doesn't
    // bring down the whole landing page.
    const safe = <T,>(p: PromiseLike<T>, fallback: unknown): Promise<T> =>
      Promise.resolve(p).then(
        (v) => v,
        () => fallback as T,
      );

    const [
      matchesCount,
      usersCount,
      activeAgg,
      perMinAgg,
      recent,
      topVerbal,
      topMath,
    ] = await Promise.all([
        safe(
          supabaseAdmin
            .from("matches")
            .select("*", { count: "exact", head: true })
            .eq("status", "finished"),
          { count: 0 } as { count: number | null },
        ),
        safe(
          supabaseAdmin
            .from("users")
            .select("*", { count: "exact", head: true }),
          { count: 0 } as { count: number | null },
        ),
        safe(
          supabaseAdmin
            .from("matches")
            .select("player1_id,player2_id", { head: false })
            .gte("created_at", fifteenMinAgo)
            .eq("status", "finished"),
          { data: [] } as {
            data: Array<{ player1_id: string | null; player2_id: string | null }>;
          },
        ),
        safe(
          supabaseAdmin
            .from("matches")
            .select("*", { count: "exact", head: true })
            .gte("created_at", oneMinAgo)
            .eq("status", "finished"),
          { count: 0 } as { count: number | null },
        ),
        safe(
          supabaseAdmin
            .from("matches")
            .select(
              "id, match_type, is_bot_match, player1_score, player2_score, winner_id, player1_id, player2_id",
            )
            .eq("status", "finished")
            .order("created_at", { ascending: false })
            .limit(10),
          { data: [] } as { data: never[] },
        ),
        safe(
          supabaseAdmin
            .from("users")
            .select("elo_verbal")
            .gte("games_played", 1)
            .order("elo_verbal", { ascending: false })
            .limit(1)
            .maybeSingle(),
          { data: null } as { data: { elo_verbal: number | null } | null },
        ),
        safe(
          supabaseAdmin
            .from("users")
            .select("elo_math")
            .gte("games_played", 1)
            .order("elo_math", { ascending: false })
            .limit(1)
            .maybeSingle(),
          { data: null } as { data: { elo_math: number | null } | null },
        ),
      ]);

    const activeIds = new Set<string>();
    for (const r of (activeAgg.data ?? []) as Array<{
      player1_id: string | null;
      player2_id: string | null;
    }>) {
      if (r.player1_id) activeIds.add(r.player1_id);
      if (r.player2_id) activeIds.add(r.player2_id);
    }

    const matches = (recent.data ?? []) as Array<{
      id: string;
      match_type: string;
      is_bot_match: boolean;
      player1_score: number | null;
      player2_score: number | null;
      winner_id: string | null;
      player1_id: string;
      player2_id: string | null;
    }>;
    const ids = Array.from(
      new Set(
        matches.flatMap((m) =>
          [m.player1_id, m.player2_id].filter((x): x is string => !!x),
        ),
      ),
    );
    const nameMap = new Map<string, string>();
    if (ids.length) {
      const { data: us } = await supabaseAdmin
        .from("users")
        .select("id, username")
        .in("id", ids);
      for (const u of us ?? [])
        nameMap.set(u.id as string, u.username as string);
    }

    return {
      totalMatches: matchesCount.count ?? 0,
      totalPlayers: usersCount.count ?? 0,
      activePlayers: activeIds.size,
      matchesPerMin: perMinAgg.count ?? 0,
      topVerbalElo: topVerbal.data?.elo_verbal ?? 0,
      topMathElo: topMath.data?.elo_math ?? 0,
      recent: matches.map((m) => ({
        ...m,
        p1_name: nameMap.get(m.player1_id) ?? null,
        p2_name: m.player2_id ? nameMap.get(m.player2_id) ?? null : null,
      })),
    };
  },
);
