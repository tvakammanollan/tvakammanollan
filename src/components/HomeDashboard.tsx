import { useState, useRef } from "react";
import { motion, useScroll, useTransform, useInView, useReducedMotion } from "framer-motion";
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
import {
  GraduationCap,
  Sigma,
  Trophy,
  Sparkles,
  Zap,
  BookOpen,
  Users,
  BarChart3,
  Flame,
  ArrowRight,
  ScrollText,
} from "lucide-react";
import { AmberMouseShadow, SplitText, TiltLayer } from "@/components/landing/MotionFX";

/* =====================================================================
   HOME DASHBOARD — "Northern Light Console"
   Scroll-driven, alive, premium. Sidebar nav + animated action grid.
   ===================================================================== */

export function HomeDashboard() {
  const { user, profile } = useAuth();
  const [matchOpen, setMatchOpen] = useState(false);
  const [matchType, setMatchType] = useState<MatchType>("verbal");
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [coachingOpen, setCoachingOpen] = useState(false);

  if (!user || !profile) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12" aria-busy="true">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <div className="skeleton-shimmer hidden h-[400px] rounded-3xl lg:block" />
          <div className="space-y-6">
            <div className="skeleton-shimmer h-48 rounded-3xl" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="skeleton-shimmer h-56 rounded-3xl" />
              <div className="skeleton-shimmer h-56 rounded-3xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const winRate =
    profile.games_played > 0 ? Math.round((profile.wins / profile.games_played) * 100) : 0;

  const openMatch = (t: MatchType) => {
    setMatchType(t);
    setMatchOpen(true);
  };

  const isGuest = !!user.is_anonymous;

  return (
    <div className="relative">
      <ResumeMatchBanner />

      {isGuest && <GuestBanner />}

      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 lg:px-6">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <Sidebar
            profile={profile}
            isGuest={isGuest}
            winRate={winRate}
            onMatch={openMatch}
            onCoaching={() => setCoachingOpen(true)}
          />

          {/* Main content */}
          <main className="space-y-6">
            <HeroPanel profile={profile} isGuest={isGuest} />
            <ActionGrid onMatch={openMatch} onCoaching={() => setCoachingOpen(true)} />
            <BattleSection profile={profile} onMatch={openMatch} />
            <ChartPanel userId={user.id} />
          </main>
        </div>
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
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden border-b border-amber-200/40 bg-gradient-to-r from-amber-50 via-orange-50 to-fuchsia-50 px-4 py-3"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-sm">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-fuchsia-500 text-white shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <span className="text-[#050507]">
            Du spelar som <strong>gäst</strong>. Skapa konto för att spara ELO.
          </span>
        </div>
        <Link
          to="/signup"
          className="btn-shine group inline-flex items-center gap-1.5 rounded-full bg-[#050507] px-4 py-1.5 text-xs font-semibold text-white shadow-md hover:shadow-lg"
        >
          Skapa konto
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </motion.div>
  );
}

