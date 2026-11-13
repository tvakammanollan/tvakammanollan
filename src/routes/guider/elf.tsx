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

export const Route = createFileRoute("/guider/elf")({
  component: ElfGuidePage,
  head: () => ({
    meta: pageMeta({
      path: "/guider/elf",
      ...guideArticleMeta("/guider/elf"),
      title: "ELF-guide: engelsk läsförståelse på HP",
      description:
        "Guide till ELF-delprovet: engelska texter, frågetyper och strategi. Med ELF-uppgifter ur gamla prov att öva på.",
      ogTitle: "Tvåkommanollan | ELF-guiden",
      ogDescription:
        "Engelsk läsförståelse på HP: akademiskt ordförråd, strategi och skillnader mot LÄS.",
    }),
    links: pageLinks("/guider/elf"),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Guider", path: "/guider" },
        { name: "ELF: Engelsk läsförståelse", path: "/guider/elf" },
      ]),
      jsonLdScript(
        guideArticleJsonLd({
          headline: "ELF-guide: engelsk läsförståelse på högskoleprovet",
          description: "Guide till ELF-delprovet: engelska texter, frågetyper och strategi.",
          url: "https://tvakommanollan.se/guider/elf",
        }),
      ),
      jsonLdScript(guideFaqJsonLd(GUIDE_FAQ.elf)),
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
        <h1
          className="mt-2 text-3xl font-bold sm:text-4xl"
          style={{ color: "var(--cream)", fontFamily: "var(--font-display)" }}
        >
          ELF: Engelsk läsförståelse
        </h1>
      </header>

      <GuideTopCta delprov="elf" code="ELF" />

      <section className="space-y-6">
        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Vad är ELF?
        </h2>
        <p>
          ELF står för engelsk läsförståelse och har 10 uppgifter per verbalt provpass. Texterna
          kommer ur tidskrifter, vetenskapsjournalistik, kulturkritik och samhällsdebatt. Både
          texter och frågor är på engelska, och svaren ska gå att belägga i texten. Du behöver inga
          förkunskaper om ämnet. ELF väger lika tungt i resultatet som LÄS. Mer om provets
          uppbyggnad finns på{" "}
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
          Skillnaden mot LÄS
        </h2>
        <p>
          Metoden är densamma som för LÄS: läs frågorna först, hitta stället i texten och stryk de
          alternativ som inte stämmer. Skillnaden är språket. ELF-texterna har ofta långa meningar
          och facktermer, så ditt engelska ordförråd spelar stor roll.
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Ordförråd
        </h2>
        <p>
          Du behöver inte kunna varje ord, men tillräckligt många för att följa resonemanget. Det
          här hjälper:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--cream)" }}>Lär dig vanliga orddelar:</strong> känner du
            igen <em>bio-</em> (liv), <em>-ology</em> (läran om), <em>-tion</em> (substantiv),{" "}
            <em>inter-</em> (mellan), <em>trans-</em> (över/genom) kan du ofta gissa vad ett nytt
            ord betyder.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Läs engelsk vetenskapsjournalistik:</strong>{" "}
            The Atlantic, The Economist och Quanta Magazine har ungefär samma språknivå och
            ämnesbredd som ELF-texterna.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Gå igenom Academic Word List (AWL):</strong>{" "}
            listan har 570 ordfamiljer som är vanliga i akademisk engelska.
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Så läser du
        </h2>
        <p>
          Läs frågorna och markera nyckelord innan du läser texten. Hitta sedan stället frågan
          gäller och svara utifrån det.
        </p>
        <p>Se upp med de här orden i frågorna. De ändrar vad som efterfrågas:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            <em>except</em> / <em>NOT</em>: du söker det alternativ som inte stämmer
          </li>
          <li>
            <em>least likely</em> / <em>least probable</em>: välj det svagast stödda
          </li>
          <li>
            <em>primarily</em> / <em>mainly</em>: frågan gäller huvudsaken
          </li>
          <li>
            <em>implies</em> / <em>suggests</em>: svaret står inte rakt ut, du ska dra en slutsats
          </li>
        </ul>
        <p>
          Är en mening svår att förstå, dela upp den: hitta subjekt, verb och objekt, och hoppa över
          inskotten tills du ser huvudsatsen.
        </p>

        <p className="mt-8">
          <Link
            to="/train"
            className="inline-flex items-center gap-1.5 underline"
            style={{ color: "var(--amber)" }}
          >
            Öva ELF
          </Link>
        </p>
      </section>

      <GuideFaq items={GUIDE_FAQ.elf} />

      <RelatedGuides
        currentPath="/guider/elf"
        relatedPaths={["/guider/las", "/guider/ord", "/guider/mek", "/guider/tidspress"]}
      />
    </article>
  );
}
