import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { stockholmDate, streakStep } from "./streak-dates";

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

/**
 * Uppdaterar dagsstreaken. Räknar som mest en gång per kalenderdag, i svensk
 * tid — se `streak-dates.ts` för varför tidszonen är hela poängen.
 *
 * Anropas från allt som räknas som ett pass: match, träning, ordövning och
 * inlämnat provpass. Tidigare bara från match och träning, vilket gjorde att
 * en dag med bara ordövning inte syntes i streaken alls.
 */
export async function updateStreak(userId: string): Promise<StreakResult | null> {
  const { data: profile, error } = await supabase
    .from("users")
    .select("current_streak, longest_streak, last_active_date")
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile) return null;

  const today = stockholmDate();
  const lastActive = profile.last_active_date as string | null;
  const prevStreak = profile.current_streak ?? 0;
  const prevLongest = profile.longest_streak ?? 0;

  const step = streakStep(lastActive, prevStreak, today);

  if (step.kind === "already-counted") {
    return {
      current: prevStreak,
      longest: prevLongest,
      previous: prevStreak,
      alreadyCountedToday: true,
      broken: false,
    };
  }

  const continued = step.kind === "continued";
  const newStreak = continued ? step.streak : 1;
  const newLongest = Math.max(newStreak, prevLongest);
  const broken = step.kind === "restarted" && step.broken;

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
