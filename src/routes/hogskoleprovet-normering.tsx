import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Scale, Table2, TrendingUp } from "lucide-react";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { describeWithin, fitTitle } from "@/lib/seo-text";
import { formatDateLong } from "@/lib/sv-format";
import { HP_INFO_URL } from "@/lib/hp-dates";
import { normeringTerms, officialMinRawFor, officialPartMax } from "@/lib/normering";

/* =====================================================================
   NORMERING, HUBBEN. "normering högskoleprovet" och "normering <termin>"
   är bland de mest sökta HP-frågorna, både veckorna efter varje provdag och
   året runt av alla som skriver gamla prov och vill veta vad de fick.

   Allt på sidan räknas ur UHR:s officiella tabeller i
   src/data/prov/normering.json (byggd av scripts/hp-import/normering.py).
   Inga egna uppskattningar här: den preliminära gissningen efter ett prov
   bor på /hogskoleprovet-facit, och approximationen bor i poängräknaren.
   Ett provtillfälle som saknar tabell syns inte, i stället för att fyllas i.
   ===================================================================== */

const PATH = "/hogskoleprovet-normering";
const NIVÅER = [2.0, 1.5, 1.0] as const;

type Rad = {
  term: string;
  /** Delar med 80 uppgifter. Våren 2012 hade 76 verbalt och hålls utanför spannen. */
  full: Record<"verbal" | "kvant", boolean>;
  label: string;
  date: string;
  krav: Record<"verbal" | "kvant", Record<string, number | null>>;
};

function rader(): Rad[] {
  return normeringTerms().map(({ term, label, date }) => {
    const krav = { verbal: {}, kvant: {} } as Rad["krav"];
    for (const kind of ["verbal", "kvant"] as const) {
      for (const n of NIVÅER) krav[kind][n.toFixed(1)] = officialMinRawFor(term, kind, n);
    }
    const full = {
      verbal: officialPartMax(term, "verbal") === 80,
      kvant: officialPartMax(term, "kvant") === 80,
    };
    return { term, label, date, krav, full };
  });
}

function spann(values: Array<number | null>): { min: number; max: number } | null {
  const v = values.filter((x): x is number => x !== null);
  return v.length ? { min: Math.min(...v), max: Math.max(...v) } : null;
}

function faq(): Array<{ q: string; a: string }> {
  const r = rader();
  const v2 = spann(r.filter((x) => x.full.verbal).map((x) => x.krav.verbal["2.0"]));
  const k2 = spann(r.filter((x) => x.full.kvant).map((x) => x.krav.kvant["2.0"]));
  const äldst = r[r.length - 1];
  return [
    {
      q: "Vad är normering på högskoleprovet?",
      a: "Normeringen översätter antal rätt till en poäng mellan 0,0 och 2,0. Den verbala och den kvantitativa delen normeras var för sig, så att ett resultat betyder ungefär samma sak oavsett vilket prov man skrev. Därför kan samma antal rätt ge olika poäng på två olika provtillfällen.",
    },
    {
      q: "Hur många rätt krävs för 2,0 på högskoleprovet?",
      a:
        v2 && k2
          ? `Det varierar mellan proven. Sedan ${äldst.label.toLowerCase()} har 2,0 krävt mellan ${v2.min} och ${v2.max} rätt av 80 på den verbala delen och mellan ${k2.min} och ${k2.max} av 80 på den kvantitativa, enligt UHR:s normeringstabeller.`
          : "Det varierar mellan proven. Se tabellen ovan.",
    },
    {
      q: "Hur räknas totalpoängen ut?",
      a: "Varje del ger en poäng mellan 0,0 och 2,0 i steg om 0,1. Provets totala resultat är medelvärdet av de två, avrundat till närmaste 0,05. Har du 1,9 verbalt och 2,0 kvantitativt blir resultatet 1,95.",
    },
    {
      q: "När kommer normeringen för senaste högskoleprovet?",
      a: "UHR publicerar normeringstabellerna tillsammans med resultaten, några veckor efter provdagen. Fram till dess finns vår preliminära uppskattning på facitsidan.",
    },
    {
      q: "Var kommer siffrorna ifrån?",
      a: "Från UHR:s officiella normeringstabeller, en per provtillfälle och provdel. Vi har inte justerat något. Saknas ett prov i listan finns tabellen inte i vårt underlag, och då gissar vi inte.",
    },
  ];
}

