/**
 * Adresserna i ordlistan.
 *
 * Ordlistan ger varje ORD-uppslag en egen sida (/ordlista/<slug>). Uppslagen
 * kommer ur `questions.question_text` och är allt från enkla ord ("viskös")
 * till fraser ("a cappella"), affix ("-ism", "a-") och lånord med accenter
 * ("crème de la crème").
 *
 * Två egenskaper är medvetna och lätta att bygga bort:
 *
 * 1. **Å, Ä och Ö står kvar i adressen.** Att translitterera dem till a/a/o
 *    är frestande men kolliderar på riktigt i det här beståndet — "får" och
 *    "far" är två olika uppslag, liksom "hår"/"har" och "mål"/"mal". En
 *    procentkodad URL är fulare i en adressrad än en krock är i ett index,
 *    och både Google och webbläsare visar den avkodad.
 * 2. **Inledande och avslutande bindestreck trimmas inte.** De bär betydelsen
 *    hos affixen: "-ism" är en ändelse och "a-" ett förled. Trimmas de blir
 *    de två oskiljbara från vanliga ord.
 */

/** Tecken som får stå kvar i en slug. Allt annat faller bort. */
const SLUG_ALLOWED = /[^a-z0-9åäöéèêëüïîôûçáàâíóúñ'-]/g;

/**
 * Ordets adressform. Gemener, mellanslag och understreck blir bindestreck,
 * och skiljetecken faller bort.
 *
 * Två uppslag i beståndet ger samma slug ("crème de la crème" och
 * "crème-de-la-crème"). Det är inte ett fel att bygga bort här — funktionen
 * ska vara ren och förutsägbar. Uppslagningen väljer i stället deterministiskt,
 * se `ordlista.server.ts`.
 */
export function ordSlug(word: string): string {
  return word
    .trim()
    .toLowerCase()
    .replace(/[’´`]/g, "'")
    .replace(/[\s_]+/g, "-")
    .replace(SLUG_ALLOWED, "")
    .replace(/-{2,}/g, "-");
}

/**
 * Bokstavsregistren. Svenska alfabetet, med å, ä och ö sist där de hör hemma.
 * Allt som inte börjar på en av dem — affix på bindestreck, siffror — samlas
 * under `ORD_LETTER_OTHER`.
 */
export const ORD_LETTERS = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "å",
  "ä",
  "ö",
] as const;

export const ORD_LETTER_OTHER = "ovrigt";

/** Bokstavsregistret ett uppslag hör hemma i. */
export function ordLetter(word: string): string {
  const first = ordSlug(word).charAt(0);
  return (ORD_LETTERS as readonly string[]).includes(first) ? first : ORD_LETTER_OTHER;
}

/** Är strängen ett giltigt bokstavsregister? Används för att 404:a resten. */
export function isOrdLetter(value: string): boolean {
  return value === ORD_LETTER_OTHER || (ORD_LETTERS as readonly string[]).includes(value);
}

/** Rubrikform: "a" → "A", "ovrigt" → "Övrigt". */
export function ordLetterLabel(letter: string): string {
  return letter === ORD_LETTER_OTHER ? "Övrigt" : letter.toUpperCase();
}

/** Sorterar uppslag som en svensk ordlista gör. */
export const ordCollator = new Intl.Collator("sv-SE");
