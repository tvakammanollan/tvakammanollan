/**
 * Delade typer/hjälpare för gamla-prov-datat (public/gamla-prov-data.json).
 * Användes tidigare duplicerat i gamla-prov.tsx, gamla-prov_.$term.tsx och
 * ova.$delprov.tsx.
 */
export interface RawQ {
  exam_term: string;
  provpass: number;
  nr: number;
  delProv: string;
  fraga: string;
  a: string;
  b: string;
  c: string;
  d: string;
  e: string;
  svar: string;
  passage?: string;
  passage_title?: string;
  image?: string;
}

/** "2026vt" → "Vårprovet 2026", "2025ht" → "Höstprovet 2025". */
export function termToLabel(term: string): string {
  const m = term.match(/^(\d{4})(ht|vt[ab]?)$/);
  if (!m) return term;
  const season = m[2].startsWith("ht") ? "Höstprovet" : "Vårprovet";
  return `${season} ${m[1]}`;
}
