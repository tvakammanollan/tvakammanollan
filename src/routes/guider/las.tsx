import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { RelatedGuides, guideArticleJsonLd } from "@/lib/guider-meta";

export const Route = createFileRoute("/guider/las")({
  component: LasGuidePage,
  head: () => ({
    meta: pageMeta({
      path: "/guider/las",
      title: "LÄS-guide: svensk läsförståelse på HP",
      description:
        "Klara LÄS-delprovet med rätt lästeknik, frågeanalys och tidsplanering. Konkreta tips för läsförståelse på HP. Fungerar för både LÄS och ELF.",
      ogTitle: "Tvåkommanollan | LÄS-guiden",
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
      jsonLdScript(
        guideArticleJsonLd({
          headline: "LÄS-guide: svensk läsförståelse på Högskoleprovet",
          description: "Klara LÄS-delprovet med rätt lästeknik, frågeanalys och tidsplanering.",
          url: "https://tvakommanollan.se/guider/las",
        }),
      ),
      // HowTo schema — Google rich-result eligibility för numrerade steg.
      // Övertaget från /guider/tips-lasforstaelse när den sidan slogs ihop hit.
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: "Så förbättrar du läsförståelsen på Högskoleprovet",
        description: "Konkreta steg för att höja resultatet på LÄS och ELF på Högskoleprovet.",
        totalTime: "PT15M",
        step: [
          {
            "@type": "HowToStep",
            position: 1,
            name: "Läs frågan innan texten",
            text: "Vet vad du letar efter. Markera nyckelord i frågan så du kan skanna texten effektivt.",
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
        <p
          className="text-xs font-semibold uppercase tracking-[0.25em]"
          style={{ color: "var(--teal)" }}
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
          LÄS-delprovet består av fyra svenska texter per provpass med fem frågor per text, totalt
          20 uppgifter. Texterna är hämtade från vetenskap, samhällsdebatt och kultur och är ofta
          komplexa med ett akademiskt eller resonerande språk. Frågorna testar inte om du kan
          memorera texten utan om du kan navigera i den: hitta information, dra slutsatser och
          förstå vad författaren menar och anser.
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Läs frågan FÖRE texten
        </h2>
        <p>
          Den kanske viktigaste strategin för LÄS: läs frågorna för en text innan du läser texten.
          Det ger dig en karta att navigera med. Du vet vad du letar efter och kan markera relevanta
          stycken direkt när du läser igenom texten. Utan denna förberedelse läser du hela texten
          och behöver sedan leta upp svaren i efterhand. Det kostar dubbelt så mycket tid.
        </p>
        <p>
          Markera nyckelord i varje fråga (namn, siffror, begrepp) och scanna texten efter just dem
          när du läser.
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Tre frågetyper
        </h2>
        <p>
          LÄS-frågor faller nästan alltid in i ett av tre mönster. Identifiera typen snabbt så vet
          du var i texten svaret finns:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--cream)" }}>Faktafråga:</strong> svaret finns direkt i
            texten, ofta ordagrant eller nära ordagrant. Lokalisera rätt stycke och peka ut
            informationen.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Slutledningsfråga:</strong> svaret kräver att
            du kombinerar information från två eller fler ställen i texten och drar en slutsats.
            Ingen av alternativen är citerade direkt.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Attitydfråga:</strong> vad menar, anser eller
            antyder författaren? Fokusera på ordval, ton och vad som betonas eller tonas ner i
            texten.
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Identifiera texttypen
        </h2>
        <p>
          Olika texttyper har olika struktur och ger upphov till olika typer av frågor. Avgör
          texttypen redan i de första meningarna:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--cream)" }}>Argument/debatt:</strong> leta efter tes och
            motargument. Frågorna handlar ofta om vad författaren anser eller hur hen bemöter
            kritik.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Populärvetenskap:</strong> leta efter
            orsak–verkan-samband och slutsatser. Frågorna testar om du förstår mekanismerna, inte
            bara fakta.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Historisk/kronologisk:</strong> lägg märke
            till tidsmarkörer. Frågorna handlar ofta om sekvenser och samband mellan händelser.
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Elimineringsmetoden
        </h2>
        <p>
          Om du är osäker: arbeta bakifrån. Stryk de alternativ som direkt strider mot texten. Av de
          kvarvarande väljer du det som <em>bäst</em> stöds av texten. Det rätta svaret behöver inte
          vara perfekt. Det behöver bara vara bättre än de andra tre.
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Hantera svåra ord
        </h2>
        <p>
          Stöter du på ett ord du inte känner igen: fortsätt läsa. Kontexten runt ordet ger ofta
          tillräcklig information för att förstå vad meningen säger. Gissa inte ett ords betydelse
          isolerat. Läs hela meningen och stycket runt om det. Samma teknik fungerar på{" "}
          <Link to="/guider/elf" className="underline" style={{ color: "var(--amber)" }}>
            ELF
          </Link>
          , där det dessutom hjälper att snabbt analysera ordets morfologi (prefix, rot, suffix).
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Tidsdisposition
        </h2>
        <p>
          Med 20 minuter för LÄS (i ett balanserat upplägg) har du ungefär 5 minuter per text.
          Fördela dem så: 1 minut att skumma frågorna och notera nyckelord, 3 minuter att läsa
          texten aktivt och markera, 1 minut att svara på frågorna med stöd i texten.
        </p>
        <p>
          Om du kört fast på en fråga efter 30 sekunder: gissa och gå vidare. Återvänd om tid finns.
          Att lägga 2 minuter på en fråga innebär att du offrar tid på de fyra övriga frågorna till
          texten.
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Vanliga feltyper att undvika
        </h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--cream)" }}>Välj det som stöds av texten:</strong> inte
            det som "låter rimligt" utifrån dina egna kunskaper. Svaret måste förankras i texten.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Missa negationer:</strong> ord som{" "}
            <em>inte, sällan, knappast, aldrig</em> vänder helt innebörden. Läs långsamt kring
            negationer.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Välja det "mest sanna" alternativet:</strong>{" "}
            i verkligheten kan ett alternativ vara sant men ändå fel för frågan om det inte svarar
            på vad som faktiskt frågades.
          </li>
        </ul>

        <p className="mt-8">
          <Link
            to="/train"
            className="inline-flex items-center gap-1.5 underline"
            style={{ color: "var(--amber)" }}
          >
            Öva LÄS-frågor gratis på Tvåkommanollan
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </p>
      </section>

      <RelatedGuides
        currentPath="/guider/las"
        relatedPaths={["/guider/elf", "/guider/ord", "/guider/mek", "/guider/tidspress"]}
      />
    </article>
  );
}