/* =================== SIDEBAR =================== */
function Sidebar({
  profile,
  isGuest,
  winRate,
  onMatch,
  onCoaching,
}: {
  profile: ReturnType<typeof useAuth>["profile"] & {};
  isGuest: boolean;
  winRate: number;
  onMatch: (t: MatchType) => void;
  onCoaching: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const stickyY = useTransform(scrollY, [0, 200], [0, -10]);

  if (!profile) return null;

  return (
    <motion.aside
      ref={ref}
      className="lg:sticky lg:top-[80px] lg:self-start"
      style={{ y: reduce ? 0 : stickyY }}
    >
      {/* Profile card */}
      <motion.div
        initial={{ opacity: 0, x: -20, filter: "blur(8px)" }}
        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl border border-black/8 bg-gradient-to-br from-white to-neutral-50 p-6 shadow-[var(--shadow-md)]"
      >
        {/* Decorative aurora */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full opacity-50 blur-3xl"
          style={{
            background: "radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)",
          }}
        />

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="relative">
              <UserAvatar name={profile.username} size={56} />
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-amber-400 to-orange-500 shadow-md">
                <Trophy className="h-2.5 w-2.5 text-white" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="eyebrow">Spelare</p>
              <div
                className="truncate text-[19px] font-bold leading-tight text-[#050507]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {isGuest ? "Gäst" : profile.username}
              </div>
            </div>
          </div>

          {/* Streak */}
          {!isGuest && (profile.current_streak ?? 0) > 0 && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 px-3 py-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-semibold text-orange-700 tabular-nums">
                {profile.current_streak} dagar streak
              </span>
            </div>
          )}

          {/* Mini stats */}
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <MiniStat label="Matcher" value={profile.games_played} />
            <MiniStat label="Vinster" value={profile.wins} accent="indigo" />
            <MiniStat label="Förluster" value={profile.losses} />
            <MiniStat label="Win %" value={`${winRate}%`} accent="amber" />
          </div>

          {/* HP score */}
          <div className="mt-5 border-t border-black/5 pt-5">
            <p className="eyebrow mb-2">Trolig HP-poäng</p>
            <HpScoreWidget eloVerbal={profile.elo_verbal} eloMath={profile.elo_math} size="full" />
          </div>

          {/* Countdown — diskret rad längst ner */}
          <div className="mt-4 border-t border-black/5 pt-4">
            <HpCountdown size="inline" />
          </div>
        </div>
      </motion.div>

      {/* Quick nav */}
      <motion.nav
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="mt-4 space-y-1 rounded-3xl border border-black/8 bg-white p-3 shadow-[var(--shadow-card)]"
      >
        <SideAction
          icon={<Zap className="h-4 w-4" />}
          label="Snabbmatch"
          accent="indigo"
          onClick={() => onMatch("verbal")}
        />
        <SideAction
          icon={<BookOpen className="h-4 w-4" />}
          label="Öva ord"
          to="/ord"
          accent="cyan"
        />
        <SideAction
          icon={<GraduationCap className="h-4 w-4" />}
          label="Träna utan tid"
          to="/train"
          accent="emerald"
        />
        <SideAction
          icon={<ScrollText className="h-4 w-4" />}
          label="Gamla prov"
          to="/gamla-prov"
          accent="violet"
        />
        <SideAction
          icon={<Trophy className="h-4 w-4" />}
          label="Topplista"
          to="/leaderboard"
          accent="amber"
        />
        <SideAction
          icon={<Users className="h-4 w-4" />}
          label="Vänner"
          to="/friends"
          accent="fuchsia"
        />
        <SideAction
          icon={<BarChart3 className="h-4 w-4" />}
          label="Statistik"
          to="/stats"
          accent="violet"
        />
        <div className="border-t border-black/5 pt-1 mt-1">
          <SideAction
            icon={<Sparkles className="h-4 w-4" />}
            label="Gratis coachning"
            accent="aurora"
            onClick={onCoaching}
            highlight
          />
        </div>
      </motion.nav>
    </motion.aside>
  );
}

function MiniStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: "indigo" | "amber";
}) {
  const color =
    accent === "indigo"
      ? "text-indigo-600"
      : accent === "amber"
        ? "text-amber-600"
        : "text-[#050507]";
  return (
    <div className="rounded-xl border border-black/5 bg-neutral-50/50 px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
        {label}
      </div>
      <div
        className={`mt-0.5 text-[18px] font-bold leading-none tabular-nums ${color}`}
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </div>
    </div>
  );
}

