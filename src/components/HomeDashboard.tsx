import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { UserAvatar } from "@/components/UserAvatar";
import { EloChart } from "@/components/EloChart";
import { Button } from "@/components/ui/button";
import { MatchmakerModal, type MatchType } from "@/components/MatchmakerModal";
import { RankBadge } from "@/components/ui/RankBadge";
import { HpScoreWidget } from "@/components/ui/HpScoreWidget";
import { StreakWidget } from "@/components/ui/StreakWidget";
import { OnboardingModal } from "@/components/ui/OnboardingModal";
import { ResumeMatchBanner } from "@/components/ui/ResumeMatchBanner";
import { CoachingModal } from "@/components/CoachingModal";
import { getNextRank } from "@/types";
import { GraduationCap, Sigma, Trophy, Sparkles } from "lucide-react";
import { FadeUp } from "@/components/motion/Reveal";

export function HomeDashboard() {
  const { user, profile } = useAuth();
  const [matchOpen, setMatchOpen] = useState(false);
  const [matchType, setMatchType] = useState<MatchType>("verbal");
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [coachingOpen, setCoachingOpen] = useState(false);

  if (!user || !profile) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12" aria-busy="true">
        <div className="skeleton-shimmer h-48 rounded-2xl" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="skeleton-shimmer h-72 rounded-2xl" />
          <div className="skeleton-shimmer h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  const winRate =
    profile.games_played > 0
      ? Math.round((profile.wins / profile.games_played) * 100)
      : 0;

  const openMatch = (t: MatchType) => {
    setMatchType(t);
    setMatchOpen(true);
  };

  const isGuest = !!user.is_anonymous;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <ResumeMatchBanner />
      {isGuest && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-5 flex flex-col items-start gap-3 rounded-2xl border border-[#d4a017]/40 bg-gradient-to-r from-[#fdf3d0] to-[#fae6a0] px-5 py-4 text-sm shadow-[var(--shadow-glow-gold)] sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="flex items-center gap-2.5 text-[#0d1f17]">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a017] to-[#8a6c0e] text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <span>
              Du spelar som <strong className="font-bold">gäst</strong>. Skapa
              konto för att spara din ELO och dyka upp på topplistan.
            </span>
          </span>
          <Button asChild size="sm" className="shrink-0 bg-[#1a5c3a] hover:bg-[#0f4029]">
            <a href="/signup">Skapa konto →</a>
          </Button>
        </motion.div>
      )}

      {/* Stat panel */}
      <motion.section
        initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl border border-[#e6e0d2] bg-gradient-to-br from-white to-[#fbfaf6] p-5 shadow-[var(--shadow-md)] sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 40% 30% at 100% 0%, rgba(26,92,58,0.06), transparent 70%), radial-gradient(ellipse 30% 25% at 0% 100%, rgba(212,160,23,0.05), transparent 70%)",
          }}
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <UserAvatar name={profile.username} size={68} />
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-[#d4a017] to-[#8a6c0e] shadow-md">
                <svg viewBox="0 0 24 24" className="h-3 w-3 fill-white">
                  <path d="M12 2l1.8 5.5H19l-4.6 3.4 1.8 5.6L12 13l-4.2 3.5 1.8-5.6L5 7.5h5.2z" />
                </svg>
              </span>
            </div>
            <div>
              <p className="eyebrow text-[#1a5c3a]">Din profil</p>
              <h1
                className="mt-1 text-[28px] font-semibold leading-tight text-[#0d1f17] sm:text-[34px]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {isGuest ? "Gäst" : profile.username}
              </h1>
              {!isGuest && (
                <StreakWidget
                  currentStreak={profile.current_streak ?? 0}
                  longestStreak={profile.longest_streak ?? 0}
                  onStartClick={() => openMatch("verbal")}
                  className="mt-1"
                />
              )}
              <div className="mt-2 flex flex-col gap-2">
                <RankPanel label="Verbal" elo={profile.elo_verbal} />
                <RankPanel label="Matte" elo={profile.elo_math} />
                <div className="mt-1 flex items-center gap-2 pl-16">
                  <HpScoreWidget
                    eloVerbal={profile.elo_verbal}
                    eloMath={profile.elo_math}
                    size="compact"
                  />
                  <span className="text-[11px] text-muted-foreground">
                    Uppskattning baserad på ELO
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatChip label="Matcher" value={profile.games_played} />
            <StatChip label="Vinster" value={profile.wins} accent="primary" />
            <StatChip label="Förluster" value={profile.losses} />
            <StatChip label="Win rate" value={`${winRate}%`} accent="gold" />
          </div>
        </div>

        <div className="mt-7">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground/80">
              ELO-progression · senaste 20 matcherna
            </h2>
          </div>
          <EloChart userId={user.id} />
        </div>
      </motion.section>

      {/* === USPs först: coaching + öva ord — högsta värdet === */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.1 }}
        className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2">
        {/* Gratis coachning — featured */}
        <button
          type="button"
          onClick={() => setCoachingOpen(true)}
          className="group relative flex w-full items-stretch justify-between gap-3 overflow-hidden rounded-3xl border border-[#d4a017]/40 bg-gradient-to-br from-[#fdf3d0] via-[#fae6a0] to-[#fdf3d0] p-6 text-left shadow-[var(--shadow-glow-gold)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-xl)] sm:p-7"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 50% 40% at 100% 0%, rgba(212,160,23,0.30), transparent 70%)",
            }}
          />
          <div className="relative flex flex-1 flex-col">
            <div className="flex items-center gap-2.5">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d4a017] to-[#8a6c0e] text-white shadow-md transition-transform group-hover:rotate-6 group-hover:scale-110">
                <Sparkles className="h-5 w-5" />
              </span>
              <span className="rounded-full bg-[#1a5c3a] px-2.5 py-1 text-[10px] font-bold tracking-wide text-white">
                Helt gratis
              </span>
            </div>
            <h3
              className="mt-4 text-[24px] font-bold leading-tight text-[#0d1f17] sm:text-[28px]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Gratis coachning
            </h3>
            <p className="mt-1.5 text-[14px] leading-relaxed text-[#5b4a17]">
              Boka 30 min med en expert som fått{" "}
              <span className="font-bold">1.9+ på HP</span>
            </p>
            <div className="mt-auto pt-5">
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1a5c3a]">
                Boka tid
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </div>
          </div>
        </button>

        {/* Öva ord solo — featured */}
        <a
          href="/ord"
          className="group relative flex w-full items-stretch justify-between gap-3 overflow-hidden rounded-3xl border border-[#1a5c3a]/30 bg-gradient-to-br from-[#e8f2ec] via-[#d4e8db] to-[#e8f2ec] p-6 text-left shadow-[var(--shadow-glow-green)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-xl)] sm:p-7"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 50% 40% at 100% 0%, rgba(26,92,58,0.20), transparent 70%)",
            }}
          />
          <div className="relative flex flex-1 flex-col">
            <div className="flex items-center gap-2.5">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1a5c3a] to-[#0f4029] text-white shadow-md transition-transform group-hover:rotate-6 group-hover:scale-110">
                <GraduationCap className="h-5 w-5" />
              </span>
              <span className="rounded-full bg-[#d4a017] px-2.5 py-1 text-[10px] font-bold tracking-wide text-white">
                8 000+ ord
              </span>
            </div>
            <h3
              className="mt-4 text-[24px] font-bold leading-tight text-[#0d1f17] sm:text-[28px]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Öva ord — solo
            </h3>
            <p className="mt-1.5 text-[14px] leading-relaxed text-[#3f5547]">
              Riktiga ORD-frågor från tidigare HP, helt själv i lugn takt
            </p>
            <div className="mt-auto pt-5">
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1a5c3a]">
                Starta övning
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </div>
          </div>
        </a>
      </motion.section>

      {/* Ornamental divider */}
      <div className="my-8 flex items-center gap-4">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#c8c0b4] to-transparent" />
        <span className="eyebrow text-[#8a8275]">Eller utmana någon</span>
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#c8c0b4] to-transparent" />
      </div>

      {/* === Battle cards (live PvP) === */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="grid gap-4 sm:grid-cols-2"
      >
        <BattleCard
          title="Verbala Battles"
          subtitle="Ord · Mek"
          elo={profile.elo_verbal}
          icon={<GraduationCap className="h-6 w-6" />}
          onStart={() => openMatch("verbal")}
          variant="primary"
        />
        <BattleCard
          title="Matte Battles"
          subtitle="Xyz · Kva · Nog"
          elo={profile.elo_math}
          icon={<Sigma className="h-6 w-6" />}
          onStart={() => openMatch("math")}
          variant="dark"
        />
      </motion.section>

      {/* Train mode (no time pressure) */}
      <section className="mt-6">
        <a
          href="/train"
          className="group flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#1a5c3a] bg-transparent px-5 py-3 text-base font-semibold text-[#1a5c3a] transition hover:bg-[#e8f2ec]"
        >
          <span>📖 Träna utan tidsbegränsning</span>
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </a>
        <p className="mt-1.5 text-center text-xs text-muted-foreground">
          Välj delprov, svårighetsgrad och antal frågor
        </p>
      </section>

      {/* Old solo word practice — kept for backward compat but hidden since featured above */}
      <section className="mt-4 hidden">
        <a
          href="/ord"
          className="group flex items-center justify-between rounded-2xl border border-border bg-white px-5 py-4 shadow-card transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f2ec] text-[#1a5c3a]">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-semibold">Öva ord (solo)</div>
              <div className="text-xs text-muted-foreground">
                8000+ riktiga ORD-frågor från tidigare HP · helt själv, ingen motståndare
              </div>
            </div>
          </div>
          <span className="text-sm text-primary group-hover:translate-x-0.5 transition-transform">→</span>
        </a>
      </section>

      <MatchmakerModal
        open={matchOpen}
        onOpenChange={setMatchOpen}
        matchType={matchType}
      />

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

function StatChip({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: "primary" | "gold";
}) {
  const valueColor =
    accent === "primary"
      ? "text-[#1a5c3a]"
      : accent === "gold"
      ? "text-[#8a6c0e]"
      : "text-[#0d1f17]";
  const accentBar =
    accent === "primary"
      ? "from-[#1a5c3a] to-[#34a06a]"
      : accent === "gold"
      ? "from-[#d4a017] to-[#fae6a0]"
      : "from-[#c8c0b4] to-[#e6e0d2]";
  return (
    <div
      className="relative overflow-hidden rounded-xl border border-[#e6e0d2] bg-white px-3.5 py-3"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <span
        aria-hidden
        className={`absolute left-0 top-0 h-full w-1 bg-gradient-to-b ${accentBar}`}
      />
      <div className="text-[10px] font-bold tracking-wide text-[#8a8275]">
        {label}
      </div>
      <div
        className={`mt-0.5 text-[22px] font-bold leading-tight tabular-nums ${valueColor}`}
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </div>
    </div>
  );
}

function BattleCard({
  title,
  subtitle,
  elo,
  icon,
  onStart,
  variant,
}: {
  title: string;
  subtitle: string;
  elo: number;
  icon: React.ReactNode;
  onStart: () => void;
  variant: "primary" | "dark";
}) {
  const isDark = variant === "dark";
  return (
    <div
      onClick={onStart}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onStart();
        }
      }}
      className={`group relative flex min-h-[280px] cursor-pointer flex-col overflow-hidden rounded-3xl border p-6 transition-all duration-300 ease-out hover:-translate-y-1.5 sm:min-h-[300px] sm:p-7 ${
        isDark
          ? "border-[#0d1f17] text-white"
          : "border-[#e6e0d2] bg-gradient-to-br from-white to-[#fbfaf6]"
      }`}
      style={{
        boxShadow: "var(--shadow-md)",
        backgroundImage: isDark
          ? "radial-gradient(ellipse 60% 40% at 20% 10%, rgba(52, 160, 106, 0.18), transparent 60%), radial-gradient(ellipse 50% 35% at 90% 90%, rgba(212, 160, 23, 0.14), transparent 60%), linear-gradient(135deg, #0d1f17 0%, #0a1810 100%)"
          : undefined,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "var(--shadow-xl)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "var(--shadow-md)")}
    >
      {/* Pattern overlay */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 opacity-60 ${isDark ? "bg-grid-ink" : "bg-dots"}`}
      />

      <div className="relative flex items-start justify-between">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 group-hover:rotate-3 ${
            isDark
              ? "bg-gradient-to-br from-[#d4a017]/25 to-[#d4a017]/10 text-[#d4a017]"
              : "bg-gradient-to-br from-[#e8f2ec] to-[#d4e8db] text-[#1a5c3a]"
          }`}
        >
          {icon}
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide ${
            isDark
              ? "bg-white/10 text-[#d4a017]"
              : "bg-[#1a5c3a]/8 text-[#1a5c3a]"
          }`}
        >
          {isDark ? "Avancerad" : "Klassiker"}
        </span>
      </div>

      <h3
        className="relative mt-5 text-[28px] font-bold leading-tight"
        style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
      >
        {title}
      </h3>
      <p
        className={`relative mt-1.5 text-[10px] font-semibold tracking-wide ${
          isDark ? "text-white/55" : "text-[#8a8275]"
        }`}
      >
        {subtitle}
      </p>

      <div className="relative mt-auto pt-6">
        <div
          className={`mb-4 flex items-baseline justify-between gap-3 border-t pt-4 ${
            isDark ? "border-white/10" : "border-[#e6e0d2]"
          }`}
        >
          <div
            className={`text-[10px] font-bold tracking-wide ${
              isDark ? "text-white/55" : "text-[#8a8275]"
            }`}
          >
            Din ELO
          </div>
          <div
            className={`text-[28px] font-bold leading-none tabular-nums ${
              isDark ? "text-gold-gradient" : "text-[#8a6c0e]"
            }`}
            style={{
              fontFamily: "var(--font-display)",
              backgroundSize: "200% 200%",
            }}
          >
            {elo}
          </div>
        </div>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onStart();
          }}
          className={`btn-shine w-full overflow-hidden font-semibold ${
            isDark
              ? "bg-gradient-to-r from-[#d4a017] to-[#c49a0e] text-[#0d1f17] hover:from-[#c49a0e] hover:to-[#a8830a]"
              : "bg-[#1a5c3a] text-white hover:bg-[#0f4029]"
          }`}
        >
          Starta Battle →
        </Button>
      </div>
    </div>
  );
}

function RankPanel({ label, elo }: { label: string; elo: number }) {
  const next = getNextRank(elo);
  const eloToNext = next ? next.minElo - elo : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-[11px] tracking-wide text-muted-foreground w-14">
          {label}
        </span>
        <RankBadge elo={elo} size="md" showName={true} showProgress={true} />
      </div>
      <span className="text-[11px] text-muted-foreground pl-16">
        {next ? `Nästa rank om ${eloToNext} ELO` : "Max rank uppnådd ✦"}
      </span>
    </div>
  );
}
