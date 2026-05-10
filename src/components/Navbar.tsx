import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { EloBadge } from "@/components/EloBadge";
import { UserAvatar } from "@/components/UserAvatar";

export function Navbar() {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const topElo = profile ? Math.max(profile.elo_verbal, profile.elo_math) : 1000;

  return (
    <header
      className="sticky top-0 z-50 border-b border-border"
      style={{
        background: "rgba(249,247,244,0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div className="mx-auto flex h-[52px] max-w-6xl items-center justify-between px-4 sm:h-14">
        <Link to="/" className="group inline-flex items-baseline">
          <span
            className="text-xl font-semibold text-[#1a5c3a]"
            style={{ fontFamily: "Playfair Display, serif", letterSpacing: "-0.02em" }}
          >
            HP Kampen
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-3">
          {loading ? null : user && profile ? (
            <>
              <NavLink to="/leaderboard">Topplista</NavLink>
              <NavLink to="/stats">Statistik</NavLink>
              <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-2 py-1 pr-3 sm:inline-flex"
                style={{ boxShadow: "var(--shadow-sm)" }}
              >
                <UserAvatar name={profile.username} size={26} />
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

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      to={to as any}
      className="group relative hidden px-1 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
      activeProps={{ className: "relative hidden px-1 py-1 text-sm font-semibold text-foreground sm:inline-block" }}
    >
      <span>{children}</span>
      <span className="pointer-events-none absolute inset-x-1 -bottom-0.5 h-[2px] origin-left scale-x-0 bg-[#1a5c3a] transition-transform duration-200 group-hover:scale-x-100" />
    </Link>
  );
}
