import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { limits } from "./rate-limit";
import { assertRateLimit, ipKey } from "./rate-limit.server";
import { isRankable } from "./username";

export interface LeaderboardRow {
  rank: number;
  user_id: string;
  username: string;
  elo: number;
  games_played: number;
  wins: number;
  losses: number;
}

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
    // Publik endpoint utan auth — hamringsskydd per IP.
    assertRateLimit(ipKey("lb"), limits.publicRead);
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

    return (
      Array.from(agg.entries())
        .map(([user_id, v]) => ({
          user_id,
          username: nameMap.get(user_id) ?? "",
          elo_gain: v.gain,
          games: v.games,
        }))
        // Sållas före slice() — annars äter anonyma konton platser i topplistan.
        .filter((r) => isRankable(r.username))
        .sort((a, b) => b.elo_gain - a.elo_gain)
        .slice(0, limit)
        .map((r, i) => ({ rank: i + 1, ...r }))
    );
  });

/**
 * Rader per varv när listan läses igenom. Anonyma konton är majoriteten av
 * `users` (de flesta spelar en botmatch som gäst och försvinner), så ett enda
 * `limit`-anrop skulle ge en halvfull lista efter filtret. Sidorna är stabila
 * tack vare sekundärsorteringen på `id`.
 */
const SCAN_PAGE = 500;
/** Bortre gräns: 3 000 genomlästa rader räcker med marginal för 500 rankade. */
const SCAN_MAX_PAGES = 6;

/**
 * "Alltid" — direkt fråga mot `users` som service role (förbi RLS och det
 * för strikta filtret i get_leaderboard-RPC:n). Ingen tröskel på antal
 * matcher, en spelad match räcker, men **anonyma konton rankas inte**
 * (`isRankable`). Filtret ligger här och inte i UI:t: serverfunktionen är
 * publik, och det var gästkonton som odlade ELO mot bottar och tog hela
 * toppen av den verbala listan 2026-08-17.
 */
export const fetchLeaderboard = createServerFn({ method: "GET" })
  .inputValidator((data: { match_type: "verbal" | "math"; limit?: number }) => data)
  .handler(async ({ data }) => {
    // Publik endpoint utan auth — hamringsskydd per IP.
    assertRateLimit(ipKey("lb"), limits.publicRead);
    const eloCol = data.match_type === "verbal" ? "elo_verbal" : "elo_math";
    const limit = Math.min(Math.max(data.limit ?? 200, 1), 500);

    const ranked: Omit<LeaderboardRow, "rank">[] = [];
    for (let page = 0; page < SCAN_MAX_PAGES && ranked.length < limit; page++) {
      const from = page * SCAN_PAGE;
      const { data: rows, error } = await supabaseAdmin
        .from("users")
        .select(`id, username, ${eloCol}, games_played, wins, losses`)
        .gte("games_played", 1)
        .order(eloCol, { ascending: false })
        .order("id", { ascending: true })
        .range(from, from + SCAN_PAGE - 1);

      if (error) throw new Error(error.message);

      const batch = (rows ?? []) as Array<Record<string, unknown>>;
      for (const r of batch) {
        if (!isRankable(r.username as string)) continue;
        ranked.push({
          user_id: r.id as string,
          username: (r.username as string) ?? "",
          elo: (r[eloCol] as number) ?? 1000,
          games_played: (r.games_played as number) ?? 0,
          wins: (r.wins as number) ?? 0,
          losses: (r.losses as number) ?? 0,
        });
        if (ranked.length >= limit) break;
      }
      // Kortare sida än begärt = slut på tabellen, inte slut på rankade konton.
      if (batch.length < SCAN_PAGE) break;
    }

    return ranked.map((r, i): LeaderboardRow => ({ rank: i + 1, ...r }));
  });
