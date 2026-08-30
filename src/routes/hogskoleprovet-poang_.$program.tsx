import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { fitTitle } from "@/lib/seo-text";
import { formatDecimal } from "@/lib/sv-format";
import { ArrowRight, GraduationCap, Info } from "lucide-react";

/* =====================================================================
   POÄNGGRÄNSER PER PROGRAM ("money pages" — se SEO-AUDIT.md)

   HP-poäng per lärosäte, en sida per program. All data är hämtad direkt ur
   UHR:s antagningsstatistik (uhr.se/studier-och-antagning/antagningsstatistik),
   urval 2, HT 2026 — inte gissad, inte skrapad från tredje part. Se
   `verifiedAt` per program.

   Siffrorna ändras varje antagningsomgång. Uppdatera genom att söka om på
   uhr.se (välj termin, sök på programmets namn) och byt `term`/`verifiedAt`
   samt raderna i `schools`. Hitta aldrig på ett tal — en TODO-rad slår ett
   påhittat antagningspoäng.
   ===================================================================== */

type StatRow = {
  /** Lärosäte, eller — för Handelshögskolans historik — ett årtal. */
  label: string;
  /** Studieort, eller en kompletterande rad (t.ex. antal sökande). */
  sub?: string;
  /** HP-poäng (urvalsgrupp Högskoleprov), 0–2. */
  hp: number;
  /** BI-poäng (gymnasiebetyg utan komplettering), om det är relevant att visa. */
  bi?: number;
};

type ProgramConfig = {
  name: string;
  h1: string;
  intro: string;
  /** Extra kontext-stycke, t.ex. om ett alternativt urval (PIL). */
  note?: string;
  schools: StatRow[];
  /** Kolumnrubrik för `label`-kolumnen: "Lärosäte" eller "Antagningsomgång". */
  labelHeader: string;
  term: string;
  sourceUrl: string;
  /** Vad länken kallas — UHR:s tabell för de flesta, lärosätets egen för Handelshögskolan. */
  sourceLabel: string;
  /** Organisationen bakom källan, för JSON-LD:ns creator-fält. */
  sourceOrg: string;
  verifiedAt: string;
  relatedPrograms: string[];
};

