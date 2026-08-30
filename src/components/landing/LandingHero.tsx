import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { m } from "framer-motion";
import { Star } from "lucide-react";
import type { DemoQuestion, LandingStats } from "@/lib/landing.functions";
import { formatDecimal, formatInt } from "@/lib/sv-format";
import { SNITTBETYG } from "@/data/omdomen";

/**
 * Hjälten: en riktig uppgift man kan svara på, inte ett löfte om en.
 *
 * Frågorna kommer ur route-loadern (`fetchLandingDemoQuestions`) och ligger
 * alltså i den serverrenderade HTML:en. En crawler ser en verklig
 * ORD-uppgift med sina fem alternativ, och ingen provpass-chunk dras in i
 * landningsbundlen.
 *
 * ELO-siffran här är en demonstration av mekaniken, inte ett påstående om
 * besökaren. Den börjar på 1000, samma startvärde som ett riktigt konto.
 */

/** Stjärnor med delfyllnad. Fem hela bredvid "4,8" säger emot siffran. */
export function Stjarnor({ betyg = 5, storlek = 14 }: { betyg?: number; storlek?: number }) {
  return (
    <span
      className="inline-flex select-none gap-0.5 align-middle"
      aria-label={`${formatDecimal(betyg, Number.isInteger(betyg) ? 0 : 1)} av 5`}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const fyllnad = Math.max(0, Math.min(1, betyg - i));
        return (
          <span
            key={i}
            className="relative inline-flex"
            style={{ height: storlek, width: storlek }}
            aria-hidden
          >
            <Star className="text-primary" style={{ height: storlek, width: storlek }} />
            {fyllnad > 0 ? (
              <span
                className="absolute inset-y-0 left-0 overflow-hidden"
                style={{ width: `${fyllnad * 100}%` }}
              >
                <Star
                  className="fill-primary text-primary"
                  style={{ height: storlek, width: storlek }}
                />
              </span>
            ) : null}
          </span>
        );
      })}
    </span>
  );
}

const START_ELO = 1000;

