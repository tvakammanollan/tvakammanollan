import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { m } from "framer-motion";
import type { DemoQuestion, LandingStats } from "@/lib/landing.functions";
import { formatInt } from "@/lib/sv-format";

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
    <section className="relative overflow-hidden border-b border-white/10">
      {/* Dekorformerna är bakgrundsatmosfär, aldrig innehåll: 0,6 till 0,9
          opacitet, ingen interaktion, och de ligger bakom texten. Fyra
          färger ur DESIGN.md:s dekoruppsättning (terracotta, Sky, Lavender,
          Cream). Plum är en kortfyllning och används aldrig som form, för
          en mörk form bakom Ink-text är oläsbar. Se `lib/produktzon.ts`. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-[5%] top-12 h-[148px] w-[168px] opacity-75"
          style={{
            background: "var(--terracotta)",
            borderRadius: "58% 42% 37% 63% / 45% 55% 45% 55%",
          }}
        />
        <div
          className="absolute right-[6%] top-28 h-[172px] w-[196px] opacity-80"
          style={{
            background: "var(--lavender)",
            borderRadius: "42% 58% 61% 39% / 52% 38% 62% 48%",
          }}
        />
        <div
          className="absolute bottom-6 left-[12%] h-[96px] w-[104px] opacity-70"
          style={{ background: "var(--sky)", borderRadius: "63% 37% 47% 53% / 41% 59% 41% 59%" }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-16 text-center sm:py-24">
        {/* Sidans h1 bär sökordet. Sloganen under är den stora raden, men en
            <p>: "Plugga på de prov som faktiskt har getts" säger ingenting
            om vad sajten är för en sökmotor, och startsidans h1 är den
            starkaste rubriken sajten har. */}
        <h1 className="mb-6 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--cream)]">
          Öva på högskoleprovet gratis
        </h1>
        <m.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-[16ch] text-[44px] leading-none tracking-[-0.03em] sm:text-[60px]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
        >
          Plugga på de prov som faktiskt har getts.
        </m.p>

        <m.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.06 }}
          className="mx-auto mt-6 max-w-[600px] text-[18px] leading-relaxed text-[var(--cream-3)]"
        >
          Alla 30 provtillfällen från 2012 till 2026, med facit på varje uppgift. Över 10&nbsp;000
          ord med förklaring. Och en duell på fem minuter när du vill mäta dig mot någon annan.
        </m.p>

        <m.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            to="/signup"
            className="inline-flex min-h-[52px] items-center justify-center rounded-lg bg-primary px-7 text-[15px] font-semibold text-on-brand transition hover:brightness-125"
          >
            Börja öva gratis
          </Link>
          <Link
            to="/gamla-prov"
            className="inline-flex min-h-[52px] items-center justify-center px-4 text-[15px] font-semibold text-[var(--cream-3)] transition hover:text-[var(--cream)]"
          >
            Se alla gamla prov
          </Link>
        </m.div>

        {/* Siffrorna är riktiga och kommer ur getLandingStats, inte ur en
            konstant. Saknas de visas ingenting, aldrig ett påhittat tal. */}
        {stats ? (
          <m.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-7 text-[13px] text-[var(--cream-3)]"
          >
            <b className="font-semibold tabular-nums text-[var(--cream)]">
              {formatInt(stats.totalPlayers)}
            </b>{" "}
            spelare ·{" "}
            <b className="font-semibold tabular-nums text-[var(--cream)]">
              {formatInt(stats.totalMatches)}
            </b>{" "}
            matcher spelade
          </m.p>
        ) : null}
      </div>

      <div className="relative mx-auto max-w-[720px] px-4 pb-16 sm:pb-24">
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {fragor.length > 0 ? (
            <LevandeFraga fragor={fragor} />
          ) : (
            // Databasen svarade inte. Hellre ingen ruta än en tom ruta.
            <div className="rounded-3xl border border-white/10 bg-card p-6">
              <p className="text-[15px] text-[var(--cream-3)]">
                Åtta delprov, 10&nbsp;000+ ord och 30 hela prov med facit. Börja var du vill.
              </p>
              <Link
                to="/ord"
                className="mt-4 inline-flex min-h-[44px] items-center text-[14px] font-semibold text-primary hover:underline"
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
