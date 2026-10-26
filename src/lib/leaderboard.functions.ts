import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { limits } from "./rate-limit";
import { assertRateLimit, ipKey } from "./rate-limit.server";
import { isRankable } from "./username";

/**
 * Hur många rader topplistan visar. Ett ställe för alla tre listorna på
 * /leaderboard (verbal, matte, ord) — 100 → 50 (2026-08-18) → 10 (2026-08-19).
 *
 * Den som ligger utanför topplistan får ändå sin egen placering under
 * tabellen, och den raden plockas ur samma svar — därför måste `limit` i
 * anropen nedan förbli mycket större än det här talet.
 */
export const LEADERBOARD_SIZE = 10;

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
 * för strikta filtret i get_leaderboard-RPC:n).
 *
 * **Enda kravet är ett valt användarnamn** (`isRankable`). Tröskeln på antal
 * matcher togs bort helt 2026-08-18: ett nyregistrerat konto står på listan
 * direkt med sina 1000 i ingångs-ELO. 22 av 88 riktiga konton hade aldrig
 * spelat en match och syntes därför inte alls, vilket gjorde listan kortare
 * än antalet registrerade. Återinför inte tröskeln utan att fråga — det här
 * är andra gången den ändras medvetet.
 *
 * Namnfiltret ligger här och inte i UI:t: serverfunktionen är publik, och det
 * var gästkonton som odlade ELO mot bottar och tog hela toppen av den verbala
 * listan 2026-08-17.
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

/**
 * Var ett givet ELO skulle hamna på listan, och hur många rankade konton
 * det finns. Driver placeringsrutan på startsidan.
 *
 * **Tar ett ELO, inte en identitet.** Frågan är "var skulle det här talet
 * hamna", inte "var ligger den här användaren", så ingen auth behövs och
 * ingenting personligt lämnar servern. Skickar någon ett påhittat ELO får
 * de ett felaktigt tal om sig själva, vilket inte skadar någon annan.
 *
 * Varför den bläddrar i stället för att räkna med `count`: rankningen
 * kräver `isRankable`, och den regeln bor i `username.ts` och ingen
 * annanstans. En motsvarande regex i SQL hade blivit en andra definition
 * som glider isär från den första — exakt det som en gång lät samma konto
 * räknas som rankat på en yta och inte på en annan. Kostnaden är densamma
 * som topplistan redan betalar.
 */
export const fetchEloPlacering = createServerFn({ method: "GET" })
  .inputValidator((data: { match_type: "verbal" | "math"; elo: number }) => data)
  .handler(async ({ data }) => {
    assertRateLimit(ipKey("lb-pos"), limits.publicRead);
    const eloCol = data.match_type === "verbal" ? "elo_verbal" : "elo_math";
    const mitt = Number.isFinite(data.elo) ? data.elo : 1000;

    let fore = 0;
    let totalt = 0;
    for (let page = 0; page < SCAN_MAX_PAGES; page++) {
      const from = page * SCAN_PAGE;
      const { data: rows, error } = await supabaseAdmin
        .from("users")
        .select(`username, ${eloCol}`)
        .order(eloCol, { ascending: false })
        .range(from, from + SCAN_PAGE - 1);

      if (error) throw new Error(error.message);

      const batch = (rows ?? []) as Array<Record<string, unknown>>;
      for (const r of batch) {
        if (!isRankable(r.username as string)) continue;
        totalt += 1;
        if (((r[eloCol] as number) ?? 1000) > mitt) fore += 1;
      }
      if (batch.length < SCAN_PAGE) break;
    }

    return { placering: fore + 1, totalt };
  });
