import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { computeAchievements, type AchievementState } from "./achievements";

/**
 * Räknar fram användarens achievements från befintlig speldata.
 * Inga egna tabeller — allt härleds från `users`, `matches` och `friendships`.
 */
export const fetchAchievements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ achievements: AchievementState[] }> => {
    const { userId } = context;

    // Perfekt match = 8/8 rätt i en avslutad match. Två separata counts
    // (player1 / player2) i stället för nästlad .or() — robustare i PostgREST.
    const [{ data: user }, perfect1, perfect2, friendsRes, ordRes] = await Promise.all([
      supabaseAdmin
        .from("users")
        .select("games_played, wins, elo_verbal_peak, elo_math_peak, longest_streak")
        .eq("id", userId)
        .maybeSingle(),
      supabaseAdmin
        .from("matches")
        .select("id", { count: "exact", head: true })
        .eq("status", "finished")
        .eq("player1_id", userId)
        .eq("player1_score", 8),
      supabaseAdmin
        .from("matches")
        .select("id", { count: "exact", head: true })
        .eq("status", "finished")
        .eq("player2_id", userId)
        .eq("player2_score", 8),
      supabaseAdmin
        .from("friendships")
        .select("id", { count: "exact", head: true })
        .eq("status", "accepted")
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
      supabaseAdmin
        .from("ord_practice_stats")
        .select("total_count")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    const peakElo = Math.max(
      (user?.elo_verbal_peak as number) ?? 0,
      (user?.elo_math_peak as number) ?? 0,
    );

    const achievements = computeAchievements({
      games_played: (user?.games_played as number) ?? 0,
      wins: (user?.wins as number) ?? 0,
      perfect_matches: (perfect1.count ?? 0) + (perfect2.count ?? 0),
      longest_streak: (user?.longest_streak as number) ?? 0,
      peak_elo: peakElo,
      friends: friendsRes.count ?? 0,
      words_done: (ordRes.data?.total_count as number) ?? 0,
    });

    return { achievements };
  });
