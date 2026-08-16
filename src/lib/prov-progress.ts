/**
 * Sparar pågående gamla prov i localStorage.
 *
 * Tidigare låg hela provet i React-state: en omladdning mitt i ett provpass
 * kastade alla 40 svaren, och det fanns ingen väg tillbaka. Nu överlever
 * svar, flaggor och kvarvarande tid både omladdning och stängd flik.
 */

export type ProvMode = "prov" | "ova";

export interface ProvProgress {
  mode: ProvMode;
  /** Uppgiftsnummer → svarsbokstav. */
  answers: Record<number, string>;
  /** Uppgifter markerade för genomgång. */
  flagged: number[];
  startedAt: number;
  /** Tidpunkt då provtiden går ut (bara i provläge). */
  endsAt: number | null;
  submittedAt: number | null;
}

const PREFIX = "gamla-prov:";
/** Påbörjade prov städas bort efter en vecka. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function key(term: string, pass: number): string {
  return `${PREFIX}${term}:${pass}`;
}

export function loadProgress(term: string, pass: number): ProvProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key(term, pass));
    if (!raw) return null;
    const data = JSON.parse(raw) as ProvProgress;
    if (!data.startedAt || Date.now() - data.startedAt > MAX_AGE_MS) {
      window.localStorage.removeItem(key(term, pass));
      return null;
    }
    return { ...data, answers: data.answers ?? {}, flagged: data.flagged ?? [] };
  } catch {
    return null;
  }
}

export function saveProgress(term: string, pass: number, progress: ProvProgress): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key(term, pass), JSON.stringify(progress));
  } catch {
    /* full eller avstängd lagring — provet fungerar ändå, det sparas bara inte */
  }
}

export function clearProgress(term: string, pass: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key(term, pass));
  } catch {
    /* ignoreras */
  }
}

/** Alla påbörjade provpass, nyast först — används för "fortsätt där du var". */
export function startedPasses(): { term: string; pass: number; progress: ProvProgress }[] {
  if (typeof window === "undefined") return [];
  const out: { term: string; pass: number; progress: ProvProgress }[] = [];
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (!k?.startsWith(PREFIX)) continue;
      const [, term, pass] = k.split(":");
      const progress = loadProgress(term, Number(pass));
      if (progress) out.push({ term, pass: Number(pass), progress });
    }
  } catch {
    return [];
  }
  return out.sort((a, b) => b.progress.startedAt - a.progress.startedAt);
}
