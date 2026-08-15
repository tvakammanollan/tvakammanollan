import { useEffect, useRef, useState } from "react";
import { ChevronDown, Highlighter, Eraser, FileText } from "lucide-react";

interface PassagePaneProps {
  matchId: string;
  passageId: string | null;
  passageText: string;
  category: string;
  /** if true, render mobile accordion instead of static block */
  mobileAccordion?: boolean;
}

const HIGHLIGHT_CLASS = "hp-highlight";

function getStoreKey(matchId: string) {
  return `highlights_${matchId}`;
}

interface SerializedHighlight {
  passage_id: string;
  text: string;
  /** index of occurrence to disambiguate identical substrings */
  occurrence: number;
}

function loadHighlights(matchId: string): SerializedHighlight[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(getStoreKey(matchId));
    if (!raw) return [];
    return JSON.parse(raw) as SerializedHighlight[];
  } catch {
    return [];
  }
}

function saveHighlights(matchId: string, hs: SerializedHighlight[]) {
  try {
    sessionStorage.setItem(getStoreKey(matchId), JSON.stringify(hs));
  } catch {
    /* ignore */
  }
}

/**
 * Wraps every saved highlight in <mark> by computing offsets in the raw text,
 * then rendering the passage as an array of nodes.
 */
function renderHighlighted(text: string, marks: SerializedHighlight[]) {
  if (marks.length === 0) return [text];

  // Build list of {start, end} ranges.
  const ranges: Array<{ start: number; end: number }> = [];
  for (const m of marks) {
    if (!m.text) continue;
    let from = 0;
    let occ = 0;
    while (from <= text.length) {
      const idx = text.indexOf(m.text, from);
      if (idx === -1) break;
      if (occ === m.occurrence) {
        ranges.push({ start: idx, end: idx + m.text.length });
        break;
      }
      occ++;
      from = idx + 1;
    }
  }
  ranges.sort((a, b) => a.start - b.start);

  // Merge overlapping
  const merged: Array<{ start: number; end: number }> = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r.start <= last.end) {
      last.end = Math.max(last.end, r.end);
    } else {
      merged.push({ ...r });
    }
  }

  const out: Array<string | { mark: string }> = [];
  let cursor = 0;
  for (const r of merged) {
    if (r.start > cursor) out.push(text.slice(cursor, r.start));
    out.push({ mark: text.slice(r.start, r.end) });
    cursor = r.end;
  }
  if (cursor < text.length) out.push(text.slice(cursor));
  return out;
}

export function PassagePane({
  matchId,
  passageId,
  passageText,
  category,
  mobileAccordion = false,
}: PassagePaneProps) {
  const [allHighlights, setAllHighlights] = useState<SerializedHighlight[]>(() =>
    loadHighlights(matchId),
  );
  const [open, setOpen] = useState(true); // mobile accordion default open
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pid = passageId ?? "no-pid";

  const passageHighlights = allHighlights.filter((h) => h.passage_id === pid);

  useEffect(() => {
    saveHighlights(matchId, allHighlights);
  }, [matchId, allHighlights]);

  const captureSelection = () => {
    const sel = typeof window !== "undefined" ? window.getSelection() : null;
    if (!sel || sel.isCollapsed) return;
    const text = sel.toString();
    if (!text || text.trim().length === 0) return;
    // Ensure selection is within our container
    if (!containerRef.current) return;
    const range = sel.getRangeAt(0);
    if (!containerRef.current.contains(range.commonAncestorContainer)) return;

    // Compute occurrence index in the raw passage text
    const before = passageText.indexOf(text);
    if (before === -1) {
      sel.removeAllRanges();
      return;
    }
    // Count occurrence by walking through text up to selection's start offset.
    // For simplicity we use the first match index — occurrence increments only
    // if user re-selects same string later.
    const existingSameText = passageHighlights.filter((h) => h.text === text).length;
    setAllHighlights((prev) => [...prev, { passage_id: pid, text, occurrence: existingSameText }]);
    sel.removeAllRanges();
  };

  const clearHighlights = () => {
    setAllHighlights((prev) => prev.filter((h) => h.passage_id !== pid));
  };

  // Både ORD/LÄS och ELF visas med svensk etikett — resten av panelen
  // ("tryck för att läsa", "Rensa markeringar") är på svenska ändå.
  const headerLabel = "Textpassage";

  const passageNodes = renderHighlighted(passageText, passageHighlights);

  const Body = (
    <div
      ref={containerRef}
      onMouseUp={captureSelection}
      onTouchEnd={captureSelection}
      className="whitespace-pre-wrap text-sm text-foreground"
      style={{ lineHeight: 1.9, maxWidth: "65ch" }}
    >
      {passageNodes.map((n, i) =>
        typeof n === "string" ? (
          <span key={i}>{n}</span>
        ) : (
          // Amber-tint i stället för överstrykningsgult (#fff59d): på den mörka
          // ytan ärvde texten cream-färg och blev cream-på-gult, dvs. oläsbar.
          <mark key={i} className={HIGHLIGHT_CLASS}>
            {n.mark}
          </mark>
        ),
      )}
    </div>
  );

  if (mobileAccordion) {
    return (
      <section className="mb-4 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-sm lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold transition-colors hover:bg-white/[0.03]"
        >
          <span className="inline-flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#f2a65a]" aria-hidden />
            {headerLabel}
            <span className="font-normal text-muted-foreground">– tryck för att läsa</span>
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
        {open && (
          <div className="border-t border-white/10 px-4 py-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Highlighter className="h-3.5 w-3.5" aria-hidden />
                Markera text genom att välja den
              </span>
              {passageHighlights.length > 0 && (
                <button
                  type="button"
                  onClick={clearHighlights}
                  className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-medium text-[#f2a65a] underline-offset-2 hover:underline"
                >
                  <Eraser className="h-3.5 w-3.5" aria-hidden />
                  Rensa markeringar
                </button>
              )}
            </div>
            {Body}
          </div>
        )}
      </section>
    );
  }

  return (
    <aside
      className="sticky top-[120px] hidden self-start overflow-y-auto border-r border-white/10 bg-white/[0.02] px-6 py-5 lg:block"
      style={{ maxHeight: "calc(100vh - 140px)" }}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          <FileText className="h-3.5 w-3.5 text-[#f2a65a]" aria-hidden />
          {headerLabel}
        </h3>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Highlighter className="h-3.5 w-3.5" aria-hidden />
            Markera text genom att välja
          </span>
          {passageHighlights.length > 0 && (
            <button
              type="button"
              onClick={clearHighlights}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#f2a65a] underline-offset-2 hover:underline"
            >
              <Eraser className="h-3.5 w-3.5" aria-hidden />
              Rensa
            </button>
          )}
        </div>
      </div>
      {Body}
    </aside>
  );
}
