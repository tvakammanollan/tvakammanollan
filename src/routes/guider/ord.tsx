import { createFileRoute, Link } from "@tanstack/react-router";
import { pageMeta, pageLinks } from "@/lib/page-meta";

export const Route = createFileRoute("/guider/ord")({
  component: OrdGuidePage,
  head: () => ({
    meta: pageMeta({
      path: "/guider/ord",
      title: "ORD-guide: ordkunskap på Högskoleprovet · HP Kampen",
      description:
        "Lär dig klara ORD-delprovet på HP. Vi förklarar frågetyper, tidsstrategi och hur du snabbt bygger ordförråd med 8 000+ riktiga HP-ord.",
      ogTitle: "ORD-guiden · HP Kampen",
      ogDescription:
        "Synonymer, antonymer och ordförrådsbygge för Högskoleprovet. Strategi och tips.",
    }),
    links: pageLinks("/guider/ord"),
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "ORD-guide: ordkunskap på Högskoleprovet",
          description:
            "Lär dig klara ORD-delprovet på HP. Vi förklarar frågetyper, tidsstrategi och hur du snabbt bygger ordförråd med 8 000+ riktiga HP-ord.",
          url: "https://hpkampen.se/guider/ord",
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

function OrdGuidePage() {
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
          ORD · Ordkunskap
        </h1>
      </header>

      <section className="space-y-6">
        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Vad testar ORD?
        </h2>
        <p>
          ORD-delprovet innehåller 40 uppgifter totalt, fördelat på 10 per
          provpass. Du presenteras med ett ord och ska välja det alternativ som
          bäst matchar ordets betydelse — antingen som synonym eller antonym.
          Orden hämtas från ett brett spektrum av svenska texter: facklitteratur,
          skönlitteratur och akademiska sammanhang. Det innebär att du möter
          allt från vardagliga men subtila ord till ovanliga termer från medicin,
          juridik och filosofi.
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Vanliga frågetyper
        </h2>
        <p>
          De flesta ORD-uppgifter faller in i ett av tre mönster:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--cream)" }}>Synonym</strong> — välj
            det ord som betyder ungefär samma sak som det givna ordet. Vanligast
            på provet.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Antonym</strong> — välj
            det ord som har motsatt betydelse. Kräver att du känner till både
            det givna och de alternativa ordens nyanser.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Bildlig/abstrakt användning</strong> —
            ibland används det givna ordet i överförd bemärkelse. Läs noggrant
            om det finns en liten kontext i uppgiften.
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Tidsstrategin
        </h2>
        <p>
          Du har ungefär 10 minuter på 10 ord — alltså en minut per uppgift. Det
          är gott om tid för de flesta ord, men snabbt om du fastnar. Arbeta så
          här: svara direkt på de ord du känner igen utan att tveka, markera
          osäkra uppgifter och återvänd till dem med den tid som är kvar. Hoppa
          aldrig över ett ord helt — gissa alltid, eftersom det inte finns avdrag
          för fel svar.
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Hur bygger man ordförråd?
        </h2>
        <p>
          Ett brett ordförråd byggs över tid, men det finns smarta genvägar
          inför HP:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--cream)" }}>Läs breda källor</strong> —
            dagstidningar som DN och SvD, vetenskapsjournalistik och
            facklitteratur inom olika ämnen exponerar dig för ord som faktiskt
            dyker upp på provet.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Träna aktivt med HP Kampen</strong> —
            öva ORD-frågor från riktiga prov i lugn takt eller i live-matcher
            under tidspress. Upprepning i kontext fastnar bättre än ordlistor.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Studera prefix och suffix</strong> —
            känner du igen morfemen vet du ofta ordets valör även om du aldrig
            sett just det ordet: <em>-het</em> (abstrakt egenskap),{" "}
            <em>-ing</em> (handling/process), <em>-mässig</em> (i stil med),{" "}
            <em>o-</em> (negation), <em>miss-</em> (fel/dålig).
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Vanliga ordkategorier på HP
        </h2>
        <p>
          Certain thematic clusters återkommer på prov efter prov. Prioritera
          dessa:
        </p>
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
          <Link
            to="/train"
            className="underline"
            style={{ color: "var(--amber)" }}
          >
            Öva ORD-frågor gratis på HP Kampen →
          </Link>
        </p>
      </section>
    </article>
  );
}
