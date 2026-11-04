import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { provTermLabel } from "@/lib/forum";
import type { ForumRelated, ForumRelatedLink } from "@/lib/forum.functions";

/**
 * Länkarna under en tråd: resten av provpasset för en genomgång, grannarna i
 * kategorin för en vanlig tråd. Serverrenderat med vanliga länkar, så att en
 * sökmotor kan gå från tråd till tråd utan att ta omvägen via kategorilistan.
 */
export function ForumRelatedBlock({
  related,
  currentId,
  categoryName,
}: {
  related: ForumRelated | null;
  currentId: number;
  categoryName: string;
}) {
  if (!related || related.items.length === 0) return null;
  return related.kind === "prov" ? (
    <ProvRelated related={related} currentId={currentId} />
  ) : (
    <section className="mt-12" aria-labelledby="fler-tradar">
      <h2 id="fler-tradar" className="text-base font-semibold text-[var(--cream)]">
        Fler trådar i {categoryName}
      </h2>
      <ul className="mt-3 space-y-1.5">
        {related.items.map((item) => (
          <li key={item.id}>
            <ThreadLink item={item} className="text-sm text-[var(--teal)] hover:underline">
              {item.title}
            </ThreadLink>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProvRelated({
  related,
  currentId,
}: {
  related: Extract<ForumRelated, { kind: "prov" }>;
  currentId: number;
}) {
  const { term, pass, prev, next, items } = related;
  return (
    <section
      className="mt-12 rounded-2xl border border-white/10 bg-white/[0.02] p-5"
      aria-labelledby="fler-uppgifter"
    >
      <h2 id="fler-uppgifter" className="text-base font-semibold text-[var(--cream)]">
        Fler uppgifter ur provpass {pass}, {provTermLabel(term)}
      </h2>

      {(prev || next) && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          {prev ? (
            <ThreadLink
              item={prev}
              className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-[var(--teal)] hover:underline"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Uppgift {prev.nr}
            </ThreadLink>
          ) : (
            <span />
          )}
          {next && (
            <ThreadLink
              item={next}
              className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-[var(--teal)] hover:underline"
            >
              Uppgift {next.nr}
              <ChevronRight className="h-4 w-4" aria-hidden />
            </ThreadLink>
          )}
        </div>
      )}

      <ul className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => {
          const label = item.delprov ? `${item.nr} · ${item.delprov}` : `${item.nr}`;
          if (item.id === currentId) {
            return (
              <li key={item.id}>
                <span
                  aria-current="page"
                  className="inline-flex min-h-[36px] items-center rounded-full bg-[var(--teal)] px-3 text-xs font-semibold text-[var(--on-brand)]"
                >
                  {label}
                </span>
              </li>
            );
          }
          return (
            <li key={item.id}>
              <ThreadLink
                item={item}
                className="inline-flex min-h-[36px] items-center rounded-full border border-white/10 px-3 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--teal)] hover:text-[var(--cream)]"
                title={item.title}
              >
                {label}
              </ThreadLink>
            </li>
          );
        })}
      </ul>

      <Link
        to="/gamla-prov/$term/$pass"
        params={{ term, pass: String(pass) }}
        className="mt-4 inline-block text-sm text-[var(--teal)] hover:underline"
      >
        Skriv hela provpasset på tid
      </Link>
    </section>
  );
}

function ThreadLink({
  item,
  className,
  title,
  children,
}: {
  item: ForumRelatedLink;
  className: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      to="/forum/$kategori/$trad"
      params={{ kategori: item.categorySlug, trad: `${item.id}-${item.slug}` }}
      className={className}
      title={title}
    >
      {children}
    </Link>
  );
}
