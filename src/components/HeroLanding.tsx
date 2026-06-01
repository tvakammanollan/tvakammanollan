import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, useReducedMotion, useInView, AnimatePresence } from "framer-motion";
import {
  Loader2,
  ArrowRight,
  CheckCircle2,
  CalendarDays,
} from "lucide-react";
import { getNextHpDate } from "@/lib/hp-dates";
import { getBotName } from "@/lib/bot";
import { getLandingStats, type LandingStats } from "@/lib/landing.functions";
import { useGuestPlay } from "@/hooks/useGuestPlay";
import { SplitText, VelocityMarquee, TiltLayer } from "@/components/landing/MotionFX";
import { RANK_TIERS } from "@/types";

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
  {
    quote:
      "HP Kampen innehåller verktyg jag hade haft stor nytta av när jag pluggade till högskoleprovet, helt gratis.",
    name: "Niklas",
    score: "1.95",
    founder: true,
  },
];

// HP Kampen aurora shader — indigo / violet / cyan palette
const SHADER_SRC = `#version 300 es
precision highp float;
out vec4 O;
uniform vec2 resolution;
uniform float time;
#define FC gl_FragCoord.xy
#define T time
#define R resolution
#define MN min(R.x,R.y)
float rnd(vec2 p){
  p=fract(p*vec2(12.9898,78.233));
  p+=dot(p,p+34.56);
  return fract(p.x*p.y);
}
float noise(in vec2 p){
  vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);
  float a=rnd(i),b=rnd(i+vec2(1,0)),c=rnd(i+vec2(0,1)),d=rnd(i+1.);
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
}
float fbm(vec2 p){
  float t=.0,a=1.;mat2 m=mat2(1.,-.5,.2,1.2);
  for(int i=0;i<5;i++){t+=a*noise(p);p*=2.*m;a*=.5;}
  return t;
}
float clouds(vec2 p){
  float d=1.,t=.0;
  for(float i=.0;i<3.;i++){
    float a=d*fbm(i*10.+p.x*.2+.2*(1.+i)*p.y+d+i*i+p);
    t=mix(t,d,a);d=a;p*=2./(i+1.);
  }
  return t;
}
void main(void){
  vec2 uv=(FC-.5*R)/MN,st=uv*vec2(2,1);
  vec3 col=vec3(0);
  float bg=clouds(vec2(st.x+T*.4,-st.y));
  uv*=1.-.3*(sin(T*.2)*.5+.5);
  for(float i=1.;i<12.;i++){
    uv+=.1*cos(i*vec2(.1+.01*i,.8)+i*i+T*.5+.1*uv.x);
    vec2 p=uv;
    float d=length(p);
    col+=.00125/d*(cos(sin(i)*vec3(3.1,2.6,0.4))+1.);
    float b=noise(i+p+bg*1.731);
    col+=.002*b/length(max(p,vec2(b*p.x*.02,p.y)));
    col=mix(col,vec3(bg*.012,bg*.008,bg*.16),d);
  }
  col*=vec3(0.42,0.48,1.65);
  O=vec4(col,1);
}`;

function useShaderCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2");
    if (!gl) return;

    const dpr = Math.max(1, 0.5 * window.devicePixelRatio);

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();

    const makeShader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const vs = makeShader(
      gl.VERTEX_SHADER,
      `#version 300 es
      precision highp float;
      in vec4 position;
      void main(){gl_Position=position;}`,
    );
    const fs = makeShader(gl.FRAGMENT_SHADER, SHADER_SRC);

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("Shader link error:", gl.getProgramInfoLog(prog));
      return;
    }

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]),
      gl.STATIC_DRAW,
    );
    const posLoc = gl.getAttribLocation(prog, "position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "resolution");
    const uTime = gl.getUniformLocation(prog, "time");

    const loop = (now: number) => {
      gl.useProgram(prog);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, now * 1e-3);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return canvasRef;
}

export function HeroLanding() {
  const fetchStats = useServerFn(getLandingStats);
  const [stats, setStats] = useState<LandingStats | null>(null);
  const { play: playAsGuest, loading: guestLoading } = useGuestPlay();

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch(() => setStats(null));
  }, [fetchStats]);

  return (
    <div className="relative overflow-hidden">
      <Hero stats={stats} guestLoading={guestLoading} onGuest={playAsGuest} />
      <Ribbon />
      <ProductShowcase />
      <RecentMatches stats={stats} />
      <EloTiers />
      <ProofSection stats={stats} />
      <TestimonialsSection />
      <FinalCTA />
    </div>
  );
}

