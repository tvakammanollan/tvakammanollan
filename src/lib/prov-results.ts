/**
 * Resultatet på skrivna provpass — det som gör att provlistan kan visa vad du
 * fick, provtillfälle för provtillfälle, medan du skrollar.
 *
 * Skilt från `prov-progress.ts` med flit, på två punkter:
 *
 *  - **Det pågående försöket är färskvara, resultatet är inte det.** Progress
 *    städas efter en vecka så att ett halvskrivet pass inte ligger kvar och
 *    erbjuder sig i evighet. Ett resultat ska stå kvar tills passet skrivs om.
 *  - **Här sparas summan, inte de fyrtio svaren.** Listsidan summerar trettio
 *    provtillfällen på en gång; att räkna rätt ur svaren hade krävt att varje
 *    provpassfil laddades (en egen chunk per pass, 120 stycken) för att svara
 *    på en fråga som ryms i två heltal.
 *
 * Lagringen är lokal, som resten av gamla prov-flödet: det fungerar utan
 * konto, och servern har ingen anledning att veta vad någon övat på.
 */
import { hasOfficialExamNormering, normeringForPart, normeringFromParts } from "./normering";
import type { ProvMode } from "./prov-progress";
import type { ExamSummary } from "@/types/gamla-prov";

export const RESULTS_STORAGE_KEY = "tkn:prov-resultat:v1";

export type PassKind = "verbal" | "kvant";

/** Ett inlämnat provpass, som det sparas. */
export interface PassResult {
  /** Antal rätt. */
  score: number;
  /** Antal uppgifter i passet. */
  total: number;
  kind: PassKind;
  /** Provläge eller övningsläge — övningsläget saknar tidspress. */
  mode: ProvMode;
  /** Tidpunkt för inlämningen. */
  at: number;
}

/** Nyckel `"2020ht:1"` → resultat. */
export type ProvResults = Record<string, PassResult>;

export function resultKey(term: string, pass: number): string {
  return `${term}:${pass}`;
}

/* ── Läsning och skrivning ───────────────────────────────────────── */

function isKind(v: unknown): v is PassKind {
  return v === "verbal" || v === "kvant";
}

function toResult(value: unknown): PassResult | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const score = v.score;
  const total = v.total;
  if (typeof score !== "number" || !Number.isFinite(score) || score < 0) return null;
  if (typeof total !== "number" || !Number.isFinite(total) || total <= 0) return null;
  if (!isKind(v.kind)) return null;
  return {
    score: Math.min(Math.round(score), Math.round(total)),
    total: Math.round(total),
    kind: v.kind,
    mode: v.mode === "ova" ? "ova" : "prov",
    at: typeof v.at === "number" && Number.isFinite(v.at) ? v.at : 0,
  };
}

/**
 * Tolkar lagringen post för post och kastar det som inte håller.
 *
 * localStorage är besökarens egen fil och kan innehålla vad som helst — en
 * halvskriven sträng efter en full disk, eller en rad från en äldre version.
 * Ett `NaN` som slinker igenom hamnar inte i en logg utan i en poäng: "NaN/40"
 * bredvid provpasset, och en normering som säger `—` utan att någon förstår
 * varför. Därför valideras varje fält, och en trasig post försvinner tyst i
 * stället för att smitta hela provtillfället.
 */
export function parseResults(raw: string | null): ProvResults {
  if (!raw) return {};
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object" || Array.isArray(data)) return {};
    const out: ProvResults = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const result = toResult(value);
      if (result) out[key] = result;
    }
    return out;
  } catch {
    return {};
  }
}

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadResults(): ProvResults {
  const store = storage();
  if (!store) return {};
  try {
    return parseResults(store.getItem(RESULTS_STORAGE_KEY));
  } catch {
    return {};
  }
}

