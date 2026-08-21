/**
 * Vem vann? — en enda plats, för båda spelarna, på båda sidor om nätet.
 *
 * Resultatet avgörs på servern (`processMatchResultServer`) och skrivs till
 * `matches.winner_id` tillsammans med `status='finished'`. Resultatsidan
 * jämförde tidigare `player1_score` mot `player2_score` i webbläsaren, vilket
 * gick fel på två sätt:
 *
 *  - **Båda kunde vinna.** Sidan läste matchraden en gång, direkt efter egen
 *    inlämning. Hann motståndarens poäng inte skrivas läste den som 0, och
 *    varje spelare såg sig själv som vinnare i sin egen webbläsare.
 *  - **Vinst visades som oavgjort.** Samma sak fast från andra hållet: två
 *    oskrivna poäng är `0` och `0`, alltså lika, alltså "Oavgjort!" — även
 *    när matchen sedan avgjordes till 6–3.
 *
 * Därför: utfallet är **odefinierat tills matchen är `finished`**. Den som
 * frågar innan dess ska visa "räknar ut", inte gissa.
 *
 * ## Oavgjort finns inte (2026-08-21)
 *
 * Vid lika poäng vinner den som lämnade in först. En match ska ha en vinnare —
 * annars är svaret på "vem vann?" ett icke-svar för båda, och ELO:t rör sig
 * inte för någon. Regeln bor i `decideWinnerSide()` och **bara** där; den
 * anropas av servern när `winner_id` skrivs, och av klienten när `winner_id`
 * är NULL (vilket det alltid är när en bot vinner — en bot har inget konto och
 * därmed inget id att peka på). Två kopior av regeln var precis vad som gjorde
 * att resultatskärmen och historiken kunde säga olika saker om samma match.
 */

export type Outcome = "win" | "loss";

/** 1 = player1, 2 = player2 (eller boten). */
export type WinnerSide = 1 | 2;

export interface DecidableMatch {
  player1_id: string;
  player2_id: string | null;
  player1_score: number | null;
  player2_score: number | null;
  player1_submitted_at: string | null;
  player2_submitted_at: string | null;
}

export interface OutcomeMatch extends DecidableMatch {
  status: string;
  winner_id: string | null;
  is_bot_match: boolean;
}

/** Millisekunder, eller Infinity för "lämnade aldrig in". */
function submittedMs(at: string | null): number {
  if (!at) return Infinity;
  const t = new Date(at).getTime();
  // Ett oläsbart datum får inte vinna tiebreaken. "Lämnade aldrig in" är det
  // säkra svaret: det kan bara kosta den som har ett trasigt värde, aldrig
  // ge dem en vinst de inte spelat ihop.
  return Number.isFinite(t) ? t : Infinity;
}

/**
 * Vem vann? Aldrig oavgjort.
 *
 * Ordningen:
 *  1. **Flest rätt vinner.** Det är fortfarande vad matchen mäter.
 *  2. **Vid lika poäng vinner den som lämnade in först.** Snabbhet är den
 *     andra halvan av provet, och det är den enda skiljelinjen som redan
 *     finns mätt på raden.
 *  3. **En som lämnat in slår en som inte gjort det.** Följer av (2), eftersom
 *     "aldrig inlämnad" räknas som oändligt sent.
 *  4. **Saknas båda tiderna vinner player1.** Det inträffar bara på en
 *     halvskriven rad — servern räknar aldrig ut ett resultat förrän båda
 *     tiderna finns (se `processMatchResultServer`). Fallbacket måste ändå
 *     vara *deterministiskt*, för servern och båda klienterna ska komma fram
 *     till samma svar utan att prata med varandra, och player1 är den enda
 *     sidan som garanterat har ett id på varje rad: `player2_id` är NULL i
 *     varje botmatch. Att slumpa, eller att låta "ingen" vinna, tar tillbaka
 *     precis den oavgjort-lucka regeln finns för att stänga.
 */
export function decideWinnerSide(match: DecidableMatch): WinnerSide {
  const p1 = match.player1_score ?? 0;
  const p2 = match.player2_score ?? 0;
  if (p1 !== p2) return p1 > p2 ? 1 : 2;

  const t1 = submittedMs(match.player1_submitted_at);
  const t2 = submittedMs(match.player2_submitted_at);
  if (t1 !== t2) return t1 < t2 ? 1 : 2;

  return 1;
}

/**
 * Utfallet ur den inloggade spelarens perspektiv.
 *
 * `null` betyder "vet inte än" — matchen är inte färdigräknad. Det är ett
 * riktigt svar och ska renderas som ett väntläge.
 */
export function outcomeFor(userId: string, match: OutcomeMatch): Outcome | null {
  if (match.status !== "finished") return null;

  const mySide: WinnerSide = match.player1_id === userId ? 1 : 2;

  // `winner_id` är serverns beslut och gäller före allt annat.
  if (match.winner_id) return match.winner_id === userId ? "win" : "loss";

  // Ingen `winner_id` betyder inte oavgjort. Det vanliga fallet är en förlorad
  // botmatch: vinnaren är boten, som inte har något konto att peka ut. Samma
  // regel som servern räknade med, så svaret blir identiskt.
  return decideWinnerSide(match) === mySide ? "win" : "loss";
}

/** Poängen från spelarens håll. Ger `null` för en sida som inte lämnat in. */
export function scoresFor(
  userId: string,
  match: Pick<OutcomeMatch, "player1_id" | "player1_score" | "player2_score">,
): { mine: number; theirs: number } {
  const isP1 = match.player1_id === userId;
  return {
    mine: (isP1 ? match.player1_score : match.player2_score) ?? 0,
    theirs: (isP1 ? match.player2_score : match.player1_score) ?? 0,
  };
}
