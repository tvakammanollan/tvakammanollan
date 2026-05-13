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

    // Realtime — listen ONLY for rows addressed to me. Avoids fan-out
    // from every friendship/invite change in the system.
    const ch = supabase
      .channel(`nav-pending-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friendships",
          filter: `addressee_id=eq.${user.id}`,
        },
        () => void refresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "match_invites",
          filter: `to_user=eq.${user.id}`,
        },
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
    <header className="glass-cream sticky top-0 z-50 border-b border-[var(--line-cream)]">
      <div className="mx-auto flex h-[60px] max-w-[1240px] items-center justify-between gap-3 px-5 sm:h-[68px] sm:px-8">
        <Link to="/" className="group inline-flex items-baseline gap-1.5 shrink-0">
          <span aria-hidden className="text-amber text-[18px] leading-none">✦</span>
          <span
            className="text-[20px] font-normal text-navy sm:text-[22px]"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}
          >
            HP Kampen
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-4">
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
                <div className="hidden items-center gap-2.5 rounded-full border border-[var(--line-cream)] bg-paper-2 px-2 py-1 pr-3.5 md:inline-flex">
                  <UserAvatar name={profile.username} size={26} />
                  <span className="font-mono text-[12px] text-navy">
                    {profile.username}
                  </span>
                  <EloBadge elo={topElo} size="sm" />
                </div>
              )}
              <BugReportButton />
              <button
                type="button"
                onClick={handleSignOut}
                className="btn-link ml-1 text-navy/55"
              >
                Logga ut
              </button>
            </>
          ) : (
            <>
              {/* CTA-discipline: only ONE button. Logga in is a text link. */}
              <Link to="/login" className="btn-link text-navy/55 mr-3">
                Logga in
              </Link>
              <Link to="/signup" className="btn-amber" style={{ padding: "10px 20px", fontSize: 14 }}>
                Skapa konto
              </Link>
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
      <span className="pointer-events-none absolute inset-x-1 -bottom-0.5 h-[2px] origin-left scale-x-0 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-amber-400 transition-transform duration-300 group-hover:scale-x-100" />
    </Link>
  );
}
