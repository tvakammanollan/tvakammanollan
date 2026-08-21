import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { isRankable } from "./username";
import { GAMLA_PROV_START_ACTION } from "./usage-actions";

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

export interface TopPlayer {
  username: string;
  elo: number;
  type: "verbal" | "math";
}

export interface LandingStats {
  /**
   * Genomförd aktivitet: avslutade matcher **plus påbörjade provpass**.
   *
   * Ett provpass är 40 uppgifter mot matchens 8, så det räknas som minst en
   * match spelad — och gamla prov är den yta flest faktiskt använder. Räknades
   * bara `matches` visade siffran en bråkdel av användningen (780 av allt som
   * hänt) därför att provflödet inte lämnade något spår på servern alls.
   */
  totalMatches: number;
  totalPlayers: number;
  /** Best-effort "online now" — players who finished a match in the last 15 min. */
  activePlayers: number;
  /** Matches finished in the last minute — for the "live" feel. */
  matchesPerMin: number;
  /** Highest verbal ELO across all users right now. */
  /** Highest math ELO across all users right now. */
  recent: RecentMatch[];
  /** Top players by ELO (verbal + math interleaved by score, max 8). */
  topPlayers: TopPlayer[];
}

export const getLandingStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<LandingStats> => {
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const oneMinAgo = new Date(Date.now() - 60 * 1000).toISOString();

    // Wrap each query so a single failure (RLS, network, missing col) doesn't
    // bring down the whole landing page.
    const safe = <T>(p: PromiseLike<T>, fallback: unknown): Promise<T> =>
      Promise.resolve(p).then(
        (v) => v,
        () => fallback as T,
      );

    const [
      matchesCount,
      provStartsCount,
      usersCount,
      activeAgg,
      perMinAgg,
      recent,
      topVerbalList,
      topMathList,
    ] = await Promise.all([
      safe(
        supabaseAdmin
          .from("matches")
          .select("*", { count: "exact", head: true })
          .eq("status", "finished"),
        { count: 0 } as { count: number | null },
      ),
      // Påbörjade provpass, skrivna av `logProvStart` (utan krav på konto).
      // Bara framåtriktat: före 2026-08-21 lagrades ingenting om gamla prov
      // på servern, så historiken finns inte att hämta.
      safe(
        supabaseAdmin
          .from("audit_log")
          .select("*", { count: "exact", head: true })
          .eq("action", GAMLA_PROV_START_ACTION),
        { count: 0 } as { count: number | null },
      ),
      safe(supabaseAdmin.from("users").select("*", { count: "exact", head: true }), {
        count: 0,
      } as { count: number | null }),
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
      // 40 rader för att få fram fem rankade — anonyma konton är majoriteten av
      // tabellen och sållas bort nedan (isRankable). Ingen tröskel på antal
      // matcher, precis som i fetchLeaderboard sedan 2026-08-18: förhandsvisningen
      // och topplistan måste lyda samma regel, annars säger de emot varandra.
      safe(
        supabaseAdmin
          .from("users")
          .select("username, elo_verbal")
          .order("elo_verbal", { ascending: false })
          .limit(40),
        { data: [] } as {
          data: Array<{ username: string | null; elo_verbal: number | null }>;
        },
      ),
      safe(
        supabaseAdmin
          .from("users")
          .select("username, elo_math")
          .order("elo_math", { ascending: false })
          .limit(40),
        { data: [] } as {
          data: Array<{ username: string | null; elo_math: number | null }>;
        },
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
      new Set(matches.flatMap((m) => [m.player1_id, m.player2_id].filter((x): x is string => !!x))),
    );
    const nameMap = new Map<string, string>();
    if (ids.length) {
      const { data: us } = await supabaseAdmin.from("users").select("id, username").in("id", ids);
      for (const u of us ?? []) nameMap.set(u.id as string, u.username as string);
    }

    const topPlayers: TopPlayer[] = [
      ...(
        (topVerbalList.data ?? []) as Array<{
          username: string | null;
          elo_verbal: number | null;
        }>
      )
        .filter((u) => isRankable(u.username) && (u.elo_verbal ?? 0) > 0)
        .slice(0, 5)
        .map((u) => ({
          username: u.username as string,
          elo: u.elo_verbal as number,
          type: "verbal" as const,
        })),
      ...(
        (topMathList.data ?? []) as Array<{
          username: string | null;
          elo_math: number | null;
        }>
      )
        .filter((u) => isRankable(u.username) && (u.elo_math ?? 0) > 0)
        .slice(0, 5)
        .map((u) => ({
          username: u.username as string,
          elo: u.elo_math as number,
          type: "math" as const,
        })),
    ]
      .sort((a, b) => b.elo - a.elo)
      .slice(0, 8);

    return {
      totalMatches: (matchesCount.count ?? 0) + (provStartsCount.count ?? 0),
      totalPlayers: usersCount.count ?? 0,
      activePlayers: activeIds.size,
      matchesPerMin: perMinAgg.count ?? 0,
      recent: matches.map((m) => ({
        ...m,
        p1_name: nameMap.get(m.player1_id) ?? null,
        p2_name: m.player2_id ? (nameMap.get(m.player2_id) ?? null) : null,
      })),
      topPlayers,
    };
  },
);
