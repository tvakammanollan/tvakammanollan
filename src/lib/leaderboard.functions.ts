import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface LeaderboardRow {
  rank: number;
  user_id: string;
  username: string;
  elo: number;
  games_played: number;
  wins: number;
  losses: number;
}

/**
 * Direct query against `users` as service role (bypasses RLS and the
 * too-strict get_leaderboard RPC filter). No client-side filter, no
 * games_played >= N threshold — anyone who has played at least 1 match
 * (incl. guests, test accounts) shows up.
 */
export interface WeeklyLeaderboardRow {
  rank: number;
  user_id: string;
  username: string;
  elo_gain: number;
  games: number;
}

/**
 * "Denna vecka" — vem som klättrat mest senaste 7 dygnen. Summerar
 * elo_change per spelare från elo_history (service role, bypassar RLS).
 */
export const fetchWeeklyLeaderboard = createServerFn({ method: "GET" })
  .inputValidator((data: { match_type: "verbal" | "math"; limit?: number }) => data)
  .handler(async ({ data }): Promise<WeeklyLeaderboardRow[]> => {
    const limit = Math.min(Math.max(data.limit ?? 100, 1), 200);
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: rows, error } = await supabaseAdmin
      .from("elo_history")
      .select("user_id, elo_change")
      .eq("match_type", data.match_type)
      .gte("created_at", since);
    if (error) throw new Error(error.message);

    const agg = new Map<string, { gain: number; games: number }>();
    for (const r of rows ?? []) {
      const uid = r.user_id as string;
      const cur = agg.get(uid) ?? { gain: 0, games: 0 };
      cur.gain += (r.elo_change as number) ?? 0;
      cur.games += 1;
      agg.set(uid, cur);
    }
    if (agg.size === 0) return [];

    const ids = Array.from(agg.keys());
    const { data: users } = await supabaseAdmin.from("users").select("id, username").in("id", ids);
    const nameMap = new Map<string, string>();
    for (const u of users ?? []) nameMap.set(u.id as string, (u.username as string) ?? "");

    return Array.from(agg.entries())
      .map(([user_id, v]) => ({
        user_id,
        username: nameMap.get(user_id) ?? "",
        elo_gain: v.gain,
        games: v.games,
      }))
      .sort((a, b) => b.elo_gain - a.elo_gain)
      .slice(0, limit)
      .map((r, i) => ({ rank: i + 1, ...r }));
  });

export const fetchLeaderboard = createServerFn({ method: "GET" })
  .inputValidator((data: { match_type: "verbal" | "math"; limit?: number }) => data)
  .handler(async ({ data }) => {
    const eloCol = data.match_type === "verbal" ? "elo_verbal" : "elo_math";
    const limit = Math.min(Math.max(data.limit ?? 200, 1), 500);

    const { data: rows, error } = await supabaseAdmin
      .from("users")
      .select(`id, username, ${eloCol}, games_played, wins, losses`)
      .gte("games_played", 1)
      .order(eloCol, { ascending: false })
      .order("id", { ascending: true })
      .limit(limit);

    if (error) throw new Error(error.message);

    return ((rows ?? []) as Array<Record<string, unknown>>).map(
      (r, i): LeaderboardRow => ({
        rank: i + 1,
        user_id: r.id as string,
        username: (r.username as string) ?? "",
        elo: (r[eloCol] as number) ?? 1000,
        games_played: (r.games_played as number) ?? 0,
        wins: (r.wins as number) ?? 0,
        losses: (r.losses as number) ?? 0,
      }),
    );
  });