export const Route = createFileRoute("/hogskoleprovet-normering")({
  head: () => {
    const r = rader();
    const nyast = r[0];
    const äldst = r[r.length - 1];
    return {
      meta: pageMeta({
        path: PATH,
        title: fitTitle("Normering högskoleprovet", "alla tabeller"),
        description: describeWithin(
          `Normeringen för alla högskoleprov från ${äldst.label.toLowerCase()} till ${nyast.label.toLowerCase()}: hur många rätt som krävdes för 2,0, 1,5 och 1,0 på varje prov.`,
          "Ur UHR:s officiella tabeller.",
        ),
        ogTitle: "Så många rätt krävdes för 2,0 på varje högskoleprov",
        ogDescription: `UHR:s normeringstabeller för ${r.length} provtillfällen, samlade på ett ställe.`,
      }),
      links: pageLinks(PATH),
      scripts: [
        breadcrumbScript([
          { name: "Hem", path: "/" },
          { name: "Normering", path: PATH },
        ]),
        jsonLdScript({
          "@context": "https://schema.org",
          "@type": "Dataset",
          name: "Normeringstabeller för högskoleprovet",
          description: `Antal rätt som krävdes för varje normerad poäng (0,0–2,0) på högskoleprovets verbala och kvantitativa del, för ${r.length} provtillfällen från ${äldst.label.toLowerCase()} till ${nyast.label.toLowerCase()}. Sammanställt ur Universitets- och högskolerådets officiella normeringstabeller.`,
          url: `https://tvakommanollan.se${PATH}`,
          inLanguage: "sv-SE",
          isAccessibleForFree: true,
          temporalCoverage: `${äldst.date}/${nyast.date}`,
          creator: { "@type": "Organization", name: "Universitets- och högskolerådet (UHR)" },
          publisher: {
            "@type": "Organization",
            name: "Tvåkommanollan",
            url: "https://tvakommanollan.se",
          },
          hasPart: r.map((x) => ({
            "@type": "Dataset",
            name: `Normering högskoleprovet ${x.label.toLowerCase()}`,
            url: `https://tvakommanollan.se${PATH}/${x.term}`,
          })),
        }),
        jsonLdScript({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq().map(({ q, a }) => ({
            "@type": "Question",
            name: q,
            acceptedAnswer: { "@type": "Answer", text: a },
          })),
        }),
      ],
    };
  },
  component: NormeringHub,
});

function H2({ icon: Icon, children }: { icon: typeof Scale; children: React.ReactNode }) {
  return (
    <h2
      className="flex items-center gap-2 text-[20px] font-bold text-[var(--cream)] sm:text-[24px]"
      style={{ fontFamily: "var(--font-display)" }}
    >
      <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden />
      {children}
    </h2>
  );
}

function cell(n: number | null) {
  return n === null ? "–" : n;
}

