import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { UserAvatar } from "@/components/UserAvatar";
import { MatchmakerModal, type MatchType } from "@/components/MatchmakerModal";
import { RankBadge } from "@/components/ui/RankBadge";
import { RankIcon } from "@/components/ui/RankIcon";
import { OnboardingModal } from "@/components/ui/OnboardingModal";
import { ResumeMatchBanner } from "@/components/ui/ResumeMatchBanner";
import { CoachingModal } from "@/components/CoachingModal";
import { Reveal } from "@/components/landing/MotionFX";
import { WordOfTheDay } from "@/components/WordOfTheDay";
import { SafeBoundary } from "@/components/SafeBoundary";
import { EyebrowLabel } from "@/components/layout/EyebrowLabel";
import { getRankForElo, getNextRank, getEloProgressInTier } from "@/types";
import { BookOpen, Sparkles, Flame, ArrowRight, Swords } from "lucide-react";

/* =====================================================================
   HOME DASHBOARD — tre val, inget mer.

   Skärmen svarar på en enda fråga: "vad gör jag nu?". Svaret är spela en
   match, plugga ord, eller boka coachning. Allt som är uppföljning
   (ELO-kurva, achievements, HP-estimat) bor på /stats; allt som är
   navigering bor i navbaren. Läggs något tillbaka här måste det tjäna
   sin plats mot de tre.
   ===================================================================== */

export function HomeDashboard() {
  const { user, profile } = useAuth();
  const [matchOpen, setMatchOpen] = useState(false);
  const [matchType, setMatchType] = useState<MatchType>("verbal");
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [coachingOpen, setCoachingOpen] = useState(false);

  if (!user || !profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-12" aria-busy="true">
        <div className="skeleton-shimmer h-20 rounded-2xl" />
        <div className="mt-8 space-y-3">
          <div className="skeleton-shimmer h-44 rounded-2xl" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="skeleton-shimmer h-28 rounded-2xl" />
            <div className="skeleton-shimmer h-28 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const isGuest = !!user.is_anonymous;
  const activeElo = matchType === "verbal" ? profile.elo_verbal : profile.elo_math;

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

      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-12">
        {/* ---------- Header: namn + en enda statusrad ---------- */}
        <Reveal y={16}>
          <header>
            <div className="flex items-center gap-3">
              <UserAvatar name={isGuest ? "Gäst" : profile.username} size={44} />
              <div className="min-w-0">
                <EyebrowLabel tone="teal" animate={false}>
                  {greeting}
                </EyebrowLabel>
                <h1
                  className="display truncate text-[30px] font-bold leading-tight text-[var(--cream)] sm:text-[38px]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {isGuest ? "Gäst" : profile.username}.
                </h1>
              </div>
            </div>

            <StatusRow
              elo={Math.max(profile.elo_verbal, profile.elo_math)}
              streak={isGuest ? 0 : (profile.current_streak ?? 0)}
            />
          </header>
        </Reveal>

        {/* ---------- 1. Spela match ---------- */}
        <Reveal y={20} delay={0.05}>
          <section className="mt-10">
            <div className="relative overflow-hidden rounded-2xl border border-[#ae2f26]/25 bg-white/[0.02] p-5 backdrop-blur-sm sm:p-6">
              <span
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#ae2f26]/10 blur-3xl"
              />

              <div className="relative flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#ae2f26]/25 bg-[#ae2f26]/10 text-[#ae2f26]">
                  <Swords className="h-5 w-5" />
                </span>
                <RankBadge elo={activeElo} size="sm" />
              </div>

              <h2
                className="display relative mt-3.5 text-[24px] font-bold leading-tight text-[var(--cream)] sm:text-[28px]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Spela en match
              </h2>
              <p className="relative mt-1 text-sm text-white/50">
                8 frågor · 5 minuter · ELO på spel
              </p>

              {/* Ämnesväxel — ett val, inte två kort */}
              <div
                role="radiogroup"
                aria-label="Välj ämne"
                className="relative mt-4 inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1"
              >
                <SubjectPill
                  label="Verbal"
                  active={matchType === "verbal"}
                  onClick={() => setMatchType("verbal")}
                />
                <SubjectPill
                  label="Matte"
                  active={matchType === "math"}
                  onClick={() => setMatchType("math")}
                />
              </div>

              <button
                type="button"
                onClick={() => setMatchOpen(true)}
                className="group relative mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#ae2f26] px-5 py-3.5 text-[15px] font-semibold text-[#fff8f5] transition hover:brightness-110 sm:w-auto sm:px-8"
              >
                Spela {matchType === "verbal" ? "verbal" : "matte"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </section>
        </Reveal>

        {/* ---------- 2. Plugga ord   3. Coachning ---------- */}
        <Reveal y={20} delay={0.08}>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <ActionCard
              to="/ord"
              tone="teal"
              icon={<BookOpen className="h-5 w-5" />}
              title="Plugga ord"
              subtitle="8 000+ riktiga HP-ord, repetition som minns vad du missar"
            />
            <ActionCard
              onClick={() => setCoachingOpen(true)}
              tone="leaf"
              icon={<Sparkles className="h-5 w-5" />}
              title="Coachning"
              subtitle="30 min gratis med en coach som själv fått 1.9+"
            />
          </div>
        </Reveal>

        {/* ---------- Dagens ord ---------- */}
        <Reveal y={20} delay={0.11}>
          <div className="mt-3">
            <SafeBoundary label="word-of-the-day">
              <WordOfTheDay />
            </SafeBoundary>
          </div>
        </Reveal>
      </div>

      <MatchmakerModal open={matchOpen} onOpenChange={setMatchOpen} matchType={matchType} />
      <CoachingModal open={coachingOpen} onOpenChange={setCoachingOpen} />
      <OnboardingModal
        open={!isGuest && profile.onboarding_completed === false && !onboardingDismissed}
        onClose={() => setOnboardingDismissed(true)}
        onStartFirstMatch={(t) => {
          setOnboardingDismissed(true);
          setMatchType(t);
          setMatchOpen(true);
        }}
      />
    </div>
  );
}

/* =================== GUEST BANNER =================== */
function GuestBanner() {
  return (
    <div className="border-b border-[#ae2f26]/20 bg-[#ae2f26]/[0.06] px-4 py-3">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-sm text-[var(--cream)]">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#ae2f26]/25 bg-[#ae2f26]/10 text-[#ae2f26]">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <span>
            Du spelar som <strong>gäst</strong>. Skapa konto för att spara din ELO.
          </span>
        </div>
        <Link
          to="/signup"
          className="group inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#ae2f26] px-4 py-1.5 text-xs font-semibold text-[#fff8f5] transition hover:brightness-110"
        >
          Skapa konto
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}

/* =================== STATUSRAD ===================
   Rank, streak och "hur långt till nästa rank" på en rad. Tidigare låg
   detta som fyra separata element (två rank-pills, en streak-pill och en
   egen progress-sektion) som tillsammans tog mer plats än spela-knappen. */
function StatusRow({ elo, streak }: { elo: number; streak: number }) {
  const rank = getRankForElo(elo);
  const next = getNextRank(elo);
  const pct = getEloProgressInTier(elo);

  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
      <span className="inline-flex items-center gap-2">
        <RankBadge elo={elo} size="sm" />
      </span>

      {streak > 0 && (
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2f6b3c] tabular-nums">
          <Flame className="h-3.5 w-3.5" />
          {streak} dagar
        </span>
      )}

      {next ? (
        <span className="inline-flex min-w-[9rem] flex-1 items-center gap-2 text-[11px] text-white/55">
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <span
              className="block h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${rank.accent}, ${next.accent})`,
              }}
            />
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 tabular-nums">
            {next.minElo - elo} till
            <RankIcon rank={next} className="h-3.5 w-3.5" style={{ color: next.accent }} />
            {next.shortName}
          </span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-[11px] text-white/55">
          <RankIcon rank={rank} className="h-3.5 w-3.5" style={{ color: rank.accent }} />
          Högsta ranken
        </span>
      )}
    </div>
  );
}

