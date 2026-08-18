import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { RelatedGuides, guideArticleJsonLd } from "@/lib/guider-meta";

export const Route = createFileRoute("/guider/dtk")({
  component: DtkGuidePage,
  head: () => ({
    meta: pageMeta({
      path: "/guider/dtk",
      title: "DTK-guide: diagram, tabeller och kartor på HP · HP Kampen",
      description:
        "Lär dig läsa diagram, tabeller och kartor snabbt och korrekt på Högskoleprovet. DTK-guide med strategi och vanliga misstag.",
      ogTitle: "DTK-guiden · HP Kampen",
      ogDescription:
        "Diagram, tabeller och kartor på HP: läs axlarna först, frågetyper och vanliga skalmisstag.",
    }),
    links: pageLinks("/guider/dtk"),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Guider", path: "/guider" },
        { name: "DTK · Diagram, tabeller, kartor", path: "/guider/dtk" },
      ]),
      jsonLdScript(
        guideArticleJsonLd({
          headline: "DTK-guide: diagram, tabeller och kartor på Högskoleprovet",
          description:
            "Lär dig läsa diagram, tabeller och kartor snabbt och korrekt på Högskoleprovet.",
          url: "https://tvakommanollan.se/guider/dtk",
        }),
      ),
    ],
  }),
});

function DtkGuidePage() {
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
          DTK · Diagram, tabeller och kartor
        </h1>
      </header>

      <section className="space-y-6">
        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Vad testar DTK?
        </h2>
        <p>
          DTK-delprovet presenterar dig med en figur — ett stapeldiagram, linjediagram,
          cirkeldiagram, kombinerat diagram, tabell eller karta — följt av 3–5 frågor om den
          figuren. Totalt 12 uppgifter per provpass, kopplade till 3–4 olika figurer. DTK tar
          vanligtvis längst tid av de kvantitativa delprovens moment eftersom du måste orientera dig
          i varje ny figur.
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Läs axlarna och titeln EERST
        </h2>
        <p>
          Innan du läser en enda fråga: orientera dig i figuren. Kontrollera alltid dessa fyra
          saker:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            <strong style={{ color: "var(--cream)" }}>Vad mäts?</strong> — titel och axeletiketter
            berättar ämnet och variabeln.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Vilken enhet?</strong> — tusental, miljoner,
            procent? Enhetsskillnader är den vanligaste orsaken till fel.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Vilket tidsintervall eller intervall?</strong>{" "}
            — börjar axeln på 0 eller på ett annat värde (trunkerad axel)?
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Absoluta eller relativa tal?</strong> — antal
            individer vs. andel i procent ger helt olika svar på förändringsfrågor.
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Vanliga frågetyper
        </h2>
        <p>DTK-frågor faller nästan alltid i ett av dessa mönster:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--cream)" }}>Exaktvärde</strong> — "Vad var värdet år X?"
            Lokalisera stapeln eller punkten, läs av mot y-axeln och ta hänsyn till enheten.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Jämförelse</strong> — "Vilket land hade störst
            ökning?" Identifiera de två relevanta värdena och räkna differensen. Var noga med om
            frågan gäller absolut eller relativ förändring.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Beräkning</strong> — "Hur många procent ökade
            X från år A till år B?" Standardformeln: (nytt − gammalt) / gammalt × 100.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Uppskattning</strong> — ibland krävs bara att
            du pekar ut rätt storleksordning. Välj det alternativ som är närmast din avläsning, inte
            det exakta.
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Vanliga misstag
        </h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--cream)" }}>Läsa av fel skala vid dubbla y-axlar</strong>{" "}
            — kombidiagram har ofta en vänster- och en högeraxel för olika serier. Kontrollera
            alltid vilken axel som gäller för varje serie.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>
              Blanda ihop relativ och absolut förändring
            </strong>{" "}
            — ett land kan ha störst procentuell ökning men minst absolut ökning om det startar från
            en lägre bas. Läs frågan noga.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Glömma enheter</strong> — om y-axeln visar
            "tusental" och du svarar i faktiska tal är du 1 000 gånger fel. Notera alltid enheten
            direkt när du orienterar.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Trunkerad axel</strong> — om y-axeln börjar på
            80 istället för 0 ser en liten skillnad enorm ut visuellt. Räkna alltid med faktiska
            värden, inte staplars visuella längd.
          </li>
        </ul>

        <p className="mt-8">
          <Link
            to="/train"
            className="inline-flex items-center gap-1.5 underline"
            style={{ color: "var(--amber)" }}
          >
            Öva DTK-uppgifter gratis på HP Kampen
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </p>
      </section>

      <RelatedGuides
        currentPath="/guider/dtk"
        relatedPaths={["/guider/xyz", "/guider/kva", "/guider/nog", "/guider/tidspress"]}
      />
    </article>
  );
}