function SideAction({
  icon,
  label,
  to,
  onClick,
  accent,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  to?: string;
  onClick?: () => void;
  accent: "indigo" | "cyan" | "emerald" | "amber" | "fuchsia" | "violet" | "aurora";
  highlight?: boolean;
}) {
  const accents: Record<string, string> = {
    indigo: "from-indigo-100 to-indigo-50 text-indigo-700",
    cyan: "from-cyan-100 to-cyan-50 text-cyan-700",
    emerald: "from-emerald-100 to-emerald-50 text-emerald-700",
    amber: "from-amber-100 to-amber-50 text-amber-700",
    fuchsia: "from-fuchsia-100 to-fuchsia-50 text-fuchsia-700",
    violet: "from-violet-100 to-violet-50 text-violet-700",
    aurora: "from-fuchsia-100 via-amber-50 to-cyan-50 text-fuchsia-700",
  };

  const inner = (
    <span className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-[#050507] transition-all duration-200 group-hover:bg-neutral-50 group-hover:translate-x-0.5">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accents[accent]} ${
          highlight ? "shadow-[var(--shadow-glow-aurora)]" : ""
        }`}
      >
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      <ArrowRight className="h-3.5 w-3.5 text-neutral-300 transition-all group-hover:text-[#050507] group-hover:translate-x-0.5" />
    </span>
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

/* =================== HERO PANEL =================== */
function HeroPanel({
  profile,
  isGuest,
}: {
  profile: ReturnType<typeof useAuth>["profile"];
  isGuest: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [40, -40]);

  if (!profile) return null;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 6) return "God natt";
    if (h < 10) return "God morgon";
    if (h < 18) return "Hej";
    return "God kväll";
  })();

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-black/8 bg-mesh text-white shadow-[var(--shadow-lg)]"
      style={{ minHeight: 220 }}
    >
      {/* Animated mesh background */}
      <div aria-hidden className="absolute inset-0 animate-mesh bg-mesh" />

      {/* Mouse-driven amber glow */}
      <AmberMouseShadow size={520} />

      {/* Floating orb */}
      <motion.div
        aria-hidden
        className="orb orb-fuchsia"
        style={{
          top: "-20%",
          right: "-10%",
          width: 320,
          height: 320,
          y: reduce ? 0 : y,
        }}
      />

      <div aria-hidden className="absolute inset-0 bg-grid-ink opacity-30" />

      {/* Content */}
      <div className="relative p-7 sm:p-9">
        <p className="eyebrow text-fuchsia-300">{greeting}</p>
        <h1
          className="display mt-2 text-[36px] leading-[0.98] sm:text-[52px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <SplitText as="span">Välkommen,</SplitText>{" "}
          <span className="text-aurora-gradient italic">
            <SplitText as="span" delay={0.2} italic>
              {isGuest ? "gäst" : profile.username}
            </SplitText>
          </span>
          <SplitText as="span" delay={0.35}>
            .
          </SplitText>
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mt-3 max-w-md text-[15px] text-white/65"
        >
          Vad vill du erövra idag? Tävla mot någon, träna i lugn takt eller öva ord — välj från
          sidopanelen eller korten nedan.
        </motion.p>

        {/* ELO mini-display */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 flex flex-wrap items-center gap-3"
        >
          <RankPill label="Verbal" elo={profile.elo_verbal} />
          <RankPill label="Matte" elo={profile.elo_math} />
        </motion.div>
      </div>
    </motion.section>
  );
}

function RankPill({ label, elo }: { label: string; elo: number }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 backdrop-blur-sm">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
        {label}
      </span>
      <RankBadge elo={elo} size="sm" showName />
    </div>
  );
}

/* =================== ACTION GRID =================== */
function ActionGrid({
  onMatch,
  onCoaching,
}: {
  onMatch: (t: MatchType) => void;
  onCoaching: () => void;
}) {
  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.08 } },
      }}
      className="grid gap-4 sm:grid-cols-2"
    >
      <ActionCard
        icon={<Sparkles className="h-6 w-6" />}
        title="Gratis coachning"
        subtitle="30 min med en 1.9+-spelare"
        gradient="from-fuchsia-500 via-amber-500 to-orange-500"
        onClick={onCoaching}
        badge="Helt gratis"
      />
      <ActionCard
        icon={<BookOpen className="h-6 w-6" />}
        title="Öva ord — solo"
        subtitle="8 000+ riktiga HP-frågor"
        gradient="from-cyan-500 via-indigo-500 to-violet-600"
        to="/ord"
        badge="8 000+ ord"
      />
      <ActionCard
        icon={<ScrollText className="h-6 w-6" />}
        title="Gamla prov"
        subtitle="36 kompletta provpass"
        gradient="from-violet-500 via-purple-500 to-indigo-600"
        to="/gamla-prov"
        badge="36 provpass"
      />
    </motion.section>
  );
}

function ActionCard({
  icon,
  title,
  subtitle,
  gradient,
  to,
  onClick,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  gradient: string;
  to?: string;
  onClick?: () => void;
  badge?: string;
}) {
  const inner = (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
        show: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      whileHover={{ y: -6, transition: { duration: 0.3 } }}
      className="group relative h-full overflow-hidden rounded-3xl border border-black/8 bg-white p-6 shadow-[var(--shadow-card)] transition-shadow duration-500 hover:shadow-[var(--shadow-xl)]"
    >
      {/* Gradient halo */}
      <div
        aria-hidden
        className={`absolute -right-12 -top-12 h-48 w-48 bg-gradient-to-br ${gradient} opacity-20 blur-3xl transition-opacity duration-500 group-hover:opacity-40`}
      />

      <div className="relative flex items-start gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-md transition-transform group-hover:rotate-3 group-hover:scale-110`}
        >
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3
              className="text-[22px] font-bold leading-tight text-[#050507]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {title}
            </h3>
            {badge && (
              <span
                className={`shrink-0 rounded-full bg-gradient-to-r ${gradient} px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm`}
              >
                {badge}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[14px] leading-relaxed text-neutral-500">{subtitle}</p>
        </div>
      </div>

      <div className="relative mt-5 flex items-center gap-1.5 text-sm font-semibold text-indigo-600">
        Starta
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </motion.div>
  );
  if (to) {
    return (
      <Link
        to={to}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        params={{} as any}
        className="block"
      >
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className="block w-full text-left">
      {inner}
    </button>
  );
}

/* =================== BATTLE SECTION =================== */
function BattleSection({
  profile,
  onMatch,
}: {
  profile: ReturnType<typeof useAuth>["profile"];
  onMatch: (t: MatchType) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  if (!profile) return null;

  return (
    <section ref={ref}>
      {/* Section title */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-4 flex items-end justify-between"
      >
        <div>
          <p className="eyebrow">Live PvP</p>
          <h2
            className="display text-[28px] font-bold leading-tight text-[#050507] sm:text-[32px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <SplitText as="span">Hoppa in i en</SplitText>{" "}
            <span className="text-aurora-gradient italic">
              <SplitText as="span" delay={0.18} italic>
                battle
              </SplitText>
            </span>
          </h2>
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TiltLayer max={6}>
          <BattleCard
            title="Verbala Battles"
            subtitle="Ord · Mek"
            elo={profile.elo_verbal}
            icon={<GraduationCap className="h-7 w-7" />}
            onStart={() => onMatch("verbal")}
            variant="indigo"
            delay={0}
          />
        </TiltLayer>
        <TiltLayer max={6}>
          <BattleCard
            title="Matte Battles"
            subtitle="Xyz · Kva · Nog"
            elo={profile.elo_math}
            icon={<Sigma className="h-7 w-7" />}
            onStart={() => onMatch("math")}
            variant="dark"
            delay={0.1}
          />
        </TiltLayer>
      </div>
    </section>
  );
}

function BattleCard({
  title,
  subtitle,
  elo,
  icon,
  onStart,
  variant,
  delay,
}: {
  title: string;
  subtitle: string;
  elo: number;
  icon: React.ReactNode;
  onStart: () => void;
  variant: "indigo" | "dark";
  delay: number;
}) {
  const isDark = variant === "dark";
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      onClick={onStart}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onStart();
        }
      }}
      className={`group relative flex min-h-[300px] cursor-pointer flex-col overflow-hidden rounded-3xl border p-7 transition-all duration-500 hover:shadow-[var(--shadow-xl)] ${
        isDark
          ? "border-black/40 text-white shadow-[var(--shadow-lg)]"
          : "border-black/8 bg-gradient-to-br from-white to-indigo-50/30 shadow-[var(--shadow-md)]"
      }`}
      style={{
        backgroundImage: isDark
          ? "radial-gradient(ellipse 60% 40% at 20% 10%, rgba(99, 102, 241, 0.40), transparent 60%), radial-gradient(ellipse 50% 35% at 90% 90%, rgba(217, 70, 239, 0.30), transparent 60%), linear-gradient(135deg, #050507 0%, #0a0a14 100%)"
          : undefined,
      }}
    >
      {/* Pattern overlay */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 opacity-30 ${
          isDark ? "bg-grid-ink" : "bg-dots"
        }`}
      />

      <div className="relative flex items-start justify-between">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 group-hover:rotate-3 ${
            isDark
              ? "bg-gradient-to-br from-fuchsia-500/30 to-indigo-500/20 text-fuchsia-200"
              : "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md"
          }`}
        >
          {icon}
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
            isDark ? "bg-fuchsia-400/10 text-fuchsia-300" : "bg-indigo-100 text-indigo-700"
          }`}
        >
          {isDark ? "Avancerad" : "Klassiker"}
        </span>
      </div>

      <h3
        className="relative mt-6 text-[28px] font-bold leading-tight"
        style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.025em" }}
      >
        {title}
      </h3>
      <p
        className={`relative mt-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${
          isDark ? "text-white/55" : "text-neutral-500"
        }`}
      >
        {subtitle}
      </p>

      <div className="relative mt-auto pt-6">
        <div
          className={`mb-4 flex items-baseline justify-between gap-3 border-t pt-4 ${
            isDark ? "border-white/10" : "border-black/5"
          }`}
        >
          <span
            className={`text-[10px] font-bold uppercase tracking-[0.18em] ${
              isDark ? "text-white/55" : "text-neutral-500"
            }`}
          >
            Din ELO
          </span>
          <span
            className={`text-[28px] font-bold leading-none tabular-nums ${
              isDark ? "text-aurora-gradient" : "text-indigo-600"
            }`}
            style={{ fontFamily: "var(--font-display)" }}
          >
            {elo}
          </span>
        </div>
        <div
          className={`btn-shine inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full px-6 py-3 font-semibold transition-all ${
            isDark
              ? "bg-white text-[#050507] hover:bg-white/95"
              : "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md hover:shadow-[var(--shadow-glow-indigo)]"
          }`}
        >
          Starta battle
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </motion.div>
  );
}

/* =================== CHART PANEL =================== */
function ChartPanel({ userId }: { userId: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-3xl border border-black/8 bg-white p-7 shadow-[var(--shadow-card)]"
    >
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="eyebrow">Din kurva</p>
          <h2
            className="display text-[24px] font-bold leading-tight text-[#050507] sm:text-[28px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            ELO-progression
          </h2>
          <p className="mt-1 text-[13px] text-neutral-500">
            Senaste 20 matcherna · uppdateras live
          </p>
        </div>
      </div>
      <EloChart userId={userId} />
    </motion.section>
  );
}
