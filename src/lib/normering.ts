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
