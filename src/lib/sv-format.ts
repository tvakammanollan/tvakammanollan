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
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString(SV);
}

export function formatDecimal(n: number | null | undefined, fractionDigits = 1): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString(SV, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function formatPercent(ratio: number | null | undefined): string {
  if (ratio == null || !Number.isFinite(ratio)) return "—";
  return `${Math.round(ratio * 100)} %`;
}

export function formatPercentInt(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
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
 * Om en definition har något att säga efter städning. Ett fåtal uppslag i
 * källorna består bara av skiljetecken (tete-a-tete gav "." och florstunn "—."),
 * och att bjuda in med "Vad betyder X?" för att sedan fälla ut en punkt är
 * sämre än att inte visa något alls.
 */
export function hasOrdDefinition(s: string | null | undefined): boolean {
  return ordDefinition(s).replace(/[^\p{L}\p{N}]/gu, "").length >= 2;
}

const HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/**
 * Normaliserar en ordförklaring/definition för visning: trimmar och ser
 * till att den börjar med versal (källorna blandar). Radbrytningar bevaras
 * (definitioner renderas med whitespace-pre-wrap).
 *
 * Städar också bort tre artefakter från svenska.se-skrapningen. Görs vid
 * rendering, inte i databasen, så att även det skrapan hämtar i framtiden
 * blir rent utan ny migration:
 *
 * 1. Homografsiffror som klistrats fast i uppslagsordet ("Det att 1ticka",
 *    "2smitta"). svenska.se numrerar likstavade ord, och siffran följde med.
 *    Bara siffror som sitter direkt före en bokstav tas bort — "10 000 m2"
 *    och betydelsenumreringen "1. ... 2. ..." måste överleva.
 * 2. Odekodade HTML-entiteter, inklusive hexvarianten (`&#x2020;`).
 * 3. Länkar som följt med in i brödtexten.
 */
export function ordDefinition(s: string | null | undefined): string {
  let t = (s ?? "").trim();
  if (!t) return t;

  t = t
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (m, name: string) => HTML_ENTITIES[name.toLowerCase()] ?? m);

  // Siffra direkt före bokstav = homografmarkör. Kräver ord-gräns före siffran
  // så att "m2" och "10 000" lämnas i fred.
  t = t.replace(/\b(\d+)(?=\p{L})/gu, "");

  // Ensam siffra kvar på slutet ("ytterligt 1sträng 1"). Endast ett ensamt
  // ensiffrigt tal sist — årtal och mängder är flersiffriga och rörs inte.
  t = t.replace(/\s+[1-9]$/, "");

  // Ta med föregående blanksteg så att borttagningen inte lämnar dubbelt
  // mellanslag efter sig. Ingen generell kollaps av mellanslag: källorna
  // separerar betydelser med dubbelt mellanslag ("1. ...  2. ...").
  t = t.replace(/[ \t]*https?:\/\/\S+/g, "");

  t = t.trim();
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}
