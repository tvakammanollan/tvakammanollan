import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { describeWithin } from "@/lib/seo-text";
import { hpDateLong, hpDateShort } from "@/lib/hp-dates";
import { formatInt } from "@/lib/sv-format";
import {
  DELPROV,
  FACIT,
  PART_LENGTH,
  PASS_LENGTH,
  besvaradeFragor,
  distansTillGrans,
  passAnswers,
  summaPerDel,
  type FacitPass,
  type PassKind,
} from "@/lib/preliminart-facit";
import { ArrowRight, Calculator, ClipboardCheck, MessageSquareQuote, Target } from "lucide-react";

/* =====================================================================
   SEO: "facit högskoleprovet" och "normering högskoleprovet" är de mest
   sökta HP-frågorna dygnen efter varje provdag. Sidan svarar på båda, och
   CoachingPrompt visar en ruta hit under veckorna efter provet
   (facit-promo.ts).

   Allt innehåll kommer ur `FACIT` i preliminart-facit.ts och är statiskt,
   alltså serverrenderat i sin helhet. Nästa prov: byt objektet där, inte
   den här filen. Adressen är medvetet terminslös så att länkarna som
   samlats in under ett prov fortsätter gälla nästa gång.
   ===================================================================== */

const PATH = "/hogskoleprovet-facit";
const KIND_LABEL: Record<PassKind, string> = { verbal: "verbal", kvant: "kvantitativ" };

/** Synliga frågor och svar. Samma text går till FAQPage-datan, ordagrant. */
function faq(): Array<{ q: string; a: string }> {
  const g = FACIT.troligGrans;
  return [
    {
      q: `Var hittar jag facit till högskoleprovet ${FACIT.label.toLowerCase()}?`,
      a: `Här ovan finns vårt preliminära facit för de fyra provpass som räknas: ${FACIT.passes
        .map((p) => `provpass ${p.pass} (${KIND_LABEL[p.kind]})`)
        .join(
          ", ",
        )}. Det officiella facit publiceras av UHR på studera.nu, och det är det som gäller om något skiljer sig.`,
    },
    ...(g
      ? [
          {
            q: `Vad blir normeringen för ${FACIT.label.toLowerCase()}?`,
            a: `Ingen vet förrän UHR publicerat den. Vår bedömning är att det krävs ungefär ${g.verbal} rätt av ${PART_LENGTH} på den verbala delen och ${g.kvant} av ${PART_LENGTH} på den kvantitativa för 2,0. Normeringen sätts efter att alla prov rättats och brukar komma tillsammans med resultaten några veckor efter provdagen.`,
          },
        ]
      : []),
    {
      q: "När kommer resultatet på högskoleprovet?",
      a: "UHR skickar ut resultaten och publicerar normeringstabellerna några veckor efter provdagen, för höstprovet brukar det vara i november. Resultatet hämtar du på hogskoleprov.nu.",
    },
    {
      q: "Varför finns inget facit för provpass 3?",
      a: "Ett av dagens fem provpass är ett utprövningspass med nya uppgifter som testas inför kommande prov. Det räknas inte in i resultatet, och facit till det publiceras inte.",
    },
    {
      q: "Hur räknas resultatet ut?",
      a: `Den verbala och den kvantitativa delen har ${PART_LENGTH} uppgifter var och normeras var för sig till en poäng mellan 0,0 och 2,0. Provets totala resultat är medelvärdet av de två, avrundat till närmaste 0,05.`,
    },
  ];
}

