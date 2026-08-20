/**
 * Ungefärlig HP-normering: råpoäng (antal rätt av 160) → normerad poäng 0,00–2,00.
 *
 * Skalan går i steg om 0,05, aldrig 0,1 — funktionen avrundar därför till
 * närmaste tjugondel och når alla 41 värdena. Visas resultatet med en decimal
 * försvinner halva skalan; se poängräknaren.
 *
 * Tabellen är en approximation baserad på historiska normeringar (UHR normerar
 * varje prov för sig, så exakta gränser varierar). Samma tabell som används i
 * gamla-prov-flödet — här extraherad för återbruk i poängräknaren.
 */
const TABLE: readonly [number, number][] = [
  [0, 0.0],
  [10, 0.05],
  [20, 0.1],
  [30, 0.15],
  [40, 0.2],
  [50, 0.35],
  [55, 0.45],
  [60, 0.55],
  [65, 0.65],
  [70, 0.75],
  [75, 0.85],
  [80, 0.95],
  [85, 1.05],
  [90, 1.15],
  [95, 1.2],
  [100, 1.25],
  [105, 1.3],
  [110, 1.35],
  [115, 1.4],
  [120, 1.5],
  [125, 1.55],
  [130, 1.65],
  [135, 1.75],
  [140, 1.85],
  [145, 1.9],
  [150, 1.95],
  [155, 2.0],
  [160, 2.0],
];

/** Totalt antal normerade uppgifter på ett högskoleprov. */
export const HP_TOTAL_QUESTIONS = 160;

/** Uppskattad normerad poäng (0,00–2,00, i steg om 0,05) från antal rätt av 160. */
export function normeringFromRaw(rawOf160: number): number {
  const raw = Math.max(0, Math.min(HP_TOTAL_QUESTIONS, Math.round(rawOf160)));
  for (let i = 0; i < TABLE.length - 1; i++) {
    const [a, va] = TABLE[i];
    const [b, vb] = TABLE[i + 1];
    if (raw >= a && raw <= b) {
      const t = (raw - a) / (b - a || 1);
      return Math.round((va + (vb - va) * t) * 20) / 20;
    }
  }
  return 0;
}

/** Antal normerade uppgifter i en provdel — verbal respektive kvantitativ. */
export const HP_PART_QUESTIONS = HP_TOTAL_QUESTIONS / 2;

/**
 * Normerad poäng utifrån *andel* rätt i stället för antal.
 *
 * Tabellen ovan är satt för hela provet, men andelen är det enda som behövs:
 * ett enskilt provpass (40 uppgifter) och en hel provdel (80) räknas upp till
 * samma 160-skala. Det är en uppskattning och sägs vara det i gränssnittet —
 * UHR normerar varje prov för sig, med gränser satta efter provdagen.
 */
export function normeringFromRatio(ratio: number): number {
  if (!Number.isFinite(ratio)) return 0;
  return normeringFromRaw(ratio * HP_TOTAL_QUESTIONS);
}

/**
 * Provets sammanlagda poäng ur delarnas: medelvärdet, avrundat till 0,05.
 *
 * Så räknas högskoleprovet — den verbala och den kvantitativa delen normeras
 * var för sig och snittas — och det är också det svar en provskrivare väntar
 * sig: 1,90 verbalt och 2,00 kvantitativt blir 1,95, inte något tredje tal.
 *
 * Att i stället lägga ihop råpoängen och slå upp summan i tabellen ger ett
 * annat värde så fort delarna går isär, eftersom tabellen inte är rät: 20 av
 * 80 verbalt och 80 av 80 kvantitativt blir 1,10 som snitt men 1,25 som summa.
 * Poängräknaren på /hogskoleprovet-poangraknare gör det senare — den tar emot
 * råpoäng och har ingen delnormering att snitta.
 */
export function normeringFromParts(verbal: number, kvant: number): number {
  return Math.round(((verbal + kvant) / 2) * 20) / 20;
}

/* ── Officiell normering per provtillfälle ───────────────────────── */

import NORMERING_DATA from "@/data/prov/normering.json";

