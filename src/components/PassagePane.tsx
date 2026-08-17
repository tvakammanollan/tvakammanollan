import { useMemo, useState } from "react";
import { ChevronDown, FileText } from "lucide-react";
import { HighlightableText, HighlighterToggle } from "@/components/HighlightableText";
import { useHighlighter } from "@/hooks/useHighlighter";
import { highlightScope } from "@/lib/highlights";

interface PassagePaneProps {
  matchId: string;
  passageId: string | null;
  passageText: string;
  category: string;
  /** if true, render mobile accordion instead of static block */
  mobileAccordion?: boolean;
}

/**
 * Lästexten i en match, med överstrykningspenna.
 *
 * Markeringarna låg tidigare i en egen implementation här inne som sparade den
 * markerade *strängen* plus "vilken förekomst i ordningen" den var. Den
 * räkningen sköt sig så fort en markering togs bort, och logiken fanns bara i
 * matchvyn — gamla prov och träningen hade ingen penna alls. Allt det ligger nu
 * i lib/highlights.ts och delas av de tre vyerna.
 */
export function PassagePane({
  matchId,
  passageId,
  passageText,
  category,
  mobileAccordion = false,
}: PassagePaneProps) {
  const [open, setOpen] = useState(true); // mobile accordion default open
  const pid = passageId ?? "no-pid";
  const highlighter = useHighlighter(highlightScope("match", matchId, pid));

  const paragraphs = useMemo(
    () => passageText.split(/\n{2,}/).filter((p) => p.trim().length > 0),
    [passageText],
  );

  // Både ORD/LÄS och ELF visas med svensk etikett — resten av panelen
  // ("tryck för att läsa", "Rensa") är på svenska ändå.
  const headerLabel = "Textpassage";

  const Body = (
    <HighlightableText
      paragraphs={paragraphs}
      highlighter={highlighter}
      className="space-y-3 text-sm text-foreground"
      paragraphClassName="whitespace-pre-wrap"
      // Radavståndet och radlängden är avstämda mot lästexten i provhäftet.
      // 65ch är ungefär en spalt, vilket gör långa stycken läsbara.
    />
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
            <FileText className="h-4 w-4 text-[#ae2f26]" aria-hidden />
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
            <HighlighterToggle highlighter={highlighter} className="mb-2" />
            <div style={{ lineHeight: 1.9, maxWidth: "65ch" }}>{Body}</div>
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
          <FileText className="h-3.5 w-3.5 text-[#ae2f26]" aria-hidden />
          {headerLabel}
        </h3>
        <HighlighterToggle highlighter={highlighter} />
      </div>
      <div style={{ lineHeight: 1.9, maxWidth: "65ch" }}>{Body}</div>
    </aside>
  );
}
