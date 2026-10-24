import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Calculator, Table2 } from "lucide-react";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { describeWithin, fitTitle } from "@/lib/seo-text";
import { ANTAL_RATT_NIVÅER, nivåFrånSlug, nivåSlug, nivåText } from "@/lib/normering";
import { faqFörNivå, kortSvar, nivåData } from "@/lib/antal-ratt";

/* =====================================================================
   HUR MÅNGA RÄTT FÖR X? En sida per poängnivå 0,5–2,0. "Hur många rätt för
   1,5 på högskoleprovet" är en av de vanligaste HP-sökningarna, och svaret
   finns bara utspritt i UHR:s tabeller, en per prov. Här står det samlat:
   spannet, medianen och gränsen på varje prov. Allt räknas ur
   src/data/prov/normering.json, inga egna uppskattningar.
   ===================================================================== */

export const Route = createFileRoute("/hogskoleprovet-antal-ratt_/$niva")({
  loader: ({ params }) => {
    const value = nivåFrånSlug(params.niva);
    if (value === null) throw notFound();
    return { value };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const d = nivåData(loaderData.value);
    const n = nivåText(d.value);
    const path = `/hogskoleprovet-antal-ratt/${nivåSlug(d.value)}`;
    const äldst = d.rader[d.rader.length - 1];
    return {
      meta: pageMeta({
        path,
        title: fitTitle(`Hur många rätt för ${n} på högskoleprovet?`, "alla prov"),
        description: describeWithin(kortSvar(d), "Ur UHR:s tabeller för varje prov."),
        ogTitle: `Så många rätt krävs för ${n} på högskoleprovet`,
        ogDescription: kortSvar(d),
      }),
      links: pageLinks(path),
      scripts: [
        breadcrumbScript([
          { name: "Hem", path: "/" },
          { name: "Antal rätt", path: "/hogskoleprovet-antal-ratt" },
          { name: n, path },
        ]),
        jsonLdScript({
          "@context": "https://schema.org",
          "@type": "Dataset",
          name: `Antal rätt för ${n} på högskoleprovet`,
          description: `Minsta antal rätt som gav ${n} på högskoleprovets verbala och kvantitativa del, för varje prov från ${äldst?.label.toLowerCase()} och framåt. Sammanställt ur Universitets- och högskolerådets officiella normeringstabeller.`,
          url: `https://tvakommanollan.se${path}`,
          inLanguage: "sv-SE",
          isAccessibleForFree: true,
          creator: { "@type": "Organization", name: "Universitets- och högskolerådet (UHR)" },
          publisher: {
            "@type": "Organization",
            name: "Tvåkommanollan",
            url: "https://tvakommanollan.se",
          },
          isPartOf: { "@id": "https://tvakommanollan.se/#website" },
        }),
        jsonLdScript({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqFörNivå(d).map(({ q, a }) => ({
            "@type": "Question",
            name: q,
            acceptedAnswer: { "@type": "Answer", text: a },
          })),
        }),
      ],
    };
  },
  component: NivåSida,
});

