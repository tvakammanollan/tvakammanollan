import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { ordText } from "@/lib/sv-format";
import { termToLabel, type RawQ } from "@/types/gamla-prov";
import { ArrowRight, ArrowLeft } from "lucide-react";

/* =====================================================================
   PROGRAMMATISK SEO: en indexerbar sida per gammalt högskoleprov-tillfälle,
   t.ex. /gamla-prov/2026vt → "Högskoleprovet Vårprovet 2026 – frågor & facit".
   Datat hämtas + filtreras i en server-loader (SSR) så HTML:en är crawlbar
   och bara det aktuella provets frågor skickas till klienten (inte hela 916 kB).
   ===================================================================== */

const DATA_URL = "https://hpkampen.se/gamla-prov-data.json";
const ALT_KEYS = ["a", "b", "c", "d", "e"] as const;
const ALT_LABELS = ["A", "B", "C", "D", "E"];

// Kända provtillfällen (matchar exam_term i datan). Används för intern länkning.
const KNOWN_TERMS = ["2026vt", "2025ht", "2025vt", "2024ht", "2024vt", "2022ht"];

const DELPROV_ORDER = ["ORD", "MEK", "LÄS", "ELF", "XYZ", "KVA", "NOG", "DTK"];

function delProvFull(code: string): string {
  const m: Record<string, string> = {
    ORD: "Ordförståelse (ORD)",
    MEK: "Meningskomplettering (MEK)",
    LÄS: "Läsförståelse (LÄS)",
    ELF: "Engelsk läsförståelse (ELF)",
    XYZ: "Matematisk problemlösning (XYZ)",
    KVA: "Kvantitativa jämförelser (KVA)",
    NOG: "Kvantitativa resonemang (NOG)",
    DTK: "Diagram, tabeller och kartor (DTK)",
  };
  return m[code] || code;
}

export const Route = createFileRoute("/gamla-prov_/$term")({
  loader: async ({ params }) => {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw notFound();
    const all = (await res.json()) as RawQ[];
    const questions = all
      .filter((q) => q.exam_term === params.term)
      .sort((a, b) => a.provpass - b.provpass || a.nr - b.nr);
    if (questions.length === 0) throw notFound();
    return { questions };
  },
  head: ({ params }) => {
    const label = termToLabel(params.term);
    const path = `/gamla-prov/${params.term}`;
    return {
      meta: pageMeta({
        path,
        title: `Högskoleprovet ${label} – alla frågor med facit · HP Kampen`,
        description: `Hela ${label} (högskoleprovet ${params.term}) gratis: alla frågor i ORD, MEK, LÄS, ELF, XYZ, KVA, NOG och DTK med facit (rätt svar). Öva online utan inloggning.`,
        ogTitle: `Högskoleprovet ${label} – frågor & facit`,
        ogDescription: `Alla delprov från ${label} med rätt svar. Öva gratis på HP Kampen.`,
      }),
      links: pageLinks(path),
      scripts: [
        breadcrumbScript([
          { name: "Hem", path: "/" },
          { name: "Gamla prov", path: "/gamla-prov" },
          { name: label, path },
        ]),
        jsonLdScript({
          "@context": "https://schema.org",
          "@type": "LearningResource",
          name: `Högskoleprovet ${label} – frågor med facit`,
          description: `Komplett uppsättning frågor från ${label} med rätt svar, för alla åtta delprov.`,
          url: `https://hpkampen.se${path}`,
          inLanguage: "sv-SE",
          isAccessibleForFree: true,
          learningResourceType: "Exam",
          educationalLevel: "Högskoleförberedande",
          about: { "@type": "Thing", name: "Högskoleprovet" },
          isPartOf: { "@id": "https://hpkampen.se/#website" },
        }),
      ],
    };
  },
  component: ExamTermPage,
});

