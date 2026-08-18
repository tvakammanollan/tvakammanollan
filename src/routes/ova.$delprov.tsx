import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { ordText } from "@/lib/sv-format";
import { provExamples } from "@/lib/prov-data";
import { ArrowRight, BookOpen, ScrollText } from "lucide-react";

/* =====================================================================
   PER-DELPROV ÖVNINGSSIDOR (transaktionell sök: "öva ORD", "MEK-övningar",
   "DTK träning"). Distinkt från /guider/* (strategi) — fokus på att GÖRA:
   riktiga exempelfrågor från gamla prov + facit + tydlig öva-CTA. SSR så
   innehållet är crawlbart. Datan hämtas/filtreras i loadern.
   ===================================================================== */

const ALT_LABELS = ["A", "B", "C", "D", "E"];

type Delprov = {
  code: string;
  name: string;
  h1: string;
  intro: string;
  practiceTo: "/ord" | "/train";
  practiceLabel: string;
};

const DELPROV: Record<string, Delprov> = {
  ord: {
    code: "ORD",
    name: "Ordförståelse",
    h1: "Öva ORD – ordförståelse inför högskoleprovet",
    intro:
      "ORD testar din ordförståelse: du ska hitta synonymen eller den närmaste betydelsen till ett ord. Det är ofta det delprov där man snabbast höjer sitt resultat genom att plugga ord. Här övar du på riktiga ORD-frågor från tidigare högskoleprov, med facit.",
    practiceTo: "/ord",
    practiceLabel: "Öva 10 000+ ord nu",
  },
  mek: {
    code: "MEK",
    name: "Meningskomplettering",
    h1: "Öva MEK – meningskomplettering inför högskoleprovet",
    intro:
      "I MEK fyller du i de ord som saknas i en mening så att den blir språkligt och innehållsmässigt korrekt. Det belönar både ordförråd och språkkänsla. Öva på riktiga MEK-frågor med facit nedan.",
    practiceTo: "/train",
    practiceLabel: "Träna MEK utan tidspress",
  },
  las: {
    code: "LÄS",
    name: "Läsförståelse",
    h1: "Öva LÄS – läsförståelse inför högskoleprovet",
    intro:
      "LÄS mäter hur väl du förstår och drar slutsatser ur längre svenska texter. Nyckeln är att läsa aktivt och alltid hitta belägg för svaret i texten. Här tränar du på riktiga LÄS-uppgifter med facit.",
    practiceTo: "/train",
    practiceLabel: "Träna LÄS utan tidspress",
  },
  elf: {
    code: "ELF",
    name: "Engelsk läsförståelse",
    h1: "Öva ELF – engelsk läsförståelse inför högskoleprovet",
    intro:
      "ELF testar din förståelse av engelska texter. Bra engelska och ett strategiskt lässätt ger snabba poäng. Öva på riktiga ELF-frågor från gamla prov med facit.",
    practiceTo: "/train",
    practiceLabel: "Träna ELF utan tidspress",
  },
  xyz: {
    code: "XYZ",
    name: "Matematisk problemlösning",
    h1: "Öva XYZ – matematisk problemlösning inför högskoleprovet",
    intro:
      "XYZ är matematisk problemlösning där du löser uppgifter och väljer rätt svarsalternativ. Träning på många uppgiftstyper bygger både snabbhet och säkerhet. Öva på riktiga XYZ-uppgifter med facit.",
    practiceTo: "/train",
    practiceLabel: "Träna XYZ utan tidspress",
  },
  kva: {
    code: "KVA",
    name: "Kvantitativa jämförelser",
    h1: "Öva KVA – kvantitativa jämförelser inför högskoleprovet",
    intro:
      "KVA ber dig avgöra vilken av två storheter som är störst – eller om det inte går att avgöra. Det handlar om att tänka smart snarare än att räkna ut allt. Öva på riktiga KVA-uppgifter med facit.",
    practiceTo: "/train",
    practiceLabel: "Träna KVA utan tidspress",
  },
  nog: {
    code: "NOG",
    name: "Kvantitativa resonemang",
    h1: "Öva NOG – kvantitativa resonemang inför högskoleprovet",
    intro:
      "NOG testar om den givna informationen räcker för att lösa ett problem. Du tränar på att avgöra exakt vad som behövs – inte att räkna ut svaret. Öva på riktiga NOG-uppgifter med facit.",
    practiceTo: "/train",
    practiceLabel: "Träna NOG utan tidspress",
  },
  dtk: {
    code: "DTK",
    name: "Diagram, tabeller och kartor",
    h1: "Öva DTK – diagram, tabeller och kartor inför högskoleprovet",
    intro:
      "DTK mäter hur snabbt och rätt du läser av data ur diagram, tabeller och kartor. Det är ett tidspressat delprov där vana avgör. Öva på riktiga DTK-uppgifter med facit.",
    practiceTo: "/train",
    practiceLabel: "Träna DTK utan tidspress",
  },
};

