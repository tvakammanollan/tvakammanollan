import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth, useHasStoredSession } from "@/hooks/useAuth";
import { isAutoUsername } from "@/lib/username";
import { HeroLanding, OMDOMEN, SNITTBETYG } from "@/components/HeroLanding";
import { HomeDashboard } from "@/components/HomeDashboard";
import { pageMeta, pageLinks, jsonLdScript } from "@/lib/page-meta";
import { fetchWordOfTheDay } from "@/lib/word-practice.functions";

export const Route = createFileRoute("/")({
  // Dagens ord hämtas i loadern och inte i kortet. Skälet är laddningsordning:
  // kortet ligger först i dashboardens vänsterspalt, men monteras inte förrän
  // både sessionen och profilen landat — så en hämtning där började sist av
  // allt och poppade in efter resten av sidan. Här är ordet med i den
  // serverrenderade HTML:en och står på plats i första målningen.
  //
  // Kostnaden är noll extra databasanrop i praktiken: serverfunktionen cachar
  // dygnets ord per isolat, eftersom svaret ändå är samma för alla till midnatt.
  loader: async () => ({ wotd: await fetchWordOfTheDay().catch(() => null) }),
  component: Index,
  head: () => ({
    meta: pageMeta({
      path: "/",
      title: "Gratis ELO-rankade HP-dueller & övningsprov",
      description:
        "Utmana vänner i realtid med HP-frågor. Klättra i ELO-rankingen. Träna gratis på ORD, MEK, LÄS, ELF, XYZ, KVA, NOG och DTK.",
      ogDescription:
        "Tävla mot vänner i realtid med riktiga HP-frågor. ELO-ranking och alla 8 delprov. Helt gratis.",
    }),
    links: pageLinks("/"),
    scripts: [
      // Schema.org WebApplication. Flyttad hit från roten (2026-08-22) — se
      // kommentaren i __root.tsx. aggregateRating/review är byggda ur samma
      // OMDOMEN-karusell som renderas några hundra pixlar ner på den här
      // sidan (SSR:ar alltid HeroLanding, se useHasStoredSession ovan), inte
      // påhittade siffror: skriv aldrig ett rakt betyg utan att OMDOMEN
      // ändras i samma commit.
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "@id": "https://tvakommanollan.se/#webapp",
        name: "Tvåkommanollan",
        alternateName: "Tvakommanollan",
        url: "https://tvakommanollan.se",
        description:
          "Tävla mot vänner i realtid med frågor från Högskoleprovet. ELO-ranking och alla 8 delmoment: ORD, MEK, LÄS, ELF, XYZ, KVA, NOG och DTK. Helt gratis.",
        applicationCategory: "EducationalApplication",
        applicationSubCategory: "TestPreparation",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "SEK" },
        inLanguage: "sv-SE",
        isAccessibleForFree: true,
        audience: {
          "@type": "EducationalAudience",
          educationalRole: "student",
          audienceType: "Gymnasieelev och högskolesökande i Sverige",
        },
        featureList: [
          "Realtidsmatcher mot vänner",
          "ELO-ranking med tiers från Brons till Diamant",
          "Övningsmatcher utan tidsbegränsning",
          "Alla 8 delprov: ORD, MEK, LÄS, ELF, XYZ, KVA, NOG, DTK",
          "10 000+ HP-ord i databasen",
          "Personlig coachning av en 1,95-spelare",
        ],
        publisher: { "@id": "https://tvakommanollan.se/#org" },
        creator: { "@id": "https://tvakommanollan.se/#niklas" },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: Number(SNITTBETYG.toFixed(1)),
          bestRating: 5,
          worstRating: 1,
          reviewCount: OMDOMEN.length,
        },
        review: OMDOMEN.map((o) => ({
          "@type": "Review",
          author: { "@type": "Person", name: o.namn },
          reviewBody: o.citat,
          reviewRating: {
            "@type": "Rating",
            ratingValue: o.betyg ?? 5,
            bestRating: 5,
            worstRating: 1,
          },
        })),
      }),
    ],
  }),
});

/**
 * Dashboardens ram medan profilen hämtas.
 *
 * Ytterhöljet och rutnätet är IDENTISKA med `HomeDashboard` (max-w-5xl, samma
 * vertikala luft, samma kolumnmall och samma `order`-klasser) — ett skelett med
 * andra yttermått är ett layouthopp med ett extra steg. Höjderna är mätta mot
 * den färdiga skärmen 2026-08-21: rubrikrad 119 px, dagens ord 147, rutan för
 * studieupplägget 312, spela-kortet 351, kortparet 218. De är
 * innehållsberoende (ett långt ord, ett långt namn) och kan inte bli exakta —
 * men de var 80/224/160/288/128, alltså 40–150 px för korta var och en, och
 * det syntes som att sidan växte när profilen landade.
 */
function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-12" aria-busy="true">
      <div className="skeleton-shimmer h-[120px] rounded-2xl" />
      <div className="mt-10 grid items-start gap-4 lg:grid-cols-[288px_minmax(0,1fr)]">
        <div className="order-2 space-y-3 lg:order-1">
          <div className="skeleton-shimmer h-[148px] rounded-2xl" />
          <div className="skeleton-shimmer h-[312px] rounded-2xl" />
        </div>
        <div className="order-1 min-w-0 lg:order-2">
          <div className="skeleton-shimmer h-[352px] rounded-2xl" />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="skeleton-shimmer h-[218px] rounded-2xl" />
            <div className="skeleton-shimmer h-[218px] rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Index() {
  const { user, profile, loading } = useAuth();
  const { wotd } = Route.useLoaderData();
  // Synkront svar på "är någon inloggad här?" — se `useHasStoredSession`.
  const harSession = useHasStoredSession();

  // SEO / AI-crawlers / first-paint: serve the marketing landing by default.
  // During SSR `loading` is true and there is no user yet — without this fall-
  // through bots would only see a "Laddar…" placeholder.
  //
  // Undantaget: har webbläsaren redan en sparad session är landningssidan fel
  // svar. Den hann annars ritas ut i sin helhet innan `getSession()` svarade,
  // så en inloggad besökare mötte marknadsföringssidan → skelett → dashboard,
  // tre olika layouter i rad. SSR:en påverkas inte: `useHasStoredSession` ger
  // `false` på servern.
  if (loading && !user) return harSession ? <DashboardSkeleton /> : <HeroLanding />;

  if (!user) return <HeroLanding />;

  // Got user but profile still loading — show a soft skeleton instead of plain
  // text so the dashboard frame is visible immediately.
  if (!profile) return <DashboardSkeleton />;

  // Force onboarding if username is still the auto-generated default — but
  // skip for anonymous guest users (they get a CTA to sign up after a match).
  if (isAutoUsername(profile.username) && !user.is_anonymous) {
    return <Navigate to="/onboarding" />;
  }

  return <HomeDashboard wordOfTheDay={wotd} />;
}
