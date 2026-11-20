import { Link } from "@tanstack/react-router";
import { ordText } from "@/lib/sv-format";
import type { ProvOrdExplanation } from "@/types/gamla-prov";

/**
 * Ordets betydelse under en ORD-uppgift när facit visas: direkt i övningsläge,
 * efter inlämning i provläge.
 *
 * Förklaringen står i provdatan (`explain`, skriven av
 * `scripts/ord-forklaringar.ts`) och finns på varje ORD-uppgift, så rutan ser
 * likadan ut på alla och kommer samtidigt som facit. Den hämtades tidigare ur
 * ordlistan vid visningen och uteblev för ord som saknades där.
 */
export function ProvOrdExplain({ word, explain }: { word: string; explain: ProvOrdExplanation }) {
  return (
    <div className="mt-4 rounded-xl bg-white/[0.04] px-4 py-3">
      <p className="text-sm leading-relaxed text-[var(--cream)]">
        <span className="font-semibold">{ordText(word)}:</span> {explain.sense}
      </p>
      <p className="mt-1 text-xs text-[var(--text-tertiary)]">{explain.source}</p>
      {explain.slug && (
        <Link
          to="/ordlista/$ord"
          params={{ ord: explain.slug }}
          // Ny flik: passet ska stå kvar där man var.
          target="_blank"
          rel="noopener"
          className="mt-1 inline-flex min-h-[44px] items-center text-sm font-semibold text-[var(--amber)] hover:underline"
        >
          Se ordet i ordlistan
        </Link>
      )}
    </div>
  );
}
