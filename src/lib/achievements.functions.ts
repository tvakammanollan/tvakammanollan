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

    const [{ data: user }, perfectRes, friendsRes] = await Promise.all([
      supabaseAdmin
        .from("users")
        .select("games_played, wins, elo_verbal_peak, elo_math_peak, longest_streak")
        .eq("id", userId)
        .maybeSingle(),
      // Perfekt match = 8/8 rätt i en avslutad match (8 frågor per match).
      supabaseAdmin
        .from("matches")
        .select("id", { count: "exact", head: true })
        .eq("status", "finished")
        .or(
          `and(player1_id.eq.${userId},player1_score.eq.8),and(player2_id.eq.${userId},player2_score.eq.8)`,
        ),
      supabaseAdmin
        .from("friendships")
        .select("id", { count: "exact", head: true })
        .eq("status", "accepted")
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
    ]);

    const peakElo = Math.max(
      (user?.elo_verbal_peak as number) ?? 0,
      (user?.elo_math_peak as number) ?? 0,
    );

    const achievements = computeAchievements({
      games_played: (user?.games_played as number) ?? 0,
      wins: (user?.wins as number) ?? 0,
      perfect_matches: perfectRes.count ?? 0,
      longest_streak: (user?.longest_streak as number) ?? 0,
      peak_elo: peakElo,
      friends: friendsRes.count ?? 0,
    });

    return { achievements };
  });
