import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { getOrdlistaEntry } from "@/lib/ordlista.functions";
import { ordSlug } from "@/lib/ord-slug";

type Explain = { slug: string; word: string; sense: string; sourceLabel: string };

/** Uppslagen som redan hämtats, så att bläddring fram och tillbaka inte frågar igen. */
const cache = new Map<string, Explain | null>();

/**
 * Ordets betydelse under en ORD-uppgift när facit visas: direkt i övningsläge,
 * efter inlämning i provläge.
 *
 * Uppslaget är ordlistans eget (`getOrdlistaEntry`), alltså samma korta
 * betydelse och källrad som på `/ordlista/<ord>`. Arkivets ord och ordlistans
 * bestånd är inte samma mängd: saknas ordet, eller går uppslaget fel, visas
 * ingenting, aldrig ett fel mitt i ett provpass.
 */
export function ProvOrdExplain({ word }: { word: string }) {
  const slug = ordSlug(word);
  const fetchEntry = useServerFn(getOrdlistaEntry);
  const [entry, setEntry] = useState<Explain | null | undefined>(() =>
    cache.has(slug) ? cache.get(slug) : undefined,
  );

  useEffect(() => {
    if (!slug) return;
    if (cache.has(slug)) {
      setEntry(cache.get(slug));
      return;
    }
    let cancelled = false;
    setEntry(undefined);
    fetchEntry({ data: { slug } })
      .then((e) => {
        const value =
          e && e.sense
            ? { slug: e.slug, word: e.word, sense: e.sense, sourceLabel: e.sourceLabel }
            : null;
        cache.set(slug, value);
        if (!cancelled) setEntry(value);
      })
      .catch(() => {
        if (!cancelled) setEntry(null);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, fetchEntry]);

  if (!entry) return null;

  return (
    <div className="mt-4 rounded-xl bg-white/[0.04] px-4 py-3">
      <p className="text-sm leading-relaxed text-[var(--cream)]">
        <span className="font-semibold">{entry.word}:</span> {entry.sense}
      </p>
      {entry.sourceLabel && (
        <p className="mt-1 text-xs text-[var(--text-tertiary)]">{entry.sourceLabel}</p>
      )}
      <Link
        to="/ordlista/$ord"
        params={{ ord: entry.slug }}
        // Ny flik: passet ska stå kvar där man var.
        target="_blank"
        rel="noopener"
        className="mt-1 inline-flex min-h-[44px] items-center text-sm font-semibold text-[var(--amber)] hover:underline"
      >
        Hela uppslaget i ordlistan
      </Link>
    </div>
  );
}
