import { createFileRoute, Link } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { RelatedGuides, guideArticleJsonLd } from "@/lib/guider-meta";

export const Route = createFileRoute("/guider/las")({
  component: LasGuidePage,
  head: () => ({
    meta: pageMeta({
      path: "/guider/las",
      title: "LÄS-guide: svensk läsförståelse på HP · HP Kampen",
      description:
        "Klara LÄS-delprovet med rätt lästeknik, frågeanalys och tidsplanering. Guide från HP Kampen med riktiga HP-texter och frågor.",
      ogTitle: "LÄS-guiden · HP Kampen",
      ogDescription:
        "Svensk läsförståelse på HP: lästeknik, tre frågetyper och hur du disponerar 5 min per text.",
    }),
    links: pageLinks("/guider/las"),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Guider", path: "/guider" },
        { name: "LÄS · Svensk läsförståelse", path: "/guider/las" },
      ]),
      jsonLdScript(guideArticleJsonLd({
        headline: "LÄS-guide: svensk läsförståelse på Högskoleprovet",
        description:
          "Klara LÄS-delprovet med rätt lästeknik, frågeanalys och tidsplanering.",
        url: "https://hpkampen.se/guider/las",
      })),
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
        <p
          className="text-xs font-semibold uppercase tracking-[0.25em]"
          style={{ color: "#a5b4fc" }}
        >
          Verbalt delprov
        </p>
        <h1
          className="mt-2 text-3xl font-bold sm:text-4xl"
          style={{ color: "var(--cream)", fontFamily: "var(--font-display)" }}
        >
          LÄS · Svensk läsförståelse
        </h1>
      </header>

      <section className="space-y-6">
        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Vad testar LÄS?
        </h2>
        <p>
          LÄS-delprovet består av fyra svenska texter per provpass med fem
          frågor per text, totalt 20 uppgifter. Texterna är hämtade från
          vetenskap, samhällsdebatt och kultur och är ofta komplexa med ett
          akademiskt eller resonerande språk. Frågorna testar inte om du kan
          memorera texten utan om du kan navigera i den — hitta information,
          dra slutsatser och förstå vad författaren menar och anser.
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Läs frågan FÖRE texten
        </h2>
        <p>
          Den kanske viktigaste strategin för LÄS: läs frågorna för en text
          innan du läser texten. Det ger dig en karta att navigera med. Du vet
          vad du letar efter och kan markera relevanta stycken direkt när du
          läser igenom texten. Utan denna förberedelse läser du hela texten
          och behöver sedan leta upp svaren i efterhand — det kostar dubbelt
          så mycket tid.
        </p>
        <p>
          Markera nyckelord i varje fråga (namn, siffror, begrepp) och
          scanna texten efter just dem när du läser.
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Tre frågetyper
        </h2>
        <p>
          LÄS-frågor faller nästan alltid in i ett av tre mönster. Identifiera
          typen snabbt så vet du var i texten svaret finns:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--cream)" }}>Faktafråga</strong> —
            svaret finns direkt i texten, ofta ordagrant eller nära ordagrant.
            Lokalisera rätt stycke och peka ut informationen.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Slutledningsfråga</strong> —
            svaret kräver att du kombinerar information från två eller fler
            ställen i texten och drar en slutsats. Ingen av alternativen är
            citerade direkt.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Attitydfråga</strong> —
            vad menar, anser eller antyder författaren? Fokusera på ordval,
            ton och vad som betonas eller tonas ner i texten.
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Tidsdisposition
        </h2>
        <p>
          Med 20 minuter för LÄS (i ett balanserat upplägg) har du ungefär 5
          minuter per text. Fördela dem så: 1 minut att skumma frågorna och
          notera nyckelord, 3 minuter att läsa texten aktivt och markera, 1
          minut att svara på frågorna med stöd i texten.
        </p>
        <p>
          Om du kört fast på en fråga efter 30 sekunder: gissa och gå vidare.
          Återvänd om tid finns. Att lägga 2 minuter på en fråga innebär att
          du offrar tid på de fyra övriga frågorna till texten.
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Vanliga feltyper att undvika
        </h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--cream)" }}>Välj det som stöds av texten</strong> —
            inte det som "låter rimligt" utifrån dina egna kunskaper. Svaret
            måste förankras i texten.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Missa negationer</strong> —
            ord som <em>inte, sällan, knappast, aldrig</em> vänder helt
            innebörden. Läs långsamt kring negationer.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Välja det "mest sanna" alternativet</strong> —
            i verkligheten kan ett alternativ vara sant men ändå fel för
            frågan om det inte svarar på vad som faktiskt frågades.
          </li>
        </ul>

        <p className="mt-8">
          <Link
            to="/train"
            className="underline"
            style={{ color: "var(--amber)" }}
          >
            Öva LÄS-frågor gratis på HP Kampen →
          </Link>
        </p>
      </section>

      <RelatedGuides
        currentPath="/guider/las"
        relatedPaths={["/guider/elf", "/guider/tips-lasforstaelse", "/guider/ord", "/guider/mek"]}
      />
    </article>
  );
}
