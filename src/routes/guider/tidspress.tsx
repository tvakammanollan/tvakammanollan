import { createFileRoute, Link } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { fitTitle } from "@/lib/seo-text";
import { RelatedGuides, guideArticleJsonLd, guideArticleMeta } from "@/lib/guider-meta";

export const Route = createFileRoute("/guider/tidspress")({
  component: TidspressGuidePage,
  head: () => ({
    meta: pageMeta({
      path: "/guider/tidspress",
      ...guideArticleMeta("/guider/tidspress"),
      title: fitTitle("Tidspress på HP: strategi för varje delprov"),
      description:
        "Så fördelar du tiden på högskoleprovet: minuter per delprov, när du ska gissa och gå vidare, och hur du övar på tid.",
      ogTitle: "Tvåkommanollan | Tidspress på HP",
      ogDescription:
        "Tidsdisposition för alla 8 delprov, hoppa-strategin och varför du aldrig ska lämna blankt.",
    }),
    links: pageLinks("/guider/tidspress"),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Guider", path: "/guider" },
        { name: "Tidspress på högskoleprovet", path: "/guider/tidspress" },
      ]),
      jsonLdScript(
        guideArticleJsonLd({
          headline: "Tidspress på högskoleprovet: strategi för varje delprov",
          description:
            "Så fördelar du tiden på högskoleprovet: minuter per delprov, när du ska gissa och gå vidare, och hur du övar på tid.",
          url: "https://tvakommanollan.se/guider/tidspress",
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
        <h1
          className="mt-2 text-3xl font-bold sm:text-4xl"
          style={{ color: "var(--cream)", fontFamily: "var(--font-display)" }}
        >
          Tidspress på högskoleprovet
        </h1>
      </header>

      <p className="mb-8">
        Varje provpass är 55 minuter och har 40 uppgifter, alltså drygt en minut per uppgift.
        Fastnar du på en svår uppgift hinner du inte med lättare uppgifter längre fram, så det lönar
        sig att bestämma i förväg hur tiden ska fördelas.
      </p>

      <section className="space-y-6">
        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Tid per delprov
        </h2>
        <p>Ett förslag på fördelning. Flytta minuter till de delprov du har svårast för:</p>

        <div className="mt-4 space-y-4">
          <div>
            <p className="font-semibold" style={{ color: "var(--cream)" }}>
              Verbalt provpass (55 min, 40 uppgifter)
            </p>
            <ul className="mt-2 list-none space-y-1 pl-4">
              <li>
                <strong style={{ color: "var(--cream)" }}>ORD:</strong> 10 uppgifter ≈ 3 min (20
                sek/uppgift)
              </li>
              <li>
                <strong style={{ color: "var(--cream)" }}>MEK:</strong> 10 uppgifter ≈ 8 min
              </li>
              <li>
                <strong style={{ color: "var(--cream)" }}>LÄS:</strong> 10 uppgifter ≈ 22 min
              </li>
              <li>
                <strong style={{ color: "var(--cream)" }}>ELF:</strong> 10 uppgifter ≈ 22 min
              </li>
            </ul>
          </div>

          <div>
            <p className="font-semibold" style={{ color: "var(--cream)" }}>
              Kvantitativt provpass (55 min, 40 uppgifter)
            </p>
            <ul className="mt-2 list-none space-y-1 pl-4">
              <li>
                <strong style={{ color: "var(--cream)" }}>XYZ:</strong> 12 uppgifter ≈ 15 min (75
                sek/uppgift)
              </li>
              <li>
                <strong style={{ color: "var(--cream)" }}>KVA:</strong> 10 uppgifter ≈ 10 min (60
                sek/uppgift)
              </li>
              <li>
                <strong style={{ color: "var(--cream)" }}>NOG:</strong> 6 uppgifter ≈ 8 min (80
                sek/uppgift)
              </li>
              <li>
                <strong style={{ color: "var(--cream)" }}>DTK:</strong> 12 uppgifter ≈ 22 min
              </li>
            </ul>
          </div>
        </div>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Gå vidare när du fastnar
        </h2>
        <p>
          Har du lagt 90 sekunder på en uppgift utan att komma fram till ett svar, gissa och gå
          vidare. Markera uppgiften och gå tillbaka om det blir tid över.
        </p>
        <p>
          Alla uppgifter ger en poäng var, hur svåra de än är. Tre minuter på en svår uppgift är tid
          som hade räckt till tre lätta.
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Gissa alltid
        </h2>
        <p>
          Fel svar ger inget avdrag, så lämna aldrig en uppgift tom. Med 4 alternativ ger en ren
          gissning rätt en gång av fyra, och kan du stryka ett eller två alternativ först blir
          chansen bättre.
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Öva på tid
        </h2>
        <p>
          Att svara på tid är något annat än att öva utan klocka. En match på Tvåkommanollan är 8
          uppgifter på 5 minuter mot någon med ungefär samma ELO, så du får öva på att bestämma dig
          fort. Hela provpass på tid finns under Gamla prov.
        </p>

        <p className="mt-8">
          <Link
            to="/matchmaking"
            search={{ type: "verbal" }}
            className="inline-flex items-center gap-1.5 underline"
            style={{ color: "var(--amber)" }}
          >
            Spela en match
          </Link>
        </p>
      </section>

      <RelatedGuides
        currentPath="/guider/tidspress"
        relatedPaths={["/guider/bra-resultat", "/guider/las", "/guider/dtk", "/guider/xyz"]}
      />
    </article>
  );
}