/** Skriver resultatet för ett provpass. Ett omskrivet pass ersätter det gamla. */
export function saveResult(term: string, pass: number, result: PassResult): void {
  const store = storage();
  if (!store) return;
  try {
    const all = parseResults(store.getItem(RESULTS_STORAGE_KEY));
    all[resultKey(term, pass)] = result;
    store.setItem(RESULTS_STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* full eller avstängd lagring — provet fungerar ändå, resultatet sparas bara inte */
  }
}

export function passResult(
  results: ProvResults,
  term: string,
  pass: number,
): PassResult | undefined {
  return results[resultKey(term, pass)];
}

/* ── Sammanräkning ───────────────────────────────────────────────── */

/** En provdel (verbal eller kvantitativ) på ett provtillfälle. */
export interface PartResult {
  kind: PassKind;
  /** Antal skrivna provpass i delen. */
  done: number;
  /** Antal provpass delen består av. */
  passes: number;
  /** Rätt av uppgifter i de skrivna passen. */
  score: number;
  total: number;
  /** Normerad poäng — sätts först när hela delen är skriven. */
  normering: number | null;
  /**
   * Uppskattad poäng ur de pass som är skrivna, när delen INTE är hel än.
   * Finns för att den som skrivit ett pass ska få en siffra direkt, i stället
   * för att vänta ett pass till (55 minuter) på någon återkoppling alls.
   * Gränssnittet måste märka den som uppskattad: ett pass är halva
   * underlaget, och det andra passet kan flytta poängen åt båda hållen.
   * `null` när delen är hel (då gäller `normering`) eller orörd.
   */
  estimate: number | null;
  /**
   * Sant när poängen kommer ur UHR:s EGEN tabell för just det här
   * provtillfället, falskt när den är en uppskattning ur den generella
   * approximationen. Gränssnittet måste skriva ut skillnaden: en officiell
   * siffra är ett besked, en uppskattning är en fingervisning.
   */
  official: boolean;
}

/** Ett provtillfälle: båda delarna och den sammanlagda poängen. */
export interface ExamResult {
  verbal: PartResult;
  kvant: PartResult;
  /** Skrivna respektive totalt antal provpass. */
  done: number;
  passes: number;
  /** Sammanlagd poäng — först när båda delarna är hela. */
  normering: number | null;
  /**
   * Uppskattad totalpoäng när båda delarna har minst ett skrivet pass men
   * provet inte är helt. Ur en enda del räknas ingen total: verbal poäng är
   * inte en provpoäng.
   */
  estimate: number | null;
  /** Sant bara när BÅDA delarna räknats ur officiella tabeller. */
  official: boolean;
  /** Sant om något av passen skrevs i övningsläge, alltså utan klocka. */
  practice: boolean;
}

/**
 * Räknar ihop ett provtillfälle ur de sparade passresultaten.
 *
 * Delpoängen visas först när **hela** delen är skriven. Ett verbalt pass är
 * 40 uppgifter av åttio, och en normering ur halva underlaget hade sett ut
 * som ett provresultat utan att vara det — den som fick 1,90 på ett pass
 * behöver inte alls landa där när det andra passet är skrivet.
 */
export function summariseExam(exam: ExamSummary, results: ProvResults): ExamResult {
  const done: PassResult[] = [];

  const part = (kind: PassKind): PartResult => {
    const passes = exam.passes.filter((p) => p.kind === kind);
    const written = passes
      .map((p) => passResult(results, exam.term, p.pass))
      .filter((r): r is PassResult => !!r);
    done.push(...written);

    const score = written.reduce((sum, r) => sum + r.score, 0);
    const total = written.reduce((sum, r) => sum + r.total, 0);
    const complete = passes.length > 0 && written.length === passes.length && total > 0;

    // UHR:s egen tabell för DET HÄR provtillfället när den finns, annars den
    // generella approximationen. Gränserna rör sig rejält mellan provtillfällen
    // — 50 rätt av 80 verbalt var 1,0 hösten 2025 men kan vara 0,9 eller 1,1 ett
    // annat år — så en gemensam tabell för alla prov är i praktiken att normera
    // mot fel prov.
    const normering = complete ? normeringForPart(exam.term, kind, score, total) : null;
    // Samma uträkning på halva underlaget: `officialNormering` räknar upp de
    // skrivna passen till tabellens skala.
    const estimate =
      !complete && written.length > 0 && total > 0
        ? normeringForPart(exam.term, kind, score, total).value
        : null;

    return {
      kind,
      done: written.length,
      passes: passes.length,
      score,
      total,
      normering: normering?.value ?? null,
      estimate,
      official: normering?.official ?? false,
    };
  };

  const verbal = part("verbal");
  const kvant = part("kvant");
  const verbalValue = verbal.normering ?? verbal.estimate;
  const kvantValue = kvant.normering ?? kvant.estimate;
  const complete = verbal.normering !== null && kvant.normering !== null;

  return {
    verbal,
    kvant,
    done: done.length,
    passes: exam.passes.length,
    normering: complete ? normeringFromParts(verbal.normering!, kvant.normering!) : null,
    estimate:
      !complete && verbalValue !== null && kvantValue !== null
        ? normeringFromParts(verbalValue, kvantValue)
        : null,
    // Hela provet är officiellt bara om båda delarna är det. En officiell
    // verbal poäng snittad med en uppskattad kvantitativ är en uppskattning.
    official: verbal.official && kvant.official && hasOfficialExamNormering(exam.term),
    practice: done.some((r) => r.mode === "ova"),
  };
}