function NormeringHub() {
  const r = rader();
  const nyast = r[0];
  const v2 = spann(r.filter((x) => x.full.verbal).map((x) => x.krav.verbal["2.0"]));
  const k2 = spann(r.filter((x) => x.full.kvant).map((x) => x.krav.kvant["2.0"]));
  const v1 = spann(r.filter((x) => x.full.verbal).map((x) => x.krav.verbal["1.0"]));
  const k1 = spann(r.filter((x) => x.full.kvant).map((x) => x.krav.kvant["1.0"]));

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
      <nav className="text-xs text-white/45" aria-label="Brödsmulor">
        <Link to="/" className="hover:text-white/70">
          Hem
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-white/70">Normering</span>
      </nav>

      <header className="mt-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
          {r.length} provtillfällen · UHR:s officiella tabeller
        </p>
        <h1
          className="mt-2 text-[28px] font-bold leading-tight text-[var(--cream)] sm:text-[40px]"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
        >
          Normering på högskoleprovet
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-white/60">
          Normeringen avgör vilken poäng dina rätta svar blir. Här är normeringen för varje
          högskoleprov sedan {r[r.length - 1].label.toLowerCase()}: hur många rätt som krävdes för
          2,0, 1,5 och 1,0 på den verbala och den kvantitativa delen. Klicka på ett prov för hela
          tabellen, poäng för poäng.
        </p>
      </header>

      <section className="mt-8 grid grid-cols-2 gap-3">
        {[
          { rubrik: "2,0 verbalt", s: v2 },
          { rubrik: "2,0 kvantitativt", s: k2 },
          { rubrik: "1,0 verbalt", s: v1 },
          { rubrik: "1,0 kvantitativt", s: k1 },
        ].map(({ rubrik, s }) => (
          <div
            key={rubrik}
            className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center backdrop-blur-sm"
          >
            <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/50">
              {rubrik}
            </div>
            <div
              className="mt-1 text-[26px] font-bold tabular-nums text-[var(--cream)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {s ? `${s.min}–${s.max}` : "–"}
            </div>
            <div className="text-[13px] text-white/60">rätt av 80 har krävts</div>
          </div>
        ))}
      </section>

      <section className="mt-12">
        <H2 icon={Table2}>Vad krävdes på varje prov?</H2>
        <p className="mt-2 text-[14px] text-white/55">
          Minsta antal rätt av 80 för respektive poäng (våren 2012 hade den verbala delen 76
          uppgifter). V = verbal del, K = kvantitativ del.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[520px] text-[14px] tabular-nums">
            <caption className="sr-only">
              Minsta antal rätt för 2,0, 1,5 och 1,0 på varje högskoleprov
            </caption>
            <thead>
              <tr className="bg-white/[0.03] text-left text-[12px] text-white/50">
                <th className="px-3 py-2 font-semibold">Prov</th>
                {NIVÅER.map((n) => (
                  <th key={n} colSpan={2} className="px-3 py-2 text-center font-semibold">
                    {n.toFixed(1).replace(".", ",")}
                  </th>
                ))}
              </tr>
              <tr className="bg-white/[0.03] text-[11px] text-white/45">
                <th />
                {NIVÅER.flatMap((n) => [
                  <th key={`${n}v`} className="px-3 pb-2 text-right font-medium">
                    V
                  </th>,
                  <th key={`${n}k`} className="px-3 pb-2 text-right font-medium">
                    K
                  </th>,
                ])}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {r.map((x) => (
                <tr key={x.term}>
                  <td className="px-3 py-2">
                    <Link
                      to="/hogskoleprovet-normering/$term"
                      params={{ term: x.term }}
                      className="text-[var(--cream)] underline decoration-white/20 underline-offset-2 hover:decoration-primary"
                    >
                      {x.label}
                    </Link>
                  </td>
                  {NIVÅER.flatMap((n) => {
                    const k = n.toFixed(1);
                    return [
                      <td key={`${k}v`} className="px-3 py-2 text-right text-white/75">
                        {cell(x.krav.verbal[k])}
                      </td>,
                      <td key={`${k}k`} className="px-3 py-2 text-right text-white/75">
                        {cell(x.krav.kvant[k])}
                      </td>,
                    ];
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[12px] text-white/45">
          Källa: UHR:s normeringstabeller. Ett streck betyder att tabellen för den delen saknas i
          vårt underlag. Mer om provet på{" "}
          <a
            href={HP_INFO_URL}
            target="_blank"
            rel="noopener"
            className="underline underline-offset-2 hover:text-white/70"
          >
            studera.nu
          </a>
          .
        </p>
      </section>

      <section className="mt-12">
        <H2 icon={Scale}>Så fungerar normeringen</H2>
        <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-white/65">
          <p>
            Högskoleprovet har 160 uppgifter som räknas: 80 i den verbala delen (ORD, LÄS, MEK och
            ELF) och 80 i den kvantitativa (XYZ, KVA, NOG och DTK). Varje del normeras för sig till
            en poäng mellan 0,0 och 2,0, i steg om 0,1.
          </p>
          <p>
            Provets resultat är medelvärdet av de två delarna, avrundat till närmaste 0,05. Det är
            därför halvsteg som 1,95 och 1,45 finns, trots att varje del bara har hela tiondelar.
          </p>
          <p>
            Proven är olika svåra, och normeringen jämnar ut det. Ett svårt prov ger samma poäng för
            färre rätt än ett lätt. Skillnaden syns i tabellen ovan: gränsen för 2,0 har flyttat sig
            flera rätt mellan proven.
          </p>
        </div>
      </section>

      <section className="mt-12">
        <H2 icon={TrendingUp}>Senaste normeringen: {nyast.label.toLowerCase()}</H2>
        <p className="mt-2 text-[15px] leading-relaxed text-white/60">
          Provet skrevs {formatDateLong(nyast.date)}. Hela tabellen, med vad varje antal rätt gav,
          finns på provets egen sida.
        </p>
        <Link
          to="/hogskoleprovet-normering/$term"
          params={{ term: nyast.term }}
          className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-brand transition hover:brightness-110"
        >
          Normering {nyast.label.toLowerCase()}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>

      <section className="mt-12">
        <h2
          className="text-[20px] font-bold text-[var(--cream)] sm:text-[24px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Vanliga frågor om normeringen
        </h2>
        <dl className="mt-4 divide-y divide-white/8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm">
          {faq().map(({ q, a }) => (
            <div key={q} className="px-5 py-4">
              <dt className="text-[15px] font-semibold text-[var(--cream)]">{q}</dt>
              <dd className="mt-1.5 text-[14.5px] leading-relaxed text-white/65">{a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12 rounded-2xl border border-primary/25 bg-primary/[0.06] p-6 sm:p-8">
        <h2
          className="text-[20px] font-bold text-[var(--cream)] sm:text-[24px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Se vad du hade fått
        </h2>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-white/60">
          Skriv ett gamla prov på originaltid. Rättningen räknar om ditt resultat med just det
          provets normering.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Link
            to="/gamla-prov"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-brand transition hover:brightness-110"
          >
            Skriv ett gammalt prov
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            to="/hogskoleprovet-facit"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-white/12 px-5 py-2.5 text-sm font-semibold text-[var(--cream)] transition hover:border-primary/50"
          >
            Facit senaste provet
          </Link>
          <Link
            to="/hogskoleprovet-poang"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-white/12 px-5 py-2.5 text-sm font-semibold text-[var(--cream)] transition hover:border-primary/50"
          >
            Poäng och antagning
          </Link>
        </div>
      </section>
    </div>
  );
}
