import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { allExams, examNeighbours, findExam, loadPass } from "@/lib/prov-data";
import { formatDateLong, formatInt } from "@/lib/sv-format";
import { delprovFull, passKindLabel, type PassSummary } from "@/types/gamla-prov";

/* =====================================================================
   Ett provtillfälle: provpassen att skriva, plus hela facit i en tabell.
   Serverrenderad så att både uppgiftsfördelning och rätta svar är crawlbara
   ("högskoleprovet våren 2019 facit").
   ===================================================================== */

export const Route = createFileRoute("/gamla-prov_/$term")({
  loader: async ({ params }) => {
    const exam = findExam(params.term);
    if (!exam) throw notFound();
    const facit = await Promise.all(
      exam.passes.map(async (p) => {
        const data = await loadPass(params.term, p.pass);
        return {
          pass: p.pass,
          answers: (data?.questions ?? []).map((q) => ({ nr: q.nr, answer: q.answer })),
        };
      }),
    );
    return { exam, facit };
  },
  head: ({ loaderData }) => {
    const exam = loaderData?.exam;
    if (!exam) return {};
    const path = `/gamla-prov/${exam.term}`;
    return {
      meta: pageMeta({
        path,
        title: `Högskoleprovet ${exam.label} – alla provpass med facit · Tvåkommanollan`,
        description:
          `Skriv ${exam.label} online: ${exam.passes.length} provpass och ${formatInt(exam.questions)} ` +
          `uppgifter med facit, på originaltid och med automatisk rättning. Gratis, utan inloggning.`,
        ogTitle: `Högskoleprovet ${exam.label} – provpass & facit`,
        ogDescription: `${formatInt(exam.questions)} uppgifter med rätta svar. Öva gratis på Tvåkommanollan.`,
      }),
      links: pageLinks(path),
      scripts: [
        breadcrumbScript([
          { name: "Hem", path: "/" },
          { name: "Gamla prov", path: "/gamla-prov" },
          { name: exam.label, path },
        ]),
        jsonLdScript({
          "@context": "https://schema.org",
          "@type": "LearningResource",
          name: `Högskoleprovet ${exam.label} – provpass med facit`,
          description: `Samtliga ${exam.passes.length} provpass från ${exam.label} med rätta svar.`,
          url: `https://tvakommanollan.se${path}`,
          inLanguage: "sv-SE",
          isAccessibleForFree: true,
          learningResourceType: "Exam",
          educationalLevel: "Högskoleförberedande",
          datePublished: exam.date,
          about: { "@type": "Thing", name: "Högskoleprovet" },
          isPartOf: { "@id": "https://tvakommanollan.se/#website" },
        }),
      ],
    };
  },
  component: ExamTermPage,
});

function ExamTermPage() {
  const { exam, facit } = Route.useLoaderData();
  const { newer, older } = examNeighbours(exam.term);
  const others = allExams().filter((e) => e.term !== exam.term);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
      <nav className="text-xs text-white/45" aria-label="Brödsmulor">
        <Link to="/" className="hover:text-white/70">
          Hem
        </Link>
        <span className="px-1.5">/</span>
        <Link to="/gamla-prov" className="hover:text-white/70">
          Gamla prov
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-white/70">{exam.label}</span>
      </nav>

      <header className="mt-4">
        <h1
          className="text-[30px] font-bold leading-tight text-[var(--cream)] sm:text-[40px]"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
        >
          Högskoleprovet {exam.label}
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/60">
          Provdagen var {formatDateLong(exam.date)}. Här finns alla {formatInt(exam.questions)}{" "}
          uppgifter från provets {exam.passes.length} räknade provpass, med facit. Välj ett pass för
          att skriva det på tid med automatisk rättning, eller läs rätta svaren längre ned.
        </p>
      </header>

      <ol className="mt-8 space-y-3">
        {exam.passes.map((p) => (
          <li key={p.pass}>
            <PassCard term={exam.term} pass={p} />
          </li>
        ))}
      </ol>

      <section className="mt-12">
        <h2
          className="text-[20px] font-bold text-[var(--cream)] sm:text-[24px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Facit
        </h2>
        <p className="mt-1 text-sm text-white/45">
          Rätt svar för samtliga uppgifter, provpass för provpass.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {facit.map((f) => (
            <div
              key={f.pass}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-sm"
            >
              <h3 className="text-sm font-semibold text-[var(--cream)]">Provpass {f.pass}</h3>
              <ul className="mt-3 grid grid-cols-5 gap-1.5 sm:grid-cols-8">
                {f.answers.map((a) => (
                  <li
                    key={a.nr}
                    className="flex items-baseline justify-center gap-1 rounded-md bg-white/[0.04] px-1 py-1 text-[11px] tabular-nums"
                  >
                    <span className="text-white/45">{a.nr}</span>
                    <span className="font-bold text-[var(--amber)]">{a.answer}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14 border-t border-white/8 pt-8">
        <h2
          className="text-[18px] font-bold text-[var(--cream)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Fler gamla högskoleprov
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {others.map((e) => (
            <Link
              key={e.term}
              to="/gamla-prov/$term"
              params={{ term: e.term }}
              className="rounded-full border border-white/12 px-3.5 py-1.5 text-sm text-white/70 transition hover:border-[var(--amber)]/50 hover:text-[var(--cream)]"
            >
              {e.label}
            </Link>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 text-sm">
          {older ? (
            <Link
              to="/gamla-prov/$term"
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
              to="/gamla-prov/$term"
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
      </section>
    </div>
  );
}

function PassCard({ term, pass }: { term: string; pass: PassSummary }) {
  return (
    <Link
      to="/gamla-prov/$term/$pass"
      params={{ term, pass: String(pass.pass) }}
      className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-sm transition-colors hover:border-[var(--amber)]/50 hover:bg-white/[0.04]"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--amber)]/15 text-lg font-bold tabular-nums text-[var(--amber)]">
        {pass.pass}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold text-[var(--cream)]">
          Provpass {pass.pass} · {passKindLabel(pass.kind)}
        </span>
        <span className="mt-0.5 block text-xs text-[var(--text-tertiary)]">
          {pass.delprov.map(delprovFull).join(" · ")}
        </span>
        <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-tertiary)]">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {pass.minutes} min
          </span>
          <span>{pass.questions} uppgifter</span>
          {pass.missing.length > 0 && <span>{pass.missing.join(", ")} saknas</span>}
        </span>
      </span>
      <ArrowRight
        className="h-4 w-4 shrink-0 text-[var(--text-tertiary)] transition-colors group-hover:text-[var(--amber)]"
        aria-hidden
      />
    </Link>
  );
}
