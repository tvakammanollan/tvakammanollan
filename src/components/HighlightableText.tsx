import { useCallback, useRef, type ReactNode } from "react";
import { Highlighter as HighlighterIcon, Eraser } from "lucide-react";
import { segmentParagraph } from "@/lib/highlights";
import type { Highlighter } from "@/hooks/useHighlighter";

/**
 * Knappen som slår på och av överstrykningspennan, plus "Rensa" när det finns
 * något att rensa. Konsumenten placerar den själv — läspanelerna ser olika ut
 * i match, träning och gamla prov.
 */
export function HighlighterToggle({
  highlighter,
  className = "",
}: {
  highlighter: Highlighter;
  className?: string;
}) {
  const { active, toggle, hasAny, clear } = highlighter;
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={active}
        title={active ? "Stäng av överstrykningspennan" : "Stryk över text i lästexten"}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
          active
            ? "border-[var(--amber)]/50 bg-[var(--amber)]/20 text-[var(--amber)]"
            : "border-white/10 text-[var(--text-tertiary)] hover:border-white/20 hover:text-[var(--text-secondary)]"
        }`}
      >
        <HighlighterIcon className="h-3.5 w-3.5" aria-hidden />
        Överstryk
      </button>
      {hasAny && (
        <button
          type="button"
          onClick={clear}
          title="Ta bort alla överstrykningar i den här texten"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-medium text-[var(--text-tertiary)] transition-colors hover:border-white/20 hover:text-[var(--text-secondary)]"
        >
          <Eraser className="h-3.5 w-3.5" aria-hidden />
          Rensa
        </button>
      )}
    </div>
  );
}

/** Teckenoffset för en punkt i DOM:en, räknat från styckets början. */
function offsetWithin(root: HTMLElement, node: Node, offset: number): number {
  const range = document.createRange();
  range.selectNodeContents(root);
  try {
    range.setEnd(node, offset);
  } catch {
    return 0;
  }
  return range.toString().length;
}

/**
 * Lästext där man kan stryka över med pennan.
 *
 * Varje stycke får `data-hp-para` med sitt index; en markering översätts till
 * teckenoffset inom det stycket. Drar man över flera stycken blir det en
 * markering per stycke, så att offseten alltid hör till en känd text.
 *
 * `decorate` finns för ELF, där luckans siffra ska ringas in mitt i texten.
 * Den körs på varje omarkerad bit för sig — dekorerar man hela stycket i
 * stället tappar man inringningen så fort någon stryker över en mening i
 * samma stycke.
 */
export function HighlightableText({
  paragraphs,
  highlighter,
  className = "",
  paragraphClassName = "",
  decorate,
}: {
  paragraphs: string[];
  highlighter: Highlighter;
  className?: string;
  paragraphClassName?: string;
  decorate?: (text: string) => ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { active, ranges, add, erase } = highlighter;

  const captureSelection = useCallback(() => {
    if (!active) return;
    const container = containerRef.current;
    const sel = typeof window === "undefined" ? null : window.getSelection();
    if (!container || !sel || sel.isCollapsed || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    if (!container.contains(range.commonAncestorContainer)) return;

    for (const el of Array.from(container.querySelectorAll<HTMLElement>("[data-hp-para]"))) {
      if (!range.intersectsNode(el)) continue;
      const p = Number(el.dataset.hpPara);
      if (!Number.isInteger(p)) continue;

      const len = el.textContent?.length ?? 0;
      const start = el.contains(range.startContainer)
        ? offsetWithin(el, range.startContainer, range.startOffset)
        : 0;
      const end = el.contains(range.endContainer)
        ? offsetWithin(el, range.endContainer, range.endOffset)
        : len;

      if (end > start) add({ p, start, end });
    }
    sel.removeAllRanges();
  }, [active, add]);

  return (
    <div
      ref={containerRef}
      onMouseUp={captureSelection}
      onTouchEnd={captureSelection}
      className={`${className} ${active ? "cursor-text selection:bg-[var(--amber)]/30" : ""}`}
    >
      {paragraphs.map((para, i) => (
        <p key={i} data-hp-para={i} className={paragraphClassName}>
          {segmentParagraph(para, ranges, i).map((seg, j) =>
            seg.marked ? (
              <mark
                key={j}
                className="hp-highlight"
                // Med pennan aktiv suddar ett klick i fältet bort det.
                onClick={active ? () => erase(i, seg.start) : undefined}
                style={active ? { cursor: "pointer" } : undefined}
              >
                {seg.text}
              </mark>
            ) : (
              <span key={j}>{decorate ? decorate(seg.text) : seg.text}</span>
            ),
          )}
        </p>
      ))}
    </div>
  );
}
