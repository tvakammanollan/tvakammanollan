import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface StreakResult {
  /** Streak value AFTER update */
  current: number;
  longest: number;
  /** Streak value BEFORE update (yesterday's running streak) */
  previous: number;
  /** True if streak was already counted today (no-op) */
  alreadyCountedToday: boolean;
  /** True if a previous streak >=1 was broken and reset to 1 today */
  broken: boolean;
}

function isoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

/**
 * Update the user's streak counter. Increments at most once per day.
 * Shows a toast if a streak of >=3 days was broken.
 */
export async function updateStreak(userId: string): Promise<StreakResult | null> {
  const { data: profile, error } = await supabase
    .from("users")
    .select("current_streak, longest_streak, last_active_date")
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile) return null;

  const today = isoDate(new Date());
  const yesterday = isoDate(new Date(Date.now() - 86_400_000));
  const lastActive = profile.last_active_date as string | null;
  const prevStreak = profile.current_streak ?? 0;
  const prevLongest = profile.longest_streak ?? 0;

  if (lastActive === today) {
    return {
      current: prevStreak,
      longest: prevLongest,
      previous: prevStreak,
      alreadyCountedToday: true,
      broken: false,
    };
  }

  const continued = lastActive === yesterday;
  const newStreak = continued ? prevStreak + 1 : 1;
  const newLongest = Math.max(newStreak, prevLongest);
  const broken = !continued && prevStreak >= 1 && lastActive !== null;

  await supabase
    .from("users")
    .update({
      current_streak: newStreak,
      longest_streak: newLongest,
      last_active_date: today,
    })
    .eq("id", userId);

  // Toast on streak broken
  if (broken && prevStreak >= 7) {
    toast(
      `Din streak på ${prevStreak} dagar bröts – men rekordet ${prevLongest} dagar finns kvar. Kämpa på!`,
    );
  } else if (broken && prevStreak >= 3) {
    toast(`Din streak på ${prevStreak} dagar bröts – börja en ny idag!`);
  } else if (continued && newStreak >= 2) {
    toast.success(`${newStreak} dagars streak!`);
  }

  return {
    current: newStreak,
    longest: newLongest,
    previous: prevStreak,
    alreadyCountedToday: false,
    broken,
  };
}