/* =================== ÄMNESVÄXEL ===================
   Verbal och matte var två jämnstora primärkort, vilket gjorde att
   skärmen saknade ett tydligt förstaval. Nu är ämnet ett litet val
   inuti spela-kortet och matchen är den enda knappen. */
function SubjectPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
        active
          ? "bg-[#7a5236]/15 text-[#7a5236]"
          : "text-white/50 hover:bg-white/[0.04] hover:text-[var(--cream)]"
      }`}
    >
      {label}
    </button>
  );
}

/* =================== ACTION CARD ===================
   Samma kort oavsett om målet är en route (`to`) eller en modal
   (`onClick`) — så ord och coachning väger exakt lika mycket. */
function ActionCard({
  to,
  onClick,
  tone,
  icon,
  title,
  subtitle,
}: {
  to?: string;
  onClick?: () => void;
  tone: "teal" | "amber" | "leaf";
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
    // Apple leder till handling, bark ar struktur, lov ar framsteg.
  const accent = tone === "teal" ? "#7a5236" : tone === "leaf" ? "#2f6b3c" : "#ae2f26";
  const className =
    "group flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-left backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/[0.04]";

  const body = (
    <>
      <span
        className="flex h-10 w-10 items-center justify-center rounded-xl border"
        style={{
          borderColor: `${accent}33`,
          background: `${accent}1a`,
          color: accent,
        }}
      >
        {icon}
      </span>
      <h3
        className="mt-3 text-[18px] font-bold leading-tight text-[var(--cream)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h3>
      <p className="mt-1 flex-1 text-[13px] leading-relaxed text-white/50">{subtitle}</p>
      <span
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold"
        style={{ color: accent }}
      >
        Öppna
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        params={{} as any}
        className={className}
      >
        {body}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {body}
    </button>
  );
}
