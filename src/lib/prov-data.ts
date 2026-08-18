/**
 * Åtkomst till gamla proven (src/data/prov/, byggd av scripts/hp-import/).
 *
 * Indexet är litet och importeras direkt — det behövs på både provlistan och
 * varje provsida. Själva provpassen laddas som egna chunkar via import.meta.glob:
 * SSR läser dem utan nätanrop och klienten hämtar bara det pass användaren
 * öppnar. Den tidigare lösningen hämtade hela datamängden (916 kB) från en
 * hårdkodad https://tvakommanollan.se-URL, vilket gjorde att lokal utveckling läste
 * produktionsdata och att varje besök på /gamla-prov drog hem alla prov.
 */
import indexJson from "@/data/prov/index.json";
import examplesJson from "@/data/prov/exempel.json";
import type {
  ExamIndex,
  ExamSummary,
  ProvExample,
  ProvPass,
  ProvQuestion,
} from "@/types/gamla-prov";

const index = indexJson as ExamIndex;
const examples = examplesJson as Record<string, ProvExample[]>;

const passModules = import.meta.glob("@/data/prov/*-*.json") as Record<
  string,
  () => Promise<{ default: ProvPass }>
>;

/** Alla provtillfällen, nyast först. */
export function allExams(): ExamSummary[] {
  return index.exams;
}

export function findExam(term: string): ExamSummary | undefined {
  return index.exams.find((e) => e.term === term);
}

/** Totalt antal uppgifter i hela arkivet. */
export function totalQuestions(): number {
  return index.exams.reduce((sum, e) => sum + e.questions, 0);
}

/** Laddar ett provpass, eller null om det inte finns. */
export async function loadPass(term: string, pass: number): Promise<ProvPass | null> {
  const key = Object.keys(passModules).find((k) => k.endsWith(`/${term}-${pass}.json`));
  if (!key) return null;
  const mod = await passModules[key]();
  return mod.default;
}

/** Ett urval riktiga uppgifter i ett delprov, för övningssidorna. */
export function provExamples(code: string): ProvExample[] {
  return examples[code] ?? [];
}

/** Grannprov i kronologisk ordning, för föregående/nästa-länkar. */
export function examNeighbours(term: string): {
  newer: ExamSummary | undefined;
  older: ExamSummary | undefined;
} {
  const i = index.exams.findIndex((e) => e.term === term);
  if (i === -1) return { newer: undefined, older: undefined };
  return { newer: index.exams[i - 1], older: index.exams[i + 1] };
}

/** Godkända svar för en uppgift (fler än ett när UHR underkänt uppgiften). */
export function acceptedAnswers(q: ProvQuestion): string[] {
  return q.answers?.length ? q.answers : [q.answer];
}

export function isCorrect(q: ProvQuestion, answer: string | undefined): boolean {
  return !!answer && acceptedAnswers(q).includes(answer);
}

const ALT_LETTERS = ["A", "B", "C", "D", "E"];

/**
 * Antal svarsalternativ, oavsett om uppgiften är text eller bild.
 *
 * För bilduppgifter räknas alternativen ur provhäftet av importskriptet. Den
 * räkningen har slagit fel lågt (2021ht-1 nr 33 kom ut som `altCount: 3` med
 * facit "D"), och då gick uppgiften inte att svara rätt på alls — bara tre
 * knappar renderades. Nuvarande data har inga sådana fall kvar; det här är
 * ett skydd mot att parsern regredierar, inte en lagning av något aktuellt.
 */
export function altCount(q: ProvQuestion): number {
  if (q.alternatives?.length) return q.alternatives.length;
  const needed = acceptedAnswers(q).reduce(
    (max, a) => Math.max(max, ALT_LETTERS.indexOf(a) + 1),
    0,
  );
  return Math.max(q.altCount ?? 4, needed);
}