export const Route = createFileRoute("/hogskoleprovet-facit")({
  head: () => ({
    meta: pageMeta({
      path: PATH,
      title: `Facit högskoleprovet ${FACIT.period}`,
      // En enda mening: describeWithin släpper hela meningar som inte ryms,
      // och normeringen är det folk söker på. Den får inte vara den som faller.
      description: describeWithin(
        `Preliminärt facit till högskoleprovet ${hpDateShort(FACIT.date)}${
          FACIT.troligGrans
            ? ` och trolig normering: ${FACIT.troligGrans.verbal}/${PART_LENGTH} verbalt, ${FACIT.troligGrans.kvant}/${PART_LENGTH} kvantitativt för 2,0.`
            : ", alla fyra provpass."
        }`,
        "Räkna dina rätt.",
      ),
      ogTitle: `Preliminärt facit och trolig normering: ${FACIT.label}`,
      ogDescription: "Alla svar på provpass 1, 2, 4 och 5, och vad som troligen krävs för 2,0.",
    }),
    links: pageLinks(PATH),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Facit högskoleprovet", path: PATH },
      ]),
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: `Preliminärt facit och trolig normering, ${FACIT.label.toLowerCase()}`,
        datePublished: FACIT.updated,
        dateModified: FACIT.updated,
        inLanguage: "sv-SE",
        mainEntityOfPage: `https://tvakommanollan.se${PATH}`,
        author: { "@type": "Person", name: "Niklas" },
        publisher: {
          "@type": "Organization",
          name: "Tvåkommanollan",
          url: "https://tvakommanollan.se",
        },
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
  }),
  component: FacitPage,
});

