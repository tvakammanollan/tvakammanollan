import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { RelatedGuides, guideArticleJsonLd } from "@/lib/guider-meta";

export const Route = createFileRoute("/guider/nog")({
  component: NogGuidePage,
  head: () => ({
    meta: pageMeta({
      path: "/guider/nog",
      title: "NOG-guide: kvantitativa resonemang på HP",
      description:
        "Guide till NOG-delprovet: lär dig avgöra om uppgiften går att lösa med given information. Strategi och vanliga fällor förklaras.",
      ogTitle: "Tvåkommanollan | NOG-guiden",
      ogDescription:
        "NOG på HP: de fem svarsalternativen, arbetsordning och varför du inte behöver lösa uppgiften.",
    }),
    links: pageLinks("/guider/nog"),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Guider", path: "/guider" },
        { name: "NOG · Kvantitativa resonemang", path: "/guider/nog" },
      ]),
      jsonLdScript(
        guideArticleJsonLd({
          headline: "NOG-guide: kvantitativa resonemang på Högskoleprovet",
          description:
            "Guide till NOG-delprovet: lär dig avgöra om uppgiften går att lösa med given information.",
          url: "https://tvakommanollan.se/guider/nog",
        }),
      ),
    ],
  }),
});

function NogGuidePage() {
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
          Kvantitativt delprov
        </p>
        <h1
          className="mt-2 text-3xl font-bold sm:text-4xl"
          style={{ color: "var(--cream)", fontFamily: "var(--font-display)" }}
        >
          NOG · Kvantitativa resonemang
        </h1>
      </header>

      <section className="space-y-6">
        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Vad är NOG?
        </h2>
        <p>
          NOG är Högskoleprovets mest unika delprovsformat. Du presenteras med en fråga (t.ex. "Hur
          stor är vinkeln x?") följt av två påståenden: (1) och (2). Din uppgift är inte att beräkna
          svaret. Din uppgift är att avgöra om informationen i påståendena räcker för att besvara
          frågan. De fem svarsalternativen är alltid:
        </p>
        <ul className="list-none space-y-1 pl-4">
          <li>
            <strong style={{ color: "var(--cream)" }}>A)</strong> Enbart påstående (1) är
            tillräckligt
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>B)</strong> Enbart påstående (2) är
            tillräckligt
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>C)</strong> Båda påståendena behövs
            tillsammans
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>D)</strong> Vardera påstående är var för sig
            tillräckligt
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>E)</strong> Varken påstående (1) eller (2)
            räcker, ens tillsammans
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Arbetsordning
        </h2>
        <p>Följ alltid denna ordning för att inte missa alternativ:</p>
        <ol className="list-decimal space-y-2 pl-6">
          <li>
            Testa påstående (1) <em>ensamt</em>: ignorera (2) helt. Räcker (1) för att besvara
            frågan entydigt? Om ja → möjliga svar är A eller D.
          </li>
          <li>
            Testa påstående (2) <em>ensamt</em>: ignorera (1) helt. Räcker (2)? Om ja → möjliga svar
            är B eller D.
          </li>
          <li>
            Om inget ensamt räcker: testa (1) + (2) tillsammans. Räcker kombinationen? Om ja → svar
            C. Annars → svar E.
          </li>
          <li>Om båda ensamt räcker: svar D.</li>
        </ol>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Vanliga fällor
        </h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--cream)" }}>Du behöver inte beräkna svaret:</strong> det
            räcker att fastslå om det GÅR att beräkna ett entydigt svar. Många tar NOG som en
            XYZ-uppgift och slösar tid på att räkna ut det faktiska värdet.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Entydigt svar krävs:</strong> om påståendet
            ger upphov till två möjliga svar (t.ex. x = 3 eller x = −3) räcker det inte. Det måste
            finnas ett och endast ett svar.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Blanda inte ihop påståendena:</strong> när du
            testar (1) ensamt ska du bokstavligen täcka (2) med handen och låtsas att det inte
            finns. Att omedvetet använda information från båda är den vanligaste NOG-tabben.
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Tidseffektivitet
        </h2>
        <p>
          NOG-uppgifter är ofta de snabbaste att lösa i det kvantitativa passet, om du inte försöker
          räkna ut hela svaret. Många uppgifter avgörs inom 30–45 sekunder med rätt metod. Sikta på
          att klara 6 NOG-uppgifter på 8 minuter, vilket lämnar extra tid till DTK och XYZ.
        </p>

        <p className="mt-8">
          <Link
            to="/train"
            className="inline-flex items-center gap-1.5 underline"
            style={{ color: "var(--amber)" }}
          >
            Öva NOG-uppgifter gratis på Tvåkommanollan
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </p>
      </section>

      <RelatedGuides
        currentPath="/guider/nog"
        relatedPaths={["/guider/xyz", "/guider/kva", "/guider/dtk", "/guider/tidspress"]}
      />
    </article>
  );
}
