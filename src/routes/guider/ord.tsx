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

export const Route = createFileRoute("/guider/ord")({
  component: OrdGuidePage,
  head: () => ({
    meta: pageMeta({
      path: "/guider/ord",
      ...guideArticleMeta("/guider/ord"),
      title: "ORD-guide: ordkunskap på högskoleprovet",
      description:
        "Guide till ORD-delprovet på högskoleprovet: hur uppgifterna ser ut, hur du lägger upp tiden och hur du bygger ordförråd.",
      ogTitle: "Tvåkommanollan | ORD-guiden",
      ogDescription:
        "Hur ORD-uppgifterna ser ut, hur du lägger upp tiden och hur du bygger ordförråd.",
    }),
    links: pageLinks("/guider/ord"),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Guider", path: "/guider" },
        { name: "ORD: Ordkunskap", path: "/guider/ord" },
      ]),
      jsonLdScript(
        guideArticleJsonLd({
          headline: "ORD-guide: ordkunskap på högskoleprovet",
          description:
            "Guide till ORD-delprovet på högskoleprovet: hur uppgifterna ser ut, hur du lägger upp tiden och hur du bygger ordförråd.",
          url: "https://tvakommanollan.se/guider/ord",
        }),
      ),
      jsonLdScript(guideFaqJsonLd(GUIDE_FAQ.ord)),
    ],
  }),
});

function OrdGuidePage() {
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
          ORD: Ordkunskap
        </h1>
      </header>

      <GuideTopCta delprov="ord" code="ORD" />

      <section className="space-y-6">
        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Vad testar ORD?
        </h2>
        <p>
          ORD-delprovet har 20 uppgifter, 10 i varje verbalt provpass. Du får ett ord och ska välja
          det av fem alternativ som ligger närmast i betydelse. Orden kommer ur facklitteratur,
          skönlitteratur och tidningstext. En del är vardagliga ord med en precis betydelse, andra
          är ovanliga termer från medicin, juridik och filosofi. Mer om provets uppbyggnad finns på{" "}
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
          Vilka ord som kommer
        </h2>
        <p>Uppgiften är alltid densamma, men orden är av olika slag:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--cream)" }}>Synonym:</strong> de flesta uppgifter är ett
            enskilt ord, och du väljer det alternativ som betyder ungefär samma sak.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Fraser och uttryck:</strong> ibland är det
            givna ordet ett uttryck, och då ska alternativet förklara vad det betyder.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Ord med flera betydelser:</strong> då gäller
            den betydelse som något av alternativen stämmer med. Läs alla fem innan du väljer.
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Tid
        </h2>
        <p>
          Räkna med ungefär 3 minuter på 10 ord. Antingen kan du ordet eller inte, så det lönar sig
          sällan att fundera länge. Svara direkt på de ord du kan, markera de osäkra och gå tillbaka
          till dem om det blir tid över. Lämna aldrig en uppgift tom. Fel svar ger inget avdrag, så
          gissa.
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Hur bygger man ordförråd?
        </h2>
        <p>Ordförråd tar tid att bygga. Det här hjälper:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--cream)" }}>Läs breda källor:</strong> dagstidningar som
            DN och SvD, vetenskapsjournalistik och facklitteratur inom olika ämnen innehåller den
            sortens ord som brukar stå på provet.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Öva på Tvåkommanollan:</strong> öva
            ORD-uppgifter utan klocka eller i matcher på tid. Ord du missar kommer tillbaka.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Studera prefix och suffix:</strong> känner du
            igen ordets delar kan du ofta gissa betydelsen även om du aldrig sett ordet:{" "}
            <em>-het</em> (abstrakt egenskap), <em>-ing</em> (handling/process), <em>-mässig</em> (i
            stil med), <em>o-</em> (negation), <em>miss-</em> (fel/dålig).
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Vanliga ordkategorier på HP
        </h2>
        <p>Orden brukar komma ur de här områdena:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Känslo- och karaktärsord (arrogant, ödmjuk, svekfull, nitisk)</li>
          <li>Vetenskapliga och akademiska termer (empirisk, deduktiv, syntes)</li>
          <li>Juridiska och politiska ord (preskription, ratificera, suverän)</li>
          <li>Ekonomiska termer (likviditet, depreciation, konjunktur)</li>
          <li>Filosofiska begrepp (epistemologi, determinism, kontingent)</li>
          <li>Medicinsk terminologi (akut, kronisk, symtomatisk, remission)</li>
          <li>Stilistiska och retoriska ord (eufemism, metafor, ironi, allegori)</li>
          <li>Klassiska lånord från latin och grekiska (permutation, digression)</li>
        </ul>

        <p className="mt-8">
          Vill du slå upp ett enskilt ord i stället för att öva finns{" "}
          <Link to="/ordlista" className="underline" style={{ color: "var(--amber)" }}>
            ordlistan
          </Link>
          : varje ord som förekommit på ORD, med betydelse, exempelmening och den uppgift det kom
          ur.
        </p>

        <p className="mt-8">
          <Link
            to="/train"
            className="inline-flex items-center gap-1.5 underline"
            style={{ color: "var(--amber)" }}
          >
            Öva ORD
          </Link>
        </p>
      </section>

      <GuideFaq items={GUIDE_FAQ.ord} />

      <RelatedGuides
        currentPath="/guider/ord"
        relatedPaths={["/guider/mek", "/guider/las", "/guider/elf", "/guider/tidspress"]}
      />
    </article>
  );
}
