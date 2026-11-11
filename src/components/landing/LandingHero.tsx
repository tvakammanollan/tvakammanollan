import { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { DemoQuestion, LandingStats } from "@/lib/landing.functions";
import { formatInt } from "@/lib/sv-format";

/**
 * Hjälten: en riktig uppgift man kan svara på, inte ett löfte om en.
 *
 * Frågorna kommer ur route-loadern (`fetchLandingDemoQuestions`) och ligger
 * alltså i den serverrenderade HTML:en. En crawler ser en verklig
 * ORD-uppgift med sina 5 alternativ, och ingen provpass-chunk dras in i
 * landningsbundlen.
 *
 * ELO-siffran här är en demonstration av mekaniken, inte ett påstående om
 * besökaren. Den börjar på 1000, samma startvärde som ett riktigt konto.
 */

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
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(6,4,14,0.04),0_24px_48px_-24px_rgba(6,4,14,0.18)]">
      <div className="flex items-center gap-3 border-b border-white/10 bg-secondary px-4 py-3">
        <span className="font-mono text-xs text-bark">Ordförståelse</span>
        <span className="ml-auto font-mono text-xs text-white/55">Prova direkt</span>
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
          <span className="font-mono text-xs text-white/55">ELO</span>
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
    <section className="border-b border-border">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:py-28">
        <div>
          {/* Sidans h1 bär sökordet. Sloganen under är den stora raden, men en
              <p>: "Plugga på de prov som faktiskt har getts" säger ingenting
              om vad sajten är för en sökmotor. */}
          <h1 className="sr-only">Öva på högskoleprovet gratis</h1>
          <p
            className="max-w-[14ch] text-[44px] leading-[0.98] tracking-[-0.035em] text-foreground sm:text-[64px]"
            style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
          >
            Plugga på de prov som faktiskt har getts.
          </p>

          <p className="mt-7 max-w-[34rem] text-[17px] leading-[1.65] text-[var(--cream-3)]">
            Alla 30 provtillfällen från 2012 till 2026, med facit på varje uppgift. Över 10&nbsp;000
            ord med förklaring. Och en duell på 5 minuter när du vill mäta dig mot någon annan.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              to="/signup"
              className="inline-flex min-h-[52px] items-center justify-center rounded-lg bg-primary px-8 text-[15px] font-semibold text-on-brand transition-colors hover:bg-primary-deep"
            >
              Börja öva gratis
            </Link>
            <Link
              to="/gamla-prov"
              className="inline-flex min-h-[44px] items-center text-[15px] font-semibold text-foreground underline decoration-border decoration-2 underline-offset-[6px] transition-colors hover:decoration-foreground"
            >
              Se alla gamla prov
            </Link>
          </div>

          {/* Siffrorna är riktiga och kommer ur getLandingStats, inte ur en
              konstant. Saknas de visas ingenting, aldrig ett påhittat tal. */}
          {stats ? (
            <dl className="mt-12 flex gap-10 border-t border-border pt-6">
              <div>
                <dt className="text-[13px] text-[var(--cream-3)]">Spelare</dt>
                <dd className="mt-1 text-[28px] font-bold leading-none tracking-tight tabular-nums">
                  {formatInt(stats.totalPlayers)}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] text-[var(--cream-3)]">Matcher spelade</dt>
                <dd className="mt-1 text-[28px] font-bold leading-none tracking-tight tabular-nums">
                  {formatInt(stats.totalMatches)}
                </dd>
              </div>
            </dl>
          ) : null}
        </div>

        <div className="w-full max-w-[560px] lg:justify-self-end">
          {fragor.length > 0 ? (
            <LevandeFraga fragor={fragor} />
          ) : (
            // Databasen svarade inte. Hellre ingen ruta än en tom ruta.
            <div className="rounded-xl border border-border bg-card p-6">
              <p className="text-[15px] text-[var(--cream-3)]">
                8 delprov, 10&nbsp;000+ ord och 30 hela prov med facit. Börja var du vill.
              </p>
              <Link
                to="/ord"
                className="mt-4 inline-flex min-h-[44px] items-center text-[14px] font-semibold text-primary hover:underline"
              >
                Öva ord
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
