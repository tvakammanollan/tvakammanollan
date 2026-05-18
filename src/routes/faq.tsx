import { createFileRoute, Link } from "@tanstack/react-router";
import { pageMeta, pageLinks } from "@/lib/page-meta";

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
    a: "Högskoleprovet ges normalt två gånger per år: en gång i mars/april och en gång i oktober. Aktuella datum hittar du på antagning.se. Anmälan öppnar ungefär tre månader innan.",
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
    <article
      className="mx-auto max-w-3xl px-4 py-12 text-[15px] leading-[1.75]"
      style={{ color: "var(--text-secondary)" }}
    >
      <header className="mb-10">
        <p
          className="text-xs font-semibold uppercase tracking-[0.25em]"
          style={{ color: "#a5b4fc" }}
        >
          FAQ
        </p>
        <h1
          className="mt-2 text-3xl font-bold sm:text-4xl"
          style={{ color: "var(--cream)", fontFamily: "var(--font-display)" }}
        >
          Vanliga frågor
        </h1>
        <p className="mt-3 max-w-prose">
          Korta svar på de vanligaste frågorna om HP Kampen. Hittar du inte
          det du söker?{" "}
          <Link
            to="/kontakt"
            className="underline"
            style={{ color: "var(--amber)" }}
          >
            Hör av dig
          </Link>
          .
        </p>
      </header>

      <dl className="space-y-6">
        {FAQ.map(({ q, a }) => (
          <div
            key={q}
            className="rounded-2xl border p-5"
            style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
          >
            <dt
              className="text-base font-semibold"
              style={{ color: "var(--cream)" }}
            >
              {q}
            </dt>
            <dd className="mt-2 text-[15px]" style={{ color: "var(--text-secondary)" }}>
              {a}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
