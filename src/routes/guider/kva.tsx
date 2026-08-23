import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { RelatedGuides, guideArticleJsonLd } from "@/lib/guider-meta";
import { GuideTopCta } from "@/lib/guide-top-cta";

export const Route = createFileRoute("/guider/kva")({
  component: KvaGuidePage,
  head: () => ({
    meta: pageMeta({
      path: "/guider/kva",
      title: "KVA-guide: kvantitativa jämförelser på HP",
      description:
        "Förstå KVA-delprovet och lär dig jämföra matematiska uttryck snabbt och säkert. Guide med riktiga HP KVA-uppgifter.",
      ogTitle: "Tvåkommanollan | KVA-guiden",
      ogDescription:
        "Kvantitativa jämförelser på HP: snabbteknik, 'kan ej avgöras'-regeln och vanliga fällor.",
    }),
    links: pageLinks("/guider/kva"),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Guider", path: "/guider" },
        { name: "KVA · Kvantitativa jämförelser", path: "/guider/kva" },
      ]),
      jsonLdScript(
        guideArticleJsonLd({
          headline: "KVA-guide: kvantitativa jämförelser på Högskoleprovet",
          description:
            "Förstå KVA-delprovet och lär dig jämföra matematiska uttryck snabbt och säkert.",
          url: "https://tvakommanollan.se/guider/kva",
        }),
      ),
    ],
  }),
});

function KvaGuidePage() {
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
          KVA · Kvantitativa jämförelser
        </h1>
      </header>

      <GuideTopCta delprov="kva" code="KVA" />

      <section className="space-y-6">
        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Vad är KVA?
        </h2>
        <p>
          KVA-delprovet ber dig jämföra två matematiska uttryck: kolumn A och kolumn B. Det finns
          fyra möjliga svar: A är större än B, B är större än A, de är lika, eller relationen kan
          inte avgöras med given information. Delprovet innehåller 10 uppgifter per provpass.
          Poängen per uppgift är densamma som övriga delprov, men rätt strategi gör att du kan svara
          på KVA-uppgifter snabbare än på XYZ. Läs mer om högskoleprovets uppbyggnad i sin helhet på{" "}
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
          "Kan ej avgöras": när och hur?
        </h2>
        <p>
          Det fjärde alternativet, att relationen beror på omständigheterna, är den vanligaste
          fällan i KVA. Välj "kan ej avgöras" ENDAST om du kan konstruera ett konkret exempel där A
          &gt; B OCH ett exempel där A &lt; B. Om du bara hittar ett motexempel men inte båda är
          svaret inte "kan ej avgöras".
        </p>
        <p>
          Praktisk tumregel: konstruera motexempel aktivt. Prova x = 1, x = −1 och x = 0 för varje
          okänd variabel. Om en av dessa tre ger olika relationer har du bevisat att svaret är "kan
          ej avgöras".
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Snabbteknik
        </h2>
        <p>
          KVA-uppgifter löses snabbast genom algebraisk förenkling, inte numerisk beräkning.
          Grundregeln: du får lägga till, dra ifrån, multiplicera och dividera med positiva tal på
          BÅDA sidor utan att ändra relationen. Subtrahera det minsta uttrycket från båda sidor och
          se om resten är positiv, negativ eller noll.
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--cream)" }}>Kvadrater och rötter:</strong> om A = x² och B
            = y² och x, y kan vara negativa går det inte att direkt jämföra rötterna. Ta hänsyn till
            tecken.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Multiplikation med okänt tecken:</strong> om
            du multiplicerar/dividerar med en variabel vars tecken är okänt kan du inte avgöra om
            relationen vänds. Det är ett "kan ej avgöras"-tecken.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Symmetri:</strong> om A och B ser likadana ut
            men med utbytta termer, kontrollera om uttrycken är kommutativa. Ibland är de lika i
            alla fall.
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Vanliga fällor
        </h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--cream)" }}>
              Glömma att x kan vara negativ eller noll :
            </strong>{" "}
            om uppgiften inte specificerar att x &gt; 0 måste du testa negativa värden. x = −1
            ändrar ofta relationen.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Anta att figuren är till skala:</strong>{" "}
            geometriska figurer i KVA är aldrig till skala om det inte uttryckligen anges. Lita inte
            på ögonmåttet.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Räkna för länge:</strong> KVA är snabbare med
            algebra än med siffror. Om du räknar mer än 45 sekunder är det förmodligen fel metod.
          </li>
        </ul>

        <p className="mt-8">
          <Link
            to="/train"
            className="inline-flex items-center gap-1.5 underline"
            style={{ color: "var(--amber)" }}
          >
            Öva KVA-uppgifter gratis på Tvåkommanollan
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </p>
      </section>

      <RelatedGuides
        currentPath="/guider/kva"
        relatedPaths={["/guider/xyz", "/guider/nog", "/guider/dtk", "/guider/tidspress"]}
      />
    </article>
  );
}