const PROGRAM: Record<string, ProgramConfig> = {
  lakarprogrammet: {
    name: "Läkarprogrammet",
    h1: "Läkarprogrammet — HP-poäng per lärosäte",
    intro:
      "Läkarprogrammet finns vid åtta lärosäten i Sverige och hör till de mest sökta utbildningarna i landet. Här är den senaste antagningspoängen i högskoleprovsgruppen (HP) för de största.",
    note: "Karolinska Institutet antar dessutom en del av sina platser genom PIL (prov- och intervjubaserat urval) — ett separat spår med kognitivt test och intervjuer, där ett starkt högskoleprovsresultat är biljetten in till steg två. PIL ersätter inte HP-kvoten ovan, det är en tredje väg vid sidan av den.",
    labelHeader: "Lärosäte",
    schools: [
      { label: "Lunds universitet", sub: "Lund", hp: 1.8 },
      { label: "Karolinska institutet", sub: "Solna", hp: 1.75 },
      { label: "Uppsala universitet", sub: "Uppsala", hp: 1.75 },
      { label: "Göteborgs universitet", sub: "Göteborg", hp: 1.7 },
      { label: "Linköpings universitet", sub: "Linköping", hp: 1.65 },
      { label: "Örebro universitet", sub: "Örebro", hp: 1.65 },
    ],
    term: "HT 2026",
    sourceUrl: "https://www.uhr.se/studier-och-antagning/antagningsstatistik/",
    sourceLabel: "UHR:s antagningsstatistik",
    sourceOrg: "Universitets- och högskolerådet (UHR)",
    verifiedAt: "2026-08-22",
    relatedPrograms: ["tandlakarprogrammet", "psykologprogrammet"],
  },
  civilekonom: {
    name: "Civilekonomprogrammet, Handelshögskolan i Stockholm",
    h1: "Handelshögskolan — HP-poäng för Civilekonomprogrammet",
    intro:
      "Handelshögskolan i Stockholm (SSE) är en fristående högskola och en av de mest sökta ekonomutbildningarna i landet. Sedan 2025 antas de flesta platserna via gymnasiebetyg med meritpoäng, men en HP-kvot finns kvar — och kravet har stigit varje år.",
    note: "Från och med 2025 räknar Handelshögskolan in meritpoäng i betygsurvalet (max meritvärde höjt från 20,0 till 22,5), vilket är varför BI/BII-poängen ovan inte är direkt jämförbara mellan 2024 och 2025. HP-kravet påverkas inte av den ändringen.",
    labelHeader: "Antagningsomgång",
    schools: [
      { label: "2026", hp: 1.95, bi: 21.9 },
      { label: "2025", hp: 1.85, bi: 19.79 },
      { label: "2024", hp: 1.85, bi: 19.58 },
      { label: "2023", hp: 1.8, bi: 19.43 },
      { label: "2022", hp: 1.75, bi: 19.32 },
      { label: "2021", hp: 1.75, bi: 19.27 },
    ],
    term: "Hösten 2026 (senaste), historik sedan 2021",
    sourceUrl:
      "https://www.hhs.se/sv/utbildning/bsc/admission/swedish-proficiency/antagningsstatistik-for-betyg-hogskoleprov/",
    sourceLabel: "Handelshögskolans egen antagningsstatistik",
    sourceOrg: "Handelshögskolan i Stockholm",
    verifiedAt: "2026-08-22",
    relatedPrograms: ["juristprogrammet"],
  },
  "teknisk-fysik": {
    name: "Civilingenjörsutbildning i teknisk fysik",
    h1: "Teknisk fysik — HP-poäng, KTH och Lund",
    intro:
      "Teknisk fysik är ett av de mest teoretiskt tunga civilingenjörsprogrammen och finns på flera lärosäten. KTH och Lunds universitet har i stort sett identiska HP-krav.",
    labelHeader: "Lärosäte",
    schools: [
      { label: "Kungl. Tekniska högskolan (KTH)", sub: "Stockholm", hp: 1.8 },
      { label: "Lunds universitet", sub: "Lund (LTH)", hp: 1.8 },
    ],
    term: "HT 2026",
    sourceUrl: "https://www.uhr.se/studier-och-antagning/antagningsstatistik/",
    sourceLabel: "UHR:s antagningsstatistik",
    sourceOrg: "Universitets- och högskolerådet (UHR)",
    verifiedAt: "2026-08-22",
    relatedPrograms: ["lakarprogrammet"],
  },
  psykologprogrammet: {
    name: "Psykologprogrammet",
    h1: "Psykologprogrammet — HP-poäng per lärosäte",
    intro:
      "Psykologprogrammet ges vid elva lärosäten i Sverige. Kravet i högskoleprovsgruppen varierar mer mellan orter än för de flesta andra program på den här listan — från 1,25 till 1,70.",
    labelHeader: "Lärosäte",
    schools: [
      { label: "Lunds universitet", sub: "Lund", hp: 1.7 },
      { label: "Uppsala universitet", sub: "Uppsala", hp: 1.65 },
      { label: "Göteborgs universitet", sub: "Göteborg", hp: 1.6 },
      { label: "Stockholms universitet", sub: "Stockholm", hp: 1.55 },
      { label: "Karolinska institutet", sub: "Solna", hp: 1.5 },
      { label: "Linköpings universitet", sub: "Linköping", hp: 1.5 },
      { label: "Karlstads universitet", sub: "Karlstad", hp: 1.45 },
      { label: "Linnéuniversitetet", sub: "Växjö", hp: 1.45 },
      { label: "Örebro universitet", sub: "Örebro", hp: 1.45 },
      { label: "Mittuniversitetet", sub: "Östersund", hp: 1.3 },
      { label: "Luleå tekniska universitet", sub: "Luleå", hp: 1.25 },
    ],
    term: "HT 2026",
    sourceUrl: "https://www.uhr.se/studier-och-antagning/antagningsstatistik/",
    sourceLabel: "UHR:s antagningsstatistik",
    sourceOrg: "Universitets- och högskolerådet (UHR)",
    verifiedAt: "2026-08-22",
    relatedPrograms: ["lakarprogrammet", "juristprogrammet"],
  },
  juristprogrammet: {
    name: "Juristprogrammet",
    h1: "Juristprogrammet — HP-poäng per lärosäte",
    intro:
      "Juristprogrammet är enligt UHR:s egen statistik det program som drar flest behöriga sökande i landet. Det ges vid sex lärosäten, med Lund som mest krävande i HP-kvoten.",
    labelHeader: "Lärosäte",
    schools: [
      { label: "Lunds universitet", sub: "Lund", hp: 1.6 },
      { label: "Uppsala universitet", sub: "Uppsala", hp: 1.5 },
      { label: "Göteborgs universitet", sub: "Göteborg", hp: 1.4 },
      { label: "Stockholms universitet", sub: "Stockholm", hp: 1.4 },
      { label: "Karlstads universitet", sub: "Karlstad", hp: 1.25 },
      { label: "Örebro universitet", sub: "Örebro", hp: 1.25 },
    ],
    term: "HT 2026",
    sourceUrl: "https://www.uhr.se/studier-och-antagning/antagningsstatistik/",
    sourceLabel: "UHR:s antagningsstatistik",
    sourceOrg: "Universitets- och högskolerådet (UHR)",
    verifiedAt: "2026-08-22",
    relatedPrograms: ["civilekonom", "psykologprogrammet"],
  },
  tandlakarprogrammet: {
    name: "Tandläkarprogrammet",
    h1: "Tandläkarprogrammet — HP-poäng per lärosäte",
    intro:
      "Tandläkarprogrammet ges vid tre lärosäten. Kraven ligger tätt ihop och strax under läkarprogrammets.",
    labelHeader: "Lärosäte",
    schools: [
      { label: "Göteborgs universitet", sub: "Göteborg", hp: 1.45 },
      { label: "Karolinska institutet", sub: "Huddinge", hp: 1.45 },
      { label: "Malmö universitet", sub: "Malmö", hp: 1.4 },
    ],
    term: "HT 2026",
    sourceUrl: "https://www.uhr.se/studier-och-antagning/antagningsstatistik/",
    sourceLabel: "UHR:s antagningsstatistik",
    sourceOrg: "Universitets- och högskolerådet (UHR)",
    verifiedAt: "2026-08-22",
    relatedPrograms: ["lakarprogrammet"],
  },
  sjukskoterskeprogrammet: {
    name: "Sjuksköterskeprogrammet",
    h1: "Sjuksköterskeprogrammet — HP-poäng, olika orter",
    intro:
      "Sjuksköterskeprogrammet ges på fler orter än något annat program på den här listan, inklusive decentraliserade platser. Kravet skiljer sig mycket mellan campus — betydligt mer än för de mer eftersökta programmen ovan.",
    labelHeader: "Lärosäte / studieort",
    schools: [
      { label: "Uppsala universitet", sub: "Uppsala", hp: 1.1 },
      { label: "Umeå universitet", sub: "Umeå", hp: 0.85 },
      { label: "Blekinge tekniska högskola", sub: "Karlskrona", hp: 0.5 },
      { label: "Uppsala universitet", sub: "Campus Gotland", hp: 0.65 },
      { label: "Umeå universitet", sub: "Decentraliserad, Skellefteå", hp: 0.45 },
    ],
    term: "HT 2026",
    sourceUrl: "https://www.uhr.se/studier-och-antagning/antagningsstatistik/",
    sourceLabel: "UHR:s antagningsstatistik",
    sourceOrg: "Universitets- och högskolerådet (UHR)",
    verifiedAt: "2026-08-22",
    relatedPrograms: ["lakarprogrammet"],
  },
};

