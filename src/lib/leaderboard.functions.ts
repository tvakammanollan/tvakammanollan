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
export const fetchLeaderboard = createServerFn({ method: "GET" })
  .inputValidator(
    (data: { match_type: "verbal" | "math"; limit?: number }) => data,
  )
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