function ExamTermPage() {
  const { term } = Route.useParams();
  const { questions } = Route.useLoaderData();
  const label = termToLabel(term);

  // Gruppera per delprov i kanonisk ordning.
  const byDelprov = new Map<string, RawQ[]>();
  for (const q of questions) {
    const arr = byDelprov.get(q.delProv) ?? [];
    arr.push(q);
    byDelprov.set(q.delProv, arr);
  }
  const groups = DELPROV_ORDER.filter((d) => byDelprov.has(d)).map((d) => ({
    code: d,
    items: byDelprov.get(d)!,
  }));

  const idx = KNOWN_TERMS.indexOf(term);
  const newer = idx > 0 ? KNOWN_TERMS[idx - 1] : null;
  const older = idx >= 0 && idx < KNOWN_TERMS.length - 1 ? KNOWN_TERMS[idx + 1] : null;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
      {/* Breadcrumb */}
      <nav className="text-xs text-white/45" aria-label="Brödsmulor">
        <Link to="/" className="hover:text-white/70">
          Hem
        </Link>
        <span className="px-1.5">/</span>
        <Link to="/gamla-prov" className="hover:text-white/70">
          Gamla prov
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-white/70">{label}</span>
      </nav>

      <header className="mt-4">
        <h1
          className="text-[30px] font-bold leading-tight text-[#e8e4da] sm:text-[40px]"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
        >
          Högskoleprovet {label}
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/60">
          Alla {questions.length} frågor från {label} med{" "}
          <strong className="text-white/80">facit</strong> (rätt svar), uppdelat per delprov. Helt
          gratis och utan inloggning. Vill du öva med tidtagning och automatisk rättning?{" "}
          <Link to="/gamla-prov" className="font-medium text-[#f2a65a] hover:underline">
            Skriv hela provet interaktivt
          </Link>
          .
        </p>

        <div className="mt-5 flex flex-wrap gap-2.5">
          <Link
            to="/gamla-prov"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#f2a65a] px-5 py-2.5 text-sm font-semibold text-[#1a0d04] transition hover:brightness-110"
          >
            Öva provet med rättning
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/ord"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            params={{} as any}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-5 py-2.5 text-sm font-semibold text-[#e8e4da] transition hover:border-[#f2a65a]/50"
          >
            Träna ord (ORD)
          </Link>
        </div>
      </header>

      {/* Delprov-sektioner */}
      <div className="mt-10 space-y-10">
        {groups.map((g) => (
          <section key={g.code}>
            <h2
              className="text-[20px] font-bold text-[#e8e4da] sm:text-[24px]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {delProvFull(g.code)}
            </h2>
            <p className="mt-1 text-sm text-white/45">{g.items.length} frågor med facit</p>

            <ol className="mt-4 space-y-3">
              {g.items.map((q, i) => {
                const prev = g.items[i - 1];
                const showPassage = q.passage && q.passage !== prev?.passage;
                return (
                  <li key={`${q.provpass}-${q.nr}`}>
                    {showPassage && (
                      <div className="mb-2 rounded-xl border border-white/8 bg-white/[0.015] p-4 text-sm leading-relaxed whitespace-pre-wrap text-white/70">
                        {q.passage_title && (
                          <div className="mb-1 font-semibold text-white/80">{q.passage_title}</div>
                        )}
                        {q.passage}
                      </div>
                    )}
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-sm">
                      <div className="text-[13px] font-semibold tracking-wide text-[#f2a65a]">
                        Fråga {q.nr}
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-[15px] font-medium leading-relaxed text-[#e8e4da]">
                        {g.code === "ORD" ? ordText(q.fraga) : q.fraga}
                      </p>
                      {q.image && (
                        <img
                          src={q.image}
                          alt={`Figur till ${g.code}-fråga ${q.nr} i högskoleprovet ${label}`}
                          loading="lazy"
                          decoding="async"
                          className="mt-3 w-full rounded-lg border border-white/10 exam-figure object-contain"
                          style={{ aspectRatio: "5 / 7" }}
                        />
                      )}
                      <ul className="mt-3 grid gap-1.5">
                        {ALT_KEYS.map((k, ai) => {
                          const isCorrect = q.svar?.toUpperCase() === ALT_LABELS[ai];
                          const text = q[k];
                          if (!text) return null;
                          return (
                            <li
                              key={k}
                              className={`flex items-start gap-2.5 rounded-lg border px-3 py-1.5 text-sm ${
                                isCorrect
                                  ? "border-[var(--success-line)] bg-[var(--success-soft)] text-[#e8e4da]"
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
                                {g.code === "ORD" ? ordText(text) : text}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                      <p className="mt-2.5 text-xs font-semibold text-[#6fb3b8]">
                        Rätt svar: {q.svar?.toUpperCase()}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>

      {/* Andra prov (intern länkning) */}
      <section className="mt-14 border-t border-white/8 pt-8">
        <h2
          className="text-[18px] font-bold text-[#e8e4da]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Fler gamla högskoleprov
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {KNOWN_TERMS.filter((t) => t !== term).map((t) => (
            <Link
              key={t}
              to="/gamla-prov/$term"
              params={{ term: t }}
              className="rounded-full border border-white/12 px-3.5 py-1.5 text-sm text-white/70 transition hover:border-[#f2a65a]/50 hover:text-[#e8e4da]"
            >
              {termToLabel(t)}
            </Link>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between text-sm">
          {older ? (
            <Link
              to="/gamla-prov/$term"
              params={{ term: older }}
              className="inline-flex items-center gap-1.5 text-white/60 hover:text-[#e8e4da]"
            >
              <ArrowLeft className="h-4 w-4" />
              {termToLabel(older)}
            </Link>
          ) : (
            <span />
          )}
          {newer ? (
            <Link
              to="/gamla-prov/$term"
              params={{ term: newer }}
              className="inline-flex items-center gap-1.5 text-white/60 hover:text-[#e8e4da]"
            >
              {termToLabel(newer)}
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <span />
          )}
        </div>
      </section>
    </div>
  );
}