export const PROGRAM_SLUGS = Object.keys(PROGRAM);
export const PROGRAM_LIST = Object.entries(PROGRAM).map(([slug, cfg]) => ({
  slug,
  name: cfg.name,
}));

export const Route = createFileRoute("/hogskoleprovet-poang_/$program")({
  loader: ({ params }) => {
    const cfg = PROGRAM[params.program];
    if (!cfg) throw notFound();
    return cfg;
  },
  head: ({ params }) => {
    const cfg = PROGRAM[params.program];
    if (!cfg) return {};
    const path = `/hogskoleprovet-poang/${params.program}`;
    const top = [...cfg.schools].sort((a, b) => b.hp - a.hp)[0];
    return {
      meta: pageMeta({
        path,
        title: fitTitle(`${cfg.name}: HP-poäng ${cfg.term}`),
        description:
          `Antagningspoäng i högskoleprovsgruppen för ${cfg.name} (${cfg.term}), lärosäte för lärosäte. ` +
          `Källa: ${cfg.sourceLabel}. Uppdaterat ${cfg.verifiedAt}.`,
        ogTitle: `${cfg.name}: vad krävs på högskoleprovet?`,
        ogDescription: `HP-poäng ${cfg.term} för ${cfg.name}, lärosäte för lärosäte. Källa: ${cfg.sourceLabel}.`,
      }),
      links: pageLinks(path),
      scripts: [
        breadcrumbScript([
          { name: "Hem", path: "/" },
          { name: "Poäng & antagning", path: "/hogskoleprovet-poang" },
          { name: cfg.name, path },
        ]),
        jsonLdScript({
          "@context": "https://schema.org",
          "@type": "Dataset",
          name: `Antagningspoäng (HP) för ${cfg.name}, ${cfg.term}`,
          description: `${cfg.labelHeader} och lägsta antagningspoäng i högskoleprovsgruppen, ${cfg.term}.`,
          url: `https://tvakommanollan.se${path}`,
          inLanguage: "sv-SE",
          isAccessibleForFree: true,
          creator: { "@type": "Organization", name: cfg.sourceOrg },
          distribution: {
            "@type": "DataDownload",
            encodingFormat: "text/html",
            contentUrl: cfg.sourceUrl,
          },
          variableMeasured: top
            ? `Lägst HP-poäng: ${formatDecimal(top.hp, 2)} (${top.label})`
            : undefined,
          isPartOf: { "@id": "https://tvakommanollan.se/#website" },
        }),
      ],
    };
  },
  component: ProgramPage,
});

