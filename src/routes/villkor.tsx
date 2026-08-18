import { createFileRoute } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript } from "@/lib/page-meta";
import { PageHero } from "@/components/layout/PageHero";

export const Route = createFileRoute("/villkor")({
  component: VillkorPage,
  head: () => ({
    meta: pageMeta({
      path: "/villkor",
      title: "Användarvillkor · Tvåkommanollan",
      description:
        "Användarvillkoren för Tvåkommanollan. Vad du får göra, hur vi hanterar konton, och villkoren för köp av coachning med 14 dagars ångerrätt.",
      ogTitle: "Användarvillkor · Tvåkommanollan",
      ogDescription: "Användarvillkoren för Tvåkommanollan.",
    }),
    links: pageLinks("/villkor"),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Användarvillkor", path: "/villkor" },
      ]),
    ],
  }),
});

function VillkorPage() {
  return (
    <div className="min-h-screen">
      <PageHero
        eyebrow="Juridik"
        title="Användarvillkor"
        subtitle="Senast uppdaterad: 2026-08-18"
        variant="compact"
      />
      <article
        className="mx-auto max-w-3xl px-4 pb-24 text-[15px] leading-[1.75] sm:px-6"
        style={{ color: "var(--text-secondary)" }}
      >
        <section className="space-y-6">
          <p>
            Genom att använda Tvåkommanollan godkänner du dessa villkor. Tjänsten drivs av{" "}
            <strong style={{ color: "var(--cream)" }}>Niklas Pellkvist</strong> som privatperson.
            All träning på sajten är gratis. Det enda som kostar är personlig coachning, som du
            köper frivilligt och som har egna villkor längre ned. Kontakt:{" "}
            <a
              href="mailto:info@tvakommanollan.se"
              className="underline"
              style={{ color: "var(--amber)" }}
            >
              info@tvakommanollan.se
            </a>
            .
          </p>

          <h2 className="mt-8 text-xl font-semibold" style={{ color: "var(--cream)" }}>
            Användning
          </h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              All träning på Tvåkommanollan är gratis att använda. Coachning är en betaltjänst med
              egna villkor, se avsnittet om köp nedan.
            </li>
            <li>Du måste vara minst 13 år för att skapa konto.</li>
            <li>
              Ett konto per person. Inga botar eller automatiserad användning (utöver de bottar vi
              själva tillhandahåller för träning).
            </li>
            <li>
              Innehållet (frågor, ord, övningsmaterial, guider) får inte skrapas, kopieras eller
              återanvändas kommersiellt utan skriftligt tillstånd.
            </li>
            <li>
              Du får inte använda tjänsten för att trakassera andra användare, sprida olämpligt
              innehåll eller på annat sätt missbruka plattformen.
            </li>
          </ul>

          <h2 className="mt-8 text-xl font-semibold" style={{ color: "var(--cream)" }}>
            Kontosäkerhet
          </h2>
          <p>
            Du ansvarar för att hålla ditt lösenord säkert och för aktivitet som sker via ditt
            konto. Misstänker du obehörig åtkomst, kontakta oss omedelbart så hjälper vi dig att
            säkra kontot.
          </p>

          <h2 className="mt-8 text-xl font-semibold" style={{ color: "var(--cream)" }}>
            Innehåll, upphovsrätt och ansvar
          </h2>
          <p>
            Frågor på Tvåkommanollan baseras på publicerade högskoleprov från Universitets- och
            högskolerådet (UHR). Materialet får användas för studiesyfte men inte för kommersiell
            vidareförsäljning. Tvåkommanollan är inte officiellt godkänt eller affilierat med UHR.
            Vi eftersträvar korrekthet i frågor, facit och normering men kan inte garantera att alla
            svar är felfria. Hittar du fel, rapportera via bug-knappen så fixar vi det.
          </p>
          <p>
            Den kostnadsfria delen av tjänsten tillhandahålls "i befintligt skick" utan garantier,
            och vi ansvarar inte för indirekta skador som följer av användningen (t.ex. uteblivet
            provresultat, missade ansökningar). För coachning du har betalat för gäller i stället
            det som står under Köp av coachning, och i övrigt svensk konsumenträtt.
          </p>

          <h2 className="mt-8 text-xl font-semibold" style={{ color: "var(--cream)" }}>
            Köp av coachning
          </h2>
          <p>
            Coachning (studieupplägg) är den enda betaltjänsten på Tvåkommanollan. Avtalet ingås
            mellan dig och Niklas Pellkvist när du slutför betalningen i kassan. Du behöver inte ha
            ett konto för att köpa.
          </p>
          <h3 className="mt-6 font-semibold" style={{ color: "var(--cream)" }}>
            Vad du får
          </h3>
          <p>
            Ett studieupplägg anpassat efter din nivå och hur lång tid du har kvar till provet,
            framtaget av en coach som själv skrivit 1,95 eller högre på högskoleprovet. Vi kontaktar
            dig inom 24 timmar efter köpet, på den e-postadress eller det telefonnummer du angav i
            kassan.
          </p>
          <h3 className="mt-6 font-semibold" style={{ color: "var(--cream)" }}>
            Pris och betalning
          </h3>
          <p>
            Priset som visas i kassan är det du betalar. Inga avgifter tillkommer efteråt.
            Betalningen hanteras av Stripe, som också skickar kvittot. Kortuppgifter passerar aldrig
            våra egna servrar.
          </p>
          <h3 className="mt-6 font-semibold" style={{ color: "var(--cream)" }}>
            Ångerrätt
          </h3>
          <p>
            Du har <strong style={{ color: "var(--cream)" }}>14 dagars ångerrätt</strong> från köpet
            enligt lagen (2005:59) om distansavtal och avtal utanför affärslokaler. Du behöver inte
            ange något skäl. Meddela oss på{" "}
            <a
              href="mailto:info@tvakommanollan.se?subject=Ångerrätt%20coachning"
              className="underline"
              style={{ color: "var(--amber)" }}
            >
              info@tvakommanollan.se
            </a>{" "}
            inom fristen, så betalar vi tillbaka hela beloppet inom 14 dagar från att meddelandet
            kom fram, med samma betalsätt som du använde. Du kan också använda{" "}
            <a
              href="https://www.konsumentverket.se/for-foretag/konsumentratt-for-foretagare/blanketter-och-mallar/"
              className="underline"
              style={{ color: "var(--amber)" }}
              target="_blank"
              rel="noopener noreferrer"
            >
              Konsumentverkets standardblankett
            </a>
            .
          </p>
          <p>
            Vill du att arbetet ska börja direkt, utan att vänta ut ångerfristen, går det bra. Säg
            bara till när vi hör av oss. Ångrar du dig sedan betalar du för den del av arbetet som
            hunnit utföras, och resten betalas tillbaka. Ångerrätten upphör helt först när upplägget
            är levererat i sin helhet och du dessförinnan uttryckligen har gått med på att arbetet
            påbörjas under fristen och att ångerrätten då faller bort.
          </p>
          <h3 className="mt-6 font-semibold" style={{ color: "var(--cream)" }}>
            Om något går fel
          </h3>
          <p>
            Kan vi inte leverera det du betalat för, betalar vi tillbaka hela beloppet. Är du inte
            nöjd med upplägget, hör av dig så gör vi om det eller betalar tillbaka. Klagomål som vi
            inte kan lösa i samförstånd kan du ta vidare till ARN, se nedan.
          </p>

          <h2 className="mt-8 text-xl font-semibold" style={{ color: "var(--cream)" }}>
            Avstängning
          </h2>
          <p>
            Vi kan stänga av konton som bryter mot dessa villkor (fusk, trakasserier, missbruk av
            tjänsten, försök att kringgå säkerhetsmekanismer). Vid avstängning förlorar du tillgång
            till ditt konto och din ELO-historik.
          </p>

          <h2 className="mt-8 text-xl font-semibold" style={{ color: "var(--cream)" }}>
            Tillämplig lag och tvister
          </h2>
          <p>
            Dessa villkor regleras av svensk rätt. Tvister som inte kan lösas i samförstånd avgörs i
            svensk domstol. Som konsument har du även rätt att vända dig till{" "}
            <a
              href="https://www.arn.se"
              className="underline"
              style={{ color: "var(--amber)" }}
              target="_blank"
              rel="noopener noreferrer"
            >
              Allmänna reklamationsnämnden (ARN)
            </a>
            .
          </p>

          <h2 className="mt-8 text-xl font-semibold" style={{ color: "var(--cream)" }}>
            Ändringar
          </h2>
          <p>
            Vi kan uppdatera villkoren. Vid större ändringar meddelar vi via e-post eller en notis
            på sajten. Mindre ändringar visas genom uppdaterat datum längst upp på denna sida.
          </p>
        </section>
      </article>
    </div>
  );
}
