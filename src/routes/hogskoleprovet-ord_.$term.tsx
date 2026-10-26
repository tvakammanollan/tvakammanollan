import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { describeWithin, fitTitle } from "@/lib/seo-text";
import { formatDateLong, formatInt } from "@/lib/sv-format";
import { examNeighbours, findExam } from "@/lib/prov-data";
import { termLabel, normeringDate } from "@/lib/normering";
import { loadExamOrd } from "@/lib/prov-ord";
import { ordSlug } from "@/lib/ord-slug";
import { getOrdlistaKnownSlugs } from "@/lib/ordlista.functions";

/* =====================================================================
   ORDEN PÅ ETT HÖGSKOLEPROV. "orden högskoleprovet hösten 2025" söks varje
   gång ett prov skrivits och året runt av den som pluggar ORD. Alla ord, alla
   alternativ och rätt svar, ur arkivet i src/data/prov. Varje ord som har en
   sida i ordlistan länkas dit; övriga står utan länk (inga 404:or).
   ===================================================================== */

const LETTERS = "ABCDE";

export const Route = createFileRoute("/hogskoleprovet-ord_/$term")({
  loader: async ({ params }) => {
    const exam = findExam(params.term);
    if (!exam) throw notFound();
    const ord = await loadExamOrd(params.term);
    if (!ord || ord.length === 0) throw notFound();
    const slugs = [...new Set(ord.map((o) => ordSlug(o.word)))];
    const known = await getOrdlistaKnownSlugs({ data: { slugs } }).catch(() => [] as string[]);
    return { exam, ord, known };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { exam, ord } = loaderData;
    const label = termLabel(exam.term, exam.date).toLowerCase();
    const path = `/hogskoleprovet-ord/${exam.term}`;
    const exempel = ord
      .slice(0, 4)
      .map((o) => o.word)
      .join(", ");
    return {
      meta: pageMeta({
        path,
        title: fitTitle(`Orden på högskoleprovet ${label}`, "med svar"),
        description: describeWithin(
          `Alla ${ord.length} ORD-uppgifter från högskoleprovet ${label} med svarsalternativ och rätt svar: ${exempel} med flera.`,
          "Öva sedan på hela provet gratis.",
        ),
        ogTitle: `Alla ${ord.length} ORD från högskoleprovet ${label}`,
        ogDescription: `${exempel} … Vilka kan du?`,
      }),
      links: pageLinks(path),
      scripts: [
        breadcrumbScript([
          { name: "Hem", path: "/" },
          { name: "Orden på högskoleprovet", path: "/hogskoleprovet-ord" },
          { name: termLabel(exam.term, exam.date), path },
        ]),
        jsonLdScript({
          "@context": "https://schema.org",
          "@type": "DefinedTermSet",
          name: `Orden på högskoleprovet ${label}`,
          url: `https://tvakommanollan.se${path}`,
          inLanguage: "sv-SE",
          hasDefinedTerm: ord.map((o) => ({
            "@type": "DefinedTerm",
            name: o.word,
            description: o.alternatives[LETTERS.indexOf(o.answer)] ?? undefined,
          })),
        }),
      ],
    };
  },
  component: ProvOrdPage,
});