/**
 * UHR:s RIKTIGA normeringstabeller, en per provtillfälle och provdel.
 *
 * Tabellen ovan är en approximation som är densamma för vårprovet 2012 och
 * höstprovet 2025 — alltså i praktiken "ett prov som referens" oavsett vilket
 * prov man faktiskt skrivit. Men UHR normerar varje prov för sig, och
 * gränserna rör sig rejält mellan tillfällena: 50 rätt av 80 på den verbala
 * delen var 1,0 hösten 2025 men kan vara 1,1 eller 0,9 ett annat år. Det är
 * skillnaden mellan en gissning och ett besked.
 *
 * Filen byggs av `scripts/hp-import/normering.py` ur UHR:s egna PDF:er.
 * Formen är `[minsta antal rätt, största antal rätt, normerad poäng]`, och
 * poängen går i steg om 0,1 — halvstegen (1,95) uppstår först när provets två
 * delar snittas.
 *
 * Provtillfällen som saknas i filen faller tillbaka på approximationen, och
 * UI:t säger då att siffran är en uppskattning. Det gäller de äldsta proven,
 * där tabellerna inte finns kvar någonstans.
 */
type NormeringTabell = [number, number, number][];

interface NormeringPost {
  date?: string;
  verbal?: NormeringTabell;
  kvant?: NormeringTabell;
}

const OFFICIELL = NORMERING_DATA as unknown as Record<string, NormeringPost>;

/**
 * Antal uppgifter i provdelen tabellen är satt för.
 *
 * Läses ur tabellens sista intervall och antas INTE vara 80: vårprovet 2012
 * hade 76 uppgifter i den verbala delen (provformatet ändrades när ELF
 * infördes), och en hårdkodad åttio hade räknat om det till fel andel.
 */
function partMax(table: NormeringTabell): number {
  return table[table.length - 1][1];
}

/** Finns UHR:s egen tabell för den här provdelen? Styr vad UI:t skriver. */
export function hasOfficialNormering(term: string, kind: "verbal" | "kvant"): boolean {
  return !!OFFICIELL[term]?.[kind];
}

/** Finns officiella tabeller för BÅDA delarna, alltså för hela provet? */
export function hasOfficialExamNormering(term: string): boolean {
  return hasOfficialNormering(term, "verbal") && hasOfficialNormering(term, "kvant");
}

/**
 * Normerad poäng för en provdel: antal rätt av 80 → 0,0–2,0.
 *
 * `null` när provtillfället saknar officiell tabell — anroparen ska då säga
 * att siffran är uppskattad, inte tyst byta till approximationen.
 */
export function officialNormering(
  term: string,
  kind: "verbal" | "kvant",
  score: number,
  total: number,
): number | null {
  const table = OFFICIELL[term]?.[kind];
  if (!table || table.length === 0 || total <= 0) return null;
  const max = partMax(table);
  // Skrivet underlag räknas upp till tabellens skala. Har man skrivit hela
  // delen är det en ren identitet; har man skrivit ett av två provpass är det
  // samma antagande som resten av flödet gör, och det sägs i gränssnittet.
  const raw = Math.max(0, Math.min(max, Math.round((score / total) * max)));
  for (const [lo, hi, value] of table) {
    if (raw >= lo && raw <= hi) return value;
  }
  // Utanför tabellen ska inte kunna hända (importen validerar att den är
  // sammanhängande från 0), men ett tyst 0 vore värre än närmaste kända värde.
  return raw < table[0][0] ? table[0][2] : table[table.length - 1][2];
}

/**
 * Normerad poäng för en provdel, med approximationen som reserv.
 *
 * Returnerar också VILKEN väg som användes, så gränssnittet kan säga
 * "officiell normering för det här provet" respektive "uppskattning".
 */
export function normeringForPart(
  term: string,
  kind: "verbal" | "kvant",
  score: number,
  total: number,
): { value: number; official: boolean } {
  const officiell = officialNormering(term, kind, score, total);
  if (officiell !== null) return { value: officiell, official: true };
  return { value: normeringFromRatio(total > 0 ? score / total : 0), official: false };
}
