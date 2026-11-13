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

export const Route = createFileRoute("/guider/xyz")({
  component: XyzGuidePage,
  head: () => ({
    meta: pageMeta({
      path: "/guider/xyz",
      ...guideArticleMeta("/guider/xyz"),
      title: "XYZ-guide: matematisk problemlösning på HP",
      description:
        "Lär dig lösa XYZ-uppgifter snabbare med rätt metod. Algebra, geometri, sannolikhet och kombinatorik förklaras steg för steg.",
      ogTitle: "Tvåkommanollan | XYZ-guiden",
      ogDescription:
        "Matematisk problemlösning på HP: strategi, eliminering och de vanligaste uppgiftstyperna.",
    }),
    links: pageLinks("/guider/xyz"),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Guider", path: "/guider" },
        { name: "XYZ: Matematisk problemlösning", path: "/guider/xyz" },
      ]),
      jsonLdScript(
        guideArticleJsonLd({
          headline: "XYZ-guide: matematisk problemlösning på högskoleprovet",
          description:
            "Lär dig lösa XYZ-uppgifter snabbare med rätt metod. Algebra, geometri, sannolikhet och kombinatorik förklaras steg för steg.",
          url: "https://tvakommanollan.se/guider/xyz",
        }),
      ),
      jsonLdScript(guideFaqJsonLd(GUIDE_FAQ.xyz)),
    ],
  }),
});

function XyzGuidePage() {
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
          XYZ: Matematisk problemlösning
        </h1>
      </header>

      <GuideTopCta delprov="xyz" code="XYZ" />

      <p className="mb-8 text-[14px]">
        Alla formler som behövs på den kvantitativa delen finns samlade i{" "}
        <Link to="/hogskoleprovet-formler" className="underline underline-offset-2">
          formelsamlingen för högskoleprovet
        </Link>
        .
      </p>

      <section className="space-y-6">
        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Vad testar XYZ?
        </h2>
        <p>
          XYZ har 12 uppgifter per kvantitativt provpass. Du får ett problem i text eller med en
          figur och väljer rätt svar bland 4 alternativ. Matematiken är på gymnasienivå, och du får
          varken använda miniräknare eller formelsamling. Mer om provets uppbyggnad finns på{" "}
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
          Det här behöver du kunna
        </h2>
        <p>De här områdena kommer på nästan varje prov:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--cream)" }}>Procent och förändringsfaktor:</strong>{" "}
            procentuell förändring, förändringsfaktor, rabatt och prisökning.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Andragradsekvationer:</strong> lösning med
            kvadratkomplettering eller andragradssatsen. Ibland som villkor ("för vilka x gäller
            att...").
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Geometri:</strong> area och volym av
            grundläggande figurer (cirkel, triangel, rektangel, prism, cylinder), Pythagoras sats
            och likformighet.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Sannolikhet och kombinatorik:</strong>{" "}
            klassisk sannolikhet (gynnsamma/möjliga utfall), permutationer och kombinationer utan
            repetition.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Proportioner och skalfaktorer:</strong>{" "}
            direkta och inversa proportioner, skala i kartor och ritningar.
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Uppskatta och stryk
        </h2>
        <p>
          Uppskatta först ungefär hur stort svaret bör vara och stryk de alternativ som ligger långt
          ifrån. Det gör en gissning bättre och fångar räknefel.
        </p>
        <p>
          Du kan också pröva med enkla tal. Har uppgiften en variabel, sätt <em>x = 2</em> eller{" "}
          <em>x = 10</em> och kontrollera vilket alternativ som ger rätt resultat. Det går ofta
          fortare än att lösa uppgiften algebraiskt.
        </p>
        <p>
          Ett tredje sätt är att räkna bakåt: sätt in svarsalternativen i uppgiften och se vilket
          som stämmer.
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Tid
        </h2>
        <p>
          12 uppgifter på ungefär 15 minuter är 75 sekunder per uppgift. Ser du inte hur uppgiften
          ska lösas inom 90 sekunder, markera den och gå vidare. En svår uppgift ger inte mer poäng
          än en lätt.
        </p>

        <p className="mt-8">
          <Link
            to="/train"
            className="inline-flex items-center gap-1.5 underline"
            style={{ color: "var(--amber)" }}
          >
            Öva XYZ
          </Link>
        </p>
      </section>

      <GuideFaq items={GUIDE_FAQ.xyz} />

      <RelatedGuides
        currentPath="/guider/xyz"
        relatedPaths={["/guider/kva", "/guider/nog", "/guider/dtk", "/guider/tidspress"]}
      />
    </article>
  );
}
