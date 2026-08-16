/**
 * Överstrykningspenna för lästexter (LÄS och ELF).
 *
 * En markering sparas som teckenoffset i ett stycke — inte som den markerade
 * strängen. Den tidigare varianten i PassagePane letade upp texten igen med
 * indexOf och räknade "vilken förekomst i ordningen" det var, vilket gick fel
 * så fort man tog bort en markering mitt i: numreringen sköt sig och gula fält
 * hoppade till fel ord. Offset i stycket är entydigt och överlever att andra
 * markeringar kommer och går.
 *
 * Texten som markeras är alltid oförändrad (den kommer ur provdatan), så
 * offseten pekar på samma tecken vid nästa besök.
 */

export interface HighlightRange {
  /** Styckeindex i passagen. */
  p: number;
  /** Teckenoffset i stycket. Halvöppet intervall [start, end). */
  start: number;
  end: number;
}

/** Ett textsegment att rendera — markerat eller inte. */
export interface Segment {
  text: string;
  marked: boolean;
  /** Startoffset i stycket, så att klick på ett segment kan sudda rätt del. */
  start: number;
}

const PREFIX = "hp-highlights:";
/** Påbörjade markeringar städas bort efter en vecka, som gamla-prov-svaren. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export type StorageKind = "local" | "session";

/**
 * Lägger till en markering och slår ihop den med allt den nuddar i samma
 * stycke, så att två drag över samma mening blir ett fält och inte två lager.
 */
export function addRange(list: HighlightRange[], next: HighlightRange): HighlightRange[] {
  if (next.end <= next.start) return list;

  let { start, end } = next;
  const rest: HighlightRange[] = [];
  for (const r of list) {
    // Överlappar eller ligger kant i kant → smält ihop.
    if (r.p === next.p && r.start <= end && start <= r.end) {
      start = Math.min(start, r.start);
      end = Math.max(end, r.end);
    } else {
      rest.push(r);
    }
  }
  rest.push({ p: next.p, start, end });
  return sortRanges(rest);
}

/**
 * Tar bort markeringen som täcker en viss punkt. Det är suddgummit: med pennan
 * aktiv tar ett klick i ett gult fält bort just det fältet.
 */
export function removeAt(list: HighlightRange[], p: number, offset: number): HighlightRange[] {
  return list.filter((r) => !(r.p === p && offset >= r.start && offset < r.end));
}

function sortRanges(list: HighlightRange[]): HighlightRange[] {
  return [...list].sort((a, b) => (a.p === b.p ? a.start - b.start : a.p - b.p));
}

/**
 * Delar ett stycke i segment att rendera. Returnerar alltid minst ett segment
 * så att tomma stycken inte försvinner ur layouten.
 */
export function segmentParagraph(text: string, ranges: HighlightRange[], p: number): Segment[] {
  const mine = sortRanges(ranges.filter((r) => r.p === p))
    .map((r) => ({ start: Math.max(0, r.start), end: Math.min(text.length, r.end) }))
    .filter((r) => r.end > r.start);

  if (mine.length === 0) return [{ text, marked: false, start: 0 }];

  const out: Segment[] = [];
  let cursor = 0;
  for (const r of mine) {
    if (r.start > cursor) {
      out.push({ text: text.slice(cursor, r.start), marked: false, start: cursor });
    }
    out.push({ text: text.slice(r.start, r.end), marked: true, start: r.start });
    cursor = r.end;
  }
  if (cursor < text.length) {
    out.push({ text: text.slice(cursor), marked: false, start: cursor });
  }
  return out;
}

/** Nyckeln som markeringarna sparas under. Delarna särskiljer passage och läge. */
export function highlightScope(...parts: Array<string | number>): string {
  return PREFIX + parts.join(":");
}

interface Stored {
  at: number;
  ranges: HighlightRange[];
}

function store(kind: StorageKind): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function loadHighlights(scope: string, kind: StorageKind): HighlightRange[] {
  const s = store(kind);
  if (!s) return [];
  try {
    const raw = s.getItem(scope);
    if (!raw) return [];
    const data = JSON.parse(raw) as Stored;
    if (!Array.isArray(data?.ranges)) return [];
    if (kind === "local" && data.at && Date.now() - data.at > MAX_AGE_MS) {
      s.removeItem(scope);
      return [];
    }
    return sortRanges(
      data.ranges.filter(
        (r) => Number.isInteger(r?.p) && Number.isFinite(r?.start) && r.end > r.start,
      ),
    );
  } catch {
    return [];
  }
}

export function saveHighlights(scope: string, kind: StorageKind, ranges: HighlightRange[]): void {
  const s = store(kind);
  if (!s) return;
  try {
    if (ranges.length === 0) s.removeItem(scope);
    else s.setItem(scope, JSON.stringify({ at: Date.now(), ranges } satisfies Stored));
  } catch {
    /* lagringen kan vara full eller avstängd — markeringar är inte värda en krasch */
  }
}
