import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth, isAutoUsername } from "@/hooks/useAuth";
import { HeroLanding } from "@/components/HeroLanding";
import { HomeDashboard } from "@/components/HomeDashboard";
import { pageMeta, pageLinks } from "@/lib/page-meta";
import { getLandingStats, type LandingStats } from "@/lib/landing.functions";

export const Route = createFileRoute("/")({
  component: Index,
  // SSR initial landing stats so the trust-bar / proof-section numbers
  // ship in initial HTML (avoids the '0' flash before client fetch).
  loader: async (): Promise<LandingStats | null> => {
    try {
      return await getLandingStats();
    } catch {
      return null;
    }
  },
  head: () => ({
    meta: pageMeta({
      path: "/",
      title: "HP Kampen – Gratis ELO-rankade HP-dueller & övningsprov",
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

  // SEO / AI-crawlers / first-paint: serve the marketing landing by default.
  // During SSR `loading` is true and there is no user yet — without this fall-
  // through bots would only see a "Laddar…" placeholder.
  if (loading && !user) return <HeroLanding initialStats={Route.useLoaderData()} />;

  if (!user) return <HeroLanding initialStats={Route.useLoaderData()} />;

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

  return <HomeDashboard />;
}
