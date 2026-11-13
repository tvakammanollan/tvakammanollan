import { createFileRoute, Link } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import {
  GuideFaq,
  RelatedGuides,
  guideArticleJsonLd,
  guideArticleMeta,
  guideFaqJsonLd,
} from "@/lib/guider-meta";
import { GUIDE_FAQ } from "@/lib/guide-faq";
import { GuideTopCta } from "@/lib/guide-top-cta";

export const Route = createFileRoute("/guider/nog")({
  component: NogGuidePage,
  head: () => ({
    meta: pageMeta({
      path: "/guider/nog",
      ...guideArticleMeta("/guider/nog"),
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
        { name: "NOG: Kvantitativa resonemang", path: "/guider/nog" },
      ]),
      jsonLdScript(
        guideArticleJsonLd({
          headline: "NOG-guide: kvantitativa resonemang på högskoleprovet",
          description:
            "Guide till NOG-delprovet: lär dig avgöra om uppgiften går att lösa med given information.",
          url: "https://tvakommanollan.se/guider/nog",
        }),
      ),
      jsonLdScript(guideFaqJsonLd(GUIDE_FAQ.nog)),
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
        <h1
          className="mt-2 text-3xl font-bold sm:text-4xl"
          style={{ color: "var(--cream)", fontFamily: "var(--font-display)" }}
        >
          NOG: Kvantitativa resonemang
        </h1>
      </header>

      <GuideTopCta delprov="nog" code="NOG" />

      <section className="space-y-6">
        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Vad är NOG?
        </h2>
        <p>
          NOG skiljer sig från de andra delproven. Du får en fråga (t.ex. "Hur stor är vinkeln x?")
          följt av 2 påståenden: (1) och (2). Du ska inte räkna ut svaret, bara avgöra om
          informationen i påståendena räcker för att besvara frågan. NOG har 6 uppgifter per
          kvantitativt provpass. De fem svarsalternativen är alltid desamma:
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
        <p className="text-sm">
          Mer om provets uppbyggnad finns på{" "}
          <a
            href="https://www.studera.nu/hogskoleprov/om/intro/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            studera.nu
          </a>
          .
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Arbetsordning
        </h2>
        <p>Gå igenom påståendena i den här ordningen:</p>
        <ol className="list-decimal space-y-2 pl-6">
          <li>
            Testa påstående (1) <em>ensamt</em>: bortse från (2). Räcker (1) för ett entydigt svar?
            Då är svaret A eller D.
          </li>
          <li>
            Testa påstående (2) <em>ensamt</em>: bortse från (1). Räcker (2)? Då är svaret B eller
            D.
          </li>
          <li>
            Räcker inget av dem ensamt, pröva (1) och (2) tillsammans. Räcker det är svaret C,
            annars E.
          </li>
          <li>Räcker båda var för sig är svaret D.</li>
        </ol>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Vanliga fällor
        </h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--cream)" }}>Räkna ut svaret:</strong> det behövs inte. Du
            ska bara avgöra om det går att få fram ett entydigt svar, och det går fortare.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Nöja sig med flera möjliga svar:</strong> ger
            påståendet två möjliga svar (t.ex. x = 3 eller x = −3) räcker det inte. Det ska finnas
            exakt ett.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Blanda ihop påståendena:</strong> när du
            prövar (1) ensamt, täck över (2). Det är lätt att råka använda uppgifter från båda.
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Tid
        </h2>
        <p>
          NOG går fort om du låter bli att räkna ut svaret. Många uppgifter tar 30–45 sekunder.
          Sikta på 8 minuter för de 6 uppgifterna, så får du mer tid till DTK och XYZ.
        </p>

        <p className="mt-8">
          <Link
            to="/train"
            className="inline-flex items-center gap-1.5 underline"
            style={{ color: "var(--amber)" }}
          >
            Öva NOG
          </Link>
        </p>
      </section>

      <GuideFaq items={GUIDE_FAQ.nog} />

      <RelatedGuides
        currentPath="/guider/nog"
        relatedPaths={["/guider/xyz", "/guider/kva", "/guider/dtk", "/guider/tidspress"]}
      />
    </article>
  );
}
