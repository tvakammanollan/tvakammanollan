/**
 * Swedish number formatting helpers.
 *
 * Sweden uses non-breaking space as thousands separator and comma for decimals.
 *
 *   formatInt(12540)         → "12 540"
 *   formatDecimal(1.5, 1)    → "1,5"
 *   formatPercent(0.72)      → "72 %"
 *   formatRelativeTime(date) → "för 2 min sedan"
 */

const SV = "sv-SE";

export function formatInt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "–";
  return n.toLocaleString(SV);
}

/**
 * Antal med rätt böjt substantiv: `antal(1, "tråd", "trådar")` → "1 tråd".
 *
 * Skrivet för att "1 trådar" stod på forumets startsida, alltså på en sida
 * som indexeras. Svenskan böjer inte alla ord (ett inlägg, två inlägg), så
 * pluralformen skickas in i stället för att härledas — den som skriver
 * texten vet, funktionen kan inte veta.
 */
export function antal(n: number, singular: string, plural: string): string {
  return `${formatInt(n)} ${n === 1 ? singular : plural}`;
}

export function formatDecimal(n: number | null | undefined, fractionDigits = 1): string {
  if (n == null || !Number.isFinite(n)) return "–";
  return n.toLocaleString(SV, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

/**
 * Belopp i minsta enhet (ören) → "1 495 kr".
 *
 * Stripe räknar allt i minsta enhet, så beloppet kommer alltid som heltal.
 * Jämna kronor visas utan decimaler — "1 495,00 kr" på en prisknapp ser ut som
 * ett systemfel, inte som ett pris.
 */
export function formatMoney(minorUnits: number | null | undefined, currency = "SEK"): string {
  if (minorUnits == null || !Number.isFinite(minorUnits)) return "–";
  const major = minorUnits / 100;
  const decimals = minorUnits % 100 === 0 ? 0 : 2;
  return major.toLocaleString(SV, {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercent(ratio: number | null | undefined): string {
  if (ratio == null || !Number.isFinite(ratio)) return "–";
  return `${Math.round(ratio * 100)} %`;
}

export function formatPercentInt(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "–";
  return `${value} %`;
}

const REL = new Intl.RelativeTimeFormat(SV, { numeric: "auto" });

export function formatRelativeTime(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  const diff = (Date.now() - d.getTime()) / 1000;
  const sign = diff >= 0 ? -1 : 1;
  const abs = Math.abs(diff);
  if (abs < 60) return REL.format(Math.round(sign * abs), "second");
  if (abs < 3600) return REL.format(Math.round((sign * abs) / 60), "minute");
  if (abs < 86400) return REL.format(Math.round((sign * abs) / 3600), "hour");
  if (abs < 2592000) return REL.format(Math.round((sign * abs) / 86400), "day");
  return REL.format(Math.round((sign * abs) / 2592000), "month");
}

export function formatDate(
  date: Date | string | number,
  opts?: Intl.DateTimeFormatOptions,
): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString(SV, opts ?? { day: "numeric", month: "short" });
}

/**
 * Fullt utskrivet datum: "lördag 15 augusti 2026".
 *
 * Fanns tidigare inlagt för hand på två ställen (HP-nedräkningen och
 * /hogskoleprovet-datum) med samma fält i olika ordning.
 */
export function formatDateLong(date: Date | string | number): string {
  return formatDate(date, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatTime(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString(SV, { hour: "2-digit", minute: "2-digit" });
}

/**
 * Översätter delprov-kategori från DB-format till visningsformat.
 *
 * DBs questions.category-constraint tillåter endast ASCII-värden
 * ('ORD','MEK','LAS','ELF','XYZ','KVA','NOG','DTK') eftersom Postgres
 * CHECK-constraints med Unicode-tecken är bräckliga. Frontend visar
 * dock alltid svensk stavning "LÄS" till användaren.
 *
 *   displayCategory("LAS") → "LÄS"
 *   displayCategory("ORD") → "ORD" (oförändrat)
 */
export function displayCategory(category: string): string {
  return category === "LAS" ? "LÄS" : category;
}

/**
 * Normaliserar ett HP-ord eller svarsalternativ för visning.
 *
 * Ord i databasen har blandad casing (vissa VERSALER, vissa gemener) och
 * ibland ojämna mellanslag. Svenska uppslagsord skrivs med gemener, så vi
 * normaliserar ALLTID vid rendering — använd denna överallt där ORD-ord
 * eller deras alternativ visas (ord-träning, matcher, träning, resultat,
 * gamla prov, dagens ord).
 *
 *   ordText("  PROGNOS ")   → "prognos"
 *   ordText("Ta  reda på")  → "ta reda på"
 */
export function ordText(s: string | null | undefined): string {
  return (s ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Ordförklaringarna bor i `lib/ord-definition.ts` — de behövde växa ur en
 * enkel formaterare (utskrivna förkortningar, exempelmeningar, liknande ord)
 * och sv-format ska förbli små, rena formateringshjälpare. Återexporteras
 * här eftersom hela appen redan importerar dem härifrån.
 */
export { ordDefinition, hasOrdDefinition } from "./ord-definition";
