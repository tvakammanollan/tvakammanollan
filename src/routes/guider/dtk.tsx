import { createFileRoute, Link } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { fitTitle } from "@/lib/seo-text";
import {
  GuideFaq,
  RelatedGuides,
  guideArticleJsonLd,
  guideArticleMeta,
  guideFaqJsonLd,
} from "@/lib/guider-meta";
import { GUIDE_FAQ } from "@/lib/guide-faq";
import { GuideTopCta } from "@/lib/guide-top-cta";

export const Route = createFileRoute("/guider/dtk")({
  component: DtkGuidePage,
  head: () => ({
    meta: pageMeta({
      path: "/guider/dtk",
      ...guideArticleMeta("/guider/dtk"),
      title: fitTitle("DTK-guide: diagram, tabeller och kartor", "på HP"),
      description:
        "Guide till DTK-delprovet: vad du ska titta på i diagram, tabeller och kartor innan du läser frågan, och de vanligaste misstagen.",
      ogTitle: "Tvåkommanollan | DTK-guiden",
      ogDescription:
        "Diagram, tabeller och kartor på HP: läs axlarna först, frågetyper och vanliga skalmisstag.",
    }),
    links: pageLinks("/guider/dtk"),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Guider", path: "/guider" },
        { name: "DTK: Diagram, tabeller, kartor", path: "/guider/dtk" },
      ]),
      jsonLdScript(
        guideArticleJsonLd({
          headline: "DTK-guide: diagram, tabeller och kartor på högskoleprovet",
          description: "Guide till DTK-delprovet: diagram, tabeller och kartor.",
          url: "https://tvakommanollan.se/guider/dtk",
        }),
      ),
      jsonLdScript(guideFaqJsonLd(GUIDE_FAQ.dtk)),
    ],
  }),
});

function DtkGuidePage() {
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
          DTK: Diagram, tabeller och kartor
        </h1>
      </header>

      <GuideTopCta delprov="dtk" code="DTK" />

      <section className="space-y-6">
        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Vad testar DTK?
        </h2>
        <p>
          DTK har 12 uppgifter per kvantitativt provpass. Du får ett uppslag med diagram, tabeller
          eller kartor och några frågor till varje uppslag. DTK brukar ta längst tid av de
          kvantitativa delproven, eftersom du måste sätta dig in i varje nytt uppslag. Mer om
          provets uppbyggnad finns på{" "}
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
          Läs rubrik och axlar först
        </h2>
        <p>Titta på figuren innan du läser frågorna. Kontrollera fyra saker:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            <strong style={{ color: "var(--cream)" }}>Vad mäts?</strong> Det står i rubriken och vid
            axlarna.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Vilken enhet?</strong> Tusental, miljoner
            eller procent? Fel enhet är det vanligaste misstaget.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Vilket intervall?</strong> Börjar axeln på 0
            eller på ett annat värde?
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Absoluta eller relativa tal?</strong> Antal
            och andel ger olika svar på frågor om förändring.
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Vanliga frågetyper
        </h2>
        <p>De flesta DTK-frågor är av fyra slag:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--cream)" }}>Läsa av ett värde:</strong> "Vad var värdet år
            X?" Lokalisera stapeln eller punkten, läs av mot y-axeln och ta hänsyn till enheten.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Jämförelse:</strong> "Vilket land hade störst
            ökning?" Identifiera de två relevanta värdena och räkna differensen. Var noga med om
            frågan gäller absolut eller relativ förändring.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Beräkning:</strong> "Hur många procent ökade X
            från år A till år B?" Standardformeln: (nytt − gammalt) / gammalt × 100.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Uppskattning:</strong> ibland räcker det att
            hamna i rätt storleksordning. Välj det alternativ som ligger närmast din avläsning.
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Vanliga misstag
        </h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--cream)" }}>Läsa av fel skala vid dubbla y-axlar:</strong>{" "}
            ett diagram kan ha en axel till vänster och en till höger för olika serier. Kontrollera
            vilken axel som hör till vilken serie.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>
              Blanda ihop relativ och absolut förändring :
            </strong>{" "}
            ett land kan ha störst ökning i procent men minst i antal, om det börjar från en låg
            nivå. Läs vad frågan gäller.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Glömma enheter:</strong> står det "tusental"
            vid axeln och du läser talet rakt av blir svaret 1 000 gånger för litet.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Avkortad axel:</strong> börjar y-axeln på 80 i
            stället för 0 ser en liten skillnad stor ut. Räkna med värdena, inte med staplarnas
            längd.
          </li>
        </ul>

        <p className="mt-8">
          <Link
            to="/train"
            className="inline-flex items-center gap-1.5 underline"
            style={{ color: "var(--amber)" }}
          >
            Öva DTK
          </Link>
        </p>
      </section>

      <GuideFaq items={GUIDE_FAQ.dtk} />

      <RelatedGuides
        currentPath="/guider/dtk"
        relatedPaths={["/guider/xyz", "/guider/kva", "/guider/nog", "/guider/tidspress"]}
      />
    </article>
  );
}