function H2({ icon: Icon, children }: { icon: typeof Target; children: React.ReactNode }) {
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

function FacitPage() {
  const grans = FACIT.troligGrans;
  const intervju = besvaradeFragor(FACIT);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
      <nav className="text-xs text-white/45" aria-label="Brödsmulor">
        <Link to="/" className="hover:text-white/70">
          Hem
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-white/70">Facit högskoleprovet</span>
      </nav>

      <header className="mt-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
          Preliminärt · uppdaterat {hpDateShort(FACIT.updated)}
        </p>
        <h1
          className="mt-2 text-[28px] font-bold leading-tight text-[var(--cream)] sm:text-[40px]"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
        >
          Facit och trolig normering, {FACIT.label.toLowerCase()}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-white/60">
          Högskoleprovet skrevs {hpDateLong(FACIT.date)}. Här är vårt preliminära facit till de fyra
          provpass som räknas, vad vi tror att det krävs för 2,0, och mina egna tankar om provet.
          Facit är sammanställt efter provet och kan innehålla fel. Det officiella facit från UHR
          gäller alltid.
        </p>
      </header>

      {grans && (
        <section className="mt-8 rounded-2xl border border-primary/25 bg-primary/[0.06] p-5 sm:p-6">
          <H2 icon={Target}>Trolig normering</H2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {(["verbal", "kvant"] as const).map((k) => (
              <div
                key={k}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center"
              >
                <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/50">
                  {k === "verbal" ? "Verbal del" : "Kvantitativ del"}
                </div>
                <div
                  className="mt-1 text-[32px] font-bold tabular-nums text-[var(--cream)]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {grans[k]}/{PART_LENGTH}
                </div>
                <div className="text-[13px] text-white/60">rätt för 2,0</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[14px] leading-relaxed text-white/60">
            Det är min bedömning, inte UHR:s. Normeringen sätts först när alla prov är rättade och
            kommer tillsammans med resultaten.
          </p>
        </section>
      )}

      <RaknaRatt />

      <section className="mt-12">
        <H2 icon={ClipboardCheck}>Preliminärt facit</H2>
        <p className="mt-2 text-[14px] text-white/55">
          Ett av dagens fem pass är ett utprövningspass och räknas inte. Därför finns inget facit
          för provpass 3.
        </p>
        <div className="mt-5 space-y-6">
          {FACIT.passes.map((p) => (
            <PassFacit key={p.pass} pass={p} />
          ))}
        </div>
      </section>

      {intervju.length > 0 && (
        <section className="mt-12">
          <H2 icon={MessageSquareQuote}>Efter provet: mina tankar</H2>
          <p className="mt-2 text-[14px] text-white/55">
            Niklas, som driver Tvåkommanollan och själv har skrivit 1,95 på provet.
          </p>
          <dl className="mt-5 space-y-5">
            {intervju.map((q) => (
              <div key={q.fraga} className="border-l-2 border-primary/40 pl-4">
                <dt className="text-[15px] font-semibold text-[var(--cream)]">{q.fraga}</dt>
                <dd className="mt-1.5 text-[15px] leading-relaxed text-white/70">{q.svar}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="mt-12">
        <h2
          className="text-[20px] font-bold text-[var(--cream)] sm:text-[24px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Vanliga frågor efter provet
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
          Ska du skriva igen i vår?
        </h2>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-white/60">
          Det bästa är att börja medan provet sitter i huvudet. Alla gamla prov sedan 2012 finns
          här, med facit och uppskattad normering på varje provpass.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Link
            to="/gamla-prov"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-brand transition hover:brightness-110"
          >
            Öva på gamla prov
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            to="/hogskoleprovet-datum"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-white/12 px-5 py-2.5 text-sm font-semibold text-[var(--cream)] transition hover:border-primary/50"
          >
            Nästa provdatum
          </Link>
          <Link
            to="/hogskoleprovet-poangraknare"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-white/12 px-5 py-2.5 text-sm font-semibold text-[var(--cream)] transition hover:border-primary/50"
          >
            Poängräknare
          </Link>
        </div>
      </section>
    </div>
  );
}

function PassFacit({ pass }: { pass: FacitPass }) {
  const svar = passAnswers(pass);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-sm sm:p-5">
      <h3
        className="text-[17px] font-bold text-[var(--cream)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Provpass {pass.pass}{" "}
        <span className="text-[14px] font-medium text-white/50">({KIND_LABEL[pass.kind]})</span>
      </h3>
      <div className="mt-3 space-y-3">
        {DELPROV[pass.kind].map((d) => (
          <div key={d.kod}>
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">
              {d.kod} · uppgift {d.from}–{d.to}
            </div>
            <ol className="mt-1.5 grid grid-cols-5 gap-1.5 sm:grid-cols-10">
              {svar.slice(d.from - 1, d.to).map((l, i) => (
                <li
                  key={d.from + i}
                  className="flex items-baseline justify-center gap-1 rounded-lg border border-white/8 bg-white/[0.02] py-1.5 tabular-nums"
                >
                  <span className="text-[11px] text-white/45">{d.from + i}</span>
                  <span className="text-[15px] font-bold text-[var(--cream)]">{l}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Fyra fält, ett per provpass. Ren klientstate; tom från start så SSR och hydrering är lika. */
function RaknaRatt() {
  const [rätt, setRätt] = useState<Record<number, number | null>>({});
  const summor = summaPerDel(FACIT, rätt);
  const grans = FACIT.troligGrans;

  const sätt = (pass: number, v: string) => {
    const n = v === "" ? null : Number(v);
    setRätt((r) => ({ ...r, [pass]: n === null || Number.isNaN(n) ? null : n }));
  };

  return (
    <section className="mt-10">
      <H2 icon={Calculator}>Räkna dina rätt</H2>
      <p className="mt-2 text-[14px] text-white/55">
        Rätta mot facit nedan och fyll i antal rätt per provpass.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {FACIT.passes.map((p) => (
          <label key={p.pass} className="block">
            <span className="text-[13px] text-white/60">
              Provpass {p.pass} <span className="text-white/45">({KIND_LABEL[p.kind]})</span>
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={PASS_LENGTH}
              placeholder={`0–${PASS_LENGTH}`}
              value={rätt[p.pass] ?? ""}
              onChange={(e) => sätt(p.pass, e.target.value)}
              className="mt-1 h-11 w-full rounded-lg border border-white/12 bg-white/[0.02] px-3 text-[16px] tabular-nums text-[var(--cream)] outline-none focus:border-primary/60"
            />
          </label>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {(["verbal", "kvant"] as const).map((k) => {
          const s = summor[k];
          const diff = s === null ? null : distansTillGrans(s, grans ? grans[k] : null);
          return (
            <div key={k} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/50">
                {k === "verbal" ? "Verbal del" : "Kvantitativ del"}
              </div>
              <div className="mt-1 text-[24px] font-bold tabular-nums text-[var(--cream)]">
                {s === null ? "–" : `${formatInt(s)}/${PART_LENGTH}`}
              </div>
              {diff !== null && (
                <div className={`text-[13px] ${diff >= 0 ? "text-success" : "text-white/60"}`}>
                  {diff >= 0
                    ? "Troligen 2,0 på den här delen"
                    : `${formatInt(-diff)} rätt från trolig 2,0`}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
