import { createFileRoute, Link } from "@tanstack/react-router";
import { pageMeta, pageLinks } from "@/lib/page-meta";

export const Route = createFileRoute("/guider/tips-lasforstaelse")({
  component: TipsLasforstaelsePage,
  head: () => ({
    meta: pageMeta({
      path: "/guider/tips-lasforstaelse",
      title: "Tips för läsförståelse på HP · LÄS och ELF · HP Kampen",
      description:
        "7 konkreta tips för att förbättra din läsförståelse på Högskoleprovet. Fungerar för både LÄS (svenska) och ELF (engelska).",
      ogTitle: "7 läsförståelsetips · HP Kampen",
      ogDescription:
        "Konkreta knep för LÄS och ELF på HP: läs frågan först, elimineringsmetoden och aktiv läsning.",
    }),
    links: pageLinks("/guider/tips-lasforstaelse"),
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Tips för läsförståelse på HP · LÄS och ELF",
          description:
            "7 konkreta tips för att förbättra din läsförståelse på Högskoleprovet.",
          url: "https://hpkampen.se/guider/tips-lasforstaelse",
          author: {
            "@type": "Person",
            name: "Niklas",
            url: "https://hpkampen.se/om",
          },
          publisher: {
            "@type": "Organization",
            name: "HP Kampen",
            url: "https://hpkampen.se",
          },
        }),
      },
    ],
  }),
});

function TipsLasforstaelsePage() {
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
          7 tips för läsförståelse på HP
        </h1>
      </header>

      <p className="mb-8">
        Läsförståelse — LÄS på svenska och ELF på engelska — utgör sammanlagt
        40 av provets 160 uppgifter. Det är det enskilt största delprovet.
        Följande sju tips fungerar för båda delproven och bygger på vad som
        konsekvent ger fler rätta svar.
      </p>

      <section className="space-y-6">
        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          1. Läs frågan innan texten
        </h2>
        <p>
          Det absolut effektivaste sättet att spara tid är att läsa frågorna
          till en text <em>innan</em> du läser texten. Du vet då exakt vad du
          letar efter och kan markera relevanta passager direkt i läsningen.
          Utan denna förberedelse läser du texten blint och måste sedan gå
          tillbaka och leta — dubbelt arbete.
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          2. Skanna texten efter nyckelord
        </h2>
        <p>
          Identifiera nyckelord i varje fråga (egennamn, siffror, datum,
          begrepp) och skanna texten snabbt efter just dem. Ditt öga är
          förvånansvärt bra på att hitta specifika ord i en textmassa — använd
          det. När du hittat rätt stycke läser du det ordentligt.
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          3. Identifiera texttypen
        </h2>
        <p>
          Olika texttyper har olika struktur och ger upphov till olika typer
          av frågor. Identifiera texttypen redan i de första meningarna:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            <strong style={{ color: "var(--cream)" }}>Argument/debatt</strong> —
            leta efter tes och motargument. Frågorna handlar ofta om vad
            författaren anser eller hur hen bemöter kritik.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Populärvetenskap</strong> —
            leta efter orsak–verkan-samband och slutsatser. Frågorna testar
            om du förstår mekanismerna, inte bara fakta.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Historisk/kronologisk</strong> —
            lägg märke till tidsmarkörer. Frågorna handlar ofta om sekvenser
            och samband mellan händelser.
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          4. Lita på texten, inte din förkunskap
        </h2>
        <p>
          Det här är en av de vanligaste orsakerna till fel: du väljer ett
          alternativ för att det <em>stämmer i verkligheten</em>, men det
          stöds inte av just den här texten. Svaret MÅSTE förankras i textens
          ord. Din allmänbildning kan hjälpa dig orientera dig, men den
          bestämmer aldrig svaret.
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          5. Elimineringsmetoden
        </h2>
        <p>
          Om du är osäker: arbeta bakifrån. Stryk de alternativ som direkt
          strider mot texten. Av de kvarvarande väljer du det som <em>bäst</em>{" "}
          stöds av texten. Det rätta svaret behöver inte vara perfekt —
          det behöver bara vara bättre än de andra tre.
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          6. Hantera svåra ord
        </h2>
        <p>
          Stöter du på ett ord du inte känner igen: fortsätt läsa. Kontexten
          runt ordet ger ofta tillräcklig information för att förstå vad meningen
          säger. Gissa inte ett ords betydelse isolerat — läs hela meningen
          och stycket runt om det. På ELF hjälper det att snabbt analysera
          ordets morfologi (prefix, rot, suffix).
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          7. Träna aktivt läsande
        </h2>
        <p>
          Passivt läsande — att låta orden flöda förbi — förbättrar inte din
          HP-läsförståelse. Aktivt läsande gör det: ställ frågor till texten
          medan du läser, markera nyckelpassager och ifrågasätt påståenden.
          HP Kampen låter dig öva LÄS- och ELF-frågor från riktiga prov med
          direkt feedback — det är den snabbaste vägen till förbättring.
        </p>

        <p className="mt-8">
          <Link
            to="/train"
            className="underline"
            style={{ color: "var(--amber)" }}
          >
            Öva läsförståelse gratis på HP Kampen →
          </Link>
        </p>
      </section>
    </article>
  );
}
