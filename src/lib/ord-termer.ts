/**
 * Vilka högskoleprov ett ORD-ord förekom på, ur arkivet. Byggs av
 * `scripts/hp-import/ord_termer.py` till `src/data/prov/ordtermer.json`
 * (slug → termer, nyast först). Ordlistans uppslag länkar med den till
 * /hogskoleprovet-ord/<termin>.
 *
 * Filnamnet saknar bindestreck med flit: `prov-data.ts` globbar
 * `*-*.json` som provpass.
 */
import termer from "@/data/prov/ordtermer.json";
import indexJson from "@/data/prov/index.json";
import { termLabel } from "@/lib/normering";

const TERMER = termer as Record<string, string[]>;
const DATUM = new Map(
  (indexJson as { exams: Array<{ term: string; date: string }> }).exams.map((e) => [
    e.term,
    e.date,
  ]),
);

export function ordExamTerms(slug: string): Array<{ term: string; label: string }> {
  return (TERMER[slug] ?? [])
    .filter((t) => DATUM.has(t))
    .map((t) => ({ term: t, label: termLabel(t, DATUM.get(t) as string) }));
}
