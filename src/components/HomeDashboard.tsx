import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { UserAvatar } from "@/components/UserAvatar";
import { EloChart } from "@/components/EloChart";
import { MatchmakerModal, type MatchType } from "@/components/MatchmakerModal";
import { RankBadge } from "@/components/ui/RankBadge";
import { HpScoreWidget } from "@/components/ui/HpScoreWidget";
import { HpCountdown } from "@/components/ui/HpCountdown";
import { OnboardingModal } from "@/components/ui/OnboardingModal";
import { ResumeMatchBanner } from "@/components/ui/ResumeMatchBanner";
import { CoachingModal } from "@/components/CoachingModal";
import { Reveal } from "@/components/landing/MotionFX";
import { EyebrowLabel } from "@/components/layout/EyebrowLabel";
import { GlassCard } from "@/components/layout/GlassCard";
import {
  GraduationCap,
  Sigma,
  BookOpen,
  Target,
  Sparkles,
  Flame,
  ArrowRight,
  ScrollText,
  Trophy,
  Users,
  BarChart3,
} from "lucide-react";

/* =====================================================================
   HOME DASHBOARD — lugn, fokuserad "vad vill du göra idag?"-sida.
   Mörkt brand-tema (matchar landing/övriga appen), ett rent läge-rutnät,
   diskret rörelse. Bygger på befintliga primitiver.
   ===================================================================== */

export function HomeDashboard() {
  const { user, profile } = useAuth();
  const [matchOpen, setMatchOpen] = useState(false);
  const [matchType, setMatchType] = useState<MatchType>("verbal");
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [coachingOpen, setCoachingOpen] = useState(false);

  if (!user || !profile) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:py-12" aria-busy="true">
        <div className="skeleton-shimmer h-24 rounded-2xl" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="skeleton-shimmer h-32 rounded-2xl" />
          <div className="skeleton-shimmer h-32 rounded-2xl" />
          <div className="skeleton-shimmer h-32 rounded-2xl" />
          <div className="skeleton-shimmer h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  const openMatch = (t: MatchType) => {
    setMatchType(t);
    setMatchOpen(true);
  };

  const isGuest = !!user.is_anonymous;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 6) return "God natt";
    if (h < 10) return "God morgon";
    if (h < 18) return "Hej";
    return "God kväll";
  })();

  return (
    <div className="min-h-screen">
      <ResumeMatchBanner />
      {isGuest && <GuestBanner />}

      <div className="mx-auto max-w-4xl px-4 py-10 sm:py-12">
        {/* ---------- Header ---------- */}
        <Reveal y={16}>
          <header>
            <div className="flex items-center gap-3">
              <UserAvatar name={isGuest ? "Gäst" : profile.username} size={44} />
              <div className="min-w-0">
                <EyebrowLabel tone="teal" animate={false}>
                  {greeting}
                </EyebrowLabel>
                <h1
                  className="display truncate text-[30px] font-bold leading-tight text-[#e8e4da] sm:text-[38px]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {isGuest ? "Gäst" : profile.username}.
                </h1>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <RankPill label="Verbal" elo={profile.elo_verbal} />
              <RankPill label="Matte" elo={profile.elo_math} />
              {!isGuest && (profile.current_streak ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f2a65a]/25 bg-[#f2a65a]/10 px-3 py-1.5 text-sm font-semibold text-[#f2a65a] tabular-nums">
                  <Flame className="h-3.5 w-3.5" />
                  {profile.current_streak} dagar
                </span>
              )}
            </div>
          </header>
        </Reveal>

        {/* ---------- Spela ---------- */}
        <Reveal y={20} delay={0.05}>
          <section className="mt-10">
            <EyebrowLabel tone="teal">Spela</EyebrowLabel>
            <h2
              className="display mt-1 text-[22px] font-bold leading-tight text-[#e8e4da] sm:text-[26px]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Vad vill du göra idag?
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <ModeCard
                icon={<GraduationCap className="h-5 w-5" />}
                title="Verbal match"
                subtitle="Ord · Mek"
                meta={`ELO ${profile.elo_verbal}`}
                accent="amber"
                onClick={() => openMatch("verbal")}
              />
              <ModeCard
                icon={<Sigma className="h-5 w-5" />}
                title="Matte match"
                subtitle="Xyz · Kva · Nog"
                meta={`ELO ${profile.elo_math}`}
                accent="amber"
                onClick={() => openMatch("math")}
              />
              <ModeCard
                icon={<BookOpen className="h-5 w-5" />}
                title="Öva ord"
                subtitle="8 000+ riktiga HP-frågor"
                accent="teal"
                to="/ord"
              />
              <ModeCard
                icon={<Target className="h-5 w-5" />}
                title="Träna utan tid"
                subtitle="I lugn takt, inget ELO på spel"
                accent="teal"
                to="/train"
              />
            </div>

            {/* Sekundär rad */}
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <SecondaryLink to="/gamla-prov" icon={<ScrollText className="h-4 w-4" />}>
                Gamla prov
              </SecondaryLink>
              <SecondaryLink to="/leaderboard" icon={<Trophy className="h-4 w-4" />}>
                Topplista
              </SecondaryLink>
              <SecondaryLink to="/friends" icon={<Users className="h-4 w-4" />}>
                Vänner
              </SecondaryLink>
              <SecondaryLink to="/stats" icon={<BarChart3 className="h-4 w-4" />}>
                Statistik
              </SecondaryLink>
              <button
                type="button"
                onClick={() => setCoachingOpen(true)}
                className="inline-flex items-center gap-1.5 text-[#f2a65a] transition-colors hover:text-[#f5c089]"
              >
                <Sparkles className="h-4 w-4" />
                Gratis coachning
              </button>
            </div>
          </section>
        </Reveal>

        {/* ---------- Din utveckling ---------- */}
        <Reveal y={20} delay={0.1}>
          <section className="mt-12">
            <div className="flex items-end justify-between gap-3">
              <div>
                <EyebrowLabel tone="teal">Din utveckling</EyebrowLabel>
                <h2
                  className="display mt-1 text-[22px] font-bold leading-tight text-[#e8e4da] sm:text-[26px]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  ELO-progression
                </h2>
              </div>
              <div className="hidden sm:block">
                <HpCountdown size="inline" />
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <HpScoreWidget
                eloVerbal={profile.elo_verbal}
                eloMath={profile.elo_math}
                size="full"
              />
              <GlassCard variant="default" className="flex flex-col">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/45">
                  Senaste 20 matcherna
                </p>
                <div className="mt-2 flex-1">
                  <EloChart userId={user.id} />
                </div>
              </GlassCard>
            </div>
          </section>
        </Reveal>
      </div>

      <MatchmakerModal open={matchOpen} onOpenChange={setMatchOpen} matchType={matchType} />
      <CoachingModal open={coachingOpen} onOpenChange={setCoachingOpen} />
      <OnboardingModal
        open={!isGuest && profile.onboarding_completed === false && !onboardingDismissed}
        onClose={() => setOnboardingDismissed(true)}
        onStartFirstMatch={(t) => {
          setOnboardingDismissed(true);
          openMatch(t);
        }}
      />
    </div>
  );
}

