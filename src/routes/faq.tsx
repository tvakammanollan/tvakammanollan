import { createFileRoute, Link } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript } from "@/lib/page-meta";
import { PageHero } from "@/components/layout/PageHero";
import { HP_FEE_SEK, hpDatesAnswer } from "@/lib/hp-dates";

interface FaqItem {
  q: string;
  a: string;
}

const FAQ: FaqItem[] = [
  {
    q: "Är Tvåkommanollan gratis?",
    a: "Det mesta. Alla gamla prov med facit, matcherna, normeringen, poängräknaren och forumet är gratis, liksom de första 40 orden och 40 MEK-uppgifterna i träningsläget. Hela ordlistan och alla MEK-uppgifter kostar 149 kr per månad, som du kan säga upp när som helst, eller 349 kr för 6 månader som engångsköp. Sajten har inga annonser.",
  },
  {
    q: "Hur fungerar ELO-systemet?",
    a: "ELO är ett rankingsystem från schack. Alla börjar på 1 000. Slår du någon med högre ELO får du fler poäng, och förlorar du mot någon med lägre tappar du fler. Nivåerna är Brons (under 1 000), Silver (1 000–1 199), Guld (1 200–1 399), Platina (1 400–1 599) och Diamant (1 600 och uppåt).",
  },
  {
    q: "Kommer uppgifterna från gamla högskoleprov?",
    a: "Ja. Under Gamla prov finns alla 30 prov från 2012 till 2026, och matcherna och träningen använder uppgifter därifrån. Ordlistan bygger till största delen på publicerade högskoleprov. MEK-uppgifter som vi skrivit själva är märkta som egna.",
  },
  {
    q: "Kan jag spela utan konto?",
    a: "Ja. Du kan spela en match som gäst utan att registrera dig. Vill du behålla din ELO och synas på topplistan behöver du skapa ett konto.",
  },
  {
    q: "Hur spelar jag mot en vän?",
    a: "Gå till Vänner och bjud in någon via användarnamn, eller dela länken till ett privat rum.",
  },
  {
    q: "Hur många ord finns i ordlistan?",
    a: "Över 10 000. De flesta kommer ur tidigare högskoleprov, resten är ord på samma nivå.",
  },
  {
    q: "Vilka delprov kan jag träna?",
    a: "Alla 8 delprov: ORD (ordkunskap), MEK (meningskomplettering), LÄS (svensk läsförståelse), ELF (engelsk läsförståelse), XYZ (matematisk problemlösning), KVA (kvantitativa jämförelser), NOG (kvantitativa resonemang) och DTK (diagram, tabeller och kartor).",
  },
  {
    q: "Hur lång är en match?",
    a: "8 uppgifter på 5 minuter, verbalt eller kvantitativt. Efteråt ser du din nya ELO och vilka uppgifter du hade rätt på.",
  },
  {
    q: "Hur fungerar Gamla prov?",
    a: "Du väljer ett provpass ur ett prov från 2012–2026 och skriver dess 40 uppgifter, antingen på tid (provläge) eller utan klocka (övningsläge). När du lämnat in får du facit. När båda passen i en provdel är skrivna får du också en normerad poäng för delen.",
  },
  {
    q: "När är nästa högskoleprov?",
    a: hpDatesAnswer(),
  },
  {
    q: "Vad är ett bra resultat på högskoleprovet?",
    a: "Medelvärdet ligger kring 0,9. Till populära utbildningar som läkare, jurist och civilingenjör i storstäderna brukar det krävas 1,7 eller mer. Vad som är bra beror på vad du söker, så kolla antagningsstatistiken för just den utbildningen.",
  },
  {
    q: "Hur länge gäller ett resultat?",
    a: "Resultatet gäller i 8 år. Du kan skriva provet hur många gånger du vill, och ditt bästa giltiga resultat används vid antagningen.",
  },
  {
    q: "Vad kostar det att skriva högskoleprovet?",
    a: `Provavgiften är ${HP_FEE_SEK} kronor och betalas när du anmäler dig på hogskoleprov.nu. Den betalas inte tillbaka om du uteblir. Avgiften går till UHR och har inget med Tvåkommanollan att göra.`,
  },
  {
    q: "Vad är skillnaden mellan verbal och kvantitativ del?",
    a: "Den verbala delen är ORD, MEK, LÄS och ELF, den kvantitativa XYZ, KVA, NOG och DTK. Varje del är 80 uppgifter och de väger lika i slutpoängen.",
  },
  {
    q: "Höjer man sitt resultat av att öva här?",
    a: "Det beror på hur mycket du övar och var du börjar. Sajten ger dig uppgifter av samma slag som på provet, övning på tid och facit på varje uppgift, så att du ser var du tappar poäng.",
  },
  {
    q: "Hur uppskattar jag min HP-poäng?",
    a: "Skriv båda provpassen i en provdel under Gamla prov, så får du råpoäng och en normerad poäng för den delen. Skriver du alla fyra passen får du en totalpoäng.",
  },
];

export const Route = createFileRoute("/faq")({
  component: FaqPage,
  head: () => ({
    meta: pageMeta({
      path: "/faq",
      title: "Vanliga frågor",
      description:
        "Svar på vanliga frågor om Tvåkommanollan: vad som är gratis, hur ELO fungerar, var uppgifterna kommer ifrån och om du behöver konto.",
      ogTitle: "Tvåkommanollan | Vanliga frågor",
      ogDescription:
        "Vad som är gratis, hur ELO fungerar och var uppgifterna kommer ifrån.",
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
        title="Vanliga frågor"
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
            Hör av dig
          </Link>
        </div>

        <div className="space-y-3">
          {FAQ.map(({ q, a }, i) => (
            <details
              key={q}
              // Open de första 2 så sidan inte ser tom ut — resten kan användaren
              // expandera vid behov.
              open={i < 2}
              className="group rounded-2xl border p-5 transition-colors hover:border-primary/30"
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
