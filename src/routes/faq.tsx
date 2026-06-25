import { createFileRoute, Link } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript } from "@/lib/page-meta";
import { PageHero } from "@/components/layout/PageHero";

interface FaqItem {
  q: string;
  a: string;
}

const FAQ: FaqItem[] = [
  {
    q: "Är HP Kampen verkligen gratis?",
    a: "Ja. Helt gratis. Inga annonser, inget kreditkort, inga in-app-köp och inga premium-paket. Sajten finansieras av grundaren.",
  },
  {
    q: "Hur fungerar ELO-systemet?",
    a: "ELO är ett rankingsystem från schackvärlden. Du börjar på 1 000. Vinner du mot en starkare spelare får du fler poäng. Förlorar du mot en svagare tappar du mer. Tiers: Brons under 1 000, Silver 1 000–1 199, Guld 1 200–1 399, Platina 1 400–1 599, Diamant 1 600+.",
  },
  {
    q: "Är frågorna från riktiga HP?",
    a: "Ja. Hela ordbanken bygger på publicerade högskoleprov från 1990-talet och framåt. Du kan också skriva hela riktiga provpass under Gamla prov.",
  },
  {
    q: "Kan jag spela utan konto?",
    a: "Ja. Tryck Testa gratis så skapas ett anonymt gästkonto och du hamnar direkt i en match. Du behöver inte skapa konto för att börja spela, men om du vill behålla din ELO och synas på topplistan behöver du registrera dig.",
  },
  {
    q: "Hur skapar jag privat match med vänner?",
    a: "Gå till Vänner och bjud in dina kompisar via deras användarnamn. Du kan också dela en rum-länk som de klickar på för att hoppa rakt in i en match.",
  },
  {
    q: "Hur många ord finns i databasen?",
    a: "Över 8 000 ord från tidigare HP samt en del nyare uttryck som inte testats på HP men som är på samma nivå.",
  },
  {
    q: "Vilka delprov kan jag träna?",
    a: "Alla åtta delprov: ORD (ordkunskap), MEK (meningskomplettering), LÄS (svensk läsförståelse), ELF (engelsk läsförståelse), XYZ (matematisk problemlösning), KVA (kvantitativa jämförelser), NOG (kvantitativa resonemang) och DTK (diagram, tabeller och kartor).",
  },
  {
    q: "Hur länge tar en match?",
    a: "En match är 8 frågor på 8 minuter. Du kan välja verbal eller matte. Direkt efter matchen ser du ditt nya ELO och statistik per fråga.",
  },
  {
    q: "Hur fungerar Gamla prov-läget?",
    a: "Du väljer ett provpass från ett gammalt högskoleprov (2022–2026) och skriver alla 40 frågor i din egen takt. Efter att du lämnat in får du facit och en uppskattning av vad det skulle motsvara i normerad HP-poäng.",
  },
  {
    q: "När är nästa Högskoleprovet?",
    a: "Högskoleprovet ges normalt två gånger per år: en gång i mars/april och en gång i oktober. Nästa officiella datum: 24 oktober 2026. Anmälan öppnar ungefär tre månader innan via antagning.se.",
  },
  {
    q: "Vad är ett bra resultat på Högskoleprovet?",
    a: "Medelvärdet ligger kring 0,9. Ett resultat på 1,2 placerar dig över snittet. För att komma in på populära utbildningar (läkare, jurist, civilingenjör i storstäder) brukar man behöva 1,7 eller högre. Ett bra resultat beror på vilken utbildning du söker — kolla antagningsstatistiken för just din linje.",
  },
  {
    q: "Hur länge är HP-resultatet giltigt?",
    a: "HP-betyget är giltigt i 8 år från provdatumet. Du kan göra provet hur många gånger du vill, och det högsta resultatet bland dina giltiga prov gäller automatiskt vid antagning.",
  },
  {
    q: "Vad kostar det att skriva Högskoleprovet?",
    a: "Anmälningsavgiften ligger kring 550 kronor (kontrollera aktuell avgift på studera.nu). HP Kampen kostar däremot ingenting — vi finansieras av grundaren.",
  },
  {
    q: "Vad är skillnaden mellan verbal och kvantitativ del?",
    a: "Verbal del = ORD, MEK, LÄS och ELF (totalt 80 uppgifter). Kvantitativ del = XYZ, KVA, NOG och DTK (totalt 80 uppgifter). De viktas lika i normeringen, så båda halvorna är lika viktiga för slutbetyget.",
  },
  {
    q: "Hjälper HP Kampen verkligen mot att höja mitt resultat?",
    a: "Aktivt övande på riktiga HP-frågor är det enskilt mest effektiva sättet att höja resultatet — det styrks av studier på testpreparation. HP Kampen ger dig samma typ av frågor som på provet, daglig träning under tidspress och konkret feedback. Hur mycket du höjer beror på hur mycket du tränar och din utgångsnivå.",
  },
  {
    q: "Finns det ett snabbtest för att uppskatta min HP-nivå?",
    a: "Ja — skriv ett helt provpass under Gamla prov så får du både råpoäng och en ungefärlig normerad HP-poäng direkt efter inlämning. Det är den mest exakta uppskattningen utan att faktiskt skriva provet.",
  },
  {
    q: "Vad är coachning på HP Kampen?",
    a: "Vi erbjuder gratis 30-minuters videocoachning från en spelare som själv fått 1,9 eller högre på HP. Coachen går igenom dina svagheter och ger en personlig plan. Boka via knappen 'Gratis coachning' i hemvyn.",
  },
];

