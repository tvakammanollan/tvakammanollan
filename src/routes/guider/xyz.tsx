import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { RelatedGuides, guideArticleJsonLd } from "@/lib/guider-meta";
import { GuideTopCta } from "@/lib/guide-top-cta";

export const Route = createFileRoute("/guider/xyz")({
  component: XyzGuidePage,
  head: () => ({
    meta: pageMeta({
      path: "/guider/xyz",
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
        { name: "XYZ · Matematisk problemlösning", path: "/guider/xyz" },
      ]),
      jsonLdScript(
        guideArticleJsonLd({
          headline: "XYZ-guide: matematisk problemlösning på Högskoleprovet",
          description:
            "Lär dig lösa XYZ-uppgifter snabbare med rätt metod. Algebra, geometri, sannolikhet och kombinatorik förklaras steg för steg.",
          url: "https://tvakommanollan.se/guider/xyz",
        }),
      ),
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
          XYZ · Matematisk problemlösning
        </h1>
      </header>

      <GuideTopCta delprov="xyz" code="XYZ" />

      <section className="space-y-6">
        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Vad testar XYZ?
        </h2>
        <p>
          XYZ-delprovet innehåller 12 uppgifter per provpass. Det är klassisk matematisk
          problemlösning på gymnasienivå: du får ett problem formulerat i text eller med en figur
          och ska välja rätt svar bland fyra alternativ. Ingen formelsamling tillåts och inga
          hjälpmedel. Matematik på HP testar inte avancerad kalkyl. Det testar om du kan tillämpa
          grundläggande matematik snabbt och säkert. Läs mer om högskoleprovets uppbyggnad i sin
          helhet på{" "}
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
          Huvudmoment
        </h2>
        <p>Dessa moment återkommer provärs efter provärs. Prioritera dem i din träning:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--cream)" }}>Procent och förändringsfaktor:</strong>{" "}
            procentuell förändring, tillväxtfaktor, rabatt och prisökning. Vanligast förekommande
            moment på XYZ.
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
          Strategin: eliminera och uppskatta
        </h2>
        <p>
          XYZ har alltid fyra svarsalternativ, och minst ett av dem är uppenbart orimligt. Börja med
          att uppskatta storleksordningen på svaret och stryk alternativ som avviker kraftigt. Det
          minskar risken vid gissning och bekräftar dina räkningar.
        </p>
        <p>
          En annan kraftfull teknik: prova enkla tal. Om uppgiften innehåller en okänd variabel,
          sätt <em>x = 2</em> eller <em>x = 10</em> och kontrollera vilket alternativ som ger rätt
          resultat. Fungerar utmärkt när algebran annars blir komplex.
        </p>
        <p>
          Bakåträkning är också effektivt: plugga in svarsalternativen i uppgiftens villkor och se
          vilket som stämmer, istället för att lösa ekvationen från grunden.
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Tidspress
        </h2>
        <p>
          12 uppgifter på ungefär 15 minuter ger dig 75 sekunder per uppgift. Det är tillräckligt
          för de flesta XYZ-uppgifter om du väljer rätt metod direkt. Hoppa-regeln: om du inte
          hittar ett angreppssätt inom 90 sekunder: markera och gå vidare. En svår uppgift är inte
          värd mer poäng än en enkel. Återvänd med eventuell restid.
        </p>

        <p className="mt-8">
          <Link
            to="/train"
            className="inline-flex items-center gap-1.5 underline"
            style={{ color: "var(--amber)" }}
          >
            Öva XYZ-uppgifter gratis på Tvåkommanollan
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </p>
      </section>

      <RelatedGuides
        currentPath="/guider/xyz"
        relatedPaths={["/guider/kva", "/guider/nog", "/guider/dtk", "/guider/tidspress"]}
      />
    </article>
  );
}
