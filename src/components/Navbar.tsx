import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { EloBadge } from "@/components/EloBadge";
import { UserAvatar } from "@/components/UserAvatar";
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  LogOut,
  Zap,
  Loader2,
  Home,
  Target,
  FileText,
  Trophy,
  Users,
  BarChart3,
  Type,
  MessagesSquare,
  ChevronDown,
  Settings,
  type LucideIcon,
} from "lucide-react";
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
              {/* Bara de tre vi faktiskt pushar. Resten bor i avatarmenyn —
                  tidigare låg fem länkar här och samma fem en gång till i
                  dashboardens sekundärrad, footern och snabbmenyn. */}
              <NavLink to="/ord">Ord</NavLink>
              <NavLink to="/train">Träna</NavLink>
              <NavLink to="/leaderboard">Topplista</NavLink>
              {!user.is_anonymous && (
                <SafeBoundary label="notifications-bell">
                  <NotificationsBell userId={user.id} />
                </SafeBoundary>
              )}
              {profile && (
                <AccountMenu profile={profile} topElo={topElo} onSignOut={handleSignOut} />
              )}
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

/* ─────────── ACCOUNT MENU — allt sekundärt bakom avataren ─────────── */
function AccountMenu({
  profile,
  topElo,
  onSignOut,
}: {
  profile: NonNullable<ReturnType<typeof useAuth>["profile"]>;
  topElo: number;
  onSignOut: () => Promise<void>;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border transition-colors hover:brightness-110"
          style={{
            borderColor: "var(--line)",
            background: "rgba(42, 28, 16, 0.6)",
            padding: "4px 10px 4px 4px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <UserAvatar name={profile.username} size={26} />
          <span
            className="max-w-[8rem] truncate text-sm font-medium"
            style={{ color: "var(--cream)" }}
            title={profile.username}
          >
            {profile.username}
          </span>
          <EloBadge elo={topElo} size="sm" />
          <ChevronDown className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--cream)" }} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <AccountMenuLink to="/stats" icon={BarChart3}>
          Statistik
        </AccountMenuLink>
        <AccountMenuLink to="/friends" icon={Users}>
          Vänner
        </AccountMenuLink>
        <AccountMenuLink to="/forum" icon={MessagesSquare}>
          Forum
        </AccountMenuLink>
        <AccountMenuLink to="/gamla-prov" icon={FileText}>
          Gamla prov
        </AccountMenuLink>
        {profile.is_admin && (
          <AccountMenuLink to="/admin" icon={Settings}>
            Admin
          </AccountMenuLink>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void onSignOut()} className="gap-2">
          <LogOut className="h-4 w-4 opacity-70" />
          Logga ut
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AccountMenuLink({
  to,
  icon: Icon,
  children,
}: {
  to: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  // Radix `asChild` kör React.Children.only — håll exakt ett barn här.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const href = to as any;
  return (
    <DropdownMenuItem asChild className="gap-2">
      <Link to={href}>
        <Icon className="h-4 w-4 opacity-70" />
        {children}
      </Link>
    </DropdownMenuItem>
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
            background: "rgba(42, 28, 16, 0.6)",
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
          <MobileNavLink to="/" onClick={close} icon={Home}>
            Hem
          </MobileNavLink>
          <MobileNavLink to="/ord" onClick={close} icon={Type}>
            Ord
          </MobileNavLink>
          <MobileNavLink to="/train" onClick={close} icon={Target}>
            Träna
          </MobileNavLink>
          <MobileNavLink to="/leaderboard" onClick={close} icon={Trophy}>
            Topplista
          </MobileNavLink>
          {/* Sekundärt — samma uppsättning som avatarmenyn på desktop.
              Guider och FAQ nås via footern. */}
          <MobileNavLink to="/stats" onClick={close} icon={BarChart3}>
            Statistik
          </MobileNavLink>
          <MobileNavLink to="/friends" onClick={close} icon={Users}>
            Vänner
          </MobileNavLink>
          <MobileNavLink to="/gamla-prov" onClick={close} icon={FileText}>
            Gamla prov
          </MobileNavLink>
          <MobileNavLink to="/forum" onClick={close} icon={MessagesSquare}>
            Forum
          </MobileNavLink>
          {profile?.is_admin && (
            <MobileNavLink to="/admin" onClick={close} icon={Settings}>
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
  icon: Icon,
  children,
  onClick,
}: {
  to: string;
  icon: LucideIcon;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      to={to as any}
      onClick={onClick}
      className="group flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium transition-colors hover:bg-white/[0.04]"
      style={{ color: "var(--cream)" }}
      activeProps={{
        style: {
          background: "rgba(242, 166, 90, 0.12)",
          color: "var(--amber)",
        },
      }}
    >
      <Icon className="h-[18px] w-[18px] shrink-0 opacity-70" aria-hidden />
      <span className="flex-1">{children}</span>
    </Link>
  );
}
