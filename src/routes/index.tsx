import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth, isAutoUsername } from "@/hooks/useAuth";
import { HeroLanding } from "@/components/HeroLanding";
import { HomeDashboard } from "@/components/HomeDashboard";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user, profile, loading } = useAuth();

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

  return <HomeDashboard />;
}