/* ============================================================ */
/* ===  HERO — WebGL shader + minimal overlay               === */
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
  const canvasRef = useShaderCanvas();
  const reduce = useReducedMotion();

  return (
    <section className="relative min-h-screen overflow-hidden bg-black text-white">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        style={{ background: "#050507" }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at center, transparent 30%, rgba(5,5,7,0.75) 100%)",
        }}
      />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-24 text-center">
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

        <motion.p
          initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 max-w-xl text-balance text-[18px] leading-relaxed text-white/70 sm:text-[22px]"
        >
          Sveriges enda plattform för live HP-matcher med ELO-ranking.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 flex w-full max-w-md flex-col items-center gap-3"
        >
          <button
            type="button"
            onClick={onGuest}
            disabled={guestLoading}
            data-cursor="link"
            className="btn-shine group relative inline-flex h-[64px] w-full items-center justify-center gap-2 rounded-full bg-white px-8 text-[17px] font-bold text-[#050507] shadow-[var(--shadow-glow-aurora)] transition-all hover:shadow-[0_0_80px_-8px_rgba(99,102,241,0.6)] disabled:opacity-60"
          >
            {guestLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {guestLoading ? "Startar…" : "Testa gratis — ingen registrering"}
            {!guestLoading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
          </button>
          <Link
            to="/signup"
            data-cursor="link"
            className="inline-flex h-[46px] items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 text-[14px] font-medium text-white backdrop-blur-sm transition hover:bg-white/10"
          >
            Skapa konto och spara ditt ELO
          </Link>
        </motion.div>

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
      </div>

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
      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 backdrop-blur-sm"
    >
      <CalendarDays className="h-3 w-3 shrink-0 text-white/70" />
      <span className="text-[12px] font-medium tracking-wide text-white/80">
        {next.label} ·{" "}
        <span className="font-bold tabular-nums text-white">{diffDays} dagar</span>
      </span>
    </span>
  );
}

/* ============================================================ */
/* ===  RIBBON                                              === */
/* ============================================================ */

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
      <span className="text-neutral-300" aria-hidden>·</span>
    </span>
  ));
  return (
    <section className="relative overflow-hidden border-y border-black/10 bg-white py-8">
      <VelocityMarquee items={rendered} baseSpeed={0.7} />
    </section>
  );
}

/* ============================================================ */
/* ===  PRODUCT SHOWCASE — in-code match-vy                 === */
/* ============================================================ */

