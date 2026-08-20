import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileText } from "lucide-react";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { fitTitle } from "@/lib/seo-text";
import { PageHero } from "@/components/layout/PageHero";
import { ProvResumeCard } from "@/components/prov/ProvResumeCard";
import { ProvScoreRow } from "@/components/prov/ProvScore";
import { useProvResults } from "@/hooks/useProvResults";
import { allExams, totalQuestions } from "@/lib/prov-data";
import { passResult, summariseExam, type ProvResults } from "@/lib/prov-results";
import { formatInt } from "@/lib/sv-format";
import { delprovFull, passKindLabel, type ExamSummary } from "@/types/gamla-prov";

/* =====================================================================
   Alla gamla högskoleprov UHR publicerat, ett kort per provtillfälle.
   Serverrenderad ur src/data/prov/index.json — sidan hämtade tidigare hela
   uppgiftsmängden i webbläsaren och visade en spinner så länge.
   ===================================================================== */

export const Route = createFileRoute("/gamla-prov")({
  component: GamlaProvPage,
  head: () => {
    const exams = allExams();
    const count = totalQuestions();
    const oldest = exams[exams.length - 1]?.date.slice(0, 4) ?? "2013";
    const newest = exams[0]?.date.slice(0, 4) ?? "2026";
    return {
      meta: pageMeta({
        path: "/gamla-prov",
        title: fitTitle(
          `Gamla högskoleprov ${oldest}–${newest} · alla provpass med facit`,
          "· Tvåkommanollan",
        ),
        description:
          `Skriv ${exams.length} riktiga högskoleprov online: ${formatInt(count)} uppgifter från ` +
          `${oldest} till ${newest} med facit, originaltid och automatisk rättning. Gratis och utan inloggning.`,
        ogTitle: `Gamla högskoleprov ${oldest}–${newest} · Tvåkommanollan`,
        ogDescription: `${exams.length} provtillfällen, ${formatInt(count)} uppgifter med facit. Gratis.`,
      }),
      links: pageLinks("/gamla-prov"),
      scripts: [
        breadcrumbScript([
          { name: "Hem", path: "/" },
          { name: "Gamla prov", path: "/gamla-prov" },
        ]),
        jsonLdScript({
          "@context": "https://schema.org",
          "@type": "LearningResource",
          name: `Gamla högskoleprov ${oldest}–${newest} med facit`,
          description: `Samtliga provpass från högskoleprovet ${oldest}–${newest}, med facit och rättning i webbläsaren.`,
          url: "https://tvakommanollan.se/gamla-prov",
          inLanguage: "sv-SE",
          isAccessibleForFree: true,
          learningResourceType: "Practice exam",
          educationalUse: "Test preparation",
          educationalLevel: "Gymnasieelev och högskolesökande",
          audience: { "@type": "EducationalAudience", educationalRole: "student" },
          publisher: { "@id": "https://tvakommanollan.se/#org" },
          teaches: ["ORD", "MEK", "LÄS", "ELF", "XYZ", "KVA", "NOG", "DTK"].map(delprovFull),
        }),
        jsonLdScript({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Gamla högskoleprov",
          itemListElement: exams.map((exam, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: `Högskoleprovet ${exam.label}`,
            url: `https://tvakommanollan.se/gamla-prov/${exam.term}`,
          })),
        }),
      ],
    };
  },
});

function GamlaProvPage() {
  const exams = allExams();
  const count = totalQuestions();

  // Vad besökaren skrivit ligger i webbläsaren. Sidan är serverrenderad och
  // lika för alla; resultaten läggs ovanpå efter montering.
  const results = useProvResults();

  return (
    <div className="min-h-screen">
      <PageHero
        eyebrow="Högskoleprovet · gamla prov"
        title="Alla gamla högskoleprov"
        subtitle={`${exams.length} provtillfällen och ${formatInt(count)} uppgifter med facit. Skriv hela provpass på tid, direkt i webbläsaren.`}
        align="center"
        variant="compact"
      />

      <div className="mx-auto max-w-4xl px-4 pb-24 sm:px-6">
        <ProvResumeCard />

        <ul className="grid gap-3 sm:grid-cols-2">
          {exams.map((exam) => (
            <li key={exam.term}>
              <ExamCard exam={exam} results={results} />
            </li>
          ))}
        </ul>

        <section className="mt-12 rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm">
          <h2
            className="flex items-center gap-2 text-lg font-bold text-[var(--cream)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <FileText className="h-5 w-5 text-[var(--amber)]" aria-hidden />
            Om proven
          </h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-[var(--text-secondary)]">
            <p>
              Ett högskoleprov består av fem provpass, varav ett är ett utprövningspass som inte
              räknas. De fyra som räknas, två verbala och två kvantitativa, publiceras av
              Universitets- och högskolerådet efter provdagen. Det är dem du hittar här, uppdelade
              precis som i provhäftet och med samma tidsgräns: 55 minuter per pass.
            </p>
            <p>
              Matematikuppgifterna visas som utsnitt ur originalhäftet, eftersom formler, figurer
              och diagram inte går att återge troget som text. Övriga uppgifter är text, vilket gör
              dem sökbara och lästa av skärmläsare.
            </p>
            <p>
              Engelsk läsförståelse (ELF) finns med i varje provpass. UHR byter en vecka efter
              provdagen ut häftet mot en version utan den engelska texten, av upphovsrättsskäl, så
              de flesta sajter saknar den delen. Här är originalhäftena spårade upp, prov för prov.
              Varje verbalt pass går alltså att skriva i sin helhet.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

/**
 * Ett provtillfälle i listan — och, för den som skrivit något av passen, vad
 * det gav: rätt av antal på varje provpass, delpoäng när en hel del är skriven
 * och totalpoäng när provet är helt.
 *
 * Poängen står här och inte bara inne på provtillfället därför att den som
 * skrollar listan letar efter nästa prov att skriva: vilka som är gjorda, och
 * hur det gick, är själva frågan.
 */
function ExamCard({ exam, results }: { exam: ExamSummary; results: ProvResults | null }) {
  const result = results ? summariseExam(exam, results) : null;

  return (
    <Link
      to="/gamla-prov/$term"
      params={{ term: exam.term }}
      className="group flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-sm transition-colors hover:border-[var(--amber)]/50 hover:bg-white/[0.04]"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-base font-semibold text-[var(--cream)]">{exam.label}</span>
        <ArrowRight
          className="h-4 w-4 shrink-0 text-[var(--text-tertiary)] transition-colors group-hover:text-[var(--amber)]"
          aria-hidden
        />
      </span>
      <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--text-tertiary)]">
        <span>
          {exam.passes.length} provpass · {formatInt(exam.questions)} uppgifter
        </span>
      </span>
      <span className="mt-3 flex flex-wrap gap-1.5">
        {exam.passes.map((p) => {
          const written = results ? passResult(results, exam.term, p.pass) : undefined;
          return (
            <span
              key={p.pass}
              className={`rounded-full px-2 py-0.5 text-[11px] ${
                written
                  ? "bg-[var(--success-soft)] text-[var(--success)]"
                  : "bg-white/[0.05] text-[var(--text-secondary)]"
              }`}
            >
              Pass {p.pass} · {passKindLabel(p.kind)}
              {written && (
                <span className="font-semibold tabular-nums">
                  {" · "}
                  {written.score}/{written.total}
                </span>
              )}
            </span>
          );
        })}
      </span>
      {result && <ProvScoreRow result={result} />}
    </Link>
  );
}
