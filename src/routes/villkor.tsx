import { createFileRoute } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript } from "@/lib/page-meta";

export const Route = createFileRoute("/villkor")({
  component: VillkorPage,
  head: () => ({
    meta: pageMeta({
      path: "/villkor",
      title: "Användarvillkor · HP Kampen",
      description:
        "Användarvillkoren för HP Kampen. Vad du får göra, vad vi förväntar oss och hur vi hanterar konton.",
      ogTitle: "Användarvillkor · HP Kampen",
      ogDescription: "Användarvillkoren för HP Kampen.",
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
    <article
      className="mx-auto max-w-3xl px-4 py-12 text-[15px] leading-[1.75]"
      style={{ color: "var(--text-secondary)" }}
    >
      <header className="mb-8">
        <h1
          className="text-3xl font-bold sm:text-4xl"
          style={{ color: "var(--cream)", fontFamily: "var(--font-display)" }}
        >
          Användarvillkor
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-tertiary)" }}>
          Senast uppdaterad: 2026-05-18
        </p>
      </header>

      <section className="space-y-6">
        <p>
          Genom att använda HP Kampen godkänner du dessa villkor. Tjänsten
          drivs av <strong style={{ color: "var(--cream)" }}>Niklas
          Pellkvist</strong> som privatperson och är gratis utan kommersiell
          verksamhet. Kontakt:{" "}
          <a
            href="mailto:info@hpkampen.se"
            className="underline"
            style={{ color: "var(--amber)" }}
          >
            info@hpkampen.se
          </a>
          .
        </p>

        <h2
          className="mt-8 text-xl font-semibold"
          style={{ color: "var(--cream)" }}
        >
          Användning
        </h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>HP Kampen är gratis att använda.</li>
          <li>Du måste vara minst 13 år för att skapa konto.</li>
          <li>
            Ett konto per person. Inga botar eller automatiserad användning
            (utöver de bottar vi själva tillhandahåller för träning).
          </li>
          <li>
            Innehållet (frågor, ord, övningsmaterial, guider) får inte
            skrapas, kopieras eller återanvändas kommersiellt utan
            skriftligt tillstånd.
          </li>
          <li>
            Du får inte använda tjänsten för att trakassera andra användare,
            sprida olämpligt innehåll eller på annat sätt missbruka
            plattformen.
          </li>
        </ul>

        <h2
          className="mt-8 text-xl font-semibold"
          style={{ color: "var(--cream)" }}
        >
          Kontosäkerhet
        </h2>
        <p>
          Du ansvarar för att hålla ditt lösenord säkert och för aktivitet
          som sker via ditt konto. Misstänker du obehörig åtkomst, kontakta
          oss omedelbart så hjälper vi dig att säkra kontot.
        </p>

        <h2
          className="mt-8 text-xl font-semibold"
          style={{ color: "var(--cream)" }}
        >
          Innehåll, upphovsrätt och ansvar
        </h2>
        <p>
          Frågor på HP Kampen baseras på publicerade högskoleprov från
          Universitets- och högskolerådet (UHR). Materialet får användas
          för studiesyfte men inte för kommersiell vidareförsäljning. HP
          Kampen är inte officiellt godkänt eller affilierat med UHR. Vi
          eftersträvar korrekthet i frågor, facit och normering men kan
          inte garantera att alla svar är felfria — hittar du fel,
          rapportera via bug-knappen så fixar vi det.
        </p>
        <p>
          Tjänsten tillhandahålls "i befintligt skick" utan garantier.
          Som privat ideellt projekt utan kommersiell verksamhet ansvarar
          vi inte för indirekta skador som följer av användningen
          (t.ex. uteblivet provresultat, missade ansökningar).
        </p>

        <h2
          className="mt-8 text-xl font-semibold"
          style={{ color: "var(--cream)" }}
        >
          Avstängning
        </h2>
        <p>
          Vi kan stänga av konton som bryter mot dessa villkor (fusk,
          trakasserier, missbruk av tjänsten, försök att kringgå
          säkerhetsmekanismer). Vid avstängning förlorar du tillgång till
          ditt konto och din ELO-historik.
        </p>

        <h2
          className="mt-8 text-xl font-semibold"
          style={{ color: "var(--cream)" }}
        >
          Tillämplig lag och tvister
        </h2>
        <p>
          Dessa villkor regleras av svensk rätt. Tvister som inte kan lösas
          i samförstånd avgörs i svensk domstol. Som konsument har du även
          rätt att vända dig till{" "}
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

        <h2
          className="mt-8 text-xl font-semibold"
          style={{ color: "var(--cream)" }}
        >
          Ändringar
        </h2>
        <p>
          Vi kan uppdatera villkoren. Vid större ändringar meddelar vi via
          e-post eller en notis på sajten. Mindre ändringar visas genom
          uppdaterat datum längst upp på denna sida.
        </p>
      </section>
    </article>
  );
}