function H2({ icon: Icon, children }: { icon: typeof Table2; children: React.ReactNode }) {
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

function NivåSida() {
  const { value } = Route.useLoaderData();
  const d = nivåData(value);
  const n = nivåText(value);
  const i = ANTAL_RATT_NIVÅER.indexOf(value);
  const lägre = i > 0 ? ANTAL_RATT_NIVÅER[i - 1] : null;
  const högre = i < ANTAL_RATT_NIVÅER.length - 1 ? ANTAL_RATT_NIVÅER[i + 1] : null;
  const faq = faqFörNivå(d);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
      <nav className="text-xs text-white/45" aria-label="Brödsmulor">
        <Link to="/" className="hover:text-white/70">
          Hem
        </Link>
        <span className="px-1.5">/</span>
        <Link to="/hogskoleprovet-antal-ratt" className="hover:text-white/70">
          Antal rätt
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-white/70">{n}</span>
      </nav>

      <header className="mt-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
          {d.rader.length} provtillfällen · UHR:s officiella tabeller
        </p>
        <h1
          className="mt-2 text-[28px] font-bold leading-tight text-[var(--cream)] sm:text-[40px]"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
        >
          Hur många rätt för {n} på högskoleprovet?
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-white/65">{kortSvar(d)}</p>
      </header>

      <section className="mt-8 grid grid-cols-2 gap-3">
        {[
          { rubrik: "Verbal del", s: d.verbal, senast: d.senaste?.verbal },
          { rubrik: "Kvantitativ del", s: d.kvant, senast: d.senaste?.kvant },
        ].map(({ rubrik, s, senast }) => (
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
            <div className="text-[13px] text-white/60">
              rätt av 80{s ? `, median ${s.median}` : ""}
            </div>
            {senast != null && d.senaste && (
              <div className="mt-1 text-[12px] text-white/45">
                {d.senaste.label}: {senast}
              </div>
            )}
          </div>
        ))}
      </section>

      <section className="mt-12">
        <H2 icon={Table2}>Gränsen för {n} på varje prov</H2>
        <p className="mt-2 text-[14px] text-white/55">
          Minsta antal rätt av 80 som gav {n} eller mer. Våren 2012 hade den verbala delen 76
          uppgifter och räknas inte in i spannet ovan.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[360px] text-[14px] tabular-nums">
            <caption className="sr-only">Minsta antal rätt för {n} på varje högskoleprov</caption>
            <thead>
              <tr className="bg-white/[0.03] text-left text-[12px] text-white/50">
                <th className="px-3 py-2 font-semibold">Prov</th>
                <th className="px-3 py-2 text-right font-semibold">Verbal</th>
                <th className="px-3 py-2 text-right font-semibold">Kvantitativ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {d.rader.map((r) => (
                <tr key={r.term}>
                  <td className="px-3 py-2">
                    <Link
                      to="/hogskoleprovet-normering/$term"
                      params={{ term: r.term }}
                      className="text-[var(--cream)] underline decoration-white/20 underline-offset-2 hover:decoration-primary"
                    >
                      {r.label}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-right text-white/75">{r.verbal ?? "–"}</td>
                  <td className="px-3 py-2 text-right text-white/75">{r.kvant ?? "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[12px] text-white/45">
          Källa: UHR:s normeringstabeller. Ett streck betyder att tabellen för den delen saknas i
          vårt underlag.
        </p>
      </section>

      <section className="mt-12">
        <h2
          className="text-[20px] font-bold text-[var(--cream)] sm:text-[24px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Vanliga frågor
        </h2>
        <dl className="mt-4 divide-y divide-white/8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm">
          {faq.map(({ q, a }) => (
            <div key={q} className="px-5 py-4">
              <dt className="text-[15px] font-semibold text-[var(--cream)]">{q}</dt>
              <dd className="mt-1.5 text-[14.5px] leading-relaxed text-white/65">{a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <nav className="mt-10 flex flex-wrap justify-between gap-3" aria-label="Andra nivåer">
        {lägre !== null ? (
          <Link
            to="/hogskoleprovet-antal-ratt/$niva"
            params={{ niva: nivåSlug(lägre) }}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-white/12 px-4 py-2 text-sm font-semibold text-[var(--cream)] hover:border-primary/50"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Antal rätt för {nivåText(lägre)}
          </Link>
        ) : (
          <span />
        )}
        {högre !== null && (
          <Link
            to="/hogskoleprovet-antal-ratt/$niva"
            params={{ niva: nivåSlug(högre) }}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-white/12 px-4 py-2 text-sm font-semibold text-[var(--cream)] hover:border-primary/50"
          >
            Antal rätt för {nivåText(högre)}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        )}
      </nav>

      <section className="mt-12 rounded-2xl border border-primary/25 bg-primary/[0.06] p-6 sm:p-8">
        <H2 icon={Calculator}>Räcker dina rätt till {n}?</H2>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-white/60">
          Skriv ett gammalt prov på originaltid så räknas ditt resultat om med just det provets
          normering. Eller fyll i dina rätt i poängräknaren.
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
            to="/hogskoleprovet-poangraknare"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-white/12 px-5 py-2.5 text-sm font-semibold text-[var(--cream)] transition hover:border-primary/50"
          >
            Poängräknaren
          </Link>
          <Link
            to="/hogskoleprovet-poang"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-white/12 px-5 py-2.5 text-sm font-semibold text-[var(--cream)] transition hover:border-primary/50"
          >
            Vilken poäng krävs till programmet?
          </Link>
        </div>
      </section>
    </div>
  );
}
