import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { normeringFromRaw } from "@/lib/normering";
import { hpScoreLabel } from "@/lib/hpScore";
import { ArrowRight } from "lucide-react";

/* =====================================================================
   HP-POÄNGRÄKNARE — interaktiv normeringskalkylator. Efterfrågad produkt-
   funktion + högvolym-sök ("högskoleprovet poängräknare / normeringstabell").
   Helt klient-sida (ingen auth/DB). SSR renderar startläget.
   ===================================================================== */

const sv = (n: number) => n.toFixed(1).replace(".", ",");

export const Route = createFileRoute("/hogskoleprovet-poangraknare")({
  head: () => ({
    meta: pageMeta({
      path: "/hogskoleprovet-poangraknare",
      title: "Högskoleprovet poängräknare – räkna ut din normerade poäng · HP Kampen",
      description:
        "Gratis poängräknare för högskoleprovet: fyll i antal rätt på den verbala och kvantitativa delen och få din uppskattade normerade poäng (0,0–2,0) direkt.",
      ogTitle: "Högskoleprovet poängräknare",
      ogDescription:
        "Räkna ut din uppskattade HP-poäng (0,0–2,0) från antal rätt. Gratis normeringskalkylator.",
    }),
    links: pageLinks("/hogskoleprovet-poangraknare"),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Poängräknare", path: "/hogskoleprovet-poangraknare" },
      ]),
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "Högskoleprovet poängräknare",
        applicationCategory: "EducationalApplication",
        operatingSystem: "Web",
        url: "https://hpkampen.se/hogskoleprovet-poangraknare",
        inLanguage: "sv-SE",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "SEK" },
        description:
          "Interaktiv normeringskalkylator som uppskattar din HP-poäng (0,0–2,0) utifrån antal rätt.",
        isPartOf: { "@id": "https://hpkampen.se/#website" },
      }),
    ],
  }),
  component: PoangraknarePage,
});

function PoangraknarePage() {
  const [verbal, setVerbal] = useState(40);
  const [quant, setQuant] = useState(40);

  const total = verbal + quant;
  const score = normeringFromRaw(total);
  const label = hpScoreLabel(score);
  const pct = Math.max(2, Math.min(100, (score / 2) * 100));

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-10 sm:px-6">
      <nav className="text-xs text-white/45" aria-label="Brödsmulor">
        <Link to="/" className="hover:text-white/70">
          Hem
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-white/70">Poängräknare</span>
      </nav>

      <header className="mt-4">
        <h1
          className="text-[28px] font-bold leading-tight text-[#2e1e14] sm:text-[38px]"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
        >
          Högskoleprovet poängräknare
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-white/60">
          Fyll i hur många rätt du hade på den verbala respektive kvantitativa delen (80 uppgifter
          var) så får du din uppskattade normerade poäng direkt.
        </p>
      </header>

      {/* Kalkylator */}
      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm">
        <SliderRow
          label="Verbal del"
          hint="ORD · LÄS · MEK · ELF"
          value={verbal}
          onChange={setVerbal}
        />
        <div className="mt-6">
          <SliderRow
            label="Kvantitativ del"
            hint="XYZ · KVA · NOG · DTK"
            value={quant}
            onChange={setQuant}
          />
        </div>

        {/* Resultat */}
        <div className="mt-8 border-t border-white/8 pt-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">
                Uppskattad poäng
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span
                  className="text-[56px] font-bold leading-none tabular-nums text-[#ae2f26]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {sv(score)}
                </span>
                <span className="text-lg text-white/40">/ 2,0</span>
              </div>
            </div>
            <span className="rounded-full border border-[#ae2f26]/25 bg-[#ae2f26]/10 px-3 py-1 text-xs font-semibold text-[#ae2f26]">
              {label}
            </span>
          </div>

          {/* gauge */}
          <div className="mt-5">
            <div className="relative h-2.5 w-full rounded-full bg-white/8">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#8f2620] to-[#ae2f26]"
                style={{ width: `${pct}%` }}
              />
              <div
                className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#fbf6ec] bg-[#f5c089]"
                style={{ left: `${pct}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] tabular-nums text-white/35">
              <span>0,0</span>
              <span>1,0</span>
              <span>2,0</span>
            </div>
          </div>

          <p className="mt-4 text-center text-sm text-white/55 tabular-nums">
            {total} rätt av 160 totalt
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-white/40">
        Poängen är en <strong className="text-white/60">uppskattning</strong>. Universitets- och
        högskolerådet normerar varje prov för sig, så de exakta gränserna varierar mellan olika
        provtillfällen. Använd siffran som en fingervisning.
      </p>

      {/* CTA */}
      <section className="mt-10 rounded-2xl border border-[#ae2f26]/25 bg-[#ae2f26]/[0.06] p-6 sm:p-8">
        <h2
          className="text-[20px] font-bold text-[#2e1e14] sm:text-[22px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Vill du höja poängen?
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-white/60">
          Öva på riktiga frågor från gamla prov och se din poäng klättra.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Link
            to="/gamla-prov"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#ae2f26] px-5 py-2.5 text-sm font-semibold text-[#fff8f5] transition hover:brightness-110"
          >
            Öva på gamla prov
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/hogskoleprovet-poang"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-5 py-2.5 text-sm font-semibold text-[#2e1e14] transition hover:border-[#ae2f26]/50"
          >
            Vad krävs för olika utbildningar?
          </Link>
        </div>
      </section>
    </div>
  );
}

function SliderRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div>
          <span className="text-sm font-semibold text-[#2e1e14]">{label}</span>
          <span className="ml-2 text-xs text-white/40">{hint}</span>
        </div>
        <span
          className="text-[18px] font-bold tabular-nums text-[#ae2f26]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {value}
          <span className="text-sm font-normal text-white/40"> / 80</span>
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={80}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={`${label} – antal rätt av 80`}
        className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10"
        style={{ accentColor: "#ae2f26" }}
      />
    </div>
  );
}
