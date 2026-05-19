import { createFileRoute, Link } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { RelatedGuides, guideArticleJsonLd } from "@/lib/guider-meta";

export const Route = createFileRoute("/guider/elf")({
  component: ElfGuidePage,
  head: () => ({
    meta: pageMeta({
      path: "/guider/elf",
      title: "ELF-guide: engelsk läsförståelse på HP · HP Kampen",
      description:
        "Guide till ELF-delprovet: engelska texter, frågetyper och strategi för att maximera poängen. Med riktiga HP-frågor från HP Kampen.",
      ogTitle: "ELF-guiden · HP Kampen",
      ogDescription:
        "Engelsk läsförståelse på HP: akademiskt ordförråd, strategi och skillnader mot LÄS.",
    }),
    links: pageLinks("/guider/elf"),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Guider", path: "/guider" },
        { name: "ELF · Engelsk läsförståelse", path: "/guider/elf" },
      ]),
      jsonLdScript(guideArticleJsonLd({
        headline: "ELF-guide: engelsk läsförståelse på Högskoleprovet",
        description:
          "Guide till ELF-delprovet: engelska texter, frågetyper och strategi för att maximera poängen.",
        url: "https://hpkampen.se/guider/elf",
      })),
    ],
  }),
});

function ElfGuidePage() {
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
          ELF · Engelsk läsförståelse
        </h1>
      </header>

      <section className="space-y-6">
        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Vad är ELF?
        </h2>
        <p>
          ELF (English as a Foreign Language) är läsförståelse på engelska.
          Du möter fyra texter per provpass hämtade från akademiska tidskrifter,
          vetenskapsjournalistik, kulturkritik och samhällsdebatt. Texterna
          är på engelska och frågorna är formulerade på engelska, men de
          alternativa svaren är noggrant valda för att testa exakt läsförståelse
          — inte allmänna kunskaper om ämnet. ELF ger lika stort utslag på
          slutbetyget som LÄS, men bedöms separat i det verbala delprovspasset.
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Viktigaste skillnaden mot LÄS
        </h2>
        <p>
          Strategin för ELF är i princip identisk med LÄS — läs frågorna
          först, lokalisera relevanta avsnitt, eliminera felaktiga alternativ.
          Men det finns en avgörande skillnad: texterna i ELF är ofta mer
          avancerade och akademiska än de svenska LÄS-texterna. Lång mening,
          komplex bisatsstruktur och fackspecifikt ordförråd på engelska är
          vanligt. Det innebär att akademiskt engelskt ordförråd är nyckeln
          till ELF på samma sätt som ordkunskap är nyckeln till ORD.
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Ordtips för ELF
        </h2>
        <p>
          Du behöver inte kunna varje ord — men du behöver förstå tillräckligt
          för att följa argumentet. Bygg ditt akademiska engelska ordförråd
          med dessa strategier:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--cream)" }}>Prefix- och rotstrategi</strong> —
            känner du igen <em>bio-</em> (liv), <em>-ology</em> (läran om),{" "}
            <em>-tion</em> (substantiv), <em>inter-</em> (mellan),{" "}
            <em>trans-</em> (över/genom) kan du gissa dig till ordets betydelse
            även om du aldrig sett det exakt.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Läs engelsk vetenskapsjournalistik</strong> —
            The Atlantic, The Economist och Quanta Magazine är utmärkta källor
            vars språknivå och ämnesbredd matchar ELF-texterna väl.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Studera Academic Word List (AWL)</strong> —
            de 570 vanligaste akademiska engelska orden täcker en stor del av
            det ordförråd som dyker upp i ELF-texterna.
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Strategi
        </h2>
        <p>
          Använd samma grundteknik som för LÄS: läs frågorna och markera
          nyckelord innan du läser texten. Lokalisera relevanta avsnitt i
          texten och svara med stöd i dem.
        </p>
        <p>
          Var extra noga med följande ord i ELF-frågor — de vänder hela
          frågeinnebörden:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li><em>except</em> / <em>NOT</em> — du söker det alternativ som INTE stämmer</li>
          <li><em>least likely</em> / <em>least probable</em> — välj det svagast stödda</li>
          <li><em>primarily</em> / <em>mainly</em> — fokus på det centrala, inte detaljer</li>
          <li><em>implies</em> / <em>suggests</em> — svaret är inte explicit, du ska sluta dig till det</li>
        </ul>
        <p>
          Engelskans meningsstruktur kan vara mer komplex än svenska. Om en
          mening är svår att förstå, dela upp den: hitta subjekt, predikat och
          objekt, och ignorera parentetiska inskjutna fraser tills grundstrukturen
          är klar.
        </p>

        <p className="mt-8">
          <Link
            to="/train"
            className="underline"
            style={{ color: "var(--amber)" }}
          >
            Öva ELF-frågor gratis på HP Kampen →
          </Link>
        </p>
      </section>

      <RelatedGuides
        currentPath="/guider/elf"
        relatedPaths={["/guider/las", "/guider/tips-lasforstaelse", "/guider/ord", "/guider/mek"]}
      />
    </article>
  );
}
