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
