import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth, isAutoUsername } from "@/hooks/useAuth";
import { HeroLanding } from "@/components/HeroLanding";
import { HomeDashboard } from "@/components/HomeDashboard";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        Laddar…
      </div>
    );
  }

  if (!user) return <HeroLanding />;

  // Got user but profile still loading
  if (!profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        Förbereder din arena…
      </div>
    );
  }

  // Force onboarding if username is still the auto-generated default
  if (isAutoUsername(profile.username)) {
    return <Navigate to="/onboarding" />;
  }

  return <HomeDashboard />;
}
