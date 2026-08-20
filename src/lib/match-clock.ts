// Matchklockan — ett ställe.
//
// Längden låg tidigare i två konstanter som glidit isär: matchsidan körde
// 5 minuter medan `ResumeMatchBanner` trodde 8. Följden var att banderollen
// "Du har en pågående match – vill du fortsätta?" satt kvar i tre minuter
// efter att tiden faktiskt tagit slut, och den som klickade landade på
// matchsidan med noll sekunder kvar. Klockan lämnade då in matchen i samma
// sekund den öppnades — "matchen lämnas in automatiskt ibland".

/** Speltid per match. Gäller både bot- och PvP-matcher. */
export const MATCH_TOTAL_SECONDS = 5 * 60;

/**
 * Hur länge motståndaren får spela klart efter att man själv lämnat in.
 * Samma tal på båda sidor: klienten räknar ned det, servern vägrar avsluta
 * matchen innan det gått (se `finalizeMatch` i `match.functions.ts`).
 */
export const OPPONENT_GRACE_SECONDS = 30;

/**
 * Nyckeln för matchens starttid i sessionStorage. Ankaret sätts när spelaren
 * faktiskt ser första frågan, inte när matchraden skapades, och delas av
 * matchsidan och återuppta-banderollen så att båda räknar på samma klocka.
 */
export function matchStartKey(matchId: string): string {
  return `match_start_${matchId}`;
}

/** Sekunder kvar av matchen givet ett startankare i millisekunder. */
export function secondsLeftFrom(anchorMs: number, now: number = Date.now()): number {
  const elapsed = Math.floor((now - anchorMs) / 1000);
  return Math.max(0, MATCH_TOTAL_SECONDS - elapsed);
}
