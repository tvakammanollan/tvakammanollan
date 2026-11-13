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

export const Route = createFileRoute("/guider/mek")({
  component: MekGuidePage,
  head: () => ({
    meta: pageMeta({
      path: "/guider/mek",
      ...guideArticleMeta("/guider/mek"),
      title: "MEK-guide: meningskomplettering på HP",
      description:
        "Så löser du MEK: lässtrategi, luckteknik och hur du fördelar tiden. Med MEK-uppgifter ur gamla prov att öva på.",
      ogTitle: "Tvåkommanollan | MEK-guiden",
      ogDescription:
        "Meningskomplettering på HP: strategi, logikord och hur du undviker distraktorer.",
    }),
    links: pageLinks("/guider/mek"),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Guider", path: "/guider" },
        { name: "MEK: Meningskomplettering", path: "/guider/mek" },
      ]),
      jsonLdScript(
        guideArticleJsonLd({
          headline: "MEK-guide: meningskomplettering på högskoleprovet",
          description: "Så löser du MEK: lässtrategi, luckteknik och hur du fördelar tiden.",
          url: "https://tvakommanollan.se/guider/mek",
        }),
      ),
      jsonLdScript(guideFaqJsonLd(GUIDE_FAQ.mek)),
    ],
  }),
});

function MekGuidePage() {
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
          MEK: Meningskomplettering
        </h1>
      </header>

      <GuideTopCta delprov="mek" code="MEK" />

      <section className="space-y-6">
        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Vad är MEK?
        </h2>
        <p>
          MEK har 10 uppgifter per verbalt provpass. Varje uppgift är en kort text med en eller
          flera luckor, och du väljer det alternativ vars ord passar i luckorna. Flera alternativ
          kan fungera grammatiskt, men bara ett passar både innehållet och tonen. Mer om provets
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
          Läs meningen först
        </h2>
        <p>
          Börja med att täcka över alternativen och läsa texten med luckan. Fundera på vilket ord,
          eller vilken sorts ord, som borde stå där. Titta sedan på alternativen och välj det som
          ligger närmast. Då blir du inte lika lätt lurad av alternativ som bara låter bra.
        </p>
        <p>
          Har texten flera luckor: börja med den du är säkrast på. Det utesluter ofta flera
          alternativ direkt.
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Sambandsord
        </h2>
        <p>
          Många MEK-uppgifter hänger på sambandsord, alltså ord som visar hur två led förhåller sig
          till varandra:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--cream)" }}>Kontrast:</strong> dock, däremot, men, trots
            att, icke desto mindre, likväl
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Orsak och följd:</strong> eftersom, därför,
            följaktligen, till följd av, härav
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Tillägg:</strong> dessutom, likaså, vidare,
            därtill, inte minst
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Medgivande:</strong> visserligen, förvisso, om
            än, även om
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Tid:</strong> sedan, tidigare, hädanefter,
            numera, alltsedan
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Vanliga fällor
        </h2>
        <p>
          De felaktiga alternativen är valda för att låta rimliga var för sig. De vanligaste
          typerna:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--cream)" }}>Fel sambandsord:</strong> ordet passar ämnet
            men ger fel samband. Står det en kontrast i texten kan luckan inte fyllas med
            "dessutom".
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Liknande ord, annan användning:</strong> ord
            som "försiggå" och "förekomma" liknar varandra men används i olika sammanhang.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Fel stilnivå:</strong> en formell text kräver
            ett formellt ord. Ett vardagligt ord sticker ut även om betydelsen stämmer.
          </li>
        </ul>
        <p>Läs till sist hela texten med ditt svar insatt. Låter det konstigt, välj om.</p>

        <p className="mt-8">
          <Link
            to="/train"
            className="inline-flex items-center gap-1.5 underline"
            style={{ color: "var(--amber)" }}
          >
            Öva MEK
          </Link>
        </p>
      </section>

      <GuideFaq items={GUIDE_FAQ.mek} />

      <RelatedGuides
        currentPath="/guider/mek"
        relatedPaths={["/guider/ord", "/guider/las", "/guider/elf", "/guider/tidspress"]}
      />
    </article>
  );
}
