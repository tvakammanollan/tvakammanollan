import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useSpring,
  useMotionValue,
  useInView,
} from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ArrowRight,
  Zap,
  Trophy,
  BookOpen,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getLandingStats, type LandingStats } from "@/lib/landing.functions";
import { rateLimit, limits } from "@/lib/rate-limit";

/* ====================================================================
   HERO LANDING — "Northern Light"
   Apple precision + Cluely energy. Scroll-driven, alive, premium.
   ==================================================================== */

export function HeroLanding() {
  const navigate = useNavigate();
  const fetchStats = useServerFn(getLandingStats);
  const [guestLoading, setGuestLoading] = useState(false);
  const [stats, setStats] = useState<LandingStats | null>(null);
  const reduce = useReducedMotion();

  // Global scroll progress
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch(() => setStats(null));
  }, [fetchStats]);

  const playAsGuest = async () => {
    // Throttle guest sign-ups (per device) to stop spam.
    const r = rateLimit("guest-signin", limits.guestSignup);
    if (!r.ok) {
      toast.error(
        `Vänta ${Math.ceil(r.resetIn / 60000)} min innan nästa gäst-session.`,
      );
      return;
    }
    setGuestLoading(true);
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      setGuestLoading(false);
      toast.error("Kunde inte starta gästläge", { description: error.message });
      return;
    }
    navigate({ to: "/" });
  };

  return (
    <div className="relative overflow-hidden">
      {/* Scroll progress bar */}
      <motion.div className="scroll-progress" style={{ scaleX }} />

      {/* CursorGlow follows mouse on desktop */}
      {!reduce && <CursorGlow />}

      <Hero stats={stats} guestLoading={guestLoading} onGuest={playAsGuest} />

      <MarqueeBand />

      <FeaturesSticky />

      <HowItWorks />

      <ProofSection stats={stats} />

      <FounderQuote />

      <FinalCTA />
    </div>
  );
}

