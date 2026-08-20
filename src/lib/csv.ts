/**
 * CSV-export.
 *
 * Egen och pytteliten i stället för ett bibliotek: det enda som är svårt med
 * CSV är citering, och den regeln får plats på fem rader.
 *
 * Två saker som brukar gå fel och som hanteras här:
 *
 *  - **Semikolon, inte komma.** Svenskt Excel läser komma som decimaltecken
 *    och lägger hela raden i en kolumn. Semikolon är vad Excel på svenska
 *    systemlokal förväntar sig.
 *  - **BOM först.** Utan byte order mark tolkar Excel filen som Windows-1252,
 *    och varje å, ä och ö blir mojibake. Det är det enskilt vanligaste
 *    "exporten är trasig"-felet.
 */

/** Citerar ett fält enligt RFC 4180 om det behövs. */
export function csvField(value: unknown, delimiter = ";"): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  // Ett fält som börjar med =, +, - eller @ tolkas som formel av Excel och
  // Google Sheets. Ett telefonnummer som "+46701234567" blir då en uträkning,
  // och i värsta fall körs innehållet. Nollbredds-prefix duger inte i Excel —
  // ett inledande apostrof gör det.
  const farlig = /^[=+\-@\t\r]/.test(s);
  const body = farlig ? `'${s}` : s;
  if (body.includes('"') || body.includes(delimiter) || /[\n\r]/.test(body)) {
    return `"${body.replace(/"/g, '""')}"`;
  }
  return body;
}

export function toCsv(
  headers: string[],
  rows: unknown[][],
  { delimiter = ";", bom = true } = {},
): string {
  const lines = [headers, ...rows].map((r) => r.map((c) => csvField(c, delimiter)).join(delimiter));
  // CRLF: Excel på Windows delar inte rader på ensamt LF i alla versioner.
  return (bom ? "﻿" : "") + lines.join("\r\n") + "\r\n";
}

/**
 * Startar en nedladdning i webbläsaren.
 *
 * Blob-URL:en återkallas efter klicket — utan det håller webbläsaren kvar
 * hela filen i minnet tills fliken stängs.
 */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
