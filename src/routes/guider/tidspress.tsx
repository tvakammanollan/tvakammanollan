import { createFileRoute, Link } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { RelatedGuides, guideArticleJsonLd } from "@/lib/guider-meta";

export const Route = createFileRoute("/guider/tidspress")({
  component: TidspressGuidePage,
  head: () => ({
    meta: pageMeta({
      path: "/guider/tidspress",
      title: "Tidspress på Högskoleprovet · strategi för varje delprov · HP Kampen",
      description:
        "Lär dig hantera tidspressen på HP. Tidsdisposition per delprov, hoppa-strategin och hur du tränar fart med HP Kampen.",
      ogTitle: "Tidspress på HP · HP Kampen",
      ogDescription:
        "Tidsdisposition för alla 8 delprov, hoppa-strategin och varför du aldrig ska lämna blankt.",
    }),
    links: pageLinks("/guider/tidspress"),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Guider", path: "/guider" },
        { name: "Tidspress på Högskoleprovet", path: "/guider/tidspress" },
      ]),
      jsonLdScript(
        guideArticleJsonLd({
          headline: "Tidspress på Högskoleprovet · strategi för varje delprov",
          description:
            "Lär dig hantera tidspressen på HP. Tidsdisposition per delprov, hoppa-strategin och hur du tränar fart.",
          url: "https://hpkampen.se/guider/tidspress",
        }),
      ),
    ],
  }),
});

function TidspressGuidePage() {
  return (
    <article
      className="mx-auto max-w-3xl px-4 py-12 text-[15px] leading-[1.75]"
      style={{ color: "var(--text-secondary)" }}
    >
      <header className="mb-10">
        <p
          className="text-xs font-semibold uppercase tracking-[0.25em]"
          style={{ color: "var(--teal)" }}
        >
          Strategi
        </p>
        <h1
          className="mt-2 text-3xl font-bold sm:text-4xl"
          style={{ color: "var(--cream)", fontFamily: "var(--font-display)" }}
        >
          Tidspress på Högskoleprovet
        </h1>
      </header>

      <p className="mb-8">
        Tid är den knappaste resursen på HP. Varje provpass är 55 minuter och innehåller ungefär 40
        uppgifter — det ger dig lite drygt en minut per uppgift. Med rätt strategi hinner du alla
        uppgifter och har restid kvar. Utan strategi riskerar du att lägga för lång tid på svåra
        uppgifter och missa enkla poäng längre fram.
      </p>

      <section className="space-y-6">
        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Tidgränser per delprov
        </h2>
        <p>
          Nedan är rekommenderade tidsgränser för ett balanserat provpass. Anpassa efter dina egna
          starka och svaga sidor:
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <p className="font-semibold" style={{ color: "var(--cream)" }}>
              Verbalt provpass (55 min, ≈ 40–60 uppgifter)
            </p>
            <ul className="mt-2 list-none space-y-1 pl-4">
              <li>
                <strong style={{ color: "var(--cream)" }}>ORD</strong> — 10 uppgifter ≈ 10 min (1
                min/uppgift)
              </li>
              <li>
                <strong style={{ color: "var(--cream)" }}>MEK</strong> — 10 uppgifter ≈ 10 min (1
                min/uppgift)
              </li>
              <li>
                <strong style={{ color: "var(--cream)" }}>LÄS</strong> — 20 uppgifter ≈ 20 min (5
                min/text)
              </li>
              <li>
                <strong style={{ color: "var(--cream)" }}>ELF</strong> — 20 uppgifter ≈ 20 min (5
                min/text)
              </li>
            </ul>
          </div>

          <div>
            <p className="font-semibold" style={{ color: "var(--cream)" }}>
              Kvantitativt provpass (55 min, ≈ 40 uppgifter)
            </p>
            <ul className="mt-2 list-none space-y-1 pl-4">
              <li>
                <strong style={{ color: "var(--cream)" }}>XYZ</strong> — 12 uppgifter ≈ 15 min (75
                sek/uppgift)
              </li>
              <li>
                <strong style={{ color: "var(--cream)" }}>KVA</strong> — 10 uppgifter ≈ 10 min (60
                sek/uppgift)
              </li>
              <li>
                <strong style={{ color: "var(--cream)" }}>NOG</strong> — 6 uppgifter ≈ 8 min (80
                sek/uppgift)
              </li>
              <li>
                <strong style={{ color: "var(--cream)" }}>DTK</strong> — 12 uppgifter ≈ 22 min (3–5
                frågor per figur)
              </li>
            </ul>
          </div>
        </div>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Hoppa-strategin
        </h2>
        <p>
          Om du lagt mer än 90 sekunder på en uppgift utan att komma fram till ett svar: gissa och
          hoppa. Markera uppgiften mentalt (eller i marginalen om du skriver på papper) och återvänd
          med restiden.
        </p>
        <p>
          Varför? Alla uppgifter på HP är lika värda — en poäng var, oavsett svårighet. Att lägga 3
          minuter på en svår uppgift kostar dig samma tid som du hade kunnat använda till tre enkla
          uppgifter. Svåra uppgifter är värda exakt lika mycket som lätta.
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Gissa alltid
        </h2>
        <p>
          HP har inget avdrag för fel svar. Det finns ingen anledning att någonsin lämna en uppgift
          obesvarad. Om du kör fast: gissa. Med fyra alternativ är sannolikheten 25 % per ren
          gissning — och med eliminering av ett eller två orimliga alternativ stiger oddsen
          kraftigt. En blank ruta ger alltid noll poäng.
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Träna tidspressen
        </h2>
        <p>
          Tidspress känns annorlunda i verkligheten än när du tränar utan klocka. HP Kampens
          live-matcher är designade för att simulera exakt detta: 8 frågor på 8 minuter mot en
          motspelare med samma ELO-rating som du. Samma känsla av klockan som tickar, samma
          beslutspressen som på riktigt HP. Regelbunden matchträning bygger den mentala vana som gör
          att du inte fryser under provdagen.
        </p>

        <p className="mt-8">
          <Link
            to="/matchmaking"
            search={{ type: "verbal" }}
            className="underline"
            style={{ color: "var(--amber)" }}
          >
            Spela live-match under tidspress →
          </Link>
        </p>
      </section>

      <RelatedGuides
        currentPath="/guider/tidspress"
        relatedPaths={[
          "/guider/bra-resultat",
          "/guider/normering",
          "/guider/tips-lasforstaelse",
          "/guider/xyz",
        ]}
      />
    </article>
  );
}
