import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { type VoteTally } from "./question-votes";

/**
 * Röstsummorna per fråga, cachade per isolat.
 *
 * Läses separat från `questions` och aldrig som kolumner i urvalsfrågorna. Två
 * skäl. Matchurvalet hämtar upp till 9 000 rader och vyn innehåller bara de
 * frågor någon röstat på, så det är billigare att hämta vyn hel. Och en
 * urvalsfråga som pekar på en vy som inte finns (migrationen
 * `20261019120000_fragerostning.sql` ej körd) hade fällt varje match och varje
 * träningspass. Här blir samma fel en tom karta, alltså "inga röster", och
 * urvalet fungerar som förut.
 */
const TTL_MS = 5 * 60 * 1000;
const PAGE = 1000;

let cache: { at: number; stats: Map<string, VoteTally> } | null = null;
let building: Promise<Map<string, VoteTally>> | null = null;

async function load(): Promise<Map<string, VoteTally>> {
  const stats = new Map<string, VoteTally>();
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabaseAdmin
      .from("question_vote_stats")
      .select("question_id, up, down, guest_up, guest_down")
      .range(from, from + PAGE - 1);
    if (error) {
      console.error("[question-votes] kunde inte läsa röstsummorna:", error.message);
      return stats;
    }
    for (const r of data ?? []) {
      if (!r.question_id) continue;
      stats.set(r.question_id, {
        up: r.up ?? 0,
        down: r.down ?? 0,
        guestUp: r.guest_up ?? 0,
        guestDown: r.guest_down ?? 0,
      });
    }
    if ((data ?? []).length < PAGE) return stats;
  }
}

export async function loadVoteStats(): Promise<Map<string, VoteTally>> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.stats;
  // Ett löfte för alla samtidiga anrop, annars startar en kall isolat en
  // full läsning per samtidig match.
  building ??= load()
    .then((stats) => {
      cache = { at: Date.now(), stats };
      return stats;
    })
    .catch((e) => {
      console.error("[question-votes] laddningen föll:", e);
      return new Map<string, VoteTally>();
    })
    .finally(() => {
      building = null;
    });
  return building;
}

/** Nollställer cachen. För den som just röstat, så att nästa urval ser rösten. */
export function invalidateVoteStats(): void {
  cache = null;
}
