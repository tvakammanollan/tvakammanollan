import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { DISCOUNT_CODE } from "@/lib/coaching-discount";
import { trackEvent } from "@/lib/events";
import type { CoachingSource } from "@/lib/events";

/**
 * Rabattkoden, att läsa och att kopiera.
 *
 * Egen komponent därför att den står på två ställen som ser olika ut men måste
 * bära exakt samma sträng: rutan som delar ut rabatten, och kassasteget i
 * CoachingModal där den faktiskt ska klistras in. En andra handskriven kopia
 * hade varit en sträng som kan glida isär från Stripe utan att något felar.
 *
 * Koden står versalt i `DISCOUNT_CODE` och renderas därför INTE med
 * `uppercase` i CSS. Skälet är detsamma som för ORD-uppslagen: skiftläget bär
 * information här, eftersom Stripe matchar promotion codes skiftlägeskänsligt,
 * och en gemen kod som ser versal ut är en kod som avvisas i kassan.
 */
export function DiscountCodeChip({ source }: { source: CoachingSource }) {
  const [kopierad, setKopierad] = useState(false);
  const timer = useRef<number | null>(null);
  const kodRef = useRef<HTMLElement>(null);

  // Bekräftelsen är en timer som annars lever vidare i en avmonterad komponent.
  useEffect(() => () => void (timer.current && window.clearTimeout(timer.current)), []);

  /**
   * Reserven när urklippet är stängt.
   *
   * `clipboard-write` går att neka (osäker kontext, företagspolicy, en del
   * inbäddade webbläsare) och `writeText` kastar då. Utan det här gjorde
   * knappen ingenting alls i de lägena, vilket läser som att den är trasig —
   * och som en dead click i mätningen. Markerad text går att kopiera med
   * tangentbordet, alltså finns det alltid en väg vidare.
   */
  const markeraKoden = () => {
    const el = kodRef.current;
    const markering = typeof window.getSelection === "function" ? window.getSelection() : null;
    if (!el || !markering) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    markering.removeAllRanges();
    markering.addRange(range);
  };

  const kopiera = async () => {
    let lyckades = false;
    try {
      await navigator.clipboard.writeText(DISCOUNT_CODE);
      lyckades = true;
    } catch {
      markeraKoden();
    }
    if (lyckades) {
      setKopierad(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setKopierad(false), 2200);
    }
    trackEvent("coaching_discount_copied", { source });
  };

  return (
    <div className="flex items-stretch gap-2">
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-primary/40 bg-primary/[0.07] px-3 py-3">
        <code
          ref={kodRef}
          className="text-[15px] font-bold tracking-[0.14em] text-primary"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {DISCOUNT_CODE}
        </code>
      </div>
      <button
        type="button"
        onClick={() => void kopiera()}
        aria-label={`Kopiera rabattkoden ${DISCOUNT_CODE}`}
        className="flex min-h-[44px] w-[52px] shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-white/70 transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
      >
        {kopierad ? (
          <Check className="h-[18px] w-[18px] text-success" aria-hidden />
        ) : (
          <Copy className="h-[18px] w-[18px]" aria-hidden />
        )}
      </button>
      {/* Bekräftelsen måste nå en skärmläsare också — ikonbytet syns inte där. */}
      <span className="sr-only" role="status">
        {kopierad ? "Rabattkoden är kopierad" : ""}
      </span>
    </div>
  );
}
