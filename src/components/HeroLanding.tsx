import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getLandingStats, type LandingStats } from "@/lib/landing.functions";

export function HeroLanding() {
  const navigate = useNavigate();
  const fetchStats = useServerFn(getLandingStats);
  const [guestLoading, setGuestLoading] = useState(false);
  const [stats, setStats] = useState<LandingStats | null>(null);

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch(() => setStats(null));
  }, [fetchStats]);

  const playAsGuest = async () => {
    setGuestLoading(true);
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      setGuestLoading(false);
      toast.error("Kunde inte starta gästläge", { description: error.message });
      return;
    }
    navigate({ to: "/" });
  };

  const scrollHow = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="overflow-hidden">
      {/* ============== HERO ============== */}
      <section className="relative px-6 pt-12 pb-24 sm:pt-20 sm:pb-32">
        {/* Decorative glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(26, 92, 58, 0.12), transparent 70%), radial-gradient(ellipse 30% 25% at 80% 10%, rgba(212, 160, 23, 0.10), transparent 70%)",
          }}
        />

        <div className="mx-auto max-w-[820px] text-center">
          {/* Live pill */}
          <div className="animate-fade-in mx-auto mb-8 flex w-fit items-center gap-2.5 rounded-full border border-[#d4cdb8] bg-white/70 px-4 py-1.5 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1a5c3a] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#1a5c3a]" />
            </span>
            <span className="eyebrow text-[#0f4029]">
              Det enda HP-verktyget med realtidsmatcher
            </span>
          </div>

          {/* Editorial headline */}
          <h1 className="animate-fade-up display text-[44px] leading-[0.98] text-[#0d1f17] sm:text-[80px] md:text-[96px]">
            <span className="block font-black">Tävla.</span>
            <span className="block font-light italic text-[#1a5c3a]">
              Klättra.
            </span>
            <span className="block font-black">
              Klara{" "}
              <span className="relative inline-block">
                <span className="text-gold-gradient">HP</span>
                <svg
                  aria-hidden
                  viewBox="0 0 120 12"
                  className="absolute -bottom-2 left-0 w-full text-[#d4a017]"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M2 8 Q 30 1, 60 6 T 118 4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              .
            </span>
          </h1>

          {/* Subhead */}
          <p className="animate-fade-up delay-100 mx-auto mt-10 max-w-[540px] text-balance text-[17px] leading-relaxed text-[#3f463f] sm:text-[19px]">
            Den enda plattformen för Högskoleprovet med{" "}
            <span className="font-semibold text-[#0d1f17]">live-matcher</span>,{" "}
            <span className="font-semibold text-[#0d1f17]">ELO-ranking</span> och{" "}
            <span className="font-semibold text-[#0d1f17]">bot-träning</span>.
            Helt gratis.
          </p>

          {/* CTAs */}
          <div className="animate-fade-up delay-200 mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              className="btn-shine group h-[52px] w-full overflow-hidden bg-[#1a5c3a] px-8 text-base font-semibold text-white shadow-[var(--shadow-glow-green)] transition-all hover:-translate-y-0.5 hover:bg-[#0f4029] sm:w-auto"
            >
              <Link to="/signup" className="inline-flex items-center gap-2">
                Skapa gratis konto
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={scrollHow}
              className="h-[52px] w-full px-8 text-base font-medium text-[#0d1f17] hover:bg-[#1a5c3a]/5 sm:w-auto"
            >
              Se hur det funkar
            </Button>
          </div>

          <div className="animate-fade-up delay-300 mt-8 flex flex-col items-center gap-1.5">
            <p className="text-xs text-[#6b6b6b]">
              {stats
                ? `${stats.totalMatches.toLocaleString("sv-SE")} matcher spelade av ${stats.totalPlayers.toLocaleString("sv-SE")} registrerade spelare`
                : "Bli en av de första HP-spelarna"}
            </p>
            <button
              type="button"
              onClick={playAsGuest}
              disabled={guestLoading}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#3f463f] underline decoration-[#1a5c3a]/30 decoration-2 underline-offset-4 transition hover:text-[#1a5c3a] hover:decoration-[#1a5c3a] disabled:opacity-60"
            >
              {guestLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {guestLoading
                ? "Startar gästläge…"
                : "eller spela som gäst (utan konto)"}
            </button>
          </div>

          {/* Ord-databas crest */}
          <div className="animate-fade-up delay-400 mt-16 inline-flex items-center gap-3 rounded-2xl border border-[#d4cdb8] bg-white/70 px-5 py-3 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-[#d4a017]" />
            <span className="text-sm font-medium text-[#0d1f17]">
              Ordlista med{" "}
              <span className="font-bold text-[#1a5c3a]">8 000+</span> ord
              troliga att komma på nästa HP
            </span>
          </div>
        </div>

        {/* Floating decorative cards */}
        <FloatingCards />
      </section>

      {/* ============== TRUST RIBBON ============== */}
      <section className="border-y border-[#d4cdb8] bg-ink bg-grid-ink py-7">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-12 gap-y-3 px-6 text-center">
          <RibbonStat
            number={stats ? stats.totalMatches.toLocaleString("sv-SE") : "—"}
            label="matcher spelade"
          />
          <Bullet />
          <RibbonStat
            number={stats ? stats.totalPlayers.toLocaleString("sv-SE") : "—"}
            label="aktiva spelare"
          />
          <Bullet />
          <RibbonStat number="8 000+" label="HP-ord i databasen" />
          <Bullet />
          <RibbonStat number="0 kr" label="alltid gratis" />
        </div>
      </section>

      {/* ============== FEATURE GRID ============== */}
      <section className="bg-paper px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-[640px] text-center">
            <p className="eyebrow text-[#1a5c3a]">Funktionerna</p>
            <h2 className="display mt-3 text-[36px] leading-tight text-[#0d1f17] sm:text-[48px]">
              Allt du behöver för{" "}
              <span className="display-italic font-medium text-[#1a5c3a]">
                att klara HP
              </span>
            </h2>
            <div className="rule-ornate mt-6 px-12">
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                fill="currentColor"
              >
                <path d="M12 2l1.8 5.5H19l-4.6 3.4 1.8 5.6L12 13l-4.2 3.5 1.8-5.6L5 7.5h5.2z" />
              </svg>
            </div>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            <FeatureCard
              icon={<LightningIcon />}
              title="Live-matcher mot vänner"
              text="Utmana vänner eller okända spelare i realtid. Privata rum med delbar länk eller öppen kö för matchmaking."
              accent="green"
            />
            <FeatureCard
              icon={<TrophyIcon />}
              title="Chess.com-känsla för HP"
              text="Klättra från Brons till Diamant med ett schackinspirerat ELO-system. Se din progression över tid."
              accent="gold"
              featured
            />
            <FeatureCard
              icon={<BookIcon />}
              title="Alla 8 delmoment"
              text="ORD · MEK · LÄS · ELF · XYZ · KVA · NOG · DTK — träna i lugn takt eller testa dig under tidspress."
              accent="green"
            />
          </div>
        </div>
      </section>

      {/* ============== HOW IT WORKS ============== */}
      <section
        id="how-it-works"
        className="relative overflow-hidden bg-[#f5f1e8] px-6 py-24"
      >
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-[640px] text-center">
            <p className="eyebrow text-[#1a5c3a]">Så här funkar det</p>
            <h2 className="display mt-3 text-[36px] leading-tight text-[#0d1f17] sm:text-[48px]">
              Tre steg till{" "}
              <span className="display-italic font-medium text-[#1a5c3a]">
                bättre HP-resultat
              </span>
            </h2>
          </div>

          <div className="relative mt-16 grid gap-8 sm:grid-cols-3">
            {/* Dotted connector line */}
            <div
              aria-hidden
              className="absolute left-[10%] right-[10%] top-[34px] hidden h-px sm:block"
              style={{
                background:
                  "repeating-linear-gradient(90deg, #c8c0b4 0 6px, transparent 6px 14px)",
              }}
            />
            <Step
              n="1"
              title="Skapa konto"
              text="Registrera dig på 30 sekunder. Inget kreditkort, ingen krångel."
            />
            <Step
              n="2"
              title="Välj verbal eller matte"
              text="Starta en match direkt mot en bot eller bjud in en vän med en länk."
            />
            <Step
              n="3"
              title="Kämpa och klättra"
              text="Varje vinst ger ELO. Se din normerade HP-poäng stiga vecka för vecka."
            />
          </div>
        </div>
      </section>

      {/* ============== LIVE ACTIVITY ============== */}
      <section className="bg-paper px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="eyebrow text-[#1a5c3a]">Senaste arenan</p>
            <h2 className="display mt-3 text-[28px] font-semibold text-[#0d1f17] sm:text-[32px]">
              Live på{" "}
              <span className="display-italic font-medium text-[#1a5c3a]">
                arenan
              </span>{" "}
              just nu
            </h2>
          </div>
          <div className="surface-paper mt-8 overflow-hidden rounded-2xl">
            <ActivityTicker recent={stats?.recent ?? []} />
          </div>
        </div>
      </section>

      {/* ============== FOUNDER TESTIMONIAL ============== */}
      <section className="bg-[#f5f1e8] px-6 py-24">
        <div className="mx-auto max-w-2xl">
          <figure className="surface-elevated relative rounded-3xl p-10 sm:p-14">
            <div
              aria-hidden
              className="absolute -left-2 -top-6 text-[120px] leading-none text-[#1a5c3a]/15"
              style={{ fontFamily: "var(--font-display)" }}
            >
              "
            </div>
            <blockquote className="display relative text-[22px] leading-[1.35] text-[#0d1f17] sm:text-[26px]">
              HP Kampen innehåller verktyg jag hade haft{" "}
              <span className="display-italic font-medium text-[#1a5c3a]">
                stor nytta av
              </span>{" "}
              när jag pluggade till högskoleprovet — helt gratis.
            </blockquote>
            <figcaption className="mt-8 flex items-center gap-4 border-t border-[#e6e0d2] pt-6">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#1a5c3a] to-[#0f4029] text-lg font-bold text-white shadow-md">
                N
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#d4a017]">
                  <svg viewBox="0 0 24 24" className="h-3 w-3 fill-white">
                    <path d="M12 2l1.8 5.5H19l-4.6 3.4 1.8 5.6L12 13l-4.2 3.5 1.8-5.6L5 7.5h5.2z" />
                  </svg>
                </span>
              </div>
              <div>
                <div
                  className="text-base font-semibold text-[#0d1f17]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Niklas
                </div>
                <div className="text-xs text-[#6b6b6b]">
                  Grundare · 1.9 på Högskoleprovet
                </div>
              </div>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ============== FINAL CTA — DRAMATIC INK ============== */}
      <section className="relative overflow-hidden bg-ink bg-grid-ink px-6 py-28 text-center text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 50% 50% at 50% 0%, rgba(212, 160, 23, 0.15), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-2xl">
          <p className="eyebrow text-[#d4a017]">Sista anhalten</p>
          <h2 className="display mt-4 text-[44px] leading-[1.05] text-white sm:text-[64px]">
            Redo att{" "}
            <span className="display-italic text-gold-gradient font-medium">
              testa dig
            </span>
            ?
          </h2>
          <p className="mx-auto mt-6 max-w-md text-base text-white/70">
            Helt gratis. Inget kreditkort. Bara du, motståndarna och poängen som
            klättrar.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              className="btn-shine group h-[56px] overflow-hidden bg-white px-8 text-base font-semibold text-[#0d1f17] hover:bg-white/95"
            >
              <Link to="/signup" className="inline-flex items-center gap-2">
                Skapa konto nu
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="h-[56px] px-8 text-base font-medium text-white hover:bg-white/10"
            >
              <Link to="/login">Jag har redan konto</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------------- Subcomponents ---------------- */

function FeatureCard({
  icon,
  title,
  text,
  accent,
  featured,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  accent: "green" | "gold";
  featured?: boolean;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-white p-7 transition-all duration-300 hover:-translate-y-1 ${
        featured
          ? "border-[#d4a017]/40 shadow-[var(--shadow-glow-gold)]"
          : "border-[#e6e0d2] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-md)]"
      }`}
    >
      {featured && (
        <div className="absolute right-4 top-4">
          <span className="rounded-full bg-[#d4a017]/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8a6c0e]">
            Populärast
          </span>
        </div>
      )}
      <div
        className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ${
          accent === "gold"
            ? "bg-gradient-to-br from-[#fdf3d0] to-[#fae6a0] text-[#8a6c0e]"
            : "bg-gradient-to-br from-[#e8f2ec] to-[#d4e8db] text-[#1a5c3a]"
        }`}
      >
        {icon}
      </div>
      <h3
        className="text-[20px] font-semibold leading-tight text-[#0d1f17]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h3>
      <p className="mt-2.5 text-[14px] leading-relaxed text-[#5a5a5a]">
        {text}
      </p>
    </div>
  );
}

function Step({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <div className="relative text-center">
      <div className="relative z-10 mx-auto flex h-[68px] w-[68px] items-center justify-center rounded-full border border-[#d4cdb8] bg-white shadow-[var(--shadow-md)]">
        <span
          className="text-gold-gradient text-[30px] font-bold"
          style={{
            fontFamily: "var(--font-display)",
            backgroundSize: "200% 200%",
          }}
        >
          {n}
        </span>
      </div>
      <h3
        className="mt-5 text-[20px] font-semibold text-[#0d1f17]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h3>
      <p className="mx-auto mt-2 max-w-[260px] text-sm leading-relaxed text-[#5a5a5a]">
        {text}
      </p>
    </div>
  );
}

function RibbonStat({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <div
        className="text-[28px] font-bold leading-none text-white tabular-nums"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {number}
      </div>
      <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/55">
        {label}
      </div>
    </div>
  );
}

function Bullet() {
  return (
    <span className="hidden h-1 w-1 rounded-full bg-white/30 sm:inline-block" />
  );
}

function FloatingCards() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 hidden lg:block"
    >
      <div
        className="animate-float absolute left-[8%] top-[35%] -rotate-6 rounded-2xl border border-[#d4cdb8] bg-white/80 px-4 py-3 shadow-[var(--shadow-lg)] backdrop-blur-sm"
        style={{ animationDelay: "0.5s" }}
      >
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#8a6c0e]">
          ⚡ Live match
        </div>
        <div
          className="mt-1 text-sm font-semibold text-[#0d1f17]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Emma vs Oscar
        </div>
        <div className="mt-0.5 text-xs text-[#5a5a5a]">7–5 · ORD</div>
      </div>
      <div
        className="animate-float absolute right-[6%] top-[42%] rotate-6 rounded-2xl border border-[#d4cdb8] bg-white/80 px-4 py-3 shadow-[var(--shadow-lg)] backdrop-blur-sm"
        style={{ animationDelay: "1.2s" }}
      >
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#1a5c3a]">
          🏆 Ny rank
        </div>
        <div
          className="mt-1 text-sm font-semibold text-[#0d1f17]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Diamant 1850
        </div>
        <div className="mt-0.5 text-xs text-[#5a5a5a]">+24 ELO</div>
      </div>
    </div>
  );
}

function LightningIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
      <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
      <path d="M5 4h14v3a5 5 0 01-5 5h-.5l.5 4h2v2H8v-2h2l.5-4H10A5 5 0 015 7V4zm-2 1h2v2a3 3 0 003 3v2a5 5 0 01-5-5V5zm16 0h2v2a5 5 0 01-5 5v-2a3 3 0 003-3V5z" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
      <path d="M4 4a2 2 0 012-2h12a2 2 0 012 2v16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v14h12V4H6zm2 3h8v2H8V7zm0 4h8v2H8v-2zm0 4h5v2H8v-2z" />
    </svg>
  );
}

function ActivityTicker({
  recent,
}: {
  recent: Array<{
    id: string;
    match_type: string;
    is_bot_match: boolean;
    player1_score: number | null;
    player2_score: number | null;
    winner_id: string | null;
    player1_id: string;
    player2_id: string | null;
    p1_name: string | null;
    p2_name: string | null;
  }>;
}) {
  if (recent.length === 0) {
    return (
      <div className="px-6 py-10 text-center text-sm text-[#6b6b6b]">
        Var bland de första att spela en match!
      </div>
    );
  }
  return (
    <ul className="divide-y divide-[#e6e0d2]">
      {recent.map((m) => {
        const winnerIsP1 = m.winner_id === m.player1_id;
        const winnerName = winnerIsP1
          ? m.p1_name ?? "Spelare"
          : m.p2_name ?? (m.is_bot_match ? "HP-Bot" : "Spelare");
        const loserName = winnerIsP1
          ? m.p2_name ?? (m.is_bot_match ? "HP-Bot" : "Spelare")
          : m.p1_name ?? "Spelare";
        const winnerScore = winnerIsP1 ? m.player1_score : m.player2_score;
        return (
          <li
            key={m.id}
            className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm transition hover:bg-[#fbfaf6]"
          >
            <span className="flex items-center gap-2.5 truncate">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#fdf3d0] text-[#d4a017]">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                  <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
                </svg>
              </span>
              <span className="truncate">
                <span className="font-semibold text-[#0d1f17]">{winnerName}</span>{" "}
                <span className="text-[#6b6b6b]">besegrade</span>{" "}
                <span className="font-medium text-[#0d1f17]">{loserName}</span>
                <span className="ml-1.5 font-medium text-[#1a5c3a] tabular-nums">
                  {winnerScore ?? 0}/8
                </span>
              </span>
            </span>
            <span className="shrink-0 rounded-full border border-[#e6e0d2] bg-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#6b6b6b]">
              {m.match_type}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
