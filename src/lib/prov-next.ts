/**
 * Vad startsidans provkort föreslår härnäst.
 *
 * Ren och testad: förslaget är en regel ("skriv det andra passet i samma del
 * först, så att delen får en poäng"), och den ska gå att läsa utan att
 * localStorage eller React är inblandade.
 */
import type { PassResult, ProvResults } from "./prov-results";
import type { ExamSummary } from "@/types/gamla-prov";

export interface LatestResult {
  term: string;
  pass: number;
  result: PassResult;
}

/** Det senast inlämnade provpasset, eller null. */
export function latestResult(results: ProvResults): LatestResult | null {
  let best: LatestResult | null = null;
  for (const [key, result] of Object.entries(results)) {
    const [term, pass] = key.split(":");
    const nr = Number(pass);
    if (!term || !Number.isFinite(nr)) continue;
    if (!best || result.at > best.result.at) best = { term, pass: nr, result };
  }
  return best;
}

/**
 * Nästa pass att skriva på samma provtillfälle.
 *
 * Först det andra passet i samma del (`kind`), eftersom det är det som ger
 * delen en riktig poäng. Därefter första oskrivna passet i provet, så att en
 * totalpoäng kommer närmare. Är hela provet skrivet finns inget förslag.
 */
export function suggestNextPass(
  exam: ExamSummary,
  results: ProvResults,
  kind: PassResult["kind"],
): { pass: number; kind: PassResult["kind"]; completesPart: boolean } | null {
  const unwritten = exam.passes.filter((p) => !results[`${exam.term}:${p.pass}`]);
  const samePart = unwritten.find((p) => p.kind === kind);
  if (samePart) return { pass: samePart.pass, kind: samePart.kind, completesPart: true };
  const any = unwritten[0];
  return any ? { pass: any.pass, kind: any.kind, completesPart: false } : null;
}

/**
 * Sekunder kvar på ett påbörjat pass i provläge, null i övningsläge. Står
 * klockan pausad räknas den mot pausens början, som i provet självt.
 */
export function secondsLeft(
  endsAt: number | null,
  pausedAt: number | null | undefined,
  now: number,
): number | null {
  if (endsAt === null) return null;
  return Math.max(0, Math.round((endsAt - (pausedAt ?? now)) / 1000));
}
