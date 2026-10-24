import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Target } from "lucide-react";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { describeWithin, fitTitle } from "@/lib/seo-text";
import { formatDateLong, formatDecimal } from "@/lib/sv-format";
import { findExam } from "@/lib/prov-data";
import {
  normeringTerms,
  officialMinRawFor,
  officialPartMax,
  officialTable,
  type NormeringRad,
} from "@/lib/normering";

/* =====================================================================
   NORMERING PER PROVTILLFÄLLE. En sida per prov med UHR:s hela tabell,
   för sökningar som "normering högskoleprovet hösten 2024" och "hur många
   rätt för 2,0 våren 2019". Data: src/data/prov/normering.json, inget annat.
   Länkar vidare till samma prov i arkivet så att den som läser tabellen kan
   skriva provet och få resultatet räknat med just den normeringen.
   ===================================================================== */

const KINDS = [
  { kind: "verbal", rubrik: "Verbal del", delprov: "ORD, LÄS, MEK och ELF" },
  { kind: "kvant", rubrik: "Kvantitativ del", delprov: "XYZ, KVA, NOG och DTK" },
] as const;

const NIVÅER = [2.0, 1.5, 1.0, 0.5] as const;

function poäng(n: number) {
  return formatDecimal(n, 1);
}

export const Route = createFileRoute("/hogskoleprovet-normering_/$term")({
  loader: ({ params }) => {
    const terms = normeringTerms();
    const i = terms.findIndex((t) => t.term === params.term);
    if (i === -1) throw notFound();
    const t = terms[i];
    return {
      ...t,
      newer: i > 0 ? terms[i - 1] : null,
      older: i < terms.length - 1 ? terms[i + 1] : null,
      hasExam: !!findExam(t.term),
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { term, label, date } = loaderData;
    const path = `/hogskoleprovet-normering/${term}`;
    const v = officialMinRawFor(term, "verbal", 2.0);
    const k = officialMinRawFor(term, "kvant", 2.0);
    const vMax = officialPartMax(term, "verbal");
    const kMax = officialPartMax(term, "kvant");
    const krav = [
      v !== null ? `${v}/${vMax} verbalt` : null,
      k !== null ? `${k}/${kMax} kvantitativt` : null,
    ]
      .filter(Boolean)
      .join(" och ");
    const namn = `Normering högskoleprovet ${label.toLowerCase()}`;
    return {
      meta: pageMeta({
        path,
        title: fitTitle(namn),
        description: describeWithin(
          `${namn}: ${krav} krävdes för 2,0. Hela tabellen med vad varje antal rätt gav.`,
          "Ur UHR:s officiella normering.",
        ),
        ogTitle: `${krav} rätt för 2,0: ${namn.toLowerCase()}`,
        ogDescription: `UHR:s normeringstabell för provet ${formatDateLong(date)}.`,
      }),
      links: pageLinks(path),
      scripts: [
        breadcrumbScript([
          { name: "Hem", path: "/" },
          { name: "Normering", path: "/hogskoleprovet-normering" },
          { name: label, path },
        ]),
        jsonLdScript({
          "@context": "https://schema.org",
          "@type": "Dataset",
          name: namn,
          description: `Normeringstabell för högskoleprovet ${formatDateLong(date)}: vilken normerad poäng mellan 0,0 och 2,0 varje antal rätt gav på den verbala och den kvantitativa delen. För 2,0 krävdes ${krav}. Källa: Universitets- och högskolerådets officiella normering.`,
          url: `https://tvakommanollan.se${path}`,
          inLanguage: "sv-SE",
          isAccessibleForFree: true,
          temporalCoverage: date,
          creator: { "@type": "Organization", name: "Universitets- och högskolerådet (UHR)" },
          publisher: {
            "@type": "Organization",
            name: "Tvåkommanollan",
            url: "https://tvakommanollan.se",
          },
          isPartOf: {
            "@type": "Dataset",
            url: "https://tvakommanollan.se/hogskoleprovet-normering",
          },
        }),
      ],
    };
  },
  component: NormeringTermPage,
});

function Tabell({
  rubrik,
  delprov,
  rows,
  max,
}: {
  rubrik: string;
  delprov: string;
  rows: NormeringRad[];
  max: number;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm">
      <div className="px-4 pt-4">
        <h3
          className="text-[17px] font-bold text-[var(--cream)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {rubrik}
        </h3>
        <p className="text-[12.5px] text-white/50">
          {max} uppgifter · {delprov}
        </p>
      </div>
      <table className="mt-3 w-full text-[14px] tabular-nums">
        <caption className="sr-only">Normering, {rubrik.toLowerCase()}</caption>
        <thead>
          <tr className="bg-white/[0.03] text-left text-[12px] text-white/50">
            <th className="px-4 py-2 font-semibold">Antal rätt</th>
            <th className="px-4 py-2 text-right font-semibold">Poäng</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/8">
          {[...rows].reverse().map((r) => (
            <tr key={r.value}>
              <td className="px-4 py-1.5 text-white/70">
                {r.from === r.to ? r.from : `${r.from}–${r.to}`}
              </td>
              <td className="px-4 py-1.5 text-right font-semibold text-[var(--cream)]">
                {poäng(r.value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NormeringTermPage() {
  const { term, label, date, newer, older, hasExam } = Route.useLoaderData();
  const delar = KINDS.map((k) => ({
    ...k,
    rows: officialTable(term, k.kind),
    max: officialPartMax(term, k.kind),
  }));
  const saknas = delar.filter((d) => !d.rows);
  const andra = normeringTerms().filter((t) => t.term !== term);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
      <nav className="text-xs text-white/45" aria-label="Brödsmulor">
        <Link to="/" className="hover:text-white/70">
          Hem
        </Link>
        <span className="px-1.5">/</span>
        <Link to="/hogskoleprovet-normering" className="hover:text-white/70">
          Normering
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-white/70">{label}</span>
      </nav>

      <header className="mt-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
          UHR:s officiella normering
        </p>
        <h1
          className="mt-2 text-[28px] font-bold leading-tight text-[var(--cream)] sm:text-[40px]"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
        >
          Normering högskoleprovet {label.toLowerCase()}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-white/60">
          Högskoleprovet skrevs {formatDateLong(date)}. Tabellerna nedan visar vilken poäng varje
          antal rätt gav på provets två delar. Provets totala resultat är medelvärdet av delarna,
          avrundat till närmaste 0,05.
        </p>
        {saknas.length > 0 && (
          <p className="mt-2 text-[14px] leading-relaxed text-white/55">
            Tabellen för {saknas.map((d) => d.rubrik.toLowerCase()).join(" och ")} finns inte i vårt
            underlag för det här provet, så den visas inte. Vi fyller inte i en gissning.
          </p>
        )}
      </header>

      <section className="mt-8 rounded-2xl border border-primary/25 bg-primary/[0.06] p-5 sm:p-6">
        <h2
          className="flex items-center gap-2 text-[20px] font-bold text-[var(--cream)] sm:text-[24px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <Target className="h-5 w-5 shrink-0 text-primary" aria-hidden />
          Så många rätt krävdes
        </h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-[14px] tabular-nums">
            <caption className="sr-only">Minsta antal rätt för varje poängnivå</caption>
            <thead>
              <tr className="bg-white/[0.03] text-left text-[12px] text-white/50">
                <th className="px-4 py-2 font-semibold">För poäng</th>
                {delar.map((d) => (
                  <th key={d.kind} className="px-4 py-2 text-right font-semibold">
                    {d.rubrik}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {NIVÅER.map((n) => (
                <tr key={n}>
                  <td className="px-4 py-2 font-semibold text-[var(--cream)]">{poäng(n)}</td>
                  {delar.map((d) => {
                    const min = officialMinRawFor(term, d.kind, n);
                    return (
                      <td key={d.kind} className="px-4 py-2 text-right text-white/75">
                        {min === null ? "–" : `${min}/${d.max}`}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {hasExam && (
          <Link
            to="/gamla-prov/$term"
            params={{ term }}
            className="mt-5 inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-brand transition hover:brightness-110"
          >
            Skriv provet med den här normeringen
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        )}
      </section>

      <section className="mt-12">
        <h2
          className="text-[20px] font-bold text-[var(--cream)] sm:text-[24px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Hela normeringstabellen
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {delar.map((d) =>
            d.rows && d.max ? (
              <Tabell
                key={d.kind}
                rubrik={d.rubrik}
                delprov={d.delprov}
                rows={d.rows}
                max={d.max}
              />
            ) : null,
          )}
        </div>
        <p className="mt-3 text-[12px] text-white/45">
          Källa: Universitets- och högskolerådets (UHR) normeringstabeller för provet{" "}
          {formatDateLong(date)}.
        </p>
      </section>

      <section className="mt-14 border-t border-white/8 pt-8">
        <h2
          className="text-[18px] font-bold text-[var(--cream)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Normering för andra prov
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {andra.map((t) => (
            <Link
              key={t.term}
              to="/hogskoleprovet-normering/$term"
              params={{ term: t.term }}
              className="rounded-full border border-white/12 px-3.5 py-1.5 text-sm text-white/70 transition hover:border-[var(--amber)]/50 hover:text-[var(--cream)]"
            >
              {t.label}
            </Link>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between gap-3 text-sm">
          {older ? (
            <Link
              to="/hogskoleprovet-normering/$term"
              params={{ term: older.term }}
              className="inline-flex items-center gap-1.5 text-white/60 hover:text-[var(--cream)]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {older.label}
            </Link>
          ) : (
            <span />
          )}
          {newer ? (
            <Link
              to="/hogskoleprovet-normering/$term"
              params={{ term: newer.term }}
              className="inline-flex items-center gap-1.5 text-white/60 hover:text-[var(--cream)]"
            >
              {newer.label}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : (
            <span />
          )}
        </div>
        <p className="mt-6 text-[14px] text-white/55">
          Alla prov i en tabell finns på{" "}
          <Link
            to="/hogskoleprovet-normering"
            className="underline underline-offset-2 hover:text-[var(--cream)]"
          >
            normeringssidan
          </Link>
          . Vill du räkna om råpoäng till en uppskattad totalpoäng, använd{" "}
          <Link
            to="/hogskoleprovet-poangraknare"
            className="underline underline-offset-2 hover:text-[var(--cream)]"
          >
            poängräknaren
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
