import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, useScroll, useTransform, useReducedMotion, useInView, AnimatePresence } from "framer-motion";
import {
  Loader2,
  ArrowRight,
  Zap,
  Trophy,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Brain,
  Swords,
  Target,
  CalendarDays,
} from "lucide-react";
import { getNextHpDate } from "@/lib/hp-dates";
import { getBotName } from "@/lib/bot";
import { getLandingStats, type LandingStats } from "@/lib/landing.functions";
import { useGuestPlay } from "@/hooks/useGuestPlay";
import {
  SplitText,
  VelocitySkew,
  VelocityMarquee,
  StickyNumber,
  FlipCard,
  ClipReveal,
  Parallax,
  TiltLayer,
  AmberMouseShadow,
} from "@/components/landing/MotionFX";

const TESTIMONIALS = [
  {
    quote:
      "Det är ett gott tecken när det känns roligt och engagerande att plugga inför högskoleprovet. Det är en ny känsla.",
    name: "Aron",
    score: "2.0",
    founder: false,
  },
  {
    quote: "HP Kampen har allt som behövs för att lyckas på högskoleprovet.",
    name: "Gustav",
    score: "1.9",
    founder: false,
  },
];

/* ====================================================================
   HERO LANDING — "Aurora Dream"
   Lerp-smooth scroll. Velocity-driven motion. Cluely energy meets Apple
   precision meets a film camera you can feel.
   ==================================================================== */

export function HeroLanding() {
  const fetchStats = useServerFn(getLandingStats);
  const [stats, setStats] = useState<LandingStats | null>(null);
  const { play: playAsGuest, loading: guestLoading } = useGuestPlay();
  const reduce = useReducedMotion();

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch(() => setStats(null));
  }, [fetchStats]);

  return (
    <div className="relative overflow-hidden">
      <Hero stats={stats} guestLoading={guestLoading} onGuest={playAsGuest} />

      <Ribbon />

      <TestimonialsSection />

      <Features />

      <Stages />

      <HowItWorks />

      <RecentMatches stats={stats} />

      <ProofSection stats={stats} />

      <FinalCTA />
    </div>
  );
}

/* ============================================================ */
/* ===  HERO                                                 === */
/* ============================================================ */

