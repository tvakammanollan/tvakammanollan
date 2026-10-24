/**
 * ORD-uppgifterna ur ett provtillfälle, för /hogskoleprovet-ord/<termin>.
 * Läser de verbala provpassen ur arkivet (samma chunkar som gamla prov) och
 * plockar ut delprovet ORD, i provpassens ordning.
 */
import { findExam, loadPass } from "@/lib/prov-data";

export interface ProvOrd {
  pass: number;
  nr: number;
  word: string;
  alternatives: string[];
  answer: string;
}

export async function loadExamOrd(term: string): Promise<ProvOrd[] | null> {
  const exam = findExam(term);
  if (!exam) return null;
  const ut: ProvOrd[] = [];
  for (const p of exam.passes) {
    if (p.kind !== "verbal") continue;
    const data = await loadPass(term, p.pass);
    for (const q of data?.questions ?? []) {
      if (q.delprov !== "ORD" || !q.text || !q.alternatives?.length) continue;
      ut.push({
        pass: p.pass,
        nr: q.nr,
        word: q.text.trim(),
        alternatives: q.alternatives,
        answer: q.answer,
      });
    }
  }
  return ut;
}
