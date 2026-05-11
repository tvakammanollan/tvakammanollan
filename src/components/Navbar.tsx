import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { EloBadge } from "@/components/EloBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { BugReportButton } from "@/components/BugReportButton";

export function Navbar() {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  // Pending friend requests + match invites for the current user
  useEffect(() => {
    if (!user) {
      setPendingCount(0);
      return;
    }
    let cancelled = false;
    const refresh = async () => {
      const [{ count: friendCount }, { count: inviteCount }] = await Promise.all([
        supabase
          .from("friendships")
          .select("id", { count: "exact", head: true })
          .eq("addressee_id", user.id)
          .eq("status", "pending"),
        supabase
          .from("match_invites")
          .select("id", { count: "exact", head: true })
          .eq("to_user", user.id)
          .eq("status", "pending"),
      ]);
      if (!cancelled) setPendingCount((friendCount ?? 0) + (inviteCount ?? 0));
    };
    void refresh();

    // Realtime — listen for new invites
    const ch = supabase
      .channel(`nav-pending-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friendships" },
        () => void refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "match_invites" },
        () => void refresh(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(ch);
    };
  }, [user]);

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
      <div className="mx-auto flex h-[52px] max-w-6xl items-center justify-between gap-2 px-3 sm:h-14 sm:px-4">
        <Link to="/" className="group inline-flex items-baseline shrink-0">
          <span
            className="text-lg font-semibold text-[#1a5c3a] sm:text-xl"
            style={{ fontFamily: "Playfair Display, serif", letterSpacing: "-0.02em" }}
          >
            HP Kampen
          </span>
        </Link>

        <nav className="flex items-center gap-0.5 sm:gap-2">
          {loading ? null : user ? (
            <>
              <NavLink to="/train">Träna</NavLink>
              <NavLink to="/leaderboard">Topplista</NavLink>
              <NavLink to="/friends" badge={pendingCount}>
                Vänner
              </NavLink>
              <NavLink to="/stats" hideOnMobile>
                Statistik
              </NavLink>
              {profile && (
                <div
                  className="hidden items-center gap-2 rounded-full border border-border bg-card px-2 py-1 pr-3 md:inline-flex"
                  style={{ boxShadow: "var(--shadow-sm)" }}
                >
                  <UserAvatar name={profile.username} size={26} />
                  <span className="text-sm font-medium">{profile.username}</span>
                  <EloBadge elo={topElo} size="sm" />
                </div>
              )}
              <BugReportButton />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="px-2 text-muted-foreground hover:text-foreground"
              >
                Logga ut
              </Button>
            </>
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

function NavLink({
  to,
  children,
  badge,
  hideOnMobile,
}: {
  to: string;
  children: React.ReactNode;
  badge?: number;
  hideOnMobile?: boolean;
}) {
  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      to={to as any}
      className={`group relative inline-block px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground ${
        hideOnMobile ? "hidden sm:inline-block" : ""
      }`}
      activeProps={{
        className: `relative inline-block px-2 py-1 text-sm font-semibold text-foreground ${
          hideOnMobile ? "hidden sm:inline-block" : ""
        }`,
      }}
    >
      <span>{children}</span>
      {badge && badge > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white shadow-sm">
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
      <span className="pointer-events-none absolute inset-x-1 -bottom-0.5 h-[2px] origin-left scale-x-0 bg-[#1a5c3a] transition-transform duration-200 group-hover:scale-x-100" />
    </Link>
  );
}
