import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { Highlighter as HighlighterIcon, Eraser } from "lucide-react";
import { segmentParagraph, snapToWords } from "@/lib/highlights";
import type { Highlighter } from "@/hooks/useHighlighter";

/**
 * Knappen som slår på och av överstrykningspennan, plus "Rensa" när det finns
 * något att rensa. Konsumenten placerar den själv — läspanelerna ser olika ut
 * i match, träning och gamla prov.
 *
 * Knappen var tidigare en 11-punkts grå pill i samma dämpade ton som all
 * annan sekundärtext, med etiketten "Överstryk" oavsett läge. Den gick knappt
 * att se, träffytan var under fingerstorlek, och påslagen såg den nästan
 * likadan ut som avslagen. Nu bär den varumärkesfärgen redan i viloläge, är
 * fylld när pennan är på, och säger med ord vilket läge man står i.
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
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={active}
        title={
          active
            ? "Pennan är på — dra över texten för att stryka, klicka på ett streck för att ta bort det"
            : "Slå på överstrykningspennan och dra över texten"
        }
        // Texten på den fyllda knappen är `#fbf6ec` och inte `text-white`:
        // temat remappar `.text-white` till bark (--cream), eftersom vit text
        // är osynlig på papper. På den röda knappen hade det gett mörkbrunt
        // på rött. Samma skäl som i ConsentBanner.
        className={`inline-flex min-h-[40px] items-center gap-2 rounded-full border px-4 text-[13px] font-semibold transition-colors duration-150 ${
          active
            ? "border-[var(--amber)] bg-[var(--amber)] text-[#fbf6ec] shadow-sm hover:bg-[var(--amber-deep)]"
            : "border-[var(--amber)]/40 bg-[var(--amber)]/[0.08] text-[var(--amber)] hover:border-[var(--amber)]/70 hover:bg-[var(--amber)]/15"
        }`}
      >
        <HighlighterIcon className="h-4 w-4 shrink-0" aria-hidden />
        {active ? "Pennan på" : "Överstryk"}
      </button>
      {active && <span className="text-[12px] text-[var(--text-tertiary)]">Dra över texten</span>}
      {hasAny && (
        <button
          type="button"
          onClick={clear}
          title="Ta bort alla överstrykningar i den här texten"
          className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-[var(--line)] px-3.5 text-[13px] font-medium text-[var(--text-tertiary)] transition-colors duration-150 hover:border-[var(--line-strong)] hover:text-[var(--text-secondary)]"
        >
          <Eraser className="h-4 w-4 shrink-0" aria-hidden />
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

      const text = el.textContent ?? "";
      const start = el.contains(range.startContainer)
        ? offsetWithin(el, range.startContainer, range.startOffset)
        : 0;
      const end = el.contains(range.endContainer)
        ? offsetWithin(el, range.endContainer, range.endOffset)
        : text.length;

      // Kanterna dras ut till hela ord, så att strecket aldrig skär av ett ord.
      const snapped = snapToWords(text, start, end);
      if (snapped) add({ p, ...snapped });
    }
    sel.removeAllRanges();
  }, [active, add]);

  /**
   * Markeringen läses när pekaren släpps — men från `document`, inte från
   * lästexten, och en tick senare.
   *
   * Med `onMouseUp`/`onTouchEnd` på behållaren föll två vanliga fall bort:
   * släppte man musen utanför texten (vilket man ofta gör i slutet av ett
   * stycke) hände ingenting alls, och på mobilen är markeringen ännu inte
   * färdig i det ögonblick fingret lyfts — den sätts när webbläsaren visat
   * sina handtag. Därför document-lyssnare plus `setTimeout(0)`.
   */
  useEffect(() => {
    if (!active) return;
    let timer = 0;
    const commit = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(captureSelection, 0);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      // Markering med tangentbordet: skift + piltangenter.
      if (e.shiftKey || e.key.startsWith("Arrow")) commit();
    };
    document.addEventListener("pointerup", commit);
    document.addEventListener("touchend", commit);
    document.addEventListener("keyup", onKeyUp);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("pointerup", commit);
      document.removeEventListener("touchend", commit);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, [active, captureSelection]);

  return (
    <div ref={containerRef} className={`${className} ${active ? "hp-pen-active" : ""}`}>
      {paragraphs.map((para, i) => (
        <p key={i} data-hp-para={i} className={paragraphClassName}>
          {segmentParagraph(para, ranges, i).map((seg, j) =>
            seg.marked ? (
              <mark
                key={j}
                className="hp-highlight"
                // Med pennan aktiv suddar ett klick i fältet bort det.
                data-erasable={active ? "true" : undefined}
                title={active ? "Klicka för att ta bort överstrykningen" : undefined}
                onClick={active ? () => erase(i, seg.start) : undefined}
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
