import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useInView,
} from "framer-motion";
import { Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getLandingStats, type LandingStats } from "@/lib/landing.functions";
import { rateLimit, limits } from "@/lib/rate-limit";
import { formatInt } from "@/lib/sv-format";

/* =====================================================================
   HERO LANDING — "Athenaeum"
   Editorial library × HP-prep arena.
   Following the close-read critique:
     · Navy + cream + amber (one button) + teal (state)
     · Newsreader serif headlines with italic amber accents
     · Hero-meta grid, scroll cue, scrollytelling "how it works"
     · Live activity counter ("324 matcher pågår nu")
     · Real Swedish soul (UHR delprov as marquee, kalenderurgency)
   ===================================================================== */

export function HeroLanding() {
  const navigate = useNavigate();
  const fetchStats = useServerFn(getLandingStats);
  const [guestLoading, setGuestLoading] = useState(false);
  const [stats, setStats] = useState<LandingStats | null>(null);
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch(() => setStats(null));
  }, [fetchStats]);

  const playAsGuest = async () => {
    const r = rateLimit("guest-signin", limits.guestSignup);
    if (!r.ok) {
      toast.error(
        `Vänta ${Math.ceil(r.resetIn / 60000)} min innan nästa gästsession.`,
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
    <div className="relative overflow-hidden bg-navy text-cream">
      {/* Scroll progress bar */}
      <motion.div className="scroll-progress" style={{ scaleX }} />

      <Hero stats={stats} guestLoading={guestLoading} onGuest={playAsGuest} />
      <Marquee />
      <Verdict />
      <HowItWorksScrolly />
      <ColorAtmosphere />
      <LiveProof stats={stats} />
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
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const glowY = useTransform(scrollYProgress, [0, 1], [0, -80]);

  return (
    <section
      ref={ref}
      className="relative min-h-screen overflow-hidden bg-navy text-cream"
    >
      <div className="bg-grid-navy absolute inset-0" />
      <motion.div
        className="glow-amber"
        style={{
          left: "50%",
          top: "30%",
          transform: "translate(-50%, -50%)",
          y: reduce ? 0 : glowY,
        }}
      />
      <div className="glow-teal" style={{ left: "10%", top: "80%" }} />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1240px] flex-col justify-end px-6 pb-24 pt-32 sm:px-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="eyebrow mb-8"
        >
          Realtid · HP-prep · Sverige
        </motion.div>

        {/* Massive editorial headline with word-rise */}
        <h1 className="display text-[48px] leading-[0.96] text-cream sm:text-[88px] md:text-[120px] lg:text-[132px]">
          <span className="word-rise" style={{ animationDelay: "0.05s" }}>
            <span>Tävla</span>
          </span>{" "}
          <span className="word-rise" style={{ animationDelay: "0.15s" }}>
            <span>mot</span>
          </span>{" "}
          <span className="word-rise" style={{ animationDelay: "0.25s" }}>
            <span>vänner</span>
          </span>
          <br />
          <span className="word-rise" style={{ animationDelay: "0.35s" }}>
            <span>i</span>
          </span>{" "}
          <span className="word-rise" style={{ animationDelay: "0.45s" }}>
            <span className="text-amber-italic">HP-frågor.</span>
          </span>
        </h1>

        {/* Hero meta grid (4 cols, like the critique) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0, ease: [0.2, 0.7, 0.2, 1] }}
          className="mt-16 grid max-w-3xl grid-cols-2 gap-7 border-t border-[var(--line)] pt-7 sm:grid-cols-4"
        >
          <MetaCell label="Live nu">
            <LiveCounter
              value={stats?.activePlayers ?? Math.max(stats?.totalPlayers ?? 0, 0)}
              suffix="online"
            />
          </MetaCell>
          <MetaCell label="Matcher / min">
            <LiveCounter value={stats?.matchesPerMin ?? 0} />
          </MetaCell>
          <MetaCell label="Delprov">Ord · Mek · Läs · Elf · Xyz · Kva · Nog · Dtk</MetaCell>
          <MetaCell label="Pris">Helt gratis</MetaCell>
        </motion.div>

        {/* CTAs — ONE amber button, rest is text link (critique #03) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="mt-12 flex flex-wrap items-center gap-6"
        >
          <Link to="/signup" className="btn-shine btn-amber">
            Skapa konto
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={onGuest}
            disabled={guestLoading}
            className="btn-link text-cream/85 disabled:opacity-60"
          >
            {guestLoading && <Loader2 className="mr-1.5 inline h-3.5 w-3.5 animate-spin" />}
            {guestLoading ? "Startar gästläge…" : "eller spela som gäst"}
          </button>
          <Link to="/login" className="btn-link text-cream/55">
            Logga in
          </Link>
        </motion.div>
      </div>

      {/* Scroll cue (lower right) */}
      <div className="absolute bottom-7 right-6 z-10 sm:right-12">
        <span className="scroll-cue text-cream/55">
          Scrolla <span className="bar" />
        </span>
      </div>
    </section>
  );
}

function MetaCell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-cream/55">
        {label}
      </div>
      <div className="display mt-1.5 text-[18px] leading-tight text-cream">
        {children}
      </div>
    </div>
  );
}