function Hero({
  stats,
  guestLoading,
  onGuest,
}: {
  stats: LandingStats | null;
  guestLoading: boolean;
  onGuest: () => void;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -160]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);

  return (
    <section ref={ref} className="relative min-h-screen overflow-hidden bg-mesh text-white">
      {/* Mesh-flow animated bg */}
      <div aria-hidden className="absolute inset-0 animate-mesh bg-mesh opacity-90" />

      {/* Mouse-driven amber radial */}
      <AmberMouseShadow size={700} />

      {/* Floating orbs (parallax handled via the absolute layer below) */}
      <Parallax speed={-0.12} className="pointer-events-none absolute inset-0">
        <motion.div
          className="orb orb-indigo"
          style={{ top: "10%", left: "10%", width: 500, height: 500 }}
          animate={reduce ? undefined : { x: [0, 80, -50, 0], y: [0, -50, 40, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="orb orb-fuchsia"
          style={{ top: "5%", right: "5%", width: 460, height: 460 }}
          animate={reduce ? undefined : { x: [0, -70, 50, 0], y: [0, 40, -60, 0] }}
          transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="orb orb-cyan"
          style={{ top: "50%", left: "45%", width: 380, height: 380 }}
          animate={reduce ? undefined : { x: [0, -90, 70, 0], y: [0, 60, -40, 0] }}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
        />
      </Parallax>

      {/* Subtle grid overlay */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid-ink opacity-30" />

      {/* Content */}
      <motion.div
        className="relative z-10 mx-auto flex min-h-screen max-w-[1100px] flex-col items-center justify-center px-6 py-24 text-center"
        style={{
          y: reduce ? 0 : heroY,
          opacity: reduce ? 1 : heroOpacity,
          scale: reduce ? 1 : heroScale,
        }}
      >
        {/* Status pills — live + diskret countdown */}
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 inline-flex flex-wrap items-center justify-center gap-2"
        >
          <span className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
            </span>
            <span className="text-[12px] font-medium tracking-wide text-white/80">
              Realtidsmatcher · Live
            </span>
          </span>
          <HeroCountdownChip />
        </motion.div>

        {/* Title — tilts on mouse, every word splits */}
        <TiltLayer max={8} className="will-change-transform">
          <h1 className="display text-balance text-[56px] font-bold leading-[0.96] text-white sm:text-[96px] md:text-[120px] lg:text-[144px]">
            <SplitText as="span" className="block" delay={0.1}>
              Tävla.
            </SplitText>
            <span className="text-aurora-gradient block">
              <SplitText as="span" delay={0.35} italic>
                Klättra.
              </SplitText>
            </span>
            <SplitText as="span" className="block" delay={0.6}>
              Klara HP.
            </SplitText>
          </h1>
        </TiltLayer>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 max-w-2xl text-balance text-[18px] leading-relaxed text-white/70 sm:text-[22px]"
        >
          Den enda plattformen för Högskoleprovet med
          <span className="font-semibold text-white"> live-matcher</span> och
          <span className="font-semibold text-white"> ELO-ranking</span>. Helt gratis.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 flex flex-col items-center gap-3 sm:flex-row"
        >
          <Link
            to="/signup"
            data-cursor="link"
            className="group relative inline-flex h-[58px] items-center gap-2 rounded-full bg-white px-8 text-[16px] font-semibold text-[#050507] shadow-[var(--shadow-glow-aurora)] transition-all hover:shadow-[0_0_80px_-8px_rgba(217,70,239,0.55)]"
          >
            Skapa gratis konto
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <button
            type="button"
            onClick={onGuest}
            disabled={guestLoading}
            data-cursor="link"
            className="inline-flex h-[58px] items-center gap-2 rounded-full border border-white/15 bg-white/5 px-8 text-[16px] font-medium text-white backdrop-blur-sm transition hover:bg-white/10 disabled:opacity-60"
          >
            {guestLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {guestLoading ? "Startar gästläge…" : "Spela som gäst"}
          </button>
        </motion.div>

        {/* Live counter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.4 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-white/55"
        >
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Inget kreditkort</span>
          </span>
          <span className="hidden sm:inline-flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>30 sekunder att börja</span>
          </span>
          <span className="hidden md:inline-flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Helt anonymt</span>
          </span>
        </motion.div>

        {/* Stats teaser */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.7 }}
            className="mt-20 flex items-center gap-12 text-center"
          >
            <StatTeaser value={stats.topVerbalElo} label="högsta verbal-ELO" />
            <span className="h-12 w-px bg-white/15" />
            <StatTeaser value={stats.topMathElo} label="högsta matte-ELO" />
            <span className="hidden h-12 w-px bg-white/15 sm:inline-block" />
            <StatTeaser value={8000} label="HP-ord" hidden suffix="+" />
          </motion.div>
        )}
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2 }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
      >
        <motion.div
          animate={reduce ? undefined : { y: [0, 8, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2 text-white/40"
        >
          <span className="text-[10px] font-medium tracking-[0.18em]">SCROLLA</span>
          <span className="h-8 w-px bg-gradient-to-b from-white/40 to-transparent" />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ============================================================ */
/* ===  RIBBON — velocity-driven marquee                     === */
/* ============================================================ */

function HeroCountdownChip() {
  const [now, setNow] = useState(() => new Date());
  const next = useMemo(() => getNextHpDate(now), [now]);
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  if (!next) return null;
  const diffDays = Math.max(
    0,
    Math.ceil((next.date.getTime() - now.getTime()) / 86400000),
  );
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 backdrop-blur-sm"
      style={{
        borderColor: "rgba(242, 166, 90, 0.30)",
        background: "rgba(242, 166, 90, 0.10)",
      }}
    >
      <CalendarDays
        className="h-3 w-3 shrink-0"
        style={{ color: "var(--amber)" }}
      />
      <span className="text-[12px] font-medium tracking-wide text-white/80">
        {next.label} ·{" "}
        <span className="font-bold tabular-nums" style={{ color: "var(--amber)" }}>
          {diffDays} dagar
        </span>
      </span>
    </span>
  );
}

function Ribbon() {
  const items = [
    "ORD",
    "MEK",
    "LÄS",
    "ELF",
    "XYZ",
    "KVA",
    "NOG",
    "DTK",
    "ELO-RANKING",
    "REALTIDSMATCHER",
    "8 000+ ORD",
    "GRATIS",
    "BRONS → DIAMANT",
  ];
  const rendered = items.map((it, i) => (
    <span
      key={i}
      className="display flex items-center gap-12 text-[28px] font-semibold tracking-tight text-[#050507] sm:text-[40px]"
    >
      {it}
      <span className="text-aurora-gradient">✦</span>
    </span>
  ));
  return (
    <section className="relative overflow-hidden border-y border-black/10 bg-white py-8">
      <VelocityMarquee items={rendered} baseSpeed={0.7} />
    </section>
  );
}

/* ============================================================ */
/* ===  TESTIMONIALS                                         === */
/* ============================================================ */

function TestimonialsSection() {
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState(1);

  useEffect(() => {
    const id = setInterval(() => {
      setDir(1);
      setActive((p) => (p + 1) % TESTIMONIALS.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const goTo = (i: number) => {
    setDir(i > active ? 1 : -1);
    setActive(i);
  };

  return (
    <section className="bg-white px-6 py-14">
      <div className="mx-auto max-w-5xl">
        <p className="eyebrow mb-8 text-center">Vad säger användarna?</p>

        {/* Desktop: all 3 side by side */}
        {(() => {
          const gradients = [
            "from-amber-400 via-orange-500 to-red-400",
            "from-cyan-400 via-indigo-500 to-violet-600",
            "from-indigo-400 via-violet-500 to-purple-600",
          ];
          return (
            <div className="hidden gap-5 md:grid md:grid-cols-3">
              {TESTIMONIALS.map((t, i) => (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -6, transition: { duration: 0.3 } }}
                  transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-black/5 bg-white p-7 shadow-[var(--shadow-card)] transition-shadow duration-500 hover:shadow-[var(--shadow-xl)]"
                >
                  <div
                    aria-hidden
                    className={`absolute inset-0 -z-10 bg-gradient-to-br ${gradients[i]} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-25`}
                  />
                  <p className="text-[16px] leading-relaxed text-[#0a0a0f]">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-6 flex items-center gap-3 border-t border-black/5 pt-5">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradients[i]} text-sm font-bold text-white shadow-md`}>
                      {t.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#050507]">{t.name}</p>
                      {t.founder && <p className="text-xs text-neutral-400">Grundare</p>}
                    </div>
                    <span className={`ml-auto shrink-0 rounded-full bg-gradient-to-r ${gradients[i]} px-2.5 py-0.5 text-xs font-bold text-white shadow-sm`}>
                      {t.score}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          );
        })()}

        {/* Mobile: carousel */}
        <div className="md:hidden">
          <div className="overflow-hidden rounded-2xl">
            <AnimatePresence initial={false} custom={dir} mode="wait">
              <motion.div
                key={active}
                custom={dir}
                initial={{ opacity: 0, x: dir * 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir * -60 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col justify-between rounded-[28px] border border-black/5 bg-white p-7 shadow-[var(--shadow-card)]"
              >
                <p className="text-[16px] leading-relaxed text-[#0a0a0f]">
                  &ldquo;{TESTIMONIALS[active].quote}&rdquo;
                </p>
                <div className="mt-6 flex items-center gap-3 border-t border-black/5 pt-5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-md">
                    {TESTIMONIALS[active].name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#050507]">{TESTIMONIALS[active].name}</p>
                    {TESTIMONIALS[active].founder && <p className="text-xs text-neutral-400">Grundare</p>}
                  </div>
                  <span className="ml-auto shrink-0 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                    {TESTIMONIALS[active].score}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="mt-4 flex justify-center gap-2">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Testimonial ${i + 1}`}
                className={`h-2 rounded-full transition-all ${i === active ? "w-5 bg-indigo-500" : "w-2 bg-neutral-300"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================ */
/* ===  FEATURES                                             === */
/* ============================================================ */

function Features() {
  return (
    <section className="relative bg-white px-6 py-24 sm:py-32">
      <div className="relative mx-auto max-w-6xl">
        <SectionHeader eyebrow="Funktioner" title="Tre superkrafter." highlight="En arena." />

        <VelocitySkew>
          <div className="mt-20 grid gap-6 md:grid-cols-3">
            <FlipCard delay={0} axis="y">
              <FeatureCard
                icon={<Zap className="h-7 w-7" />}
                title="Live-matcher"
                text="Utmana vänner eller okända spelare i realtid. Privata rum med delbar länk eller öppen kö."
                gradient="from-cyan-400 via-indigo-500 to-violet-600"
              />
            </FlipCard>
            <FlipCard delay={0.12} axis="x">
              <FeatureCard
                icon={<Trophy className="h-7 w-7" />}
                title="ELO-ranking"
                text="Klättra från Brons till Diamant med ett schackinspirerat system. Se din progression i realtid."
                gradient="from-amber-400 via-orange-500 to-pink-500"
                featured
              />
            </FlipCard>
            <FlipCard delay={0.24} axis="y">
              <FeatureCard
                icon={<BookOpen className="h-7 w-7" />}
                title="Alla 8 delprov"
                text="Ord · Mek · Läs · Elf · Xyz · Kva · Nog · Dtk. Träna i lugn takt eller testa dig under tidspress."
                gradient="from-emerald-400 via-teal-500 to-cyan-600"
              />
            </FlipCard>
          </div>
        </VelocitySkew>
      </div>
    </section>
  );
}

/* ============================================================ */
/* ===  STAGES — three alternating "play loop" rows          === */
/* ============================================================ */

const STAGES = [
  {
    icon: <Swords className="h-5 w-5" />,
    eyebrow: "Stage 01",
    title: "Hitta motståndare.",
    text: "Hoppa in i en match på 5 sekunder mot en vän eller okänd spelare. Inga väntrum, ingen latency.",
    accent: "from-cyan-400 to-indigo-500",
    elo: 1420,
  },
  {
    icon: <Brain className="h-5 w-5" />,
    eyebrow: "Stage 02",
    title: "Tänk snabbare.",
    text: "Riktig HP-tidspress. Varje sekund räknas. Resultatet syns direkt i din profil.",
    accent: "from-fuchsia-400 to-pink-500",
    elo: 1640,
  },
  {
    icon: <Target className="h-5 w-5" />,
    eyebrow: "Stage 03",
    title: "Klättra rankingen.",
    text: "ELO-poäng efter varje match. Brons, silver, guld, diamant. Inte en topplista, en resa.",
    accent: "from-amber-400 to-orange-500",
    elo: 1880,
  },
];

function Stages() {
  return (
    <section className="relative overflow-hidden bg-paper">
      <div className="mx-auto max-w-6xl px-6 pb-8 pt-24 sm:pt-32">
        <SectionHeader eyebrow="Spelets gång" title="Tre faser." highlight="En upplevelse." />
      </div>
      <div className="space-y-12 pb-24 sm:space-y-20 sm:pb-32">
        {STAGES.map((stage, i) => (
          <StageRow key={i} stage={stage} index={i} reversed={i % 2 === 1} />
        ))}
      </div>
    </section>
  );
}

function StageRow({
  stage,
  index,
  reversed,
}: {
  stage: (typeof STAGES)[number];
  index: number;
  reversed: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.25, margin: "200px 0px 200px 0px" });
  const reduce = useReducedMotion();
  const dirX = reversed ? 60 : -60;

  return (
    <div ref={ref} className="mx-auto max-w-6xl px-6">
      <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
        {/* Text side */}
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, x: dirX }}
          animate={inView ? { opacity: 1, x: 0 } : undefined}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className={reversed ? "md:order-2" : ""}
        >
          <div
            className={`mb-5 inline-flex h-9 items-center gap-2 rounded-full bg-gradient-to-r ${stage.accent} px-3 text-xs font-semibold text-white shadow-md`}
          >
            {stage.icon}
            {stage.eyebrow}
          </div>
          <h3 className="display text-[40px] font-bold leading-[1.04] text-[#0a0a0f] sm:text-[56px]">
            {stage.title}
          </h3>
          <p className="mt-4 max-w-md text-[17px] leading-relaxed text-neutral-600">{stage.text}</p>
          <div className="mt-6 inline-flex items-center gap-2 text-[13px] font-medium text-neutral-500">
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full bg-gradient-to-r ${stage.accent}`}
            />
            Stage {String(index + 1).padStart(2, "0")} av {STAGES.length}
          </div>
        </motion.div>

        {/* Phone mockup */}
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, x: -dirX, rotate: reversed ? -3 : 3 }}
          animate={inView ? { opacity: 1, x: 0, rotate: 0 } : undefined}
          transition={{ duration: 1, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className={reversed ? "md:order-1" : ""}
          style={{ transformPerspective: 1200 }}
        >
          <StagePhone stage={stage} />
        </motion.div>
      </div>
    </div>
  );
}

function StagePhone({ stage }: { stage: (typeof STAGES)[number] }) {
  return (
    <div
      className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[36px] shadow-[var(--shadow-xl)]"
      style={{ background: "var(--navy-2)" }}
    >
      <div className={`relative h-full w-full bg-gradient-to-br ${stage.accent} opacity-90`}>
        <div
          className="absolute inset-6 flex flex-col justify-between rounded-[24px] p-7 shadow-inner"
          style={{
            background: "rgba(7,17,30,0.92)",
            border: "1px solid var(--line)",
          }}
        >
          <div className="flex items-center justify-between">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${stage.accent} text-white shadow-md`}
            >
              {stage.icon}
            </div>
            <span
              className="flex h-7 items-center justify-center rounded-full px-3 text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{ background: "rgba(111,179,184,0.18)", color: "var(--teal)" }}
            >
              LIVE
            </span>
          </div>

          <div>
            <div
              className="text-[10px] uppercase tracking-[0.22em]"
              style={{ color: "var(--hp-muted)" }}
            >
              {stage.eyebrow}
            </div>
            <div
              className="display mt-2 text-[28px] font-bold leading-tight"
              style={{ color: "var(--cream)" }}
            >
              {stage.title}
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <div
                className="text-[10px] uppercase tracking-[0.18em]"
                style={{ color: "var(--hp-muted)" }}
              >
                ELO
              </div>
              <div
                className="display text-[44px] font-bold leading-none tabular-nums"
                style={{ color: "var(--cream)" }}
              >
                {stage.elo}
              </div>
            </div>
            <div
              className={`h-11 rounded-full bg-gradient-to-r ${stage.accent} px-6 text-xs font-semibold leading-[2.75rem] text-white shadow-md`}
            >
              SPELA
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================ */
/* ===  HOW IT WORKS                                         === */
/* ============================================================ */

function HowItWorks() {
  return (
    <section id="how-it-works" className="relative overflow-hidden bg-paper px-6 py-24 sm:py-32">
      <StickyNumber n="01" />
      <div aria-hidden className="absolute inset-0 bg-mesh-light opacity-60" />
      <div className="relative mx-auto max-w-6xl">
        <SectionHeader eyebrow="Så funkar det" title="Tre steg." highlight="Bättre HP-resultat." />

        <VelocitySkew maxDeg={2}>
          <div className="mt-20 grid gap-10 md:grid-cols-3">
            <FlipCard delay={0} axis="x">
              <Step
                n="01"
                title="Skapa konto"
                text="Registrera dig på 30 sekunder. Inget kreditkort, ingen krångel."
              />
            </FlipCard>
            <FlipCard delay={0.18} axis="y">
              <Step
                n="02"
                title="Välj verbal eller matte"
                text="Starta en match direkt eller bjud in en vän med en delbar länk."
              />
            </FlipCard>
            <FlipCard delay={0.36} axis="x">
              <Step
                n="03"
                title="Kämpa & klättra"
                text="Varje vinst ger ELO. Se din normerade HP-poäng stiga vecka för vecka."
              />
            </FlipCard>
          </div>
        </VelocitySkew>
      </div>
    </section>
  );
}

/* ============================================================ */
/* ===  RECENT MATCHES — live feed from getLandingStats      === */
/* ============================================================ */

function RecentMatches({ stats }: { stats: LandingStats | null }) {
  const matches = stats?.recent?.slice(0, 6) ?? [];
  if (matches.length === 0) return null;

  return (
    <section className="relative bg-white px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-3xl">
        <SectionHeader eyebrow="Live" title="Senaste matcherna." highlight="Just nu." />

        <ul className="mt-12 space-y-3">
          {matches.map((m, i) => (
            <MatchRow key={m.id} match={m} delay={i * 0.07} />
          ))}
        </ul>

        <div className="mt-8 text-center text-[12px] uppercase tracking-[0.18em] text-neutral-500">
          uppdateras varje gång en match avslutas
        </div>
      </div>
    </section>
  );
}

function MatchRow({
  match,
  delay,
}: {
  match: NonNullable<LandingStats["recent"]>[number];
  delay: number;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5, margin: "200px 0px 200px 0px" });

  const p1Name = match.p1_name || "Gäst";
  const p2Name = match.is_bot_match ? getBotName(match.bot_elo ?? 1000, match.id) : match.p2_name || "Gäst";
  const p1Score = match.player1_score ?? 0;
  const p2Score = match.player2_score ?? 0;

  const isDraw = !match.winner_id;
  const p1Won = match.winner_id === match.player1_id;

  const winnerName = isDraw ? null : p1Won ? p1Name : p2Name;
  const loserName = isDraw ? null : p1Won ? p2Name : p1Name;
  const winnerScore = isDraw ? p1Score : p1Won ? p1Score : p2Score;
  const loserScore = isDraw ? p2Score : p1Won ? p2Score : p1Score;

  const matchTypeLabel = match.match_type === "verbal" ? "Verbal" : "Matte";
  const accentByType =
    match.match_type === "verbal" ? "from-cyan-400 to-indigo-500" : "from-amber-400 to-orange-500";

  return (
    <motion.li
      ref={ref}
      initial={{ opacity: 0, x: -16 }}
      animate={inView ? { opacity: 1, x: 0 } : undefined}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className="group flex items-center justify-between gap-4 rounded-2xl border border-black/5 bg-white p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-lg)]"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accentByType} text-[10px] font-bold uppercase tracking-wide text-white`}
        >
          {matchTypeLabel.slice(0, 3)}
        </span>
        <p className="truncate text-[15px] leading-snug text-[#0a0a0f]">
          {isDraw ? (
            <>
              <span className="font-semibold">{p1Name}</span>
              <span className="text-neutral-500"> och </span>
              <span className="font-semibold">{p2Name}</span>
              <span className="text-neutral-500"> – oavgjort</span>
            </>
          ) : (
            <>
              <span className="font-semibold">{winnerName}</span>
              <span className="text-neutral-500"> slog </span>
              <span className="font-semibold">{loserName}</span>
            </>
          )}
        </p>
      </div>
      <div className="shrink-0 font-mono text-[15px] font-bold tabular-nums">
        <span className="text-[#0a0a0f]">{winnerScore}</span>
        <span className="mx-1 text-neutral-400">–</span>
        <span className="text-neutral-500">{loserScore}</span>
      </div>
    </motion.li>
  );
}

/* ============================================================ */
/* ===  PROOF                                                === */
/* ============================================================ */

function ProofSection({ stats }: { stats: LandingStats | null }) {
  return (
    <section className="relative bg-white px-6 py-20">
      <div className="relative mx-auto max-w-5xl">
        <VelocitySkew maxDeg={2.5}>
          <div className="grid gap-6 sm:grid-cols-3">
            <FlipCard delay={0} axis="y">
              <ProofCard value={stats?.topVerbalElo ?? 0} label="Högsta verbal-ELO" />
            </FlipCard>
            <FlipCard delay={0.1} axis="x">
              <ProofCard value={stats?.topMathElo ?? 0} label="Högsta matte-ELO" />
            </FlipCard>
            <FlipCard delay={0.2} axis="y">
              <ProofCard value={8000} suffix="+" label="HP-ord i databasen" />
            </FlipCard>
          </div>
        </VelocitySkew>
      </div>
    </section>
  );
}

/* ============================================================ */
/* ===  FOUNDER QUOTE                                        === */
/* ============================================================ */

function FounderQuote() {
  return (
    <section className="relative bg-paper px-6 pb-24 pt-20 sm:pb-28">
      <div className="relative mx-auto max-w-3xl">
        <motion.figure
          initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.2, margin: "200px 0px 200px 0px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="surface-elevated relative rounded-[32px] p-10 sm:p-14"
        >
          <div
            aria-hidden
            className="absolute -left-2 -top-8 text-[160px] leading-none text-indigo-500/15"
            style={{ fontFamily: "var(--font-display)" }}
          >
            &ldquo;
          </div>
          <blockquote className="display relative text-[26px] leading-[1.3] text-[#0a0a0f] sm:text-[34px]">
            HP Kampen innehåller verktyg jag hade haft{" "}
            <span className="text-aurora-gradient italic">stor nytta av</span> när jag pluggade till
            högskoleprovet, helt gratis.
          </blockquote>
          <figcaption className="mt-8 flex items-center gap-4 border-t border-black/5 pt-6">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-700 text-lg font-bold text-white shadow-md">
              N
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-amber-400">
                <svg viewBox="0 0 24 24" className="h-3 w-3 fill-white">
                  <path d="M12 2l1.8 5.5H19l-4.6 3.4 1.8 5.6L12 13l-4.2 3.5 1.8-5.6L5 7.5h5.2z" />
                </svg>
              </span>
            </div>
            <div>
              <div
                className="text-base font-semibold text-[#0a0a0f]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Niklas
              </div>
              <div className="text-xs text-neutral-500">Grundare · 1.9 på Högskoleprovet</div>
            </div>
          </figcaption>
        </motion.figure>
      </div>
    </section>
  );
}

/* ============================================================ */
/* ===  FINAL CTA                                            === */
/* ============================================================ */

function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-mesh px-6 py-24 text-center text-white">
      <div aria-hidden className="absolute inset-0 bg-grid-ink opacity-30" />

      <Parallax speed={-0.2} className="pointer-events-none absolute inset-0">
        <div
          className="orb orb-indigo animate-orb-drift"
          style={{ top: "20%", left: "20%", width: 400, height: 400 }}
        />
        <div
          className="orb orb-fuchsia animate-orb-drift"
          style={{
            top: "30%",
            right: "15%",
            width: 360,
            height: 360,
            animationDelay: "5s",
          }}
        />
      </Parallax>

      <ClipReveal>
        <div className="relative mx-auto max-w-3xl">
          <p className="eyebrow text-fuchsia-300">Sista anhalten</p>
          <h2 className="display mt-4 text-[56px] leading-[1.05] text-white sm:text-[88px]">
            <SplitText as="span">Redo att testa dig?</SplitText>
          </h2>
          <p className="mx-auto mt-6 max-w-md text-[18px] text-white/65">
            Helt gratis. Inget kreditkort. Bara du, motståndarna och poängen som klättrar.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/signup"
              data-cursor="link"
              className="btn-shine group inline-flex h-[64px] items-center gap-2 rounded-full bg-white px-10 text-[17px] font-semibold text-[#050507] shadow-[var(--shadow-glow-aurora)]"
            >
              Skapa konto nu
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/login"
              data-cursor="link"
              className="inline-flex h-[64px] items-center gap-2 rounded-full border border-white/15 bg-white/5 px-10 text-[17px] font-medium text-white hover:bg-white/10"
            >
              Jag har redan konto
            </Link>
          </div>
        </div>
      </ClipReveal>
    </section>
  );
}

/* ============================================================ */
/* ===  SUB-COMPONENTS                                       === */
/* ============================================================ */

function SectionHeader({
  eyebrow,
  title,
  highlight,
}: {
  eyebrow: string;
  title: string;
  highlight: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3, margin: "200px 0px 200px 0px" });
  return (
    <div ref={ref} className="text-center">
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="eyebrow"
      >
        {eyebrow}
      </motion.p>
      <h2 className="display mt-3 text-[44px] leading-[0.98] text-[#050507] sm:text-[64px] md:text-[80px]">
        <SplitText as="span" className="block">
          {title}
        </SplitText>
        <span className="text-aurora-gradient">
          <SplitText as="span" delay={0.15} italic>
            {highlight}
          </SplitText>
        </span>
      </h2>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  text,
  gradient,
  featured,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  gradient: string;
  featured?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className={`group relative overflow-hidden rounded-[28px] border border-black/5 bg-white p-8 shadow-[var(--shadow-card)] transition-shadow duration-500 hover:shadow-[var(--shadow-xl)] ${
        featured ? "md:-translate-y-3" : ""
      }`}
    >
      <div
        aria-hidden
        className={`absolute inset-0 -z-10 bg-gradient-to-br ${gradient} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-30`}
      />
      <div
        className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-md transition-transform group-hover:scale-110 group-hover:rotate-3`}
      >
        {icon}
      </div>
      <h3
        className="text-[26px] font-bold leading-tight text-[#0a0a0f]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h3>
      <p className="mt-3 text-[15px] leading-relaxed text-neutral-600">{text}</p>
      {featured && (
        <div className="mt-6 inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
          <Sparkles className="h-3.5 w-3.5" />
          Mest älskad funktion
        </div>
      )}
    </motion.div>
  );
}

function Step({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <div className="relative">
      <div
        className="text-aurora-gradient text-[80px] font-bold leading-none"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {n}
      </div>
      <h3
        className="mt-3 text-[28px] font-bold leading-tight text-[#0a0a0f]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h3>
      <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-neutral-600">{text}</p>
    </div>
  );
}

function ProofCard({ value, label, suffix }: { value: number; label: string; suffix?: string }) {
  return (
    <div className="rounded-[24px] border border-black/5 bg-gradient-to-br from-white to-neutral-50 p-8 text-center shadow-[var(--shadow-card)]">
      <div
        className="text-[60px] font-bold leading-none text-aurora-gradient tabular-nums"
        style={{ fontFamily: "var(--font-display)" }}
      >
        <CountUp end={value} />
        {suffix}
      </div>
      <div className="mt-3 text-[13px] font-medium uppercase tracking-wider text-neutral-500">
        {label}
      </div>
    </div>
  );
}

function StatTeaser({
  value,
  label,
  suffix,
  hidden,
}: {
  value: number;
  label: string;
  suffix?: string;
  hidden?: boolean;
}) {
  return (
    <div className={hidden ? "hidden md:block" : ""}>
      <div
        className="text-[28px] font-bold leading-none text-white tabular-nums"
        style={{ fontFamily: "var(--font-display)" }}
      >
        <CountUp end={value} />
        {suffix}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/45">{label}</div>
    </div>
  );
}

function CountUp({ end }: { end: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5, margin: "200px 0px 200px 0px" });

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const dur = 1500;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(end * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, end]);

  return <span ref={ref}>{display.toLocaleString("sv-SE")}</span>;
}
