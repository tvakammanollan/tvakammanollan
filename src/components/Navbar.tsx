import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { EloBadge } from "@/components/EloBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { BugReportButton } from "@/components/BugReportButton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Menu, LogOut, Zap, Loader2 } from "lucide-react";
import { useGuestPlay } from "@/hooks/useGuestPlay";

export function Navbar() {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const { play: playAsGuest, loading: guestLoading } = useGuestPlay();

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
      className="sticky top-0 z-50"
      style={{
        background: "rgba(7, 17, 30, 0.72)",
        borderBottom: "1px solid var(--line)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
      }}
    >
      <div className="mx-auto flex h-[56px] max-w-6xl items-center justify-between gap-2 px-3 sm:h-[60px] sm:px-5">
        <Link to="/" className="group inline-flex items-center gap-2.5 shrink-0">
          {/* Aurora monogram crest */}
          <span
            aria-hidden
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-amber-400 text-white shadow-md transition-transform group-hover:rotate-6 group-hover:scale-110"
          >
            <span className="absolute inset-0.5 rounded-[10px] bg-[#050507]" />
            <span
              className="relative text-[13px] font-black tracking-tighter text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              HP
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
          </span>
          <span
            className="text-[19px] font-bold text-[#050507] sm:text-[21px]"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.025em" }}
          >
            Kampen
          </span>
        </Link>

        {/* ===== DESKTOP NAV (≥ md) ===== */}
        <nav className="hidden items-center gap-2 md:flex">
          {loading ? null : user ? (
            <>
              <NavLink to="/train">Träna</NavLink>
              <NavLink to="/gamla-prov">Gamla prov</NavLink>
              <NavLink to="/leaderboard">Topplista</NavLink>
              <NavLink to="/friends" badge={pendingCount}>
                Vänner
              </NavLink>
              <NavLink to="/stats">Statistik</NavLink>
              {profile?.is_admin && <NavLink to="/admin">Admin</NavLink>}
              {profile && (
                <div
                  className="inline-flex items-center gap-2 rounded-full border"
                  style={{
                    borderColor: "var(--line)",
                    background: "rgba(21, 39, 62, 0.6)",
                    padding: "4px 12px 4px 4px",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <UserAvatar name={profile.username} size={26} />
                  <span className="text-sm font-medium" style={{ color: "var(--cream)" }}>
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
              <Button variant="ghost" size="sm" asChild>
                <Link to="/signup">Skapa konto</Link>
              </Button>
              <Button
                size="sm"
                onClick={() => playAsGuest("verbal")}
                disabled={guestLoading}
                className="gap-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-[#0a0a0f] font-semibold shadow-[0_0_20px_rgba(242,166,90,0.35)] hover:shadow-[0_0_30px_rgba(242,166,90,0.5)] hover:from-amber-300 hover:to-orange-400 transition-shadow"
              >
                {guestLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Zap className="h-3.5 w-3.5" />
                )}
                Testa gratis
              </Button>
            </>
          )}
        </nav>

        {/* ===== MOBILE NAV (< md) ===== */}
        <div className="flex items-center gap-1 md:hidden">
          {loading ? null : user ? (
            <>
              {/* Pending-badge syns alltid om något väntar */}
              {pendingCount > 0 && (
                <Link
                  to="/friends"
                  className="relative inline-flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ background: "rgba(242,166,90,0.16)" }}
                  aria-label={`${pendingCount} väntande`}
                >
                  <span
                    className="text-xs font-bold tabular-nums"
                    style={{ color: "var(--amber)" }}
                  >
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                </Link>
              )}
              <MobileMenu profile={profile} topElo={topElo} onSignOut={handleSignOut} />
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="px-2 text-xs">
                <Link to="/login">Logga in</Link>
              </Button>
              <Button
                size="sm"
                onClick={() => playAsGuest("verbal")}
                disabled={guestLoading}
                className="gap-1 px-3 text-xs bg-gradient-to-r from-amber-400 to-orange-500 text-[#0a0a0f] font-semibold shadow-[0_0_16px_rgba(242,166,90,0.35)]"
              >
                {guestLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Zap className="h-3 w-3" />
                )}
                Testa
              </Button>
            </>
          )}
        </div>
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
      data-cursor="link"
      className={`nav-link group relative inline-block px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground ${
        hideOnMobile ? "hidden sm:inline-block" : ""
      }`}
      activeProps={{
        className: `nav-link is-active relative inline-block px-2 py-1 text-sm font-semibold text-foreground ${
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
      {/* Underline — animates in on hover, persists on active */}
      <span className="pointer-events-none absolute inset-x-1 -bottom-0.5 h-[2px] origin-left scale-x-0 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-amber-400 transition-transform duration-300 group-hover:scale-x-100 group-[.is-active]:scale-x-100" />
    </Link>
  );
}

/* ─────────── MOBILE MENU — hamburger + sheet drawer ─────────── */
function MobileMenu({
  profile,
  topElo,
  onSignOut,
}: {
  profile: ReturnType<typeof useAuth>["profile"];
  topElo: number;
  onSignOut: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Öppna meny"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors"
          style={{
            borderColor: "var(--line)",
            background: "rgba(21, 39, 62, 0.6)",
            color: "var(--cream)",
          }}
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[80vw] max-w-[320px] border-l p-0"
        style={{
          background: "var(--navy)",
          borderColor: "var(--line)",
          color: "var(--cream)",
        }}
      >
        <SheetHeader
          className="border-b px-6 pb-4 pt-6 text-left"
          style={{ borderColor: "var(--line)" }}
        >
          <SheetTitle style={{ color: "var(--cream)", fontFamily: "var(--font-display)" }}>
            Meny
          </SheetTitle>
          {profile && (
            <div className="mt-3 flex items-center gap-3">
              <UserAvatar name={profile.username} size={36} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold" style={{ color: "var(--cream)" }}>
                  {profile.username}
                </div>
                <div className="mt-0.5">
                  <EloBadge elo={topElo} size="sm" />
                </div>
              </div>
            </div>
          )}
        </SheetHeader>

        <nav className="flex flex-col px-2 py-3">
          <MobileNavLink to="/" onClick={close} emoji="🏠">
            Hem
          </MobileNavLink>
          <MobileNavLink to="/train" onClick={close} emoji="🎯">
            Träna
          </MobileNavLink>
          <MobileNavLink to="/gamla-prov" onClick={close} emoji="📄">
            Gamla prov
          </MobileNavLink>
          <MobileNavLink to="/leaderboard" onClick={close} emoji="🏆">
            Topplista
          </MobileNavLink>
          <MobileNavLink to="/friends" onClick={close} emoji="👥">
            Vänner
          </MobileNavLink>
          <MobileNavLink to="/stats" onClick={close} emoji="📊">
            Statistik
          </MobileNavLink>
          <MobileNavLink to="/guider" onClick={close} emoji="📚">
            Guider
          </MobileNavLink>
          <MobileNavLink to="/faq" onClick={close} emoji="❓">
            Vanliga frågor
          </MobileNavLink>
          {profile?.is_admin && (
            <MobileNavLink to="/admin" onClick={close} emoji="⚙️">
              Admin
            </MobileNavLink>
          )}
        </nav>

        <div className="mt-auto border-t px-4 py-4" style={{ borderColor: "var(--line)" }}>
          <SheetClose asChild>
            <button
              type="button"
              onClick={async () => {
                close();
                await onSignOut();
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors"
              style={{
                borderColor: "var(--line)",
                color: "var(--text-secondary)",
              }}
            >
              <LogOut className="h-4 w-4" />
              Logga ut
            </button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MobileNavLink({
  to,
  emoji,
  children,
  onClick,
}: {
  to: string;
  emoji: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      to={to as any}
      onClick={onClick}
      className="group flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium transition-colors"
      style={{ color: "var(--cream)" }}
      activeProps={{
        style: {
          background: "rgba(242, 166, 90, 0.12)",
          color: "var(--amber)",
        },
      }}
    >
      <span className="text-lg" aria-hidden>
        {emoji}
      </span>
      <span className="flex-1">{children}</span>
    </Link>
  );
}
