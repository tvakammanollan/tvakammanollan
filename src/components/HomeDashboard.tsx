import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { UserAvatar } from "@/components/UserAvatar";
import { EloChart } from "@/components/EloChart";
import { MatchmakerModal, type MatchType } from "@/components/MatchmakerModal";
import { RankBadge } from "@/components/ui/RankBadge";
import { RankIcon } from "@/components/ui/RankIcon";
import { HpScoreWidget } from "@/components/ui/HpScoreWidget";
import { HpCountdown } from "@/components/ui/HpCountdown";
import { OnboardingModal } from "@/components/ui/OnboardingModal";
import { ResumeMatchBanner } from "@/components/ui/ResumeMatchBanner";
import { CoachingModal } from "@/components/CoachingModal";
import { Reveal } from "@/components/landing/MotionFX";
import { AchievementsCard } from "@/components/AchievementsCard";
import { WordOfTheDay } from "@/components/WordOfTheDay";
import { SafeBoundary } from "@/components/SafeBoundary";
import { EyebrowLabel } from "@/components/layout/EyebrowLabel";
import { GlassCard } from "@/components/layout/GlassCard";
import { getRankForElo, getNextRank, getEloProgressInTier } from "@/types";
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

            <NextRankBar elo={Math.max(profile.elo_verbal, profile.elo_math)} />
          </header>
        </Reveal>

        {/* ---------- Spela ---------- */}
        <Reveal y={20} delay={0.05}>
          <section className="mt-12">
            <EyebrowLabel tone="amber">Spela</EyebrowLabel>
            <h2
              className="display mt-1 text-[22px] font-bold leading-tight text-[#e8e4da] sm:text-[26px]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Starta en match
            </h2>
            <p className="mt-1.5 text-sm text-white/45">8 frågor · 5 minuter · ELO på spel</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <BattleCard
                icon={<GraduationCap className="h-5 w-5" />}
                title="Verbal"
                subtitle="Ord & meningskomplettering"
                elo={profile.elo_verbal}
                onClick={() => openMatch("verbal")}
              />
              <BattleCard
                icon={<Sigma className="h-5 w-5" />}
                title="Matte"
                subtitle="Xyz · Kva · Nog"
                elo={profile.elo_math}
                onClick={() => openMatch("math")}
              />
            </div>

            {/* Öva i lugn takt */}
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <QuietCard
                to="/ord"
                icon={<BookOpen className="h-4 w-4" />}
                title="Öva ord"
                subtitle="8 000+ riktiga HP-ord"
              />
              <QuietCard
                to="/train"
                icon={<Target className="h-4 w-4" />}
                title="Träna utan tid"
                subtitle="I lugn takt, inget ELO"
              />
            </div>

            {/* Sekundär rad */}
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
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

        {/* ---------- Dagens ord ---------- */}
        <Reveal y={20} delay={0.08}>
          <div className="mt-6">
            <SafeBoundary label="word-of-the-day">
              <WordOfTheDay />
            </SafeBoundary>
          </div>
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

            {!isGuest && (
              <div className="mt-4">
                <SafeBoundary label="achievements-compact">
                  <AchievementsCard variant="compact" />
                </SafeBoundary>
              </div>
            )}
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
function NextRankBar({ elo }: { elo: number }) {
  const rank = getRankForElo(elo);
  const next = getNextRank(elo);
  const pct = getEloProgressInTier(elo);
  if (!next) {
    return (
      <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/55">
        <RankIcon rank={rank} className="h-3.5 w-3.5" style={{ color: rank.accent }} />
        Du är på högsta ranken — <span style={{ color: rank.accent }}>{rank.name}</span>.
      </p>
    );
  }
  const toGo = next.minElo - elo;
  return (
    <div className="mt-3 max-w-xs">
      <div className="flex items-center justify-between gap-2 text-[11px] text-white/55">
        <span className="inline-flex items-center gap-1.5">
          <RankIcon rank={rank} className="h-3.5 w-3.5" style={{ color: rank.accent }} />
          {rank.shortName}
        </span>
        <span className="inline-flex items-center gap-1.5 tabular-nums">
          {toGo} ELO till
          <RankIcon rank={next} className="h-3.5 w-3.5" style={{ color: next.accent }} />
          {next.shortName}
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${rank.accent}, ${next.accent})`,
          }}
        />
      </div>
    </div>
  );
}

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

/* =================== BATTLE CARD (primär) =================== */
function BattleCard({
  icon,
  title,
  subtitle,
  elo,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  elo: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-left backdrop-blur-sm transition-all hover:border-[#f2a65a]/40 hover:bg-white/[0.04]"
    >
      {/* mjuk amber-glöd vid hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#f2a65a]/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
      />
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#f2a65a]/20 bg-[#f2a65a]/10 text-[#f2a65a]">
          {icon}
        </span>
        <RankBadge elo={elo} size="sm" />
      </div>
      <h3
        className="mt-3.5 text-[20px] font-bold leading-tight text-[#e8e4da]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h3>
      <p className="mt-0.5 text-[13px] text-white/50">{subtitle}</p>
      <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#f2a65a]">
        Spela
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}

/* =================== QUIET CARD (öva, sekundär) =================== */
function QuietCard({
  to,
  icon,
  title,
  subtitle,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      to={to}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      params={{} as any}
      className="group flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.015] px-4 py-3 transition-colors hover:border-white/15 hover:bg-white/[0.03]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#6fb3b8]/20 bg-[#6fb3b8]/10 text-[#6fb3b8]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-[#e8e4da]">{title}</div>
        <div className="text-xs text-white/45">{subtitle}</div>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-white/25 transition-all group-hover:translate-x-0.5 group-hover:text-[#6fb3b8]" />
    </Link>
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
