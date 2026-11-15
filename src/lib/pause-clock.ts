/**
 * Paus i provpass och träning.
 *
 * Pausen lagras som EN tidpunkt (`pausedAt`), inte som en summa pausad tid.
 * När passet återupptas flyttas alla ankare (start, sluttid, när frågan
 * visades) fram lika långt som pausen varade, så att allt som räknar på dem
 * (klockan, tiden på resultatskärmen, tid per fråga) fortsätter stämma utan
 * att känna till pausen.
 */

/**
 * Hur långt ankarna ska flyttas fram när en paus tar slut, i millisekunder.
 *
 * Ett oläsbart eller framtida `pausedAt` ger 0: värdet kommer ur localStorage,
 * och en trasig post får inte kunna skänka någon obegränsad provtid eller
 * lägga ett `NaN` i klockan.
 */
export function pauseShift(pausedAt: number | null | undefined, now: number): number {
  if (typeof pausedAt !== "number" || !Number.isFinite(pausedAt)) return 0;
  if (pausedAt <= 0 || pausedAt > now) return 0;
  return now - pausedAt;
}

/** Klockslaget tiden ska räknas mot: pausens början om passet är pausat. */
export function clockNow(pausedAt: number | null | undefined, now: number): number {
  return now - pauseShift(pausedAt, now);
}
