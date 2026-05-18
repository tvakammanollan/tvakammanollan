import { createServerFn } from "@tanstack/react-start";
import { readFileSync } from "node:fs";
import { join } from "node:path";

interface RawQ {
  provpass: number;
  nr: number;
  delProv: string;
  exam_term: string;
}

export interface ProvpassSummary {
  provpass: number;
  questionCount: number;
  delProvs: string[]; // e.g. ["ORD","MEK","LÄS","ELF"]
}

export interface ExamSummary {
  exam_term: string; // e.g. "2026vt"
  label: string; // e.g. "Vårprovet 2026"
  passes: ProvpassSummary[];
  totalQuestions: number;
}

export interface GamlaProvSummary {
  exams: ExamSummary[];
  totalExams: number;
  totalQuestions: number;
}

function termToLabel(term: string): string {
  const m = term.match(/^(\d{4})(ht|vt[ab]?)$/);
  if (!m) return term;
  const season = m[2].startsWith("ht") ? "Höstprovet" : "Vårprovet";
  return `${season} ${m[1]}`;
}

function termSortKey(term: string): string {
  const m = term.match(/^(\d{4})(ht|vt[ab]?)$/);
  if (!m) return term;
  const seasonOrder = m[2].startsWith("ht") ? "2" : "1";
  return `${m[1]}-${seasonOrder}-${m[2]}`;
}

/**
 * Server function that reads the static gamla-prov-data.json and
 * returns a compact catalog (no question bodies — those stay
 * client-side fetched when the user opens a quiz). Used by the route
 * loader so the selection screen ships in the initial SSR HTML for SEO.
 */
export const getGamlaProvSummary = createServerFn({ method: "GET" }).handler(
  async (): Promise<GamlaProvSummary> => {
    const path = join(process.cwd(), "public", "gamla-prov-data.json");
    const raw = readFileSync(path, "utf8");
    const all = JSON.parse(raw) as RawQ[];

    const examMap = new Map<string, Map<number, RawQ[]>>();
    for (const q of all) {
      if (!examMap.has(q.exam_term)) examMap.set(q.exam_term, new Map());
      const ppMap = examMap.get(q.exam_term)!;
      if (!ppMap.has(q.provpass)) ppMap.set(q.provpass, []);
      ppMap.get(q.provpass)!.push(q);
    }

    const exams: ExamSummary[] = [];
    for (const [exam_term, ppMap] of examMap.entries()) {
      const passes: ProvpassSummary[] = [];
      let totalQuestions = 0;
      for (const [provpass, qs] of [...ppMap.entries()].sort((a, b) => a[0] - b[0])) {
        const delProvs = Array.from(new Set(qs.map((q) => q.delProv)));
        passes.push({
          provpass,
          questionCount: qs.length,
          delProvs,
        });
        totalQuestions += qs.length;
      }
      exams.push({
        exam_term,
        label: termToLabel(exam_term),
        passes,
        totalQuestions,
      });
    }

    exams.sort((a, b) => termSortKey(b.exam_term).localeCompare(termSortKey(a.exam_term)));

    return {
      exams,
      totalExams: exams.length,
      totalQuestions: exams.reduce((s, e) => s + e.totalQuestions, 0),
    };
  },
);
