import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { EloBadge } from "@/components/EloBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { eloTier } from "@/lib/elo";

export function Navbar() {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  // Use highest of the two ELOs for the username chip badge
  const topElo = profile ? Math.max(profile.elo_verbal, profile.elo_math) : 1000;

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="group inline-flex items-baseline gap-1.5">
          <span
            className="text-2xl font-semibold tracking-tight text-[#1a5c3a]"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            HP Kampen
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          {loading ? null : user && profile ? (
            <>
              <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-2 py-1 pr-3 shadow-sm sm:inline-flex">
                <UserAvatar name={profile.username} size={28} />
                <span className="text-sm font-medium">{profile.username}</span>
                <EloBadge elo={topElo} size="sm" />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground"
              >
                Logga ut
              </Button>
            </>
          ) : user && !profile ? (
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Logga ut
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Logga in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/signup">Skapa konto</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
