import { createFileRoute, Link } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { RelatedGuides, guideArticleJsonLd } from "@/lib/guider-meta";

export const Route = createFileRoute("/guider/normering")({
  component: NormeringGuidePage,
  head: () => ({
    meta: pageMeta({
      path: "/guider/normering",
      title: "Normering på Högskoleprovet · hur poängen räknas · HP Kampen",
      description:
        "Förstå hur normering fungerar på HP: råpoäng, stanine och HP-betyg 0.0–2.0. Se vilka råpoäng som krävs för betyg 1.5, 1.7, 2.0.",
      ogTitle: "Normering på HP · HP Kampen",
      ogDescription:
        "Hur råpoäng omvandlas till HP-betyg 0.0–2.0. Historiska normgränser och vad betygen betyder vid antagning.",
    }),
    links: pageLinks("/guider/normering"),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Guider", path: "/guider" },
        { name: "Normering på Högskoleprovet", path: "/guider/normering" },
      ]),
      jsonLdScript(guideArticleJsonLd({
        headline: "Normering på Högskoleprovet · hur poängen räknas",
        description:
          "Förstå hur normering fungerar på HP: råpoäng, stanine och HP-betyg 0.0–2.0.",
        url: "https://hpkampen.se/guider/normering",
      })),
    ],
  }),
});

function NormeringGuidePage() {
  return (
    <article
      className="mx-auto max-w-3xl px-4 py-12 text-[15px] leading-[1.75]"
      style={{ color: "var(--text-secondary)" }}
    >
      <header className="mb-10">
        <p
          className="text-xs font-semibold uppercase tracking-[0.25em]"
          style={{ color: "#a5b4fc" }}
        >
          Strategi
        </p>
        <h1
          className="mt-2 text-3xl font-bold sm:text-4xl"
          style={{ color: "var(--cream)", fontFamily: "var(--font-display)" }}
        >
          Normering och HP-betyg
        </h1>
      </header>

      <section className="space-y-6">
        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Vad är normering?
        </h2>
        <p>
          Högskoleprovet ger inte ett enkelt procentresultat. Ditt resultat
          anges som ett HP-betyg på skalan 0.0–2.0 i steg om 0.1. Det är
          detta betyg som används vid antagning till högskola och universitet.
          Betygen beräknas via normering: UHR (Universitets- och högskolerådet)
          fastställer normgränserna efter varje provrunda baserat på provets
          svårighetsgrad och deltagarnas råpoäng. Det innebär att samma antal
          rätt kan ge olika betyg beroende på vilket prov du skriver.
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Hur normering fungerar
        </h2>
        <p>
          Du kan maximalt få 160 råpoäng (ett rätt per uppgift, inget avdrag
          för fel). UHR räknar sedan ut hur råpoängen fördelar sig bland alla
          provdeltagare och sätter normgränser som justeras ≈ 2–5 råpoäng per
          tillfälle för att kompensera för svårighetsvariation mellan prov.
        </p>
        <p>
          Nedanstående är historiska riktlinjer baserade på offentliggjorda
          normgränser. De exakta gränserna varierar varje år:
        </p>
        <ul className="list-none space-y-2 pl-4">
          <li>
            <strong style={{ color: "var(--cream)" }}>2.0</strong> —
            ≈ 155–160 rätt av 160
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>1.9</strong> —
            ≈ 145–150 rätt av 160
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>1.8</strong> —
            ≈ 135–142 rätt av 160
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>1.7</strong> —
            ≈ 125–133 rätt av 160
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>1.5</strong> —
            ≈ 105–115 rätt av 160
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>1.0</strong> —
            ≈ 65–75 rätt av 160
          </li>
        </ul>
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          Obs: Dessa siffror är ungefärliga historiska snitt. De faktiska
          normgränserna för varje provrunda publiceras av UHR efter provets
          genomförande.
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Verbal vs kvantitativ del
        </h2>
        <p>
          Provet ger ett samlat HP-betyg. Verbal och kvantitativ del viktas
          lika — varje del innehåller 80 uppgifter. Det finns inget separat
          verbal- eller kvantitativbetyg vid antagning; det är det samlade
          betygen som räknas. Däremot kan du se din fördelning i ditt
          resultatintyg och använda det för att veta vilken del som ger mest
          att förbättra.
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          HP-poäng vid antagning
        </h2>
        <p>
          Vid antagning till de flesta program används HP-resultatet i en av
          fyra antagningskvoter. Om du konkurrerar i HP-kvoten jämförs ditt
          betyg enbart mot andra HP-sökande. Betygen är giltiga i 8 år från
          provdatumet. Du kan skriva provet obegränsat antal gånger, och det
          bästa resultatet bland dina giltiga prov gäller automatiskt.
        </p>

        <p className="mt-8">
          <Link
            to="/gamla-prov"
            className="underline"
            style={{ color: "var(--amber)" }}
          >
            Testa dig på riktiga gamla prov →
          </Link>
        </p>
      </section>

      <RelatedGuides
        currentPath="/guider/normering"
        relatedPaths={["/guider/bra-resultat", "/guider/tidspress", "/guider/tips-lasforstaelse", "/guider/ord"]}
      />
    </article>
  );
}
