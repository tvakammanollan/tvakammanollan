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

export const Route = createFileRoute("/guider/las")({
  component: LasGuidePage,
  head: () => ({
    meta: pageMeta({
      path: "/guider/las",
      ...guideArticleMeta("/guider/las"),
      title: "LÄS-guide: svensk läsförståelse på HP",
      description:
        "Guide till LÄS-delprovet: läs frågorna först, känn igen frågetyperna och håll tiden. Samma metod fungerar på ELF.",
      ogTitle: "Tvåkommanollan | LÄS-guiden",
      ogDescription:
        "Svensk läsförståelse på HP: lästeknik, tre frågetyper och hur du disponerar 5 min per text.",
    }),
    links: pageLinks("/guider/las"),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Guider", path: "/guider" },
        { name: "LÄS: Svensk läsförståelse", path: "/guider/las" },
      ]),
      jsonLdScript(
        guideArticleJsonLd({
          headline: "LÄS-guide: svensk läsförståelse på högskoleprovet",
          description:
            "Guide till LÄS-delprovet: läs frågorna först, känn igen frågetyperna och håll tiden.",
          url: "https://tvakommanollan.se/guider/las",
        }),
      ),
      jsonLdScript(guideFaqJsonLd(GUIDE_FAQ.las)),
      // HowTo schema — Google rich-result eligibility för numrerade steg.
      // Övertaget från /guider/tips-lasforstaelse när den sidan slogs ihop hit.
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: "Så förbättrar du läsförståelsen på högskoleprovet",
        description: "Konkreta steg för att höja resultatet på LÄS och ELF på högskoleprovet.",
        totalTime: "PT15M",
        step: [
          {
            "@type": "HowToStep",
            position: 1,
            name: "Läs frågan innan texten",
            text: "Vet vad du letar efter. Markera nyckelord i frågan så att du vet vad du ska leta efter i texten.",
          },
          {
            "@type": "HowToStep",
            position: 2,
            name: "Identifiera frågetypen",
            text: "Faktafråga, slutledningsfråga eller attitydfråga: typen avgör var i texten svaret finns.",
          },
          {
            "@type": "HowToStep",
            position: 3,
            name: "Identifiera texttypen",
            text: "Argument-text: leta efter tes och motargument. Populärvetenskap: orsak–verkan. Historisk: tidsmarkörer.",
          },
          {
            "@type": "HowToStep",
            position: 4,
            name: "Eliminera orimliga alternativ",
            text: "Stryk det som strider mot texten och välj det som bäst stöds av den. Svaret måste förankras i texten, inte i din förkunskap.",
          },
          {
            "@type": "HowToStep",
            position: 5,
            name: "Håll tiden",
            text: "Cirka 5 minuter per text. Kör du fast mer än 30 sekunder på en fråga: gissa och gå vidare.",
          },
        ],
      }),
    ],
  }),
});

function LasGuidePage() {
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
          LÄS: Svensk läsförståelse
        </h1>
      </header>

      <GuideTopCta delprov="las" code="LÄS" />

      <section className="space-y-6">
        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Vad testar LÄS?
        </h2>
        <p>
          LÄS-delprovet har 10 uppgifter per verbalt provpass, 20 på hela provet. Texterna handlar
          om vetenskap, samhällsfrågor och kultur och är skrivna på ett resonerande språk. Frågorna
          gäller vad som står i texten, vilka slutsatser som går att dra av den och vad författaren
          anser. Mer om provets uppbyggnad finns på{" "}
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
          Läs frågorna före texten
        </h2>
        <p>
          Läs frågorna till en text innan du läser texten. Då vet du vad du letar efter och kan
          markera rätt stycken medan du läser. Annars får du läsa texten först och leta upp svaren
          efteråt, och det tar längre tid.
        </p>
        <p>
          Markera nyckelord i varje fråga (namn, siffror, begrepp) och leta efter dem när du läser.
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Tre frågetyper
        </h2>
        <p>De flesta LÄS-frågor är av tre slag. Vet du vilket, vet du var svaret brukar stå:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--cream)" }}>Faktafråga:</strong> svaret står i texten,
            ofta nästan ordagrant. Hitta rätt stycke.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Slutledningsfråga:</strong> du behöver lägga
            ihop uppgifter från flera ställen i texten och dra en slutsats. Inget alternativ står
            ordagrant i texten.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Attitydfråga:</strong> vad anser eller antyder
            författaren? Titta på ordval, ton och vad som lyfts fram eller tonas ned.
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Texttyper
        </h2>
        <p>
          Olika slags texter är uppbyggda på olika sätt och ger olika slags frågor. Det brukar synas
          redan i de första meningarna:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--cream)" }}>Argument/debatt:</strong> leta efter tes och
            motargument. Frågorna handlar ofta om vad författaren anser eller hur hen bemöter
            kritik.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Populärvetenskap:</strong> leta efter
            orsak–verkan-samband och slutsatser. Frågorna gäller ofta hur något hänger ihop.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Historisk/kronologisk:</strong> lägg märke
            till tidsmarkörer. Frågorna handlar ofta om sekvenser och samband mellan händelser.
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Stryk alternativ
        </h2>
        <p>
          Är du osäker, stryk först de alternativ som strider mot texten. Av dem som är kvar väljer
          du det som <em>bäst</em> stöds av texten. Rätt svar behöver bara vara bättre än de andra
          tre.
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Svåra ord
        </h2>
        <p>
          Stöter du på ett ord du inte kan, läs vidare. Meningen och stycket runt ordet räcker
          oftast för att förstå vad som sägs. Samma sak gäller på{" "}
          <Link to="/guider/elf" className="underline" style={{ color: "var(--amber)" }}>
            ELF
          </Link>
          , där det också hjälper att titta på ordets delar (prefix, rot, suffix).
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Tid
        </h2>
        <p>
          Med ungefär 22 minuter för LÄS har du 4–5 minuter per text. En rimlig fördelning är 1
          minut på frågorna, 3 minuter på texten och 1 minut på svaren.
        </p>
        <p>
          Har du fastnat på en fråga i 30 sekunder, gissa och gå vidare. Gå tillbaka om det blir tid
          över.
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Vanliga fel
        </h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--cream)" }}>Svara utifrån egna kunskaper:</strong> ett
            alternativ kan låta rimligt utan att stå i texten. Svaret ska gå att belägga där.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Missa negationer:</strong> ord som{" "}
            <em>inte, sällan, knappast, aldrig</em> vänder på betydelsen. Läs meningen en gång till.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>
              Välja ett sant alternativ som inte svarar på frågan:
            </strong>{" "}
            ett alternativ kan stämma med texten och ändå vara fel, om frågan gäller något annat.
          </li>
        </ul>

        <p className="mt-8">
          <Link
            to="/train"
            className="inline-flex items-center gap-1.5 underline"
            style={{ color: "var(--amber)" }}
          >
            Öva LÄS
          </Link>
        </p>
      </section>

      <GuideFaq items={GUIDE_FAQ.las} />

      <RelatedGuides
        currentPath="/guider/las"
        relatedPaths={["/guider/elf", "/guider/ord", "/guider/mek", "/guider/tidspress"]}
      />
    </article>
  );
}