function ProductShowcase() {
  return (
    <section className="bg-white px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="display mx-auto max-w-2xl text-center text-[32px] font-bold leading-[1.1] text-[#050507] sm:text-[44px]"
        >
          Två spelare. Fem minuter. Samma frågor.
          <br />
          <span className="text-neutral-400">Bäst ELO vinner.</span>
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mt-14"
        >
          <MatchPreview />
        </motion.div>
      </div>
    </section>
  );
}

function MatchPreview() {
  return (
    <div className="overflow-hidden rounded-3xl border border-black/8 bg-white shadow-[0_30px_60px_-20px_rgba(0,0,0,0.18),0_8px_20px_-8px_rgba(0,0,0,0.10)]">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-black/5 bg-neutral-50 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-[#6366f1] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            ORD
          </span>
          <span className="text-[12px] font-medium text-neutral-500">Verbal · Match 4 av 8</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-black/8 bg-white px-3 py-1 font-mono text-[12px] font-semibold tabular-nums text-[#050507]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          02:47
        </div>
      </div>

      {/* Players */}
      <div className="grid grid-cols-2 divide-x divide-black/5 border-b border-black/5">
        <PlayerStrip name="Du" elo={1542} score={3} side="left" you />
        <PlayerStrip name="Aron" elo={1518} score={2} side="right" />
      </div>

      {/* Question */}
      <div className="px-6 py-10 sm:px-12 sm:py-14">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
          Synonymer
        </div>
        <p className="mt-4 text-[26px] font-bold leading-snug text-[#050507] sm:text-[32px]">
          Vad betyder ordet <span className="text-[#6366f1]">prekär</span>?
        </p>
        <div className="mt-8 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {[
            { label: "A", text: "Trivial", state: "idle" },
            { label: "B", text: "Bekymmersam", state: "correct" },
            { label: "C", text: "Förutsägbar", state: "idle" },
            { label: "D", text: "Lockande", state: "idle" },
          ].map((opt) => (
            <div
              key={opt.label}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-[15px] transition ${
                opt.state === "correct"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                  : "border-black/8 bg-white text-[#050507]"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold ${
                  opt.state === "correct"
                    ? "bg-emerald-500 text-white"
                    : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {opt.label}
              </span>
              <span className="font-medium">{opt.text}</span>
              {opt.state === "correct" && (
                <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-600" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlayerStrip({
  name,
  elo,
  score,
  you,
}: {
  name: string;
  elo: number;
  score: number;
  side: "left" | "right";
  you?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-bold ${
            you ? "bg-[#6366f1] text-white" : "bg-neutral-200 text-neutral-700"
          }`}
        >
          {name[0]}
        </div>
        <div>
          <div className="text-[14px] font-semibold text-[#050507]">{name}</div>
          <div className="font-mono text-[11px] tabular-nums text-neutral-500">{elo} ELO</div>
        </div>
      </div>
      <div className="font-mono text-[28px] font-bold tabular-nums text-[#050507]">{score}</div>
    </div>
  );
}

/* ============================================================ */
/* ===  RECENT MATCHES                                      === */
/* ============================================================ */

function RecentMatches({ stats }: { stats: LandingStats | null }) {
  const matches = stats?.recent?.slice(0, 6) ?? [];
  if (matches.length === 0) return null;

  return (
    <section className="relative bg-white px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Live just nu
          </span>
        </div>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="display mt-3 text-center text-[32px] font-bold leading-[1.05] text-[#050507] sm:text-[44px]"
        >
          Senaste matcherna
        </motion.h2>

        <ul className="mt-12 space-y-3">
          {matches.map((m, i) => (
            <MatchRow key={m.id} match={m} delay={i * 0.05} />
          ))}
        </ul>

        <div className="mt-8 text-center text-[12px] text-neutral-500">
          Uppdateras varje gång en match avslutas.
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

  const isVerbal = match.match_type === "verbal";
  const matchTypeLabel = isVerbal ? "Verbal" : "Matte";

  return (
    <motion.li
      ref={ref}
      initial={{ opacity: 0, x: -16 }}
      animate={inView ? { opacity: 1, x: 0 } : undefined}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center justify-between gap-4 rounded-2xl border border-black/8 bg-white p-4"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold uppercase tracking-wide ${
            isVerbal
              ? "bg-[#6366f1] text-white"
              : "bg-neutral-900 text-white"
          }`}
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
/* ===  ELO TIERS                                           === */
/* ============================================================ */

function EloTiers() {
  return (
    <section className="bg-white px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="display text-center text-[32px] font-bold leading-[1.05] text-[#050507] sm:text-[44px]"
        >
          Från Brons till Diamant.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mx-auto mt-4 max-w-xl text-center text-[15px] text-neutral-500"
        >
          Schackinspirerat ranking-system. Vinst ger ELO, förlust kostar.
          Varje match räknas.
        </motion.p>

        <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {RANK_TIERS.map((tier, i) => (
            <motion.div
              key={tier.tier}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              className={`rounded-2xl border p-5 text-center ${
                tier.tier === "diamant"
                  ? "border-[#6366f1]/30 bg-gradient-to-br from-white to-indigo-50/40 shadow-[0_0_40px_-12px_rgba(99,102,241,0.35)]"
                  : "border-black/8 bg-white"
              }`}
            >
              <div
                className="mx-auto flex h-12 w-12 items-center justify-center rounded-full text-[20px]"
                style={{
                  background: tier.bgColor,
                  color: tier.textColor,
                  border: `2px solid ${tier.borderColor}`,
                }}
              >
                {tier.icon}
              </div>
              <div className="mt-4 text-[15px] font-bold capitalize text-[#050507]">
                {tier.tier}
              </div>
              <div className="mt-1 font-mono text-[11px] tabular-nums text-neutral-500">
                {tier.minElo}
                {tier.tier === "diamant" ? "+" : ` – ${tier.maxElo}`}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================ */
/* ===  PROOF                                               === */
/* ============================================================ */

function ProofSection({ stats }: { stats: LandingStats | null }) {
  const items = [
    { value: stats?.topVerbalElo ?? 0, label: "Högsta verbal-ELO" },
    { value: stats?.topMathElo ?? 0, label: "Högsta matte-ELO" },
    { value: 8000, suffix: "+", label: "HP-ord i databasen" },
  ];
  return (
    <section className="bg-neutral-50 px-6 py-20 sm:py-24">
      <div className="mx-auto grid max-w-5xl gap-10 sm:grid-cols-3">
        {items.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <div className="display text-[56px] font-bold leading-none tabular-nums text-[#050507] sm:text-[64px]">
              {item.value > 0 ? <CountUp end={item.value} /> : "—"}
              {item.value > 0 ? item.suffix : null}
            </div>
            <div className="mt-3 text-[12px] font-medium uppercase tracking-[0.16em] text-neutral-500">
              {item.label}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ============================================================ */
/* ===  TESTIMONIALS                                        === */
/* ============================================================ */

function TestimonialsSection() {
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState(1);

  const goTo = (i: number) => {
    setDir(i > active ? 1 : -1);
    setActive(i);
  };

  return (
    <section className="bg-white px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <p className="mb-10 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
          Vad säger användarna?
        </p>

        <div className="hidden gap-5 md:grid md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col justify-between rounded-2xl border border-black/8 bg-white p-7"
            >
              <p className="text-[16px] leading-relaxed text-[#0a0a0f]">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3 border-t border-black/5 pt-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-bold text-[#050507]">
                  {t.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#050507]">{t.name}</p>
                  {t.founder && <p className="text-xs text-neutral-500">Grundare</p>}
                </div>
                <span className="ml-auto shrink-0 rounded-full bg-[#050507] px-2.5 py-0.5 font-mono text-xs font-bold tabular-nums text-white">
                  {t.score}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile carousel */}
        <div className="md:hidden">
          <div className="overflow-hidden rounded-2xl">
            <AnimatePresence initial={false} custom={dir} mode="wait">
              <motion.div
                key={active}
                custom={dir}
                initial={{ opacity: 0, x: dir * 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir * -60 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col justify-between rounded-2xl border border-black/8 bg-white p-7"
              >
                <p className="text-[16px] leading-relaxed text-[#0a0a0f]">
                  &ldquo;{TESTIMONIALS[active].quote}&rdquo;
                </p>
                <div className="mt-6 flex items-center gap-3 border-t border-black/5 pt-5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-bold text-[#050507]">
                    {TESTIMONIALS[active].name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#050507]">{TESTIMONIALS[active].name}</p>
                    {TESTIMONIALS[active].founder && <p className="text-xs text-neutral-500">Grundare</p>}
                  </div>
                  <span className="ml-auto shrink-0 rounded-full bg-[#050507] px-2.5 py-0.5 font-mono text-xs font-bold tabular-nums text-white">
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
                className={`h-2 rounded-full transition-all ${i === active ? "w-5 bg-[#6366f1]" : "w-2 bg-neutral-300"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================ */
/* ===  FINAL CTA                                           === */
/* ============================================================ */

function FinalCTA() {
  return (
    <section className="relative px-6 py-28 text-center text-white sm:py-32" style={{ background: "#050507" }}>
      <div className="relative mx-auto max-w-2xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="display text-[44px] font-bold leading-[1.05] text-white sm:text-[64px]"
        >
          Redo att testa dig?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mx-auto mt-5 max-w-md text-[17px] text-white/60"
        >
          Helt gratis. Inget kreditkort. Bara du, motståndarna och poängen som klättrar.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            to="/signup"
            className="group inline-flex h-[60px] items-center gap-2 rounded-full bg-white px-10 text-[16px] font-semibold text-[#050507] transition-all hover:scale-[1.02]"
          >
            Skapa konto nu
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to="/login"
            className="inline-flex h-[60px] items-center gap-2 rounded-full border border-white/15 bg-white/5 px-10 text-[16px] font-medium text-white hover:bg-white/10"
          >
            Jag har redan konto
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================ */
/* ===  SUB-COMPONENTS                                      === */
/* ============================================================ */

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
      <div className="font-mono text-[26px] font-bold leading-none tabular-nums text-white">
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