function LiveCounter({
  value,
  suffix,
}: {
  value: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const dur = 800;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <span ref={ref} className="numeric-display tabular-nums">
      {formatInt(display)}
      {suffix && <span className="ml-1 text-cream/60">{suffix}</span>}
    </span>
  );
}

/* ============== MARQUEE — all 8 delprov + live signal ============== */
function Marquee() {
  const items = [
    "Ord",
    "Mek",
    "Läs",
    "Elf",
    "Xyz",
    "Kva",
    "Nog",
    "Dtk",
    "ELO-ranking",
    "Realtidsmatcher",
    "8 000+ ord",
    "Bot-träning",
  ];
  return (
    <section className="relative overflow-hidden border-y border-[var(--line)] bg-navy-2 py-7">
      <div
        className="flex gap-12 whitespace-nowrap"
        style={{
          animation: "scroll-x 36s linear infinite",
          width: "max-content",
        }}
      >
        <style>{`
          @keyframes scroll-x {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }
        `}</style>
        {[...items, ...items].map((it, i) => (
          <span
            key={i}
            className="display flex items-center gap-12 text-[28px] text-cream/85 sm:text-[36px]"
          >
            {it}
            <span className="text-amber">✦</span>
          </span>
        ))}
      </div>
    </section>
  );
}

/* ============== VERDICT — five-second story w/ proof ============== */
function Verdict() {
  return (
    <section className="relative bg-navy py-32">
      <div className="mx-auto max-w-[1240px] px-6 sm:px-12">
        <div className="grid gap-12 md:grid-cols-[1.1fr_1fr] md:items-start">
          <div>
            <Reveal>
              <p className="eyebrow">Vad du får</p>
            </Reveal>
            <Reveal delay={1}>
              <h2 className="display mt-4 text-[36px] leading-[1.02] text-cream sm:text-[60px]">
                En arena byggd som ett bibliotek.{" "}
                <span className="text-amber-italic">Med stake.</span>
              </h2>
            </Reveal>
            <Reveal delay={2}>
              <p className="mt-6 max-w-[60ch] text-[17px] leading-[1.6] text-cream/72">
                HP Kampen är ingen quiz-app. Det är en plats. Lås in dig en
                kvart om kvällen, hitta en motståndare som är lika rädd som du,
                och se din ELO klättra. Vi sköter matchningen, frågorna och
                rankingen. Du sköter resten.
              </p>
            </Reveal>
          </div>
          <div className="space-y-px overflow-hidden rounded-2xl border border-[var(--line)]">
            <ProofRow label="01" name="Live-matcher mot vänner" badge="Realtid" />
            <ProofRow label="02" name="ELO-ranking · Brons till Diamant" badge="Konkurrens" />
            <ProofRow label="03" name="Alla 8 delprov, riktiga HP-frågor" badge="UHR" />
            <ProofRow label="04" name="Bot-träning utan tidspress" badge="Lugn" />
            <ProofRow label="05" name="Gratis. Inga annonser." badge="0 kr" />
          </div>
        </div>
      </div>
    </section>
  );
}

function ProofRow({ label, name, badge }: { label: string; name: string; badge: string }) {
  return (
    <div className="grid grid-cols-[48px_1fr_auto] items-center gap-5 bg-navy-2 px-6 py-5">
      <span className="font-mono text-[11px] tracking-[0.18em] text-amber">{label}</span>
      <span className="display text-[19px] text-cream">{name}</span>
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-cream/55">
        {badge}
      </span>
    </div>
  );
}

