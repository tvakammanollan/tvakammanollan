import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Calculator,
  GraduationCap,
  MessageSquare,
  Plus,
  ScrollText,
  Sparkles,
} from "lucide-react";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { PageHero } from "@/components/layout/PageHero";
import { ThreadListItem } from "@/components/forum/ThreadListItem";
import { fetchForumHome } from "@/lib/forum.functions";
import { formatInt } from "@/lib/sv-format";
import { EmptyState } from "@/components/EmptyState";

/* =====================================================================
   Forumets startsida: kategorierna och den senaste aktiviteten.

   Allt hämtas i loadern, aldrig i klienten. Ett forum vars innehåll bara
   finns efter hydrering har ingen text att indexera — och SEO är halva
   poängen med att bygga forumet.
   ===================================================================== */

export const Route = createFileRoute("/forum")({
  loader: () => fetchForumHome(),
  head: ({ loaderData }) => {
    const threads = loaderData?.totalThreads ?? 0;
    return {
      meta: pageMeta({
        path: "/forum",
        title: "Forum om högskoleprovet · frågor, svar och plugg · HP Kampen",
        description:
          "Ställ frågor om högskoleprovet och få svar av andra som pluggar. Diskutera KVA, XYZ, NOG, DTK, ORD och läsförståelse, anmälan, normering och resultat. Gratis och öppet att läsa.",
        ogTitle: "Forum om högskoleprovet · HP Kampen",
        ogDescription:
          "Frågor och svar om högskoleprovet — uppgifter, plugg, anmälan och normering.",
      }),
      links: pageLinks("/forum"),
      scripts: [
        breadcrumbScript([
          { name: "Hem", path: "/" },
          { name: "Forum", path: "/forum" },
        ]),
        jsonLdScript({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Forum om högskoleprovet",
          description: `Diskussionsforum om högskoleprovet med ${formatInt(threads)} trådar.`,
          url: "https://hpkampen.se/forum",
          inLanguage: "sv-SE",
          isPartOf: { "@id": "https://hpkampen.se/#website" },
          publisher: { "@id": "https://hpkampen.se/#org" },
        }),
      ],
    };
  },
  component: ForumHomePage,
});

/** Ikonerna hör hemma i UI-lagret — kategoridatan i databasen bär inga. */
const CATEGORY_ICONS: Record<string, typeof MessageSquare> = {
  allmant: MessageSquare,
  kvantitativ: Calculator,
  verbal: BookOpen,
  provdagen: ScrollText,
  plugg: GraduationCap,
};

function ForumHomePage() {
  const { categories, latest, totalThreads, totalPosts } = Route.useLoaderData();

  return (
    <div className="min-h-screen">
      <PageHero
        eyebrow="Högskoleprovet · forum"
        title="Forum"
        subtitle={
          totalThreads > 0
            ? `${formatInt(totalThreads)} trådar och ${formatInt(totalPosts)} inlägg om högskoleprovet. Läs fritt — skriv med ett konto.`
            : "Frågor och svar om högskoleprovet. Läs fritt — skriv med ett konto."
        }
        align="center"
        variant="compact"
      />

      <div className="mx-auto max-w-4xl px-4 pb-24 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/forum/nytt"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--amber)] px-4 py-2 text-sm font-semibold text-[#fbf6ec] transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Ny tråd
          </Link>
          <Link
            to="/forum/regler"
            className="text-sm text-[var(--text-tertiary)] underline-offset-4 hover:text-[var(--cream)] hover:underline"
          >
            Regler och vem som driver forumet
          </Link>
        </div>

        <ul className="grid gap-3">
          {categories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.slug] ?? MessageSquare;
            return (
              <li key={cat.slug}>
                <Link
                  to="/forum/$kategori"
                  params={{ kategori: cat.slug }}
                  className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-sm transition-colors hover:border-[var(--amber)]/50 hover:bg-white/[0.04]"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--amber)]/15">
                    <Icon className="h-5 w-5 text-[var(--amber)]" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-semibold text-[var(--cream)]">
                        {cat.name}
                      </span>
                      {cat.kind === "qa" && (
                        <span className="rounded-full bg-[var(--teal)]/15 px-2 py-0.5 text-[11px] font-medium text-[var(--teal)]">
                          Fråga & svar
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-[var(--text-tertiary)]">
                      {cat.description}
                    </span>
                    <span className="mt-2 block text-xs tabular-nums text-[var(--text-tertiary)]">
                      {formatInt(cat.threadCount)} trådar · {formatInt(cat.postCount)} inlägg
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <section className="mt-12">
          <h2
            className="flex items-center gap-2 text-[20px] font-bold text-[var(--cream)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <Sparkles className="h-5 w-5 text-[var(--amber)]" aria-hidden />
            Senaste aktivitet
          </h2>

          {latest.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="Inga trådar än"
              subtitle="Bli den första som ställer en fråga — den som svarar sitter förmodligen och pluggar just nu."
              ctaLabel="Starta en tråd"
              ctaHref="/forum/nytt"
            />
          ) : (
            <ul className="mt-4 grid gap-3">
              {latest.map((thread) => (
                <ThreadListItem key={thread.id} thread={thread} showCategory />
              ))}
            </ul>
          )}
        </section>

        <section className="mt-14 rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm">
          <h2
            className="text-lg font-bold text-[var(--cream)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Innan du skriver
          </h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-[var(--text-secondary)]">
            <p>
              Forumet är öppet att läsa för alla. För att skriva behövs ett konto med bekräftad
              mejladress — det är enda sättet att hålla spam borta från ett forum som annars går att
              skapa hur många konton som helst i.
            </p>
            <p>
              Klistra inte in hela lästexter eller provuppgifter ur UHR:s häften — de är
              upphovsrättsskyddade. Länka i stället till uppgiften i{" "}
              <Link to="/gamla-prov" className="text-[var(--teal)] hover:underline">
                gamla prov
              </Link>
              , så ser alla exakt vilken du menar.
            </p>
            <p>
              <Link to="/forum/regler" className="text-[var(--teal)] hover:underline">
                Läs hela reglerna
              </Link>{" "}
              — de är korta.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
