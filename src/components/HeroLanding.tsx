import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
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
    <div className="bg-[#f8f7f4]">
      {/* HERO */}
      <section className="mx-auto max-w-[720px] px-6 pb-16 pt-16 text-center sm:pt-20">
        <span className="inline-block text-[11px] font-bold uppercase tracking-[0.18em] text-[#1a5c3a]">
          Det enda HP-verktyget med realtidsmatcher
        </span>

        <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border-2 border-[#1a5c3a] bg-[#e8f5ee] px-4 py-2 text-sm font-bold text-[#1a5c3a] sm:text-base">
          <span aria-hidden>📚</span>
          Ordlista med 8000+ ord som är troliga att komma på nästa HP
        </div>

        <h1
          className="mt-6 text-[36px] leading-[1.1] tracking-tight text-foreground sm:text-[52px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <span className="block font-bold">Tävla mot vänner.</span>
          <span className="block font-light italic">Klättra i rankingen.</span>
          <span className="block font-bold">Klara HP.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-[480px] text-base text-[#6b6b6b] sm:text-[18px]">
          HP Kampen är den enda plattformen för Högskoleprovet med live-matcher,
          ELO-ranking och bot-träning – helt gratis.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            asChild
            className="h-12 w-full bg-[#1a5c3a] px-8 text-white hover:bg-[#154d31] sm:w-auto"
          >
            <Link to="/signup">Skapa gratis konto →</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={scrollHow}
            className="h-12 w-full border-[#1a5c3a] px-8 text-[#1a5c3a] hover:bg-[#e8f5ee] sm:w-auto"
          >
            Se hur det funkar ↓
          </Button>
        </div>

        <p className="mt-5 text-xs text-[#6b6b6b]">
          {stats
            ? `${stats.totalMatches.toLocaleString("sv-SE")} matcher spelade av ${stats.totalPlayers.toLocaleString("sv-SE")} registrerade spelare`
            : "Bli en av de första HP-spelarna"}
        </p>

        <div className="mt-3">
          <button
            type="button"
            onClick={playAsGuest}
            disabled={guestLoading}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#6b6b6b] underline-offset-4 hover:text-foreground hover:underline disabled:opacity-60"
          >
            {guestLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {guestLoading ? "Startar gästläge…" : "Spela som gäst (utan konto)"}
          </button>
        </div>
      </section>

      {/* FEATURE GRID */}
      <section className="border-t border-[#e8e6e0] bg-white px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2
            className="text-center text-[28px] font-semibold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Allt du behöver för att klara HP
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <FeatureCard
              icon="⚡"
              title="Live-matcher mot vänner"
              text="Utmana vänner eller okända spelare i realtid. Privata rum med delbar länk eller öppen kö."
            />
            <FeatureCard
              icon="🏆"
              title="Chess.com-känsla för HP"
              text="Klättra från Brons till Diamant med ett schackinspirerat ELO-system. Se din progression."
            />
            <FeatureCard
              icon="📚"
              title="ORD · MEK · LÄS · ELF · XYZ · KVA · NOG · DTK"
              text="Övningstryck på alla delmoment. Träna i lugn takt eller testa dig i tidspress mot en motståndare."
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="border-t border-[#e8e6e0] bg-[#f8f7f4] px-6 py-16"
      >
        <div className="mx-auto max-w-5xl">
          <h2
            className="text-center text-[28px] font-semibold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Tre steg till bättre HP-resultat
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            <Step
              n="1"
              icon="📝"
              title="Skapa konto (gratis)"
              text="Registrera dig på 30 sekunder. Inget kreditkort."
            />
            <Step
              n="2"
              icon="🎯"
              title="Välj verbal eller matte"
              text="Starta en match direkt mot en bot eller bjud in en vän."
            />
            <Step
              n="3"
              icon="📈"
              title="Kämpa och klättra"
              text="Varje vinst ger ELO. Se din normerade HP-poäng stiga."
            />
          </div>
        </div>
      </section>

      {/* LIVE ACTIVITY */}
      <section className="border-t border-[#e8e6e0] bg-white px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <h2
            className="text-center text-[20px] font-semibold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Senaste matcherna
          </h2>
          <div className="mt-6 overflow-hidden rounded-xl border border-[#e8e6e0] bg-[#f8f7f4]">
            <ActivityTicker recent={stats?.recent ?? []} />
          </div>
        </div>
      </section>

      {/* FOUNDER TESTIMONIAL */}
      <section className="border-t border-[#e8e6e0] bg-[#f8f7f4] px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <figure className="rounded-2xl border border-[#e8e6e0] bg-white p-8 shadow-sm sm:p-10">
            <div className="text-4xl leading-none text-[#1a5c3a]">“</div>
            <blockquote
              className="mt-2 text-[20px] leading-snug text-foreground sm:text-[22px]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              HP Kampen innehåller verktyg jag hade haft stor nytta av när jag
              pluggade till högskoleprovet, helt gratis.
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1a5c3a] text-base font-bold text-white">
                N
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">
                  Niklas
                </div>
                <div className="text-xs text-[#6b6b6b]">
                  Founder · 1.9 på Högskoleprovet
                </div>
              </div>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-[#1a5c3a] px-6 py-20 text-center text-white">
        <h2
          className="text-[36px] font-bold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Redo att testa dig?
        </h2>
        <p className="mt-3 text-base opacity-90">
          Helt gratis. Inget kreditkort.
        </p>
        <div className="mt-8">
          <Button
            asChild
            className="h-[52px] bg-white px-8 text-base font-semibold text-[#1a5c3a] hover:bg-white/90"
          >
            <Link to="/signup">Skapa konto nu</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-[#e8e6e0] bg-white p-6">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f5ee] text-2xl">
        <span aria-hidden>{icon}</span>
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#6b6b6b]">{text}</p>
    </div>
  );
}

function Step({
  n,
  icon,
  title,
  text,
}: {
  n: string;
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl shadow-sm ring-1 ring-[#e8e6e0]">
        <span aria-hidden>{icon}</span>
      </div>
      <div className="mt-3 text-xs font-bold uppercase tracking-wider text-[#1a5c3a]">
        Steg {n}
      </div>
      <h3 className="mt-1 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-[#6b6b6b]">{text}</p>
    </div>
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
      <div className="px-4 py-6 text-center text-sm text-[#6b6b6b]">
        Var bland de första att spela!
      </div>
    );
  }
  return (
    <ul className="divide-y divide-[#e8e6e0]">
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
            className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
          >
            <span className="truncate">
              <span className="text-[#d4a017]">⚡</span>{" "}
              <span className="font-semibold">{winnerName}</span> besegrade{" "}
              <span className="font-medium">{loserName}</span> – {winnerScore ?? 0}/8 rätt
            </span>
            <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-[#6b6b6b]">
              {m.match_type}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
