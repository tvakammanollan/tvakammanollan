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
}

export interface LandingStats {
  totalMatches: number;
  totalPlayers: number;
  recent: RecentMatch[];
}

export const getLandingStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<LandingStats> => {
    const [matchesCount, usersCount, recent] = await Promise.all([
      supabaseAdmin
        .from("matches")
        .select("*", { count: "exact", head: true })
        .eq("status", "finished"),
      supabaseAdmin.from("users").select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("matches")
        .select(
          "id, match_type, is_bot_match, player1_score, player2_score, winner_id, player1_id, player2_id",
        )
        .eq("status", "finished")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

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
      recent: matches.map((m) => ({
        ...m,
        p1_name: nameMap.get(m.player1_id) ?? null,
        p2_name: m.player2_id ? nameMap.get(m.player2_id) ?? null : null,
      })),
    };
  },
);
