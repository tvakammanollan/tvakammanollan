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
  // Ett oläsbart ankare läses som "matchen började nyss", aldrig som "tiden är
  // slut". Ett NaN här hamnar inte i en logg utan i en automatisk inlämning.
  if (!Number.isFinite(anchorMs)) return MATCH_TOTAL_SECONDS;
  const elapsed = Math.floor((now - anchorMs) / 1000);
  return Math.max(0, Math.min(MATCH_TOTAL_SECONDS, MATCH_TOTAL_SECONDS - elapsed));
}

/**
 * Är matchen spelbar just nu?
 *
 * Klockan får INTE starta på en match som fortfarande är `waiting`, och det är
 * inte en teoretisk finess: `acceptMatchInvite` och `joinMatch` skriver
 * `match_questions` FÖRST och flippar raden till `active` + `started_at`
 * efteråt. Mellan de två skrivningarna finns en match som har åtta frågor men
 * inte har börjat. Matchsidan gick tidigare bara på "finns det frågor?", så
 * inbjudarens flik började räkna ned där — och sparade dessutom ankaret
 * lokalt. När vännen sedan accepterade var de fem minuterna redan brända, och
 * matchen lämnades in automatiskt i samma sekund den blev spelbar, med
 * "Tiden är slut" i rutan. Reproducerat 2026-08-21: en `waiting`-rad med
 * frågor gav en löpande klocka och `player1_submitted_at` satt, poäng 0.
 *
 * Botmatch och rankad match skapas direkt som `active` med `started_at` satt,
 * och har därför aldrig haft fönstret — vilket är hela skälet till att buggen
 * bara syntes på vänmatcher.
 */
export function matchIsLive(status: string | null | undefined): boolean {
  return status === "active";
}

export interface AnchorInput {
  /** `matches.started_at` — serverns tidpunkt, samma för båda spelarna. */
  startedAt: string | null | undefined;
  /** Lokalt sparat ankare för just den här matchen (sessionStorage). */
  stored: string | null;
  /** Nu, i millisekunder. */
  now: number;
}

export interface AnchorResult {
  /** Tidpunkten klockan räknar ifrån, i millisekunder. */
  anchor: number;
  /** Ska ankaret skrivas till sessionStorage? Bara när servern saknar sitt. */
  persist: boolean;
}

/**
 * Var startade klockan?
 *
 * Ordningen är servern först, lokalt ankare sedan, `nu` sist. Serverns
 * `started_at` är samma tal för båda spelarna och är det resultatsidan, botens
 * tid och tidsgolvet räknar ifrån; det lokala ankaret finns kvar för matcher
 * skapade före 2026-08-19 (kolumnen är NULL där) och för glappet innan raden
 * är läst.
 *
 * Ett lokalt ankare som ligger i framtiden eller inte går att läsa som ett tal
 * kastas. Det tolkas som "nyss", aldrig som "urgammalt" — samma regel som
 * `coaching-sweep.ts` följer för ett oläsbart `created_at`: motsatsen gör att
 * ett trasigt värde tar matchen i stället för att bara se konstigt ut.
 *
 * Ett ankare som är gammalt men giltigt behålls med flit. Den som spelat i
 * fem minuter, somnat om fliken och kommer tillbaka SKA mötas av en match vars
 * tid tagit slut — det är inte samma sak som den här funktionens felfall.
 */
export function resolveMatchAnchor({ startedAt, stored, now }: AnchorInput): AnchorResult {
  const server = startedAt ? new Date(startedAt).getTime() : NaN;
  if (Number.isFinite(server) && server > 0) return { anchor: server, persist: false };

  const local = stored == null || stored === "" ? NaN : Number(stored);
  if (Number.isFinite(local) && local > 0 && local <= now) return { anchor: local, persist: false };

  return { anchor: now, persist: true };
}