/* ============== SCROLLYTELLING — How it works (3 pinned scenes) ============== */
function HowItWorksScrolly() {
  const stageRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ["start start", "end end"],
  });
  const [step, setStep] = useState(0);

  useEffect(() => {
    return scrollYProgress.on("change", (p) => {
      const idx = Math.min(2, Math.floor(p * 3 * 0.999));
      setStep(idx);
    });
  }, [scrollYProgress]);

  const scenes = [
    {
      eyebrow: "Steg 01 · Hitta",
      title: (
        <>
          Välj <em className="text-amber-italic">delprov.</em>
        </>
      ),
      body: "Verbal eller matte. Öppen kö eller privat rum med en länk till en vän. Vi matchar mot någon på din nivå inom 10 sekunder.",
    },
    {
      eyebrow: "Steg 02 · Möt",
      title: (
        <>
          En motståndare <em className="text-amber-italic">hittad.</em>
        </>
      ),
      body: "ELO 1 410. Specialitet: ORD. Hen är på fråga 4 medan du läser fråga 5. Pressen är inte fientlig — den är delad.",
    },
    {
      eyebrow: "Steg 03 · Vinn",
      title: (
        <>
          Klättra i <em className="text-amber-italic">rankingen.</em>
        </>
      ),
      body: "Varje vinst räknas. +24 ELO efter en bra match. Streaks dag för dag. Brons till Diamant. Vi visar din normerade HP-poäng på köpet.",
    },
  ];

  return (
    <section id="how-it-works" className="bg-navy">
      <div ref={stageRef} className="relative" style={{ height: "300vh" }}>
        <div className="sticky top-0 grid h-screen grid-cols-1 items-center gap-12 px-6 md:grid-cols-2 md:px-12">
          <div className="relative h-[60vh]">
            {scenes.map((s, i) => (
              <div
                key={i}
                className={`absolute inset-0 flex flex-col justify-center transition-all duration-700 ${
                  step === i ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
                }`}
              >
                <p className="eyebrow mb-5">{s.eyebrow}</p>
                <h3 className="display text-[32px] leading-[1.05] text-cream sm:text-[48px]">
                  {s.title}
                </h3>
                <p className="mt-5 max-w-[48ch] text-[17px] leading-[1.6] text-cream/75">
                  {s.body}
                </p>
              </div>
            ))}
          </div>

          <Scene step={step} />
        </div>
      </div>
    </section>
  );
}

function Scene({ step }: { step: number }) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-[var(--line)] bg-gradient-to-br from-navy-2 to-navy">
      <div
        className={`absolute inset-6 flex flex-col justify-between rounded-xl bg-paper p-7 text-navy transition-all duration-800 ${
          step === 0 ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-95"
        }`}
      >
        <div>
          <p className="eyebrow">Live nu</p>
          <h4 className="display mt-2 text-[28px] leading-tight">
            Träna med <em className="text-amber-italic">vänner.</em>
          </h4>
          <p className="mt-2 text-[14px] text-navy/65">
            324 matcher pågår just nu — hoppa in.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Stat number="1 540" label="Online" />
          <Stat number="72" label="Matcher / min" />
        </div>
      </div>
      <div
        className={`absolute inset-6 flex flex-col justify-between rounded-xl bg-paper p-7 text-navy transition-all duration-800 ${
          step === 1 ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-95"
        }`}
      >
        <div>
          <p className="eyebrow">Match · 02 / 03</p>
          <h4 className="display mt-2 text-[28px] leading-tight">
            En motståndare <em className="text-amber-italic">hittad.</em>
          </h4>
          <p className="mt-2 text-[14px] text-navy/65">
            ELO 1 410 · Specialitet: ORD
          </p>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <span className="h-9 w-9 rounded-full bg-amber" />
            <span className="h-9 w-9 rounded-full bg-teal" />
          </div>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-navy/60">
            03 : 00 startar
          </span>
        </div>
      </div>
      <div
        className={`absolute inset-6 flex flex-col justify-between rounded-xl bg-paper p-7 text-navy transition-all duration-800 ${
          step === 2 ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-95"
        }`}
      >
        <div>
          <p className="eyebrow">Din ELO</p>
          <h4 className="display mt-2 numeric-display text-[44px] leading-tight">
            1 428
          </h4>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-navy/10">
            <div
              className="h-full bg-gradient-to-r from-amber to-teal"
              style={{ width: "72%" }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Stat number="+24" label="Senaste match" />
          <Stat number="9" label="Streak" />
        </div>
      </div>
    </div>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div className="numeric-display text-[36px] leading-none text-navy">{number}</div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-navy/60">
        {label}
      </div>
    </div>
  );
}