export const DELPROV_SLUGS = Object.keys(DELPROV);

export const Route = createFileRoute("/ova/$delprov")({
  loader: ({ params }) => {
    const cfg = DELPROV[params.delprov];
    if (!cfg) throw notFound();
    return { examples: provExamples(cfg.code) };
  },
  head: ({ params }) => {
    const cfg = DELPROV[params.delprov];
    if (!cfg) return {};
    const path = `/ova/${params.delprov}`;
    return {
      meta: pageMeta({
        path,
        title: `Öva ${cfg.code} (${cfg.name}) gratis – frågor med facit · HP Kampen`,
        description: `${cfg.intro.slice(0, 150)} Gratis och utan inloggning.`,
        ogTitle: `Öva ${cfg.code} – ${cfg.name}`,
        ogDescription: `Träna ${cfg.code} inför högskoleprovet med riktiga frågor och facit. Gratis.`,
      }),
      links: pageLinks(path),
      scripts: [
        breadcrumbScript([
          { name: "Hem", path: "/" },
          { name: "Guider", path: "/guider" },
          { name: `Öva ${cfg.code}`, path },
        ]),
        jsonLdScript({
          "@context": "https://schema.org",
          "@type": "LearningResource",
          name: cfg.h1,
          description: cfg.intro,
          url: `https://tvakommanollan.se${path}`,
          inLanguage: "sv-SE",
          isAccessibleForFree: true,
          learningResourceType: "Practice problem set",
          educationalLevel: "Högskoleförberedande",
          about: { "@type": "Thing", name: `Högskoleprovet ${cfg.code}` },
          isPartOf: { "@id": "https://tvakommanollan.se/#website" },
        }),
      ],
    };
  },
  component: OvaDelprovPage,
});