/* ============== HERO ============== */
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
    <section
      ref={ref}
      className="relative min-h-screen overflow-hidden bg-mesh text-white"
    >
      {/* Mesh-flow animated bg */}
      <div aria-hidden className="absolute inset-0 animate-mesh bg-mesh opacity-90" />

      {/* Floating orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
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
      </div>

      {/* Subtle grid overlay */}
      <div aria-hidden className="absolute inset-0 bg-grid-ink opacity-30" />

      {/* Content */}
      <motion.div
        className="relative z-10 mx-auto flex min-h-screen max-w-[1100px] flex-col items-center justify-center px-6 py-24 text-center"
        style={{ y: reduce ? 0 : heroY, opacity: reduce ? 1 : heroOpacity, scale: reduce ? 1 : heroScale }}
      >
        {/* Status pill */}
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 backdrop-blur-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
          </span>
          <span className="text-[12px] font-medium tracking-wide text-white/80">
            Realtidsmatcher · Live
          </span>
        </motion.div>

        {/* Massive Apple-style headline */}
        <h1 className="display text-balance text-[56px] font-bold leading-[0.96] text-white sm:text-[96px] md:text-[120px] lg:text-[144px]">
          <WordReveal text="Tävla." delay={0.1} />
          <br />
          <span className="text-aurora-gradient">
            <WordReveal text="Klättra." delay={0.3} italic />
          </span>
          <br />
          <WordReveal text="Klara HP." delay={0.5} />
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 max-w-2xl text-balance text-[18px] leading-relaxed text-white/70 sm:text-[22px]"
        >
          Den enda plattformen för Högskoleprovet med
          <span className="font-semibold text-white"> live-matcher</span>,
          <span className="font-semibold text-white"> ELO-ranking</span> och
          <span className="font-semibold text-white"> bot-träning</span>.
          Helt gratis.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 flex flex-col items-center gap-3 sm:flex-row"
        >
          <MagneticButton primary>
            <Link
              to="/signup"
              className="relative inline-flex h-[58px] items-center gap-2 rounded-full bg-white px-8 text-[16px] font-semibold text-[#050507] shadow-[var(--shadow-glow-aurora)] transition-all hover:shadow-[0_0_80px_-8px_rgba(217,70,239,0.55)]"
            >
              Skapa gratis konto
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </MagneticButton>
          <MagneticButton>
            <button
              type="button"
              onClick={onGuest}
              disabled={guestLoading}
              className="inline-flex h-[58px] items-center gap-2 rounded-full border border-white/15 bg-white/5 px-8 text-[16px] font-medium text-white backdrop-blur-sm transition hover:bg-white/10 disabled:opacity-60"
            >
              {guestLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {guestLoading ? "Startar gästläge…" : "Spela som gäst"}
            </button>
          </MagneticButton>
        </motion.div>

        {/* Live counter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.4 }}
          className="mt-12 flex items-center gap-6 text-[13px] text-white/55"
        >
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            Inget kreditkort
          </span>
          <span className="hidden sm:inline-flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            30 sekunder att börja
          </span>
          <span className="hidden md:inline-flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            Helt anonymt
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
            <StatTeaser
              value={stats.totalMatches}
              label="matcher spelade"
            />
            <span className="h-12 w-px bg-white/15" />
            <StatTeaser
              value={stats.totalPlayers}
              label="spelare"
            />
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

/* ============== MARQUEE — endless scrolling band ============== */
function MarqueeBand() {
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
    "BOT-TRÄNING",
    "BRONS → DIAMANT",
  ];
  return (
    <section className="relative overflow-hidden border-y border-black/10 bg-white py-8">
      <div className="flex animate-marquee gap-12 whitespace-nowrap will-change-transform">
        {[...items, ...items].map((it, i) => (
          <span
            key={i}
            className="display flex items-center gap-12 text-[28px] font-semibold tracking-tight text-[#050507] sm:text-[40px]"
          >
            {it}
            <span className="text-aurora-gradient">✦</span>
          </span>
        ))}
      </div>
    </section>
  );
}

/* ============== FEATURES — sticky scroll-storytelling ============== */
function FeaturesSticky() {
  return (
    <section className="relative bg-white px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          eyebrow="Funktioner"
          title="Tre superkrafter."
          highlight="En arena."
        />

        <div className="mt-20 grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={<Zap className="h-7 w-7" />}
            title="Live-matcher"
            text="Utmana vänner eller okända spelare i realtid. Privata rum med delbar länk eller öppen kö."
            gradient="from-cyan-400 via-indigo-500 to-violet-600"
            delay={0}
          />
          <FeatureCard
            icon={<Trophy className="h-7 w-7" />}
            title="ELO-ranking"
            text="Klättra från Brons till Diamant med ett schackinspirerat system. Se din progression i realtid."
            gradient="from-amber-400 via-orange-500 to-pink-500"
            featured
            delay={0.1}
          />
          <FeatureCard
            icon={<BookOpen className="h-7 w-7" />}
            title="Alla 8 delprov"
            text="Ord · Mek · Läs · Elf · Xyz · Kva · Nog · Dtk — träna i lugn takt eller testa dig under tidspress."
            gradient="from-emerald-400 via-teal-500 to-cyan-600"
            delay={0.2}
          />
        </div>
      </div>
    </section>
  );
}

/* ============== HOW IT WORKS ============== */
function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden bg-paper px-6 py-24 sm:py-32"
    >
      <div aria-hidden className="absolute inset-0 bg-mesh-light opacity-60" />
      <div className="relative mx-auto max-w-6xl">
        <SectionHeader
          eyebrow="Så funkar det"
          title="Tre steg."
          highlight="Bättre HP-resultat."
        />

        <div className="mt-20 grid gap-10 md:grid-cols-3">
          <Step
            n="01"
            title="Skapa konto"
            text="Registrera dig på 30 sekunder. Inget kreditkort, ingen krångel."
            delay={0}
          />
          <Step
            n="02"
            title="Välj verbal eller matte"
            text="Starta en match direkt mot en bot eller bjud in en vän med en länk."
            delay={0.15}
          />
          <Step
            n="03"
            title="Kämpa & klättra"
            text="Varje vinst ger ELO. Se din normerade HP-poäng stiga vecka för vecka."
            delay={0.3}
          />
        </div>
      </div>
    </section>
  );
}

/* ============== PROOF — live counter w/ count-up ============== */
function ProofSection({ stats }: { stats: LandingStats | null }) {
  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-6 sm:grid-cols-3">
          <ProofCard
            value={stats?.totalMatches ?? 0}
            label="Matcher spelade"
          />
          <ProofCard value={stats?.totalPlayers ?? 0} label="Aktiva spelare" />
          <ProofCard value={8000} suffix="+" label="HP-ord i databasen" />
        </div>
      </div>
    </section>
  );
}

/* ============== FOUNDER QUOTE ============== */
function FounderQuote() {
  return (
    <section className="bg-paper px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-3xl">
        <motion.figure
          initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="surface-elevated relative rounded-[32px] p-12 sm:p-16"
        >
          <div
            aria-hidden
            className="absolute -left-2 -top-8 text-[160px] leading-none text-indigo-500/15"
            style={{ fontFamily: "var(--font-display)" }}
          >
            "
          </div>
          <blockquote className="display relative text-[26px] leading-[1.3] text-[#0a0a0f] sm:text-[34px]">
            HP Kampen innehåller verktyg jag hade haft{" "}
            <span className="text-aurora-gradient italic">stor nytta av</span>{" "}
            när jag pluggade till högskoleprovet — helt gratis.
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
              <div className="text-xs text-neutral-500">
                Grundare · 1.9 på Högskoleprovet
              </div>
            </div>
          </figcaption>
        </motion.figure>
      </div>
    </section>
  );
}

