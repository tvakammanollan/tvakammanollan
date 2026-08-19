import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { isAutoUsername } from "@/lib/username";
import { HeroLanding } from "@/components/HeroLanding";
import { HomeDashboard } from "@/components/HomeDashboard";
import { pageMeta, pageLinks } from "@/lib/page-meta";
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
      title: "Tvåkommanollan – Gratis ELO-rankade HP-dueller & övningsprov",
      description:
        "Utmana vänner i realtid med HP-frågor. Klättra i ELO-rankingen. Träna på ORD, MEK, LÄS, ELF, XYZ, KVA, NOG och DTK, gratis.",
      ogDescription:
        "Tävla mot vänner i realtid med riktiga HP-frågor. ELO-ranking och alla 8 delprov, helt gratis.",
    }),
    links: pageLinks("/"),
  }),
});

function Index() {
  const { user, profile, loading } = useAuth();
  const { wotd } = Route.useLoaderData();

  // SEO / AI-crawlers / first-paint: serve the marketing landing by default.
  // During SSR `loading` is true and there is no user yet — without this fall-
  // through bots would only see a "Laddar…" placeholder.
  if (loading && !user) return <HeroLanding />;

  if (!user) return <HeroLanding />;

  // Got user but profile still loading — show a soft skeleton instead of plain
  // text so the dashboard frame is visible immediately.
  if (!profile) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12" aria-busy="true">
        <div className="skeleton-shimmer h-48 rounded-2xl" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="skeleton-shimmer h-72 rounded-2xl" />
          <div className="skeleton-shimmer h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Force onboarding if username is still the auto-generated default — but
  // skip for anonymous guest users (they get a CTA to sign up after a match).
  if (isAutoUsername(profile.username) && !user.is_anonymous) {
    return <Navigate to="/onboarding" />;
  }

  return <HomeDashboard wordOfTheDay={wotd} />;
}
