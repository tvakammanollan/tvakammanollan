/**
 * Röstningen på frågor: hur rösterna blir till urval.
 *
 * Tumme upp eller ned efter att man svarat. Det rösterna styr är vilka frågor
 * som delas ut och hur ofta. De bra kommer oftare, och de som tillräckligt
 * många med säkerhet ogillar slutar delas ut. Ingenting raderas: en begravd
 * fråga står kvar i databasen och kommer tillbaka av sig själv om rösterna
 * vänder.
 *
 * Ren logik, testad i `question-votes.test.ts`. Databasdelen är
 * `question-votes.server.ts`.
 *
 * Tre beslut som är lätta att göra fel:
 *
 * - **Säkerhet, inte andel.** 1 upp och 0 ned är 100 % men säger ingenting.
 *   Wilsonintervallet ger en gräns som växer med antalet röster, så en fråga
 *   begravs först när det är *säkert* att de flesta ogillar den, och lyfts
 *   först när det är säkert att de flesta gillar den.
 * - **Gäster väger hälften.** Gästkonton går att skapa i obegränsat antal, och
 *   det farliga utfallet är att någon begraver bra frågor med en hög
 *   engångskonton. Att stänga ute gästerna helt hade tappat de flesta
 *   rösterna, eftersom de flesta som spelar är gäster.
 * - **Begravning kräver många röster.** `MIN_VOTES_TO_BURY` viktade röster
 *   innan något försvinner. Ett lyft är billigare (`MIN_VOTES_TO_FAVOUR`)
 *   eftersom ett felaktigt lyft bara gör att en fråga visas lite oftare.
 */

export type Vote = -1 | 1;

export interface VoteTally {
  up: number;
  down: number;
  guestUp: number;
  guestDown: number;
}

export const EMPTY_TALLY: VoteTally = { up: 0, down: 0, guestUp: 0, guestDown: 0 };

export const GUEST_WEIGHT = 0.5;
export const MIN_VOTES_TO_BURY = 8;
export const MIN_VOTES_TO_FAVOUR = 5;
/** Begravs när det med 95 % säkerhet är färre än 40 % som gillar frågan. */
export const BURY_BELOW = 0.4;
/** Lyfts när det med 95 % säkerhet är fler än 60 % som gillar frågan. */
export const FAVOUR_ABOVE = 0.6;
/**
 * Vikten följer nettorösterna (upp minus ned, gäster till hälften): varje
 * nettoröst multiplicerar vikten med √2, så +2 ger dubbel chans, +4 fyrdubbel
 * och taket +8 sexton gånger. Nedröster drar ned vikten på samma sätt.
 * Taket finns för att några få röster inte ska kunna låta en fråga ta över.
 */
export const NET_VOTE_CAP = 8;
/** Högsta vikt en fråga kan få, vid `NET_VOTE_CAP` nettoröster. */
export const FAVOURED_WEIGHT = Math.pow(2, NET_VOTE_CAP / 2);

export type VoteStatus = "buried" | "neutral" | "favoured";

const Z = 1.96;

/** Viktade upp- och nedröster. */
export function weighted(t: VoteTally): { up: number; down: number; n: number } {
  const up = t.up + GUEST_WEIGHT * t.guestUp;
  const down = t.down + GUEST_WEIGHT * t.guestDown;
  return { up, down, n: up + down };
}

/** Wilsonintervallet för andelen upp-röster. [0, 1] utan röster. */
export function wilsonInterval(up: number, n: number): [number, number] {
  if (n <= 0) return [0, 1];
  const p = up / n;
  const z2 = Z * Z;
  const centre = p + z2 / (2 * n);
  const margin = Z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n));
  const denom = 1 + z2 / n;
  return [Math.max(0, (centre - margin) / denom), Math.min(1, (centre + margin) / denom)];
}

export function voteStatus(t: VoteTally): VoteStatus {
  const { up, n } = weighted(t);
  const [low, high] = wilsonInterval(up, n);
  if (n >= MIN_VOTES_TO_BURY && high < BURY_BELOW) return "buried";
  if (n >= MIN_VOTES_TO_FAVOUR && low > FAVOUR_ABOVE) return "favoured";
  return "neutral";
}

/**
 * Dragningsvikt. 0 betyder att frågan inte delas ut (med säkerhet ogillad,
 * se `voteStatus`); annars `2^(netto/2)`, från 1/16 till 16, där en fråga
 * utan röster har 1. Tillsammans med `weightedShuffle` blir sannolikheten att
 * en fråga kommer tidigt starkt kopplad till hur många som gillar den, utan
 * att samma frågor alltid kommer först.
 */
export function voteWeight(t: VoteTally | undefined): number {
  const tally = t ?? EMPTY_TALLY;
  if (voteStatus(tally) === "buried") return 0;
  const { up, down } = weighted(tally);
  const net = Math.max(-NET_VOTE_CAP, Math.min(NET_VOTE_CAP, up - down));
  return Math.pow(2, net / 2);
}

/**
 * Viktad blandning utan återläggning (Efraimidis–Spirakis): varje element får
 * nyckeln `u^(1/w)` och listan sorteras fallande. Ett element med vikt 2 hamnar
 * alltså oftare tidigt, men aldrig alltid, och vikt 0 tas bort helt.
 *
 * Det är blandningen och inte en sortering på poäng med flit: sorterades
 * frågorna på röster skulle samma tjugo frågor komma först i varje pass.
 */
export function weightedShuffle<T>(
  items: T[],
  weightOf: (item: T) => number,
  random: () => number = Math.random,
): T[] {
  return items
    .map((item) => ({ item, w: weightOf(item) }))
    .filter((x) => x.w > 0)
    .map((x) => ({ item: x.item, key: Math.pow(random(), 1 / x.w) }))
    .sort((a, b) => b.key - a.key)
    .map((x) => x.item);
}

/**
 * Siffrorna bredvid tummarna medan man klickar.
 *
 * Servern svarar med totalen inklusive den röst användaren hade när sidan
 * laddades (`stored`). När användaren byter eller tar tillbaka rösten
 * (`current`) räknas den gamla bort och den nya in, utan att vänta på ett
 * nytt anrop. Aldrig under noll, ifall totalen och den egna rösten lästes i
 * otakt.
 */
export function displayedVoteCounts(
  server: { up: number; down: number },
  stored: -1 | 0 | 1,
  current: -1 | 0 | 1,
): { up: number; down: number } {
  const up = server.up - (stored === 1 ? 1 : 0) + (current === 1 ? 1 : 0);
  const down = server.down - (stored === -1 ? 1 : 0) + (current === -1 ? 1 : 0);
  return { up: Math.max(0, up), down: Math.max(0, down) };
}