function ProvOrdPage() {
  const { exam, ord, known } = Route.useLoaderData();
  const kända = new Set(known);
  const label = termLabel(exam.term, exam.date);
  const { newer, older } = examNeighbours(exam.term);
  const passes = [...new Set(ord.map((o) => o.pass))];

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
      <nav className="text-xs text-white/45" aria-label="Brödsmulor">
        <Link to="/" className="hover:text-white/70">
          Hem
        </Link>
        <span className="px-1.5">/</span>
        <Link to="/hogskoleprovet-ord" className="hover:text-white/70">
          Orden på högskoleprovet
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-white/70">{label}</span>
      </nav>

      <header className="mt-4">
        <p className="text-sm text-white/65">
          Delprovet ORD: {formatInt(ord.length)} uppgifter
        </p>
        <h1
          className="mt-2 text-[28px] font-bold leading-tight text-[var(--cream)] sm:text-[40px]"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
        >
          Orden på högskoleprovet {label.toLowerCase()}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-white/60">
          Högskoleprovet skrevs {formatDateLong(exam.date)}. Här är alla {formatInt(ord.length)}{" "}
          ORD-uppgifter från provets verbala provpass, med svarsalternativ och rätt svar. Ord som
          har en egen sida i ordlistan går att klicka på för betydelse och exempelmening.
        </p>
      </header>

      {passes.map((pass) => (
        <section key={pass} className="mt-10">
          <h2
            className="flex items-center gap-2 text-[20px] font-bold text-[var(--cream)] sm:text-[24px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Provpass {pass}
          </h2>
          <ol className="mt-4 space-y-3">
            {ord
              .filter((o) => o.pass === pass)
              .map((o) => {
                const slug = ordSlug(o.word);
                const rätt = LETTERS.indexOf(o.answer);
                return (
                  <li
                    key={`${o.pass}-${o.nr}`}
                    className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-sm"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-[18px] font-bold text-[var(--cream)]">
                        <span className="mr-2 text-[13px] font-medium tabular-nums text-white/45">
                          {o.nr}.
                        </span>
                        {kända.has(slug) ? (
                          <Link
                            to="/ordlista/$ord"
                            params={{ ord: slug }}
                            className="underline decoration-white/20 underline-offset-4 hover:decoration-primary"
                          >
                            {o.word}
                          </Link>
                        ) : (
                          o.word
                        )}
                      </h3>
                    </div>
                    <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                      {o.alternatives.map((alt, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2 text-[14.5px] text-foreground"
                        >
                          <span
                            className={
                              i === rätt
                                ? "flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-success text-[12px] font-bold text-on-brand"
                                : "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/12 text-[12px] font-semibold text-white/55"
                            }
                          >
                            {LETTERS[i]}
                          </span>
                          {alt}
                          {i === rätt && <span className="sr-only"> (rätt svar)</span>}
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
          </ol>
          <Link
            to="/gamla-prov/$term/$pass"
            params={{ term: exam.term, pass: String(pass) }}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Skriv hela provpass {pass} på tid
          </Link>
        </section>
      ))}

      <section className="mt-12 rounded-2xl border border-primary/25 bg-primary/[0.06] p-6 sm:p-8">
        <h2
          className="text-[20px] font-bold text-[var(--cream)] sm:text-[24px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Nöt in orden
        </h2>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-white/60">
          Ordövningen har varje ord från tidigare prov, med repetition av de ord du missar.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Link
            to="/ord"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-brand transition hover:brightness-110"
          >
            Öva ORD
          </Link>
          <Link
            to="/gamla-prov/$term"
            params={{ term: exam.term }}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-white/12 px-5 py-2.5 text-sm font-semibold text-[var(--cream)] transition hover:border-primary/50"
          >
            Hela provet med facit
          </Link>
          {normeringDate(exam.term) && (
            <Link
              to="/hogskoleprovet-normering/$term"
              params={{ term: exam.term }}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-white/12 px-5 py-2.5 text-sm font-semibold text-[var(--cream)] transition hover:border-primary/50"
            >
              Normeringen
            </Link>
          )}
        </div>
      </section>

      <div className="mt-10 flex items-center justify-between gap-3 border-t border-white/8 pt-6 text-sm">
        {older ? (
          <Link
            to="/hogskoleprovet-ord/$term"
            params={{ term: older.term }}
            className="inline-flex items-center gap-1.5 text-white/60 hover:text-[var(--cream)]"
          >
            {termLabel(older.term, older.date)}
          </Link>
        ) : (
          <span />
        )}
        {newer ? (
          <Link
            to="/hogskoleprovet-ord/$term"
            params={{ term: newer.term }}
            className="inline-flex items-center gap-1.5 text-white/60 hover:text-[var(--cream)]"
          >
            {termLabel(newer.term, newer.date)}
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
