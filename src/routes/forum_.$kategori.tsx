import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { z } from "zod";
import { MessageSquare, Plus } from "lucide-react";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { describeWithin, fitTitle } from "@/lib/seo-text";
import { ThreadListItem } from "@/components/forum/ThreadListItem";
import { ForumPagination } from "@/components/forum/ForumPagination";
import { EmptyState } from "@/components/EmptyState";
import { fetchForumCategory } from "@/lib/forum.functions";
import { pageCount, threadPath } from "@/lib/forum";
import { antal, formatInt } from "@/lib/sv-format";

/* =====================================================================
   Trådlistan i en kategori, paginerad med ?sida=N.

   Kanoniska länken pekar på sidan själv, aldrig tillbaka till sida 1 — det
   senare gömmer allt utom de första 30 trådarna för Google.
   ===================================================================== */

const searchSchema = z.object({
  sida: z.number().int().min(1).max(10000).optional(),
});

export const Route = createFileRoute("/forum_/$kategori")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ sida: search.sida ?? 1 }),
  loader: async ({ params, deps }) => {
    const data = await fetchForumCategory({
      data: { slug: params.kategori, page: deps.sida },
    });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { category, page, total, perPage, threads } = loaderData;
    const path = page > 1 ? `/forum/${category.slug}?sida=${page}` : `/forum/${category.slug}`;
    const suffix = page > 1 ? ` · sida ${page}` : "";

    return {
      meta: pageMeta({
        path,
        title: fitTitle(`${category.name} · forum om högskoleprovet${suffix}`),
        // Kategoribeskrivningen är olika lång per kategori och sprack på de
        // längsta — därför en budget i stället för en fast mening.
        description: describeWithin(
          `${category.description} ${antal(total, "tråd", "trådar")}.`,
          "Ställ din fråga eller läs vad andra som pluggar frågat.",
        ),
        ogTitle: `${category.name} · Tvåkommanollans forum`,
        ogDescription: category.description,
        // En kategori utan trådar är en rubrik och en mening — tunt innehåll,
        // och sex sådana sidor drar ner bedömningen av hela sajten. `follow`
        // så länkarna vidare fortfarande räknas. Grinden släpper av sig själv
        // i samma sekund den första tråden postas; den ska inte bli en flagga
        // någon måste komma ihåg att stänga av.
        noindex: total === 0,
      }),
      links: pageLinks(path),
      scripts: [
        breadcrumbScript([
          { name: "Hem", path: "/" },
          { name: "Forum", path: "/forum" },
          { name: category.name, path: `/forum/${category.slug}` },
        ]),
        jsonLdScript({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: category.name,
          description: category.description,
          url: `https://tvakommanollan.se${path}`,
          inLanguage: "sv-SE",
          isPartOf: { "@id": "https://tvakommanollan.se/#website" },
          mainEntity: {
            "@type": "ItemList",
            itemListOrder: "https://schema.org/ItemListOrderDescending",
            numberOfItems: threads.length,
            itemListElement: threads.map((t, i) => ({
              "@type": "ListItem",
              position: (page - 1) * perPage + i + 1,
              name: t.title,
              url: `https://tvakommanollan.se${threadPath(t.categorySlug, t.id, t.slug)}`,
            })),
          },
        }),
      ],
    };
  },
  component: ForumCategoryPage,
});

function ForumCategoryPage() {
  const { category, threads, page, total, perPage, siblings } = Route.useLoaderData();
  const pages = pageCount(total, perPage);

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-10 sm:px-6">
      <nav className="text-xs text-white/45" aria-label="Brödsmulor">
        <Link to="/" className="hover:text-white/70">
          Hem
        </Link>
        <span className="px-1.5">/</span>
        <Link to="/forum" className="hover:text-white/70">
          Forum
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-white/70">{category.name}</span>
      </nav>

      <header className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1
            className="text-[28px] font-bold leading-tight text-[var(--cream)] sm:text-[36px]"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
          >
            {category.name}
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-white/60">
            {category.description}
          </p>
          <p className="mt-1 text-xs tabular-nums text-[var(--text-tertiary)]">
            {antal(total, "tråd", "trådar")}
            {pages > 1 ? ` · sida ${page} av ${pages}` : ""}
          </p>
        </div>

        <Link
          to="/forum/nytt"
          search={{ kategori: category.slug }}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[var(--amber)] px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Ny tråd
        </Link>
      </header>

      {threads.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Inga trådar här än"
          subtitle="Ställ den första frågan i kategorin. Den blir dessutom lättare att hitta för alla som googlar samma sak."
          ctaLabel="Starta en tråd"
          ctaHref="/forum/nytt"
        />
      ) : (
        <ul className="mt-8 grid gap-3">
          {threads.map((thread) => (
            <ThreadListItem key={thread.id} thread={thread} />
          ))}
        </ul>
      )}

      <ForumPagination page={page} pageCount={pages} />

      <section className="mt-14 border-t border-white/8 pt-8">
        <h2
          className="text-[18px] font-bold text-[var(--cream)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Andra kategorier
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {siblings.map((c) => (
            <Link
              key={c.slug}
              to="/forum/$kategori"
              params={{ kategori: c.slug }}
              className="rounded-full border border-white/12 px-3.5 py-1.5 text-sm text-white/70 transition hover:border-[var(--amber)]/50 hover:text-[var(--cream)]"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
