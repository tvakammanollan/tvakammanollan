import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { EloBadge } from "@/components/EloBadge";
import { displayElo, type EloHeadline } from "@/lib/elo";
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
  ChevronDown,
  Settings,
  Swords,
  type LucideIcon,
} from "lucide-react";
import { useGuestPlay } from "@/hooks/useGuestPlay";
import { displayName } from "@/lib/guest-name";

type EloTrack = EloHeadline["track"];

/** V eller M på märket — utelämnas när grenen inte säger något (båda lika). */
function trackLabel(track: EloTrack): string | undefined {
  if (track === "verbal") return "V";
  if (track === "math") return "M";
  return undefined;
}

export function Navbar() {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { play: playAsGuest, loading: guestLoading } = useGuestPlay();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  // Ett ELO, inte två. Här stod först `Math.max(elo_verbal, elo_math)` (som
  // visade mattens orörda 1000 efter en förlorad verbal match), sedan båda
  // grenarna bredvid varandra — ärligt, men två tal att tolka i en rad man
  // läser i förbifarten. Nu visas den högsta av de grenar man faktiskt
  // spelat, med V eller M utsatt så att talet aldrig blir anonymt. Regeln
  // och varför den räknar matcher i stället för att titta på ELO:t bor i
  // `displayElo`. Ändrat på begäran 2026-08-24 — gå inte tillbaka till två
  // märken utan att fråga.
  const headline: EloHeadline = profile ? displayElo(profile) : { elo: 1000, track: null };

  // Scroll-aware: glaset tätnar och lyfter när man scrollar. Helt
  // transparent i toppläget har provats och gjorde att raden flöt ihop
  // med sidan — glaset behöver en egen yta även överst, bara tunnare.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      // Glasreceptet bor i .navbar-glass (styles.css) och inte här, därför
      // att det behöver @supports: utan backdrop-filter blir en
      // halvgenomskinlig rad oläslig, och en fallback går inte att uttrycka
      // i en inline-style. Scrolläget är ett data-attribut av samma skäl.
      className="navbar-glass sticky top-0 z-50 pt-safe px-safe"
      data-scrolled={scrolled}
    >
      <div className="mx-auto flex h-[56px] max-w-6xl items-center justify-between gap-2 px-3 sm:h-[60px] sm:px-5">
        {/* Märket OCH namnet. Märket satt tidigare ensamt, med motiveringen
            att det bär namnet självt — men en 36 px röd ruta med "2,0" i
            läser inte som ett sajtnamn för den som kommer utifrån, och
            hörnet såg tomt ut. Ordmärket står i display-snittet och med å,
            precis som i all annan text (se CLAUDE.md: å i text, a i teknik).
            Det döljs under sm så att raden inte trängs på en liten skärm —
            aria-label på länken bär namnet för skärmläsare oavsett. */}
        <Link
          to="/"
          aria-label="Tvåkommanollan, till startsidan"
          className="group inline-flex shrink-0 items-center gap-2"
        >
          <span
            aria-hidden
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl shadow-sm transition-transform group-hover:rotate-3 group-hover:scale-105"
            style={{ background: "#ae2f26" }}
          >
            {/* Samma märke som faviconen och delningsbilden: talet 2,0. */}
            <span
              className="relative text-[15px] font-black leading-none tracking-[-0.08em] text-on-brand"
              style={{ fontFamily: "var(--font-display)" }}
            >
              2,0
            </span>
            {/* Discord-stilen: pricken ska ligga PÅ den röda cirkelns kant, inte
                mot rutans hörn. Märket är `rounded-xl` på en 36×36-ruta, men
                temats `--radius-xl` är satt så stort att CSS klampar formen
                till en perfekt cirkel (radie 18 px) — synligt bara vid mätning,
                inte i klassnamnet. Rutans matematiska HÖRN ligger däremot
                ~12,7 px utanför den synliga kanten i varje led, så `-bottom-0.5
                -right-0.5` (2 px utanför hörnet) lämnade ett gap på omkring
                11 px till cirkeln — pricken "svävade" i tomrummet.
                Beräkning: cirkelns kant vid 45° = radie + radie·cos45° ≈
                30,73 px från rutans övre vänstra hörn i varje led; för en 8 px
                prick blir det `bottom/right: 1,27px` för att lägga prickens
                CENTRUM exakt på kanten. Mätt i webbläsaren: 18,01 px från
                badgens centrum mot en radie på 18 — pricken ligger nu på
                linjen, inte i luften. */}
            <span
              className="absolute h-2 w-2 rounded-full border border-background bg-emerald-400"
              style={{ bottom: "1.27px", right: "1.27px" }}
            />
          </span>
          <span
            aria-hidden
            className="hidden text-[17px] font-bold leading-none tracking-[-0.02em] text-[var(--cream)] transition-colors group-hover:text-primary sm:inline"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Tvåkommanollan
          </span>
        </Link>

        {/* ===== DESKTOP NAV (≥ md) ===== */}
        <nav className="hidden items-center gap-2 md:flex">
          {loading ? null : user ? (
            <>
              {/* Bara de tre vi faktiskt pushar. Resten bor i avatarmenyn —
                  tidigare låg fem länkar här och samma fem en gång till i
                  dashboardens sekundärrad, footern och snabbmenyn. */}
              {/* Duellen är sajtens kärna men saknades helt i navbaren —
                  den nåddes bara via ett kort på startsidan. */}
              <NavLink to="/matchmaking" search={{ type: "verbal" }}>
                Duell
              </NavLink>
              <NavLink to="/ord">Ord</NavLink>
              <NavLink to="/gamla-prov">Gamla prov</NavLink>
              <NavLink to="/leaderboard">Topplista</NavLink>
              {!user.is_anonymous && (
                <SafeBoundary label="notifications-bell">
                  <NotificationsBell userId={user.id} />
                </SafeBoundary>
              )}
              {profile && (
                <AccountMenu
                  profile={profile}
                  elo={headline.elo}
                  track={headline.track}
                  onSignOut={handleSignOut}
                />
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
                className="gap-1.5 bg-primary text-on-brand font-semibold hover: hover:from-amber-300 hover:to-orange-400 transition-shadow"
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
              <MobileMenu
                profile={profile}
                elo={headline.elo}
                track={headline.track}
                onSignOut={handleSignOut}
              />
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
                className="gap-1 px-3 text-xs bg-primary text-on-brand font-semibold"
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
  search,
}: {
  to: string;
  children: React.ReactNode;
  hideOnMobile?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  search?: any;
}) {
  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      to={to as any}
      search={search}
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
        style={{ background: "#ae2f26" }}
      />
    </Link>
  );
}

/* ─────────── ACCOUNT MENU — allt sekundärt bakom avataren ─────────── */
function AccountMenu({
  profile,
  elo,
  track,
  onSignOut,
}: {
  profile: NonNullable<ReturnType<typeof useAuth>["profile"]>;
  elo: number;
  track: EloTrack;
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
            background: "rgba(46, 30, 20, 0.06)",
            padding: "4px 10px 4px 4px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <UserAvatar
            name={displayName(profile.username, profile.id)}
            seed={profile.id}
            size={26}
          />
          <span
            className="max-w-[8rem] truncate text-sm font-medium"
            style={{ color: "var(--cream)" }}
            title={displayName(profile.username, profile.id)}
          >
            {displayName(profile.username, profile.id)}
          </span>
          <EloBadge elo={elo} label={trackLabel(track)} size="sm" />
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
        <AccountMenuLink to="/train" icon={Target}>
          Träna
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
  elo,
  track,
  onSignOut,
}: {
  profile: ReturnType<typeof useAuth>["profile"];
  elo: number;
  track: EloTrack;
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
            background: "rgba(46, 30, 20, 0.06)",
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
              <UserAvatar
                name={displayName(profile.username, profile.id)}
                seed={profile.id}
                size={36}
              />
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-sm font-semibold"
                  style={{ color: "var(--cream)" }}
                  title={displayName(profile.username, profile.id)}
                >
                  {displayName(profile.username, profile.id)}
                </div>
                <div className="mt-0.5">
                  <EloBadge elo={elo} label={trackLabel(track)} size="sm" />
                </div>
              </div>
            </div>
          )}
        </SheetHeader>

        <nav className="flex flex-col px-2 py-3">
          <MobileNavLink to="/" onClick={close} icon={Home}>
            Hem
          </MobileNavLink>
          <MobileNavLink
            to="/matchmaking"
            search={{ type: "verbal" }}
            onClick={close}
            icon={Swords}
          >
            Duell
          </MobileNavLink>
          <MobileNavLink to="/ord" onClick={close} icon={Type}>
            Ord
          </MobileNavLink>
          <MobileNavLink to="/gamla-prov" onClick={close} icon={FileText}>
            Gamla prov
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
          <MobileNavLink to="/train" onClick={close} icon={Target}>
            Träna
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
  search,
}: {
  to: string;
  icon: LucideIcon;
  children: React.ReactNode;
  onClick?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  search?: any;
}) {
  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      to={to as any}
      search={search}
      onClick={onClick}
      className="group flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium transition-colors hover:bg-white/[0.04]"
      style={{ color: "var(--cream)" }}
      activeProps={{
        style: {
          background: "rgba(174, 47, 38, 0.12)",
          color: "var(--amber)",
        },
      }}
    >
      <Icon className="h-[18px] w-[18px] shrink-0 opacity-70" aria-hidden />
      <span className="flex-1">{children}</span>
    </Link>
  );
}
