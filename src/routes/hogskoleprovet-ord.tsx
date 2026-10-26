import { createFileRoute, Link } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { fitTitle } from "@/lib/seo-text";
import { formatDateLong } from "@/lib/sv-format";
import { allExams } from "@/lib/prov-data";
import { termLabel } from "@/lib/normering";

/* =====================================================================
   ORDEN PÅ HÖGSKOLEPROVET, NAVET. Länkar till ett provs alla ORD-ord, ett
   provtillfälle per sida. Själva orden laddas på undersidorna, inte här:
   att läsa sextio verbala provpass för en lista med länkar vore slöseri.
   ===================================================================== */

const PATH = "/hogskoleprovet-ord";

export const Route = createFileRoute("/hogskoleprovet-ord")({
  head: () => {
    const exams = allExams();
    return {
      meta: pageMeta({
        path: PATH,
        title: fitTitle("Orden på högskoleprovet", "alla prov"),
        description: `Alla ORD-ord från ${exams.length} högskoleprov sedan 2012, med svarsalternativ och rätt svar. Ett prov per sida, med länkar till ordlistan.`,
        ogTitle: "Alla ORD-ord från varje högskoleprov sedan 2012",
      }),
      links: pageLinks(PATH),
      scripts: [
        breadcrumbScript([
          { name: "Hem", path: "/" },
          { name: "Orden på högskoleprovet", path: PATH },
        ]),
        jsonLdScript({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Orden på högskoleprovet",
          itemListElement: exams.map((e, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: `Orden på högskoleprovet ${termLabel(e.term, e.date).toLowerCase()}`,
            url: `https://tvakommanollan.se${PATH}/${e.term}`,
          })),
        }),
      ],
    };
  },
  component: OrdHub,
});

function OrdHub() {
  const exams = allExams();
  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
      <nav className="text-xs text-white/45" aria-label="Brödsmulor">
        <Link to="/" className="hover:text-white/70">
          Hem
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-white/70">Orden på högskoleprovet</span>
      </nav>
      <header className="mt-4">
        <h1
          className="text-[28px] font-bold leading-tight text-[var(--cream)] sm:text-[40px]"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
        >
          Orden på högskoleprovet
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-white/60">
          Varje högskoleprov har 20 ORD-uppgifter, tio i vart och ett av de två verbala provpassen.
          Här finns orden från alla {exams.length} prov i arkivet, med svarsalternativ och rätt
          svar. Välj ett prov.
        </p>
      </header>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {exams.map((e) => (
          <li key={e.term}>
            <Link
              to="/hogskoleprovet-ord/$term"
              params={{ term: e.term }}
              className="group flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-sm transition-colors hover:border-primary/50"
            >
              <span>
                <span className="block text-[16px] font-semibold text-[var(--cream)]">
                  Orden {termLabel(e.term, e.date).toLowerCase()}
                </span>
                <span className="block text-xs text-white/50">{formatDateLong(e.date)}</span>
              </span>

            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-10 text-[14px] text-white/55">
        Vill du slå upp ett enskilt ord? Alla ord som förekommit på provet finns i{" "}
        <Link to="/ordlista" className="underline underline-offset-2 hover:text-[var(--cream)]">
          ordlistan
        </Link>
        . För att öva med repetition, gå till{" "}
        <Link to="/ord" className="underline underline-offset-2 hover:text-[var(--cream)]">
          ORD-övningen
        </Link>
        .
      </p>
    </div>
  );
}
