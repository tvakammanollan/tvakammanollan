import { BookOpen, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { ProvPassage } from "@/types/gamla-prov";
import { HighlightableText, HighlighterToggle } from "@/components/HighlightableText";
import type { Highlighter } from "@/hooks/useHighlighter";

/**
 * Lästexten till en LÄS- eller ELF-uppgift.
 *
 * På skrivbordet står den i en egen kolumn bredvid uppgiften — som i
 * provhäftet, där text och frågor ligger på samma uppslag. På mobil fälls den
 * ihop till ett dragspel så att uppgiften syns direkt.
 *
 * `gapNumber` sätts för ELF:s luckuppgifter: siffran står mitt i texten och
 * markeras så att man hittar den utan att leta.
 *
 * `highlighter` kommer uppifrån och inte härifrån, eftersom panelen renderas
 * två gånger (en mobil- och en skrivbordsvariant). Med var sin hook hade de
 * fått var sitt tillstånd och skrivit över varandras markeringar i lagringen.
 */
export function ProvPassagePanel({
  passage,
  gapNumber,
  collapsible = false,
  highlighter,
}: {
  passage: ProvPassage;
  gapNumber?: number;
  collapsible?: boolean;
  highlighter?: Highlighter;
}) {
  const [open, setOpen] = useState(!collapsible);

  const body = (
    <div className="space-y-4">
      {highlighter ? (
        <HighlightableText
          paragraphs={passage.paragraphs}
          highlighter={highlighter}
          className="space-y-4"
          paragraphClassName="text-[15px] leading-[1.75] text-[var(--cream)]"
          decorate={gapNumber ? (text) => highlightGap(text, gapNumber) : undefined}
        />
      ) : (
        passage.paragraphs.map((para, i) => (
          <p key={i} className="text-[15px] leading-[1.75] text-[var(--cream)]">
            {gapNumber ? highlightGap(para, gapNumber) : para}
          </p>
        ))
      )}

      {passage.byline && (
        <p className="pt-1 text-sm italic text-[var(--text-tertiary)]">{passage.byline}</p>
      )}

      {passage.glossary && passage.glossary.length > 0 && (
        <dl className="rounded-xl border border-[var(--amber)]/20 bg-[var(--amber)]/[0.06] px-4 py-3 text-[13px] leading-relaxed">
          {passage.glossary.map((entry, i) => (
            <div key={i} className={i > 0 ? "mt-1.5" : undefined}>
              <dt className="inline font-semibold text-[var(--amber)]">{entry.term}</dt>
              <dd className="ml-2 inline text-[var(--text-secondary)]">= {entry.definition}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm">
      <button
        type="button"
        onClick={() => collapsible && setOpen((v) => !v)}
        aria-expanded={collapsible ? open : undefined}
        className={`flex w-full items-start justify-between gap-3 px-5 py-4 text-left ${
          collapsible ? "transition-colors hover:bg-white/[0.03]" : "cursor-default"
        }`}
      >
        <span className="flex flex-col gap-1">
          <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--amber)]">
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
            Lästext
          </span>
          {passage.title && (
            <span className="text-base font-semibold leading-tight text-[var(--cream)]">
              {passage.title}
            </span>
          )}
          {collapsible && !open && (
            <span className="text-xs text-[var(--text-tertiary)]">Tryck för att läsa texten</span>
          )}
        </span>
        {collapsible && (
          <ChevronDown
            className={`mt-0.5 h-4 w-4 shrink-0 text-[var(--text-tertiary)] transition-transform ${
              open ? "rotate-180" : ""
            }`}
            aria-hidden
          />
        )}
      </button>
      {open && (
        <div className="max-h-[70vh] overflow-y-auto px-5 pb-5">
          {highlighter && (
            <HighlighterToggle
              highlighter={highlighter}
              className="mb-3 border-b border-white/[0.06] pb-3"
            />
          )}
          {body}
        </div>
      )}
    </section>
  );
}

/**
 * ELF-luckorna är utsatta som ett ensamt uppgiftsnummer i löptexten. Vi ringar
 * in just den siffran — annars får man leta rad för rad efter "31".
 */
function highlightGap(text: string, gap: number) {
  const parts = text.split(new RegExp(`(?<![\\d])${gap}(?![\\d])`));
  if (parts.length === 1) return text;
  return parts.flatMap((part, i) =>
    i === 0
      ? [part]
      : [
          <span
            key={i}
            className="mx-0.5 rounded bg-[var(--amber)]/20 px-1.5 py-0.5 font-bold text-[var(--amber)]"
          >
            {gap}
          </span>,
          part,
        ],
  );
}