function OvaDelprovPage() {
  const { delprov } = Route.useParams();
  const { examples } = Route.useLoaderData();
  const cfg = DELPROV[delprov];

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
      <nav className="text-xs text-white/45" aria-label="Brödsmulor">
        <Link to="/" className="hover:text-white/70">
          Hem
        </Link>
        <span className="px-1.5">/</span>
        <Link to="/guider" className="hover:text-white/70">
          Guider
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-white/70">Öva {cfg.code}</span>
      </nav>

      <header className="mt-4">
        <h1
          className="text-[28px] font-bold leading-tight text-[var(--cream)] sm:text-[38px]"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
        >
          {cfg.h1}
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/60">{cfg.intro}</p>

        <div className="mt-5 flex flex-wrap gap-2.5">
          <Link
            to={cfg.practiceTo}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            params={{} as any}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#ae2f26] px-5 py-2.5 text-sm font-semibold text-[#fff8f5] transition hover:brightness-110"
          >
            {cfg.practiceLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to={`/guider/${delprov}` as string}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            params={{} as any}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-5 py-2.5 text-sm font-semibold text-[var(--cream)] transition hover:border-[#ae2f26]/50"
          >
            <ScrollText className="h-4 w-4" />
            {cfg.code}-guide & strategi
          </Link>
        </div>
      </header>

      {/* Exempelfrågor */}
      {examples.length > 0 && (
        <section className="mt-10">
          <h2
            className="text-[20px] font-bold text-[var(--cream)] sm:text-[24px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Exempelfrågor med facit
          </h2>
          <p className="mt-1 text-sm text-white/45">
            Riktiga {cfg.code}-frågor från tidigare högskoleprov.
          </p>

          <ol className="mt-4 space-y-3">
            {examples.map((q, i) => (
              <li
                key={`${q.term}-${q.pass}-${q.nr}`}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-sm"
              >
                <div className="text-[13px] font-semibold tracking-wide text-[var(--amber)]">
                  Exempel {i + 1}
                </div>
                {q.passage && (
                  <p className="mt-2 text-[13px] leading-relaxed text-white/55">{q.passage}</p>
                )}
                {q.text && !q.image && (
                  <p className="mt-2 text-[15px] font-medium leading-relaxed text-[var(--cream)]">
                    {cfg.code === "ORD" ? ordText(q.text) : q.text}
                  </p>
                )}
                {q.figure && (
                  <img
                    src={q.figure}
                    alt={`Diagram till ${cfg.code}-uppgift ${q.nr}`}
                    loading="lazy"
                    decoding="async"
                    className="exam-figure mt-3 w-full rounded-lg border border-white/10"
                  />
                )}
                {q.image && (
                  <img
                    src={q.image}
                    alt={`${cfg.code}-uppgift ${q.nr} ur provhäftet`}
                    loading="lazy"
                    decoding="async"
                    className="exam-figure mt-3 w-full rounded-lg border border-white/10"
                  />
                )}
                {q.alternatives && (
                  <ul className="mt-3 grid gap-1.5">
                    {q.alternatives.map((text, ai) => {
                      const isCorrect = q.answer === ALT_LABELS[ai];
                      return (
                        <li
                          key={ai}
                          className={`flex items-start gap-2.5 rounded-lg border px-3 py-1.5 text-sm ${
                            isCorrect
                              ? "border-[var(--success-line)] bg-[var(--success-soft)] text-[var(--cream)]"
                              : "border-transparent text-white/65"
                          }`}
                        >
                          <span
                            className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-bold ${
                              isCorrect
                                ? "bg-[var(--success)] text-[var(--success-ink)]"
                                : "bg-white/10 text-white/60"
                            }`}
                          >
                            {ALT_LABELS[ai]}
                          </span>
                          <span className="leading-relaxed">
                            {cfg.code === "ORD" ? ordText(text) : text}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <p className="mt-2.5 text-xs font-semibold text-[var(--teal)]">
                  Rätt svar: {q.answer} ·{" "}
                  <Link
                    to="/gamla-prov/$term/$pass"
                    params={{ term: q.term, pass: String(q.pass) }}
                    className="underline-offset-2 hover:underline"
                  >
                    {q.label}, provpass {q.pass}
                  </Link>
                </p>
              </li>
            ))}
          </ol>

          <Link
            to={cfg.practiceTo}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            params={{} as any}
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#ae2f26] hover:underline"
          >
            <BookOpen className="h-4 w-4" />
            {cfg.practiceLabel}
          </Link>
        </section>
      )}

      {/* Övriga delprov */}
      <section className="mt-14 border-t border-white/8 pt-8">
        <h2
          className="text-[18px] font-bold text-[var(--cream)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Öva andra delprov
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {DELPROV_SLUGS.filter((s) => s !== delprov).map((s) => (
            <Link
              key={s}
              to="/ova/$delprov"
              params={{ delprov: s }}
              className="rounded-full border border-white/12 px-3.5 py-1.5 text-sm text-white/70 transition hover:border-[#ae2f26]/50 hover:text-[var(--cream)]"
            >
              {DELPROV[s].code}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
