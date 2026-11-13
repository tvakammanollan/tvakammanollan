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

export const Route = createFileRoute("/guider/kva")({
  component: KvaGuidePage,
  head: () => ({
    meta: pageMeta({
      path: "/guider/kva",
      ...guideArticleMeta("/guider/kva"),
      title: "KVA-guide: kvantitativa jämförelser på HP",
      description:
        "Guide till KVA-delprovet: hur du jämför två kvantiteter utan att räkna ut dem, och när svaret är att det inte går att avgöra.",
      ogTitle: "Tvåkommanollan | KVA-guiden",
      ogDescription:
        "Kvantitativa jämförelser på HP: snabbteknik, 'kan ej avgöras'-regeln och vanliga fällor.",
    }),
    links: pageLinks("/guider/kva"),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Guider", path: "/guider" },
        { name: "KVA: Kvantitativa jämförelser", path: "/guider/kva" },
      ]),
      jsonLdScript(
        guideArticleJsonLd({
          headline: "KVA-guide: kvantitativa jämförelser på högskoleprovet",
          description:
            "Guide till KVA-delprovet: hur du jämför två kvantiteter utan att räkna ut dem.",
          url: "https://tvakommanollan.se/guider/kva",
        }),
      ),
      jsonLdScript(guideFaqJsonLd(GUIDE_FAQ.kva)),
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
        <h1
          className="mt-2 text-3xl font-bold sm:text-4xl"
          style={{ color: "var(--cream)", fontFamily: "var(--font-display)" }}
        >
          KVA: Kvantitativa jämförelser
        </h1>
      </header>

      <GuideTopCta delprov="kva" code="KVA" />

      <p className="mb-8 text-[14px]">
        Alla formler som behövs på den kvantitativa delen finns samlade i{" "}
        <Link to="/hogskoleprovet-formler" className="underline underline-offset-2">
          formelsamlingen för högskoleprovet
        </Link>
        .
      </p>

      <section className="space-y-6">
        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Vad är KVA?
        </h2>
        <p>
          KVA har 10 uppgifter per kvantitativt provpass. I varje uppgift jämför du två kvantiteter,
          I och II. Det finns fyra svar: I är större än II, II är större än I, de är lika, eller
          informationen räcker inte. Eftersom du sällan behöver räkna ut något exakt går KVA ofta
          fortare än XYZ. Mer om provets uppbyggnad finns på{" "}
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
          Det fjärde alternativet är det som oftast väljs fel. Välj "kan ej avgöras" när du kan
          hitta två tillåtna exempel som ger olika svar, till exempel ett där kvantiteterna är lika
          och ett där I är större. Ger alla dina exempel samma svar är det inte "kan ej avgöras".
        </p>
        <p>
          Pröva x = 1, x = −1 och x = 0 för varje variabel. Ger de olika svar är svaret "kan ej
          avgöras".
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Förenkla i stället för att räkna
        </h2>
        <p>
          KVA går fortast om du förenklar uttrycken i stället för att räkna ut dem. Du får lägga
          till, dra ifrån, multiplicera och dividera med positiva tal på båda sidor utan att
          jämförelsen ändras. Stryk det som är lika på båda sidor och jämför det som blir kvar.
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--cream)" }}>Kvadrater och rötter:</strong> är I = x² och
            II = y², och x och y kan vara negativa, kan du inte jämföra x och y direkt. Tänk på
            tecknen.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Multiplikation med okänt tecken:</strong>{" "}
            multiplicerar eller dividerar du med en variabel som kan vara negativ vet du inte om
            olikheten vänds. Det tyder ofta på "kan ej avgöras".
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Symmetri:</strong> ser I och II likadana ut
            men med termerna i annan ordning, kontrollera om ordningen spelar roll. Ibland är de
            lika.
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
            står det inte att x &gt; 0 måste du pröva negativa värden också.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Anta att figuren är till skala:</strong>{" "}
            figurerna behöver inte vara skalenliga. Mät inte med ögat.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Räkna för länge:</strong> har du räknat i mer
            än 45 sekunder finns det troligen en enklare väg.
          </li>
        </ul>

        <p className="mt-8">
          <Link
            to="/train"
            className="inline-flex items-center gap-1.5 underline"
            style={{ color: "var(--amber)" }}
          >
            Öva KVA
          </Link>
        </p>
      </section>

      <GuideFaq items={GUIDE_FAQ.kva} />

      <RelatedGuides
        currentPath="/guider/kva"
        relatedPaths={["/guider/xyz", "/guider/nog", "/guider/dtk", "/guider/tidspress"]}
      />
    </article>
  );
}