function LevandeFraga({ fragor }: { fragor: DemoQuestion[] }) {
  const [idx, setIdx] = useState(0);
  const [valt, setValt] = useState<string | null>(null);
  const [elo, setElo] = useState(START_ELO);
  const [delta, setDelta] = useState<number | null>(null);

  const fraga = fragor[idx % fragor.length];
  const svarat = valt !== null;
  const ratt = svarat && valt === fraga.ratt;

  function svara(id: string) {
    if (svarat) return;
    setValt(id);
    // Storleksordningen speglar K-faktorn för ett nytt konto (<1500 → 96),
    // men det här är en demonstration och inte en riktig uträkning.
    const d = id === fraga.ratt ? 14 : -11;
    setDelta(d);
    setElo((e) => e + d);
  }

  function nasta() {
    setIdx((i) => i + 1);
    setValt(null);
    setDelta(null);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-card">
      <div className="flex items-center gap-3 border-b border-white/10 bg-secondary px-4 py-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-bark">
          Ordförståelse
        </span>
        <span className="ml-auto font-mono text-[11px] uppercase tracking-[0.14em] text-white/55">
          Prova direkt
        </span>
      </div>

      <div className="px-4 pb-4 pt-5">
        <p className="font-display text-[28px] leading-[1.05] tracking-tight sm:text-[32px]">
          {fraga.ord}
        </p>
        <p className="mt-1.5 text-[13px] text-white/55">Vad betyder ordet?</p>

        <div className="mt-4 grid gap-1.5" role="group" aria-label="Svarsalternativ">
          {fraga.alternativ.map((a) => {
            const arRatt = svarat && a.id === fraga.ratt;
            const arFel = svarat && a.id === valt && a.id !== fraga.ratt;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => svara(a.id)}
                disabled={svarat}
                className={`flex min-h-[46px] w-full items-center gap-3 rounded-md border px-3 py-2 text-left text-[15px] leading-tight transition-colors ${
                  arRatt
                    ? "border-success bg-success-soft"
                    : arFel
                      ? "border-danger bg-danger-soft"
                      : "border-white/10 hover:border-white/25 hover:bg-white/[0.03]"
                }`}
              >
                <span
                  className={`grid h-[26px] w-[26px] shrink-0 place-items-center rounded-sm font-mono text-[12px] font-medium ${
                    arRatt
                      ? "bg-success text-success-ink"
                      : arFel
                        ? "bg-danger text-danger-ink"
                        : "bg-secondary text-white/70"
                  }`}
                >
                  {a.id}
                </span>
                {/* Svarstexten behåller sin färg. Brickan bär statusen — den
                    som just svarat vill kunna läsa vad ordet betydde. */}
                <span>{a.text}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex min-h-[60px] flex-wrap items-center gap-3 border-t border-white/10 px-4 py-3">
        <span
          className={`text-[14px] font-bold ${
            !svarat ? "text-white/55" : ratt ? "text-success" : "text-destructive"
          }`}
          aria-live="polite"
        >
          {!svarat ? "Välj ett alternativ" : ratt ? "Rätt." : `Fel. Rätt svar är ${fraga.ratt}.`}
        </span>
        {svarat ? (
          <button
            type="button"
            onClick={nasta}
            className="min-h-[44px] text-[14px] font-bold text-primary hover:underline"
          >
            Nästa ord
          </button>
        ) : null}
        <span className="ml-auto flex items-baseline gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/55">
            ELO
          </span>
          <span className="font-mono text-[22px] font-medium tabular-nums tracking-tight">
            {formatInt(elo)}
          </span>
          {delta !== null ? (
            <span
              className={`font-mono text-[13px] font-medium ${delta > 0 ? "text-success" : "text-destructive"}`}
            >
              {delta > 0 ? "+" : ""}
              {delta}
            </span>
          ) : null}
        </span>
      </div>
    </div>
  );
}

export function LandingHero({
  fragor,
  stats,
}: {
  fragor: DemoQuestion[];
  stats: LandingStats | null;
}) {
  return (
    <section className="border-b border-white/10">
      <div className="mx-auto grid max-w-6xl items-start gap-10 px-4 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,480px)] lg:gap-16">
        <div>
          <m.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-[11ch] text-[46px] leading-[1.02] tracking-[-0.045em] sm:text-[68px]"
          >
            Svara nu. Siffran rör sig <span className="text-primary">direkt</span>.
          </m.h1>

          <m.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.06 }}
            className="mt-6 max-w-[44ch] text-[18px] leading-relaxed text-white/70"
          >
            Dueller i realtid på riktiga provfrågor. Din ELO justeras efter varje match, separat för
            verbal och kvantitativ del, och räknas om till den poäng du faktiskt skriver på provet.
          </m.p>

          <m.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link
              to="/matchmaking"
              search={{ type: "verbal" }}
              className="inline-flex min-h-[52px] items-center justify-center rounded-md bg-primary px-7 text-[15px] font-bold text-on-brand transition-colors hover:bg-primary-deep"
            >
              Starta en duell
            </Link>
            <Link
              to="/gamla-prov"
              className="inline-flex min-h-[52px] items-center justify-center rounded-md border border-white/25 px-7 text-[15px] font-bold transition-colors hover:bg-white/[0.05]"
            >
              Öppna arkivet
            </Link>
          </m.div>

          {/* Social proof direkt under CTA:n. Siffrorna är riktiga och
              kommer ur getLandingStats, inte ur en konstant. */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px] text-white/70"
          >
            {stats ? (
              <>
                <span className="inline-flex items-baseline gap-1.5">
                  <b className="font-mono text-[16px] font-medium tabular-nums text-foreground">
                    {formatInt(stats.totalPlayers)}
                  </b>
                  spelare
                </span>
                <span className="h-[3px] w-[3px] rounded-full bg-white/25" aria-hidden />
                <span className="inline-flex items-baseline gap-1.5">
                  <b className="font-mono text-[16px] font-medium tabular-nums text-foreground">
                    {formatInt(stats.totalMatches)}
                  </b>
                  matcher spelade
                </span>
                <span className="h-[3px] w-[3px] rounded-full bg-white/25" aria-hidden />
              </>
            ) : null}
            <span className="inline-flex items-center gap-2">
              <Stjarnor betyg={SNITTBETYG} />
              <b className="font-mono text-[16px] font-medium tabular-nums text-foreground">
                {formatDecimal(SNITTBETYG, 1)}
              </b>
            </span>
          </m.div>

          <p className="mt-4 text-[13.5px] text-white/55">
            Inget konto behövs. Gratis, hela vägen.
          </p>
        </div>

        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {fragor.length > 0 ? (
            <LevandeFraga fragor={fragor} />
          ) : (
            // Databasen svarade inte. Hellre ingen ruta än en tom ruta.
            <div className="rounded-xl border border-white/10 bg-card p-6">
              <p className="text-[15px] text-white/70">
                Åtta delprov, 8 761 ord och 30 hela prov med facit. Börja var du vill.
              </p>
              <Link
                to="/ord"
                className="mt-4 inline-flex min-h-[44px] items-center text-[14px] font-bold text-primary hover:underline"
              >
                Öva ord
              </Link>
            </div>
          )}
        </m.div>
      </div>
    </section>
  );
}