/* =================== GUEST BANNER =================== */
function GuestBanner() {
  return (
    <div className="border-b border-[#f2a65a]/20 bg-[#f2a65a]/[0.06] px-4 py-3">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-sm text-[#e8e4da]">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#f2a65a]/25 bg-[#f2a65a]/10 text-[#f2a65a]">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <span>
            Du spelar som <strong>gäst</strong>. Skapa konto för att spara din ELO.
          </span>
        </div>
        <Link
          to="/signup"
          className="group inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#f2a65a] px-4 py-1.5 text-xs font-semibold text-[#1a0d04] transition hover:brightness-110"
        >
          Skapa konto
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}

/* =================== RANK PILL =================== */
function RankPill({ label, elo }: { label: string; elo: number }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
        {label}
      </span>
      <RankBadge elo={elo} size="sm" />
    </span>
  );
}

/* =================== MODE CARD =================== */
function ModeCard({
  icon,
  title,
  subtitle,
  meta,
  accent,
  to,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  meta?: string;
  accent: "amber" | "teal";
  to?: string;
  onClick?: () => void;
}) {
  const iconClass =
    accent === "amber"
      ? "border-[#f2a65a]/20 bg-[#f2a65a]/10 text-[#f2a65a]"
      : "border-[#6fb3b8]/20 bg-[#6fb3b8]/10 text-[#6fb3b8]";

  const inner = (
    <GlassCard variant="interactive" className="h-full">
      <div className="flex items-start gap-4">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${iconClass}`}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3
              className="text-[18px] font-bold leading-tight text-[#e8e4da]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {title}
            </h3>
            {meta && <span className="shrink-0 text-xs tabular-nums text-white/45">{meta}</span>}
          </div>
          <p className="mt-1 text-[13px] leading-relaxed text-white/55">{subtitle}</p>
        </div>
        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-white/30 transition-all group-hover:translate-x-0.5 group-hover:text-[#f2a65a]" />
      </div>
    </GlassCard>
  );

  if (to) {
    return (
      <Link
        to={to}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        params={{} as any}
        className="group block"
      >
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className="group block w-full text-left">
      {inner}
    </button>
  );
}

/* =================== SECONDARY LINK =================== */
function SecondaryLink({
  to,
  icon,
  children,
}: {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      params={{} as any}
      className="inline-flex items-center gap-1.5 text-white/60 transition-colors hover:text-[#e8e4da]"
    >
      {icon}
      {children}
    </Link>
  );
}