/* ============== FINAL CTA — dramatic dark with mesh ============== */
function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-mesh px-6 py-32 text-center text-white">
      <div aria-hidden className="absolute inset-0 bg-grid-ink opacity-30" />

      {/* Floating orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
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
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto max-w-3xl"
      >
        <p className="eyebrow text-fuchsia-300">Sista anhalten</p>
        <h2 className="display mt-4 text-[56px] leading-[1.05] text-white sm:text-[88px]">
          Redo att{" "}
          <span className="text-aurora-gradient italic">testa dig</span>?
        </h2>
        <p className="mx-auto mt-6 max-w-md text-[18px] text-white/65">
          Helt gratis. Inget kreditkort. Bara du, motståndarna och poängen som
          klättrar.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <MagneticButton primary>
            <Link
              to="/signup"
              className="btn-shine group inline-flex h-[64px] items-center gap-2 rounded-full bg-white px-10 text-[17px] font-semibold text-[#050507] shadow-[var(--shadow-glow-aurora)]"
            >
              Skapa konto nu
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </MagneticButton>
          <MagneticButton>
            <Link
              to="/login"
              className="inline-flex h-[64px] items-center gap-2 rounded-full border border-white/15 bg-white/5 px-10 text-[17px] font-medium text-white hover:bg-white/10"
            >
              Jag har redan konto
            </Link>
          </MagneticButton>
        </div>
      </motion.div>
    </section>
  );
}

/* ===========================================================
   SUB-COMPONENTS
   =========================================================== */

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
  const inView = useInView(ref, { once: true, amount: 0.3 });
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
      <motion.h2
        initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
        animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="display mt-3 text-[44px] leading-[0.98] text-[#050507] sm:text-[64px] md:text-[80px]"
      >
        {title}{" "}
        <span className="text-aurora-gradient italic">{highlight}</span>
      </motion.h2>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  text,
  gradient,
  featured,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  gradient: string;
  featured?: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className={`group relative overflow-hidden rounded-[28px] border border-black/5 bg-white p-8 shadow-[var(--shadow-card)] transition-shadow duration-500 hover:shadow-[var(--shadow-xl)] ${
        featured ? "md:-translate-y-3" : ""
      }`}
    >
      {/* Gradient halo on hover */}
      <div
        aria-hidden
        className={`absolute inset-0 -z-10 bg-gradient-to-br ${gradient} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-30`}
      />

      {/* Icon */}
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
      <p className="mt-3 text-[15px] leading-relaxed text-neutral-600">
        {text}
      </p>

      {featured && (
        <div className="mt-6 inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
          <Sparkles className="h-3.5 w-3.5" />
          Mest älskad funktion
        </div>
      )}
    </motion.div>
  );
}

function Step({
  n,
  title,
  text,
  delay,
}: {
  n: string;
  title: string;
  text: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <div className="text-aurora-gradient text-[80px] font-bold leading-none" style={{ fontFamily: "var(--font-display)" }}>
        {n}
      </div>
      <h3
        className="mt-3 text-[28px] font-bold leading-tight text-[#0a0a0f]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h3>
      <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-neutral-600">
        {text}
      </p>
    </motion.div>
  );
}

function ProofCard({
  value,
  label,
  suffix,
}: {
  value: number;
  label: string;
  suffix?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-[24px] border border-black/5 bg-gradient-to-br from-white to-neutral-50 p-8 text-center shadow-[var(--shadow-card)]"
    >
      <div className="text-[60px] font-bold leading-none text-aurora-gradient tabular-nums" style={{ fontFamily: "var(--font-display)" }}>
        <CountUp end={value} />
        {suffix}
      </div>
      <div className="mt-3 text-[13px] font-medium uppercase tracking-wider text-neutral-500">
        {label}
      </div>
    </motion.div>
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
      <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/45">
        {label}
      </div>
    </div>
  );
}

function CountUp({ end }: { end: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

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

function WordReveal({
  text,
  delay,
  italic,
}: {
  text: string;
  delay: number;
  italic?: boolean;
}) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 60, rotateX: -45, filter: "blur(16px)" }}
      animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
      transition={{ duration: 1, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`inline-block ${italic ? "italic font-light" : "font-bold"}`}
      style={{ transformPerspective: 1000 }}
    >
      {text}
    </motion.span>
  );
}

function MagneticButton({
  children,
  primary,
}: {
  children: React.ReactNode;
  primary?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 20 });
  const sy = useSpring(y, { stiffness: 300, damping: 20 });

  if (reduce) {
    return <div className={primary ? "group" : ""}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      style={{ x: sx, y: sy }}
      onMouseMove={(e) => {
        const rect = ref.current!.getBoundingClientRect();
        const cx = e.clientX - rect.left - rect.width / 2;
        const cy = e.clientY - rect.top - rect.height / 2;
        x.set(cx * 0.25);
        y.set(cy * 0.25);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      className={primary ? "group" : ""}
    >
      {children}
    </motion.div>
  );
}

/* ===== Cursor glow that follows mouse ===== */
function CursorGlow() {
  const x = useMotionValue(-1000);
  const y = useMotionValue(-1000);
  const sx = useSpring(x, { stiffness: 80, damping: 20 });
  const sy = useSpring(y, { stiffness: 80, damping: 20 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [x, y]);

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[60] hidden h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full md:block"
      style={{
        x: sx,
        y: sy,
        background:
          "radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 60%)",
        mixBlendMode: "screen",
      }}
    />
  );
}