function ProgramPage() {
  const cfg = Route.useLoaderData();
  const rows = [...cfg.schools].sort((a, b) => b.hp - a.hp);
  const related = cfg.relatedPrograms
    .map((slug) => PROGRAM[slug])
    .filter((p): p is ProgramConfig => !!p);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
      <nav className="text-xs text-white/45" aria-label="Brödsmulor">
        <Link to="/" className="hover:text-white/70">
          Hem
        </Link>
        <span className="px-1.5">/</span>
        <Link to="/hogskoleprovet-poang" className="hover:text-white/70">
          Poäng &amp; antagning
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-white/70">{cfg.name}</span>
      </nav>

      <header className="mt-4">
        <h1
          className="text-[26px] font-bold leading-tight text-[var(--cream)] sm:text-[36px]"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
        >
          {cfg.h1}
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/60">{cfg.intro}</p>
      </header>

      <section className="mt-8">
        <h2
          className="flex items-center gap-2 text-[18px] font-bold text-[var(--cream)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <GraduationCap className="h-5 w-5 text-primary" />
          HP-poäng, {cfg.term}
        </h2>
        <ul className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm">
          {rows.map((r) => (
            <li
              key={`${r.label}-${r.sub ?? ""}`}
              className="flex items-center justify-between gap-4 border-b border-white/8 px-5 py-3.5 last:border-b-0"
            >
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-medium text-[var(--cream)]">
                  {r.label}
                </span>
                {r.sub && <span className="block text-xs text-white/45">{r.sub}</span>}
              </span>
              <span className="flex shrink-0 items-baseline gap-3">
                {r.bi != null && (
                  <span className="text-xs text-white/40">BI {formatDecimal(r.bi, 2)}</span>
                )}
                <span
                  className="text-[20px] font-bold tabular-nums text-primary"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {formatDecimal(r.hp, 2)}
                </span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 flex items-start gap-1.5 text-xs text-white/40">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          Lägsta HP-poäng som togs in i urval 2, {cfg.term}. Källa:{" "}
          <a
            href={cfg.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white/60"
          >
            {cfg.sourceLabel}
          </a>
          , kontrollerad {cfg.verifiedAt}. Gränserna sätts om varje antagningsomgång och kan både
          stiga och sjunka — använd talen som en fingervisning, inte ett facit för nästa termin.
        </p>
        {cfg.note && <p className="mt-4 text-[14px] leading-relaxed text-white/55">{cfg.note}</p>}
      </section>

      <section className="mt-10 rounded-2xl border border-primary/25 bg-primary/[0.06] p-6 sm:p-8">
        <h2
          className="text-[20px] font-bold text-[var(--cream)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Öva upp din HP-poäng
        </h2>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-white/60">
          Aktivt övande på riktiga HP-frågor är det mest effektiva sättet att höja resultatet. Räkna
          ut var du ligger i dag, öva sedan på riktiga uppgifter från gamla prov.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Link
            to="/hogskoleprovet-poangraknare"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-brand transition hover:brightness-110"
          >
            Räkna ut din poäng
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/gamla-prov"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-5 py-2.5 text-sm font-semibold text-[var(--cream)] transition hover:border-primary/50"
          >
            Öva på gamla prov
          </Link>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-10 border-t border-white/8 pt-8">
          <h2
            className="text-[16px] font-bold text-[var(--cream)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Andra program
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {related.map((p) => {
              const slug = Object.keys(PROGRAM).find((k) => PROGRAM[k] === p)!;
              return (
                <Link
                  key={slug}
                  to="/hogskoleprovet-poang/$program"
                  params={{ program: slug }}
                  className="rounded-full border border-white/12 px-3.5 py-1.5 text-sm text-white/70 transition hover:border-primary/50 hover:text-[var(--cream)]"
                >
                  {p.name}
                </Link>
              );
            })}
            <Link
              to="/hogskoleprovet-poang"
              className="rounded-full border border-white/12 px-3.5 py-1.5 text-sm text-white/70 transition hover:border-primary/50 hover:text-[var(--cream)]"
            >
              Alla program
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
