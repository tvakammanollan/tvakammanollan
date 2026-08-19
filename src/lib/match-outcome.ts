/**
 * Vem vann? — en enda plats, för båda spelarna.
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
 * frågar innan dess ska visa "räknar ut", inte gissa. Och när den är klar är
 * `winner_id` svaret — samma rad, samma svar, för båda spelarna.
 */

export type Outcome = "win" | "loss" | "draw";

export interface OutcomeMatch {
  status: string;
  player1_id: string;
  player2_id: string | null;
  player1_score: number | null;
  player2_score: number | null;
  winner_id: string | null;
  is_bot_match: boolean;
}

/**
 * Utfallet ur den inloggade spelarens perspektiv.
 *
 * `null` betyder "vet inte än" — matchen är inte färdigräknad. Det är ett
 * riktigt svar och ska renderas som ett väntläge, inte som oavgjort.
 */
export function outcomeFor(userId: string, match: OutcomeMatch): Outcome | null {
  if (match.status !== "finished") return null;

  // `winner_id` är serverns beslut och gäller före allt annat.
  if (match.winner_id) return match.winner_id === userId ? "win" : "loss";

  // Ingen vinnare på en färdig match = oavgjort. Poängen läses ändå som
  // kontroll: en färdig match utan vinnare och med olika poäng betyder att
  // raden är halvskriven, och då är "oavgjort" fel svar.
  const p1 = match.player1_score ?? 0;
  const p2 = match.player2_score ?? 0;
  if (p1 === p2) return "draw";

  const isP1 = match.player1_id === userId;
  const mine = isP1 ? p1 : p2;
  const theirs = isP1 ? p2 : p1;
  return mine > theirs ? "win" : "loss";
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
