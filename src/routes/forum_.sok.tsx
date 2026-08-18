import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { MessageSquare, Search } from "lucide-react";
import { pageMeta, pageLinks, breadcrumbScript } from "@/lib/page-meta";
import { ForumPagination } from "@/components/forum/ForumPagination";
import { EmptyState } from "@/components/EmptyState";
import { searchForum, type ForumSearchData } from "@/lib/forum.functions";
import { displayAuthor, pageCount } from "@/lib/forum";
import { formatInt, formatRelativeTime } from "@/lib/sv-format";

/* =====================================================================
   Forumsök — Postgres fulltext mot svensk konfiguration.

   Serverrenderat som alla forumsidor, men noindex: sökresultatsidor hör
   inte hemma i indexet (de skapar oändligt många tunna URL:er av samma
   innehåll). Trådarna de pekar på indexeras däremot.
   ===================================================================== */

const searchSchema = z.object({
  q: z.string().trim().max(120).optional(),
  sida: z.number().int().min(1).max(100).optional(),
});

export const Route = createFileRoute("/forum_/sok")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ q: search.q ?? "", sida: search.sida ?? 1 }),
  loader: async ({ deps }): Promise<ForumSearchData | null> => {
    // Ett tecken matchar halva forumet och kostar ett GIN-uppslag. Låt
    // formuläret stå tomt i stället.
    if (deps.q.trim().length < 2) return null;
    return await searchForum({ data: { q: deps.q.trim(), page: deps.sida } });
  },
  head: ({ loaderData }) => {
    const q = loaderData?.query;
    const title = q ? `Sök: ${q} · HP Kampens forum` : "Sök i forumet · HP Kampen";
    return {
      meta: pageMeta({
        path: "/forum/sok",
        title,
        description:
          "Sök bland frågor och svar om högskoleprovet — XYZ, KVA, NOG, DTK, ORD, LÄS, MEK och ELF.",
        noindex: true,
      }),
      links: pageLinks("/forum/sok"),
      scripts: [
        breadcrumbScript([
          { name: "Hem", path: "/" },
          { name: "Forum", path: "/forum" },
          { name: "Sök", path: "/forum/sok" },
        ]),
      ],
    };
  },
  component: ForumSearchPage,
});

function ForumSearchPage() {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [draft, setDraft] = useState(search.q ?? "");

  const pages = data ? pageCount(data.total, data.perPage) : 1;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = draft.trim();
    // Sidnumret nollställs vid ny sökning — annars landar man på sida 4 av
    // ett resultat som bara har en sida, och sidan ser tom ut.
    void navigate({ search: q.length >= 2 ? { q } : {} });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
      <nav className="text-xs text-white/45" aria-label="Brödsmulor">
        <Link to="/" className="hover:text-white/70">
          Hem
        </Link>
        <span className="px-1.5">/</span>
        <Link to="/forum" className="hover:text-white/70">
          Forum
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-white/70">Sök</span>
      </nav>

      <h1
        className="mt-4 text-[28px] font-bold leading-tight text-[var(--cream)] sm:text-[34px]"
        style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
      >
        Sök i forumet
      </h1>

      <form onSubmit={submit} className="mt-6 flex gap-2">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]"
            aria-hidden
          />
          <input
            type="search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="t.ex. kva rötter, normering 1.4, dtk tidspress"
            aria-label="Sök i forumet"
            maxLength={120}
            className="w-full rounded-xl border border-white/12 bg-white/[0.02] py-2.5 pl-9 pr-3 text-sm text-[var(--cream)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--amber)]/50 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-[var(--amber)] px-5 py-2.5 text-sm font-semibold text-[#170d05] transition-opacity hover:opacity-90"
        >
          Sök
        </button>
      </form>

      {!data ? (
        <p className="mt-8 text-sm text-[var(--text-tertiary)]">
          Skriv minst två tecken. Söket letar i både rubriker och inlägg — rubrikträffar väger
          tyngre.
        </p>
      ) : data.hits.length === 0 ? (
        <EmptyState
          icon={Search}
          title={`Inga träffar på "${data.query}"`}
          subtitle="Prova färre eller andra ord. Hittar du ingenting är det ett bra tecken på att frågan är värd att ställa."
          ctaLabel="Starta en tråd"
          ctaHref="/forum/nytt"
        />
      ) : (
        <>
          <p className="mt-6 text-xs tabular-nums text-[var(--text-tertiary)]">
            {formatInt(data.total)} {data.total === 1 ? "träff" : "träffar"} på &quot;{data.query}
            &quot;
            {pages > 1 ? ` · sida ${data.page} av ${pages}` : ""}
          </p>

          <ul className="mt-4 grid gap-3">
            {data.hits.map((hit) => (
              <li key={hit.threadId}>
                <Link
                  to="/forum/$kategori/$trad"
                  params={{ kategori: hit.categorySlug, trad: hit.trad }}
                  className="block rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-sm transition-colors hover:border-[var(--amber)]/40 sm:p-5"
                >
                  <p className="text-[15px] font-semibold leading-snug text-[var(--cream)]">
                    {hit.title}
                  </p>
                  {hit.excerpt && (
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-white/60">
                      {hit.excerpt}
                    </p>
                  )}
                  <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--text-tertiary)]">
                    <span>{hit.categoryName}</span>
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" aria-hidden />
                      {formatInt(hit.replyCount)} svar
                    </span>
                    <span aria-hidden>·</span>
                    <span>{displayAuthor(hit.author?.username)}</span>
                    <span aria-hidden>·</span>
                    <time dateTime={hit.lastPostAt}>{formatRelativeTime(hit.lastPostAt)}</time>
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          <ForumPagination page={data.page} pageCount={pages} />
        </>
      )}
    </div>
  );
}
