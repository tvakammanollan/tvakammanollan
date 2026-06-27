import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { EloBadge } from "@/components/EloBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { BugReportButton } from "@/components/BugReportButton";
import { NotificationsBell } from "@/components/NotificationsBell";
import { SafeBoundary } from "@/components/SafeBoundary";
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
  const { play: playAsGuest, loading: guestLoading } = useGuestPlay();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const topElo = profile ? Math.max(profile.elo_verbal, profile.elo_math) : 1000;

  // Scroll-aware: helt transparent vid top, glas-bg först när användaren
  // scrollar — så hero-shadern bleeds fritt under navbaren utan strip.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="sticky top-0 z-50 transition-[background,backdrop-filter] duration-300"
      style={{
        background: scrolled ? "rgba(15, 8, 3, 0.65)" : "transparent",
        backdropFilter: scrolled ? "blur(20px) saturate(180%)" : undefined,
        WebkitBackdropFilter: scrolled ? "blur(20px) saturate(180%)" : undefined,
      }}
    >
      <div className="mx-auto flex h-[56px] max-w-6xl items-center justify-between gap-2 px-3 sm:h-[60px] sm:px-5">
        <Link to="/" className="group inline-flex items-center gap-2.5 shrink-0">
          {/* Monogram crest — amber */}
          <span
            aria-hidden
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm transition-transform group-hover:rotate-3 group-hover:scale-105"
            style={{ background: "#f2a65a" }}
          >
            <span className="absolute inset-0.5 rounded-[10px] bg-[#170d05]" />
            <span
              className="relative text-[13px] font-black tracking-tighter"
              style={{ fontFamily: "var(--font-display)", color: "#f2a65a" }}
            >
              HP
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-[#170d05] bg-emerald-400" />
          </span>
          <span
            className="text-[19px] font-bold text-white sm:text-[21px]"
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
              <NavLink to="/friends">Vänner</NavLink>
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
                  <span
                    className="max-w-[10rem] truncate text-sm font-medium"
                    style={{ color: "var(--cream)" }}
                    title={profile.username}
                  >
                    {profile.username}
                  </span>
                  <EloBadge elo={topElo} size="sm" />
                </div>
              )}
              {!user.is_anonymous && (
                <SafeBoundary label="notifications-bell">
                  <NotificationsBell userId={user.id} />
                </SafeBoundary>
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
              {!user.is_anonymous && (
                <SafeBoundary label="notifications-bell">
                  <NotificationsBell userId={user.id} />
                </SafeBoundary>
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
  hideOnMobile,
}: {
  to: string;
  children: React.ReactNode;
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
      {/* Underline — animates in on hover, persists on active */}
      <span
        className="pointer-events-none absolute inset-x-1 -bottom-0.5 h-[2px] origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100 group-[.is-active]:scale-x-100"
        style={{ background: "#f2a65a" }}
      />
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
                <div
                  className="truncate text-sm font-semibold"
                  style={{ color: "var(--cream)" }}
                  title={profile.username}
                >
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