/* ============== COLOR ATMOSPHERE — palette spotlight ============== */
function ColorAtmosphere() {
  return (
    <section className="bg-paper py-32 text-navy">
      <div className="mx-auto max-w-[1240px] px-6 sm:px-12">
        <Reveal>
          <p className="eyebrow">Färg & atmosfär</p>
        </Reveal>
        <Reveal delay={1}>
          <h2 className="display mt-4 max-w-[22ch] text-[36px] leading-[1.02] text-navy sm:text-[60px]">
            Lästest sker i lågt ljus.{" "}
            <em className="text-amber-italic">Vi designar därefter.</em>
          </h2>
        </Reveal>
        <Reveal delay={2}>
          <p className="mt-6 max-w-[60ch] text-[17px] leading-[1.6] text-navy/72">
            Papper för dig som läser, navy för dig som tävlar. Bärnsten är
            varje sidas enda <em>knapp</em>. Mossa är tillstånd och progression.
            Två accenter med disciplin slår tio med vibes.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-4 gap-2 sm:grid-cols-8">
          {[
            ["#0E1B2C", "Midnatt"],
            ["#15273E", "Kväll"],
            ["#1E3552", "Skymning"],
            ["#6FB3B8", "Mossa"],
            ["#E8E4DA", "Papper"],
            ["#DAD4C5", "Pergament"],
            ["#F2A65A", "Bärnsten"],
            ["#C97B41", "Eldsken"],
          ].map(([hex, name], i) => (
            <Reveal key={hex} delay={Math.min(i, 4) as 0 | 1 | 2 | 3 | 4}>
              <div
                className="relative aspect-[1/2.2] overflow-hidden rounded-xl"
                style={{ background: hex }}
              >
                <span className="absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-[0.14em] text-white mix-blend-difference">
                  {name} · {hex.slice(1)}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============== LIVE PROOF ============== */
function LiveProof({ stats }: { stats: LandingStats | null }) {
  return (
    <section className="bg-navy py-32">
      <div className="mx-auto max-w-[1240px] px-6 sm:px-12">
        <div className="grid gap-12 md:grid-cols-3">
          <ProofTile
            value={stats?.totalMatches ?? 0}
            label="Matcher spelade"
          />
          <ProofTile value={stats?.totalPlayers ?? 0} label="Aktiva spelare" />
          <ProofTile value={8000} suffix="+" label="HP-ord i databasen" />
        </div>
        <Reveal>
          <p className="mt-12 font-mono text-[11px] uppercase tracking-[0.18em] text-cream/55">
            Uppdateras live · senast nu
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function ProofTile({
  value,
  label,
  suffix,
}: {
  value: number;
  label: string;
  suffix?: string;
}) {
  return (
    <Reveal>
      <div>
        <div className="numeric-display text-[72px] leading-none text-amber sm:text-[96px]">
          <LiveCounter value={value} />
          {suffix && <span className="text-cream/40">{suffix}</span>}
        </div>
        <div className="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-cream/55">
          {label}
        </div>
      </div>
    </Reveal>
  );
}

/* ============== FOUNDER QUOTE ============== */
function FounderQuote() {
  return (
    <section className="bg-paper py-32 text-navy">
      <div className="mx-auto max-w-[800px] px-6 sm:px-12">
        <Reveal>
          <figure className="surface-elevated p-12 sm:p-16">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-amber-deep">
              ✦ Grundaren
            </p>
            <blockquote className="display mt-6 text-[24px] leading-[1.35] text-navy sm:text-[32px]">
              <span className="text-amber">"</span>
              HP Kampen innehåller verktyg jag hade haft{" "}
              <em className="text-amber-italic">stor nytta av</em> när jag
              pluggade till högskoleprovet — helt gratis.
              <span className="text-amber">"</span>
            </blockquote>
            <figcaption className="mt-8 flex items-center gap-4 border-t border-[var(--line-cream)] pt-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-navy text-cream display">
                N
              </span>
              <div>
                <div className="display text-[17px] text-navy">Niklas</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-navy/60">
                  Grundare · 1,9 på Högskoleprovet
                </div>
              </div>
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}

/* ============== FINAL CTA ============== */
function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-ink py-32 text-cream">
      <div className="bg-grid-navy absolute inset-0" />
      <div className="glow-amber" style={{ left: "50%", top: "20%", transform: "translateX(-50%)" }} />
      <div className="relative mx-auto max-w-[800px] px-6 text-center sm:px-12">
        <Reveal>
          <p className="eyebrow eyebrow-amber justify-center">Sista raden</p>
        </Reveal>
        <Reveal delay={1}>
          <h2 className="display mt-6 text-[44px] leading-[1.05] text-cream sm:text-[80px]">
            Lägg din ELO i potten.{" "}
            <em className="text-amber-italic">Vi hittar någon som är lika rädd.</em>
          </h2>
        </Reveal>
        <Reveal delay={2}>
          <p className="mx-auto mt-6 max-w-[48ch] text-[17px] text-cream/70">
            Inget kreditkort. Ingen ångest. Bara du, motståndarna och poängen.
          </p>
        </Reveal>
        <Reveal delay={3}>
          <div className="mt-10 flex flex-col items-center justify-center gap-5 sm:flex-row">
            <Link to="/signup" className="btn-shine btn-amber text-[16px]">
              Skapa konto
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/login" className="btn-link text-cream/65">
              Jag har redan ett
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============== Small Reveal helper ============== */
function Reveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: 0 | 1 | 2 | 3 | 4;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{
        duration: 0.8,
        delay: delay * 0.08,
        ease: [0.2, 0.7, 0.2, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
