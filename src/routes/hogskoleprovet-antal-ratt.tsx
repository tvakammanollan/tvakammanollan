import { createFileRoute, Link } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { describeWithin, fitTitle } from "@/lib/seo-text";
import { nivåSlug, nivåText } from "@/lib/normering";
import { allaNivåer, kortSvar } from "@/lib/antal-ratt";

/* =====================================================================
   ANTAL RÄTT, HUBBEN. Varje poängnivå på en rad: hur många rätt den har
   krävt på varje del. Länkar till nivåsidorna (/hogskoleprovet-antal-ratt/1-5)
   och till normeringen per prov. Allt ur UHR:s tabeller i normering.json.
   ===================================================================== */

const PATH = "/hogskoleprovet-antal-ratt";

export const Route = createFileRoute("/hogskoleprovet-antal-ratt")({
  head: () => {
    const nivåer = allaNivåer();
    const två = nivåer[nivåer.length - 1];
    const ett = nivåer.find((d) => d.value === 1)!;
    return {
      meta: pageMeta({
        path: PATH,
        title: fitTitle("Hur många rätt på högskoleprovet för varje poäng?", "0,5 till 2,0"),
        description: describeWithin(
          `Antal rätt som krävts för varje poäng från 0,5 till 2,0 på högskoleprovet. ${kortSvar(två)}`,
          "Ur UHR:s normeringstabeller.",
        ),
        ogTitle: "Så många rätt krävs för varje poäng på högskoleprovet",
        ogDescription: kortSvar(ett),
      }),
      links: pageLinks(PATH),
      scripts: [
        breadcrumbScript([
          { name: "Hem", path: "/" },
          { name: "Antal rätt", path: PATH },
        ]),
        jsonLdScript({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Antal rätt för varje poäng på högskoleprovet",
          itemListElement: nivåer.map((d, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: `Antal rätt för ${nivåText(d.value)}`,
            url: `https://tvakommanollan.se${PATH}/${nivåSlug(d.value)}`,
          })),
        }),
        jsonLdScript({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [två, ett].map((d) => ({
            "@type": "Question",
            name: `Hur många rätt behövs för ${nivåText(d.value)} på högskoleprovet?`,
            acceptedAnswer: { "@type": "Answer", text: kortSvar(d) },
          })),
        }),
      ],
    };
  },
  component: AntalRättHub,
});

function AntalRättHub() {
  const nivåer = [...allaNivåer()].reverse();
  const antalProv = nivåer[0]?.rader.length ?? 0;
  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
      <nav className="text-xs text-white/45" aria-label="Brödsmulor">
        <Link to="/" className="hover:text-white/70">
          Hem
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-white/70">Antal rätt</span>
      </nav>

      <header className="mt-4">
        <p className="text-sm text-white/65">
          {antalProv} provtillfällen, UHR:s officiella tabeller
        </p>
        <h1
          className="mt-2 text-[28px] font-bold leading-tight text-[var(--cream)] sm:text-[40px]"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
        >
          Hur många rätt krävs på högskoleprovet?
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-white/60">
          Varje del av provet har 80 uppgifter och normeras för sig till en poäng mellan 0,0 och
          2,0. Tabellen visar hur många rätt varje poäng har krävt på de prov vi har tabeller för:
          det lägsta och högsta antalet, och medianen. Klicka på en poäng för gränsen på varje
          enskilt prov.
        </p>
      </header>

      <section className="mt-10">
        <h2
          className="flex items-center gap-2 text-[20px] font-bold text-[var(--cream)] sm:text-[24px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Antal rätt av 80 per poäng
        </h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[420px] text-[14px] tabular-nums">
            <caption className="sr-only">
              Antal rätt som krävts för varje poäng på högskoleprovet
            </caption>
            <thead>
              <tr className="bg-white/[0.03] text-left text-[12px] text-white/50">
                <th className="px-3 py-2 font-semibold">Poäng</th>
                <th className="px-3 py-2 text-right font-semibold">Verbal (median)</th>
                <th className="px-3 py-2 text-right font-semibold">Kvantitativ (median)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {nivåer.map((d) => (
                <tr key={d.value}>
                  <td className="px-3 py-2">
                    <Link
                      to="/hogskoleprovet-antal-ratt/$niva"
                      params={{ niva: nivåSlug(d.value) }}
                      className="font-semibold text-[var(--cream)] underline decoration-white/20 underline-offset-2 hover:decoration-primary"
                    >
                      {nivåText(d.value)}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-right text-white/75">
                    {d.verbal ? `${d.verbal.min}–${d.verbal.max} (${d.verbal.median})` : "–"}
                  </td>
                  <td className="px-3 py-2 text-right text-white/75">
                    {d.kvant ? `${d.kvant.min}–${d.kvant.max} (${d.kvant.median})` : "–"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[12px] text-white/45">
          Källa: UHR:s normeringstabeller. Provets totala resultat är medelvärdet av de två delarnas
          poäng, avrundat till närmaste 0,05.
        </p>
      </section>

      <section className="mt-12 rounded-2xl border border-primary/25 bg-primary/[0.06] p-6 sm:p-8">
        <h2
          className="text-[20px] font-bold text-[var(--cream)] sm:text-[24px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Se var du ligger
        </h2>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-white/60">
          Normeringen för varje prov, poäng för poäng, finns på normeringssidan. Skriv ett gammalt
          prov så räknas ditt resultat om med just det provets tabell.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Link
            to="/gamla-prov"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-brand transition hover:brightness-110"
          >
            Skriv ett gammalt prov
          </Link>
          <Link
            to="/hogskoleprovet-normering"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-white/12 px-5 py-2.5 text-sm font-semibold text-[var(--cream)] transition hover:border-primary/50"
          >
            Normering per prov
          </Link>
          <Link
            to="/hogskoleprovet-poangraknare"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-white/12 px-5 py-2.5 text-sm font-semibold text-[var(--cream)] transition hover:border-primary/50"
          >
            Poängräknaren
          </Link>
        </div>
      </section>
    </div>
  );
}
