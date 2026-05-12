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
      className="sticky top-0 z-50 border-b border-[#e6e0d2]"
      style={{
        background: "rgba(246, 242, 232, 0.85)",
        backdropFilter: "blur(16px) saturate(180%)",
        WebkitBackdropFilter: "blur(16px) saturate(180%)",
      }}
    >
      <div className="mx-auto flex h-[56px] max-w-6xl items-center justify-between gap-2 px-3 sm:h-[60px] sm:px-5">
        <Link to="/" className="group inline-flex items-center gap-2.5 shrink-0">
          {/* Monogram crest */}
          <span
            aria-hidden
            className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#10b981] to-[#047857] text-white shadow-[var(--shadow-sm)] transition-transform group-hover:rotate-3 group-hover:scale-105"
          >
            <span
              className="text-[13px] font-black tracking-tighter"
              style={{ fontFamily: "var(--font-display)" }}
            >
              HP
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-[#f6f2e8] bg-[#eab308]" />
          </span>
          <span
            className="text-lg font-semibold text-[#022c22] sm:text-xl"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
          >
            Kampen
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
              {profile?.is_admin && (
                <NavLink to="/admin" hideOnMobile>
                  Admin
                </NavLink>
              )}
              {profile && (
                <div
                  className="hidden items-center gap-2 rounded-full border border-[#e6e0d2] bg-white/80 px-2 py-1 pr-3 backdrop-blur-sm md:inline-flex"
                  style={{ boxShadow: "var(--shadow-sm)" }}
                >
                  <UserAvatar name={profile.username} size={26} />
                  <span className="text-sm font-medium text-[#022c22]">
                    {profile.username}
                  </span>
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
      <span className="pointer-events-none absolute inset-x-1 -bottom-0.5 h-[2px] origin-left scale-x-0 bg-[#10b981] transition-transform duration-200 group-hover:scale-x-100" />
    </Link>
  );
}
