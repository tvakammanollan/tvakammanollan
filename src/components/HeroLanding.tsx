import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2, CheckCircle2, Zap, Trophy, BookOpen, CalendarDays } from "lucide-react";
import { getNextHpDate } from "@/lib/hp-dates";
import { getLandingStats, type LandingStats } from "@/lib/landing.functions";
import { useGuestPlay } from "@/hooks/useGuestPlay";

const TESTIMONIALS = [
  {
    quote:
      "Det är ett gott tecken när det känns roligt och engagerande att plugga inför högskoleprovet. Det är en ny känsla.",
    name: "Aron",
    score: "2.0",
  },
  {
    quote: "HP Kampen har allt som behövs för att lyckas på högskoleprovet.",
    name: "Gustav",
    score: "1.9",
  },
  {
    quote:
      "HP Kampen innehåller verktyg jag hade haft stor nytta av när jag pluggade till högskoleprovet, helt gratis.",
    name: "Niklas",
    score: "1.9",
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
      <Features />
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

      {/* Edge vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at center, transparent 30%, rgba(5,5,7,0.75) 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-24 text-center">
        {/* HP countdown */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <HeroCountdownChip />
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="display text-balance text-[56px] font-bold leading-[0.95] text-white sm:text-[96px] md:text-[120px] lg:text-[148px]"
        >
          Tävla.
          <br />
          <span className="text-aurora-gradient italic">Klättra.</span>
          <br />
          Klara HP.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 max-w-xl text-[17px] leading-relaxed text-white/60 sm:text-[20px]"
        >
          Live-matcher och ELO-ranking för Högskoleprovet.{" "}
          <span className="font-medium text-white/90">Helt gratis.</span>
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 flex w-full max-w-sm flex-col gap-3"
        >
          <button
            type="button"
            onClick={onGuest}
            disabled={guestLoading}
            className="group relative inline-flex h-[58px] items-center justify-center gap-2 rounded-full bg-white px-8 text-[16px] font-bold text-[#050507] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_60px_-8px_rgba(99,102,241,0.65)] disabled:opacity-60"
          >
            {guestLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {guestLoading ? "Startar…" : "Testa gratis — ingen registrering"}
            {!guestLoading && (
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            )}
          </button>
          <Link
            to="/signup"
            className="inline-flex h-[46px] items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 text-[14px] font-medium text-white backdrop-blur-sm transition hover:bg-white/10"
          >
            Skapa konto och spara ditt ELO
          </Link>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.72 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] text-white/38"
        >
          {["Inget kreditkort", "30 sek att börja", "Helt anonymt"].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-emerald-400/70" />
              {t}
            </span>
          ))}
        </motion.div>

        {/* Live stats */}
        {stats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 1.0 }}
            className="mt-16 flex items-center gap-10"
          >
            <StatTeaser value={stats.topVerbalElo} label="Verbal-ELO" />
            <span className="h-10 w-px bg-white/12" />
            <StatTeaser value={stats.topMathElo} label="Matte-ELO" />
          </motion.div>
        )}
      </div>

      {/* Scroll hint */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.6 }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
      >
        <motion.div
          animate={reduce ? undefined : { y: [0, 8, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2 text-white/30"
        >
          <span className="text-[9px] font-medium tracking-[0.2em]">SCROLLA</span>
          <span className="h-7 w-px bg-gradient-to-b from-white/30 to-transparent" />
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
      className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 backdrop-blur-sm"
      style={{
        borderColor: "rgba(99,102,241,0.30)",
        background: "rgba(99,102,241,0.10)",
      }}
    >
      <CalendarDays className="h-3 w-3 shrink-0 text-indigo-300" />
      <span className="text-[12px] font-medium tracking-wide text-white/80">
        {next.label} ·{" "}
        <span className="font-bold tabular-nums text-indigo-300">{diffDays} dagar</span>
      </span>
    </span>
  );
}

function StatTeaser({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="display text-[26px] font-bold leading-none text-white tabular-nums">
        {value.toLocaleString("sv-SE")}
      </div>
      <div className="mt-1 text-[9px] uppercase tracking-[0.2em] text-white/38">{label}</div>
    </div>
  );
}

/* ============================================================ */
/* ===  FEATURES — 3 clean cards                            === */
/* ============================================================ */

const FEATURES = [
  {
    icon: <Zap className="h-5 w-5" />,
    title: "Live-matcher",
    text: "Utmana vänner eller okända spelare i realtid. Privata rum med delbar länk.",
    gradient: "from-cyan-400 to-indigo-500",
  },
  {
    icon: <Trophy className="h-5 w-5" />,
    title: "ELO-ranking",
    text: "Klättra från Brons till Diamant med ett schackinspirerat system.",
    gradient: "from-indigo-400 via-violet-500 to-purple-600",
    featured: true,
  },
  {
    icon: <BookOpen className="h-5 w-5" />,
    title: "Alla 8 delprov",
    text: "ORD · MEK · LÄS · ELF · XYZ · KVA · NOG · DTK. Träna eller testa.",
    gradient: "from-violet-400 via-fuchsia-500 to-pink-500",
  },
];

function Features() {
  return (
    <section className="bg-white px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-5 sm:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className={`group relative overflow-hidden rounded-[24px] border border-black/5 bg-white p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.06)] ${
                f.featured ? "sm:-translate-y-3" : ""
              }`}
            >
              <div
                aria-hidden
                className={`absolute inset-0 -z-10 bg-gradient-to-br ${f.gradient} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-25`}
              />
              <div
                className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${f.gradient} text-white shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
              >
                {f.icon}
              </div>
              <h3 className="display text-[22px] font-bold leading-tight text-[#0a0a0f]">
                {f.title}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-neutral-500">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================ */
/* ===  TESTIMONIALS                                        === */
/* ============================================================ */

const GRADIENTS = [
  "from-cyan-400 via-indigo-500 to-violet-600",
  "from-indigo-400 via-violet-500 to-purple-600",
  "from-violet-400 via-fuchsia-500 to-pink-500",
];

function TestimonialsSection() {
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState(1);

  useEffect(() => {
    const id = setInterval(() => {
      setDir(1);
      setActive((p) => (p + 1) % TESTIMONIALS.length);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  const goTo = (i: number) => {
    setDir(i > active ? 1 : -1);
    setActive(i);
  };

  return (
    <section className="bg-white px-6 pb-20 pt-4 sm:pb-28">
      <div className="mx-auto max-w-5xl">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400"
        >
          Vad säger användarna?
        </motion.p>

        {/* Desktop */}
        <div className="hidden gap-5 md:grid md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              transition={{ duration: 0.65, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="group relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-black/5 bg-white p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.06)]"
            >
              <div
                aria-hidden
                className={`absolute inset-0 -z-10 bg-gradient-to-br ${GRADIENTS[i]} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-20`}
              />
              <p className="text-[15px] leading-relaxed text-[#0a0a0f]">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3 border-t border-black/5 pt-5">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${GRADIENTS[i]} text-sm font-bold text-white shadow-sm`}
                >
                  {t.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#050507]">{t.name}</p>
                  {t.founder && <p className="text-xs text-neutral-400">Grundare</p>}
                </div>
                <span
                  className={`ml-auto shrink-0 rounded-full bg-gradient-to-r ${GRADIENTS[i]} px-2.5 py-0.5 text-xs font-bold text-white shadow-sm`}
                >
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
                className="flex flex-col justify-between rounded-[24px] border border-black/5 bg-white p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.06)]"
              >
                <p className="text-[15px] leading-relaxed text-[#0a0a0f]">
                  &ldquo;{TESTIMONIALS[active].quote}&rdquo;
                </p>
                <div className="mt-6 flex items-center gap-3 border-t border-black/5 pt-5">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${GRADIENTS[active]} text-sm font-bold text-white`}
                  >
                    {TESTIMONIALS[active].name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#050507]">{TESTIMONIALS[active].name}</p>
                    {TESTIMONIALS[active].founder && (
                      <p className="text-xs text-neutral-400">Grundare</p>
                    )}
                  </div>
                  <span className={`ml-auto shrink-0 rounded-full bg-gradient-to-r ${GRADIENTS[active]} px-2.5 py-0.5 text-xs font-bold text-white`}>
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
/* ===  FINAL CTA                                           === */
/* ============================================================ */

function FinalCTA() {
  return (
    <section
      className="relative overflow-hidden px-6 py-24 text-center text-white sm:py-32"
      style={{ background: "linear-gradient(135deg,#050507 0%,#0d0b1e 50%,#050507 100%)" }}
    >
      {/* Subtle glow orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/3 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/15 blur-[100px]" />
        <div className="absolute right-1/4 top-2/3 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/12 blur-[80px]" />
      </div>

      <div className="relative mx-auto max-w-2xl">
        <motion.h2
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="display text-[48px] font-bold leading-[1.02] text-white sm:text-[72px]"
          style={{ letterSpacing: "-0.025em" }}
        >
          Redo att{" "}
          <span className="text-aurora-gradient italic">testa dig?</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto mt-5 max-w-md text-[17px] text-white/50"
        >
          Helt gratis. Inget kreditkort. Bara du, motståndarna och poängen som klättrar.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
        >
          <Link
            to="/signup"
            className="group inline-flex h-[58px] items-center gap-2 rounded-full bg-white px-10 text-[16px] font-semibold text-[#050507] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_55px_-8px_rgba(99,102,241,0.55)]"
          >
            Skapa konto
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to="/login"
            className="inline-flex h-[58px] items-center gap-2 rounded-full border border-white/12 bg-white/5 px-10 text-[16px] font-medium text-white transition hover:bg-white/10"
          >
            Jag har redan konto
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