export const Route = createFileRoute("/faq")({
  component: FaqPage,
  head: () => ({
    meta: pageMeta({
      path: "/faq",
      title: "Vanliga frågor om HP Kampen · FAQ",
      description:
        "Svar på vanliga frågor: är HP Kampen gratis, hur fungerar ELO, är frågorna riktiga, behöver jag konto.",
      ogTitle: "Vanliga frågor · HP Kampen",
      ogDescription:
        "Allt du undrar om HP Kampen: gratis, ELO-ranking, riktiga HP-frågor, gästläge.",
    }),
    links: pageLinks("/faq"),
    // Page-level FAQPage JSON-LD (per-page, distinct from the root one which
    // mixes site-wide and HP-info questions).
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Vanliga frågor", path: "/faq" },
      ]),
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map(({ q, a }) => ({
            "@type": "Question",
            name: q,
            acceptedAnswer: { "@type": "Answer", text: a },
          })),
        }),
      },
    ],
  }),
});

function FaqPage() {
  return (
    <div className="min-h-screen">
      <PageHero
        eyebrow="FAQ"
        title="Vanliga frågor"
        subtitle="Korta svar på det vi oftast får. Hittar du inte det du söker?"
        align="center"
        variant="content"
      />
      <article
        className="mx-auto max-w-3xl px-4 pb-24 text-[15px] leading-[1.75] sm:px-6"
        style={{ color: "var(--text-secondary)" }}
      >
        <div className="mb-8 text-center">
          <Link
            to="/kontakt"
            className="text-sm font-medium underline-offset-4 hover:underline"
            style={{ color: "var(--amber)" }}
          >
            Hör av dig →
          </Link>
        </div>

        <div className="space-y-3">
          {FAQ.map(({ q, a }, i) => (
            <details
              key={q}
              // Open de första 2 så sidan inte ser tom ut — resten kan användaren
              // expandera vid behov.
              open={i < 2}
              className="group rounded-2xl border p-5 transition-colors hover:border-[#f2a65a]/30"
              style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
            >
              <summary
                className="flex cursor-pointer items-start justify-between gap-4 text-base font-semibold marker:hidden [&::-webkit-details-marker]:hidden"
                style={{ color: "var(--cream)" }}
              >
                <span>{q}</span>
                <span
                  aria-hidden="true"
                  className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs transition-transform group-open:rotate-45"
                  style={{ borderColor: "var(--line)", color: "var(--text-tertiary)" }}
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-[15px]" style={{ color: "var(--text-secondary)" }}>
                {a}
              </p>
            </details>
          ))}
        </div>
      </article>
    </div>
  );
}
