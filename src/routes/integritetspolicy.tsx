import { createFileRoute, Link } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript } from "@/lib/page-meta";
import { PageHero } from "@/components/layout/PageHero";
import { ConsentSettings } from "@/components/ConsentSettings";

export const Route = createFileRoute("/integritetspolicy")({
  component: IntegritetspolicyPage,
  head: () => ({
    meta: pageMeta({
      path: "/integritetspolicy",
      title: "Integritetspolicy · Tvåkommanollan",
      description:
        "Hur Tvåkommanollan samlar in, använder och skyddar dina personuppgifter enligt GDPR.",
      ogTitle: "Integritetspolicy · Tvåkommanollan",
      ogDescription: "Hur vi hanterar dina personuppgifter enligt GDPR.",
    }),
    links: pageLinks("/integritetspolicy"),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Integritetspolicy", path: "/integritetspolicy" },
      ]),
    ],
  }),
});

function IntegritetspolicyPage() {
  return (
    <div className="min-h-screen">
      <PageHero
        align="center"
        eyebrow="Juridik"
        title="Integritetspolicy"
        subtitle="Senast uppdaterad: 2026-08-17"
        variant="compact"
      />
      <article
        className="mx-auto max-w-3xl px-4 pb-24 text-[15px] leading-[1.75] sm:px-6"
        style={{ color: "var(--text-secondary)" }}
      >
        <section className="space-y-6">
          <p>
            Denna policy beskriver hur Tvåkommanollan samlar in och hanterar dina personuppgifter
            när du använder tvakommanollan.se.
          </p>

          <h2 className="mt-8 text-xl font-semibold text-center" style={{ color: "var(--cream)" }}>
            Personuppgiftsansvarig
          </h2>
          <p>
            Tvåkommanollan drivs av{" "}
            <strong style={{ color: "var(--cream)" }}>Niklas Pellkvist</strong> som privatperson.
            Träningen på sajten är gratis. Det enda som kostar är personlig coachning
            (studieupplägg), som köps frivilligt. Kontakt:{" "}
            <a
              href="mailto:info@tvakommanollan.se"
              className="underline"
              style={{ color: "var(--amber)" }}
            >
              info@tvakommanollan.se
            </a>
            .
          </p>

          <h2 className="mt-8 text-xl font-semibold text-center" style={{ color: "var(--cream)" }}>
            Vilka uppgifter samlar vi in?
          </h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong style={{ color: "var(--cream)" }}>E-postadress:</strong> vid kontoregistrering
              (för inloggning och eventuell återställning av lösenord)
            </li>
            <li>
              <strong style={{ color: "var(--cream)" }}>Användarnamn:</strong> självvalt, visas på
              topplistan och i matcher
            </li>
            <li>
              <strong style={{ color: "var(--cream)" }}>Spelhistorik:</strong> matchresultat,
              ELO-utveckling, statistik per delprov
            </li>
            <li>
              <strong style={{ color: "var(--cream)" }}>Foruminlägg:</strong> texten du skriver i
              forumet, tidpunkt och vilket konto som skrev den. Inlägg är offentliga och syns för
              alla, även utloggade och sökmotorer.
            </li>
            <li>
              <strong style={{ color: "var(--cream)" }}>Köpuppgifter:</strong> om du köper
              coachning: namn, e-postadress, telefonnummer, den tid du bokar och det du själv
              skriver i frågorna vid bokning och i kassan, samt belopp, valuta och Stripes referens
              till betalningen.{" "}
              <em>Kortuppgifter hanteras av Stripe och passerar aldrig våra servrar</em>: vi ser
              aldrig ditt kortnummer.
            </li>
            <li>
              <strong style={{ color: "var(--cream)" }}>
                Telefonnummer om du ber oss höra av oss:
              </strong>{" "}
              om du fyller i formuläret &quot;Osäker på om det är något för dig?&quot; sparar vi
              ditt mobilnummer, ditt namn om du skrev det, dina två svar och tidpunkten du skickade
              in. Att skicka in numret är ditt samtycke: texten över knappen säger vad numret
              används till. Det används <em>enbart</em> för att ringa eller sms:a dig om
              studieupplägget. Vi hör inte av oss om något annat, och numret lämnas inte vidare.
            </li>
            <li>
              <strong style={{ color: "var(--cream)" }}>Teknisk information:</strong> IP-adress och
              webbläsarversion, enbart för säkerhet och felsökning (anonymiseras efter 30 dagar)
            </li>
            <li>
              <strong style={{ color: "var(--cream)" }}>Användningsdata</strong>{" "}
              <em>(endast om du samtyckt till analys)</em>: vilka sidor du besöker, vad du klickar
              på, ungefärlig plats på landsnivå, enhets- och webbläsartyp samt inspelningar av hur
              gränssnittet används. Text du skriver i fält maskeras i inspelningarna. Vi mäter också
              hur du använder funktionerna: att en match lämnades in, att ett träningspass
              avslutades, vad du sökte efter i forumet och hur snabbt sidorna laddar. Innehållet i
              det du skriver ingår aldrig, bara att det hände.
            </li>
          </ul>

          <h2 className="mt-8 text-xl font-semibold text-center" style={{ color: "var(--cream)" }}>
            Rättslig grund och syften
          </h2>
          <p>
            Vi behandlar uppgifterna med stöd av{" "}
            <strong style={{ color: "var(--cream)" }}>avtal</strong> (för att leverera tjänsten du
            har skapat konto för, och den coachning du eventuellt köpt) och{" "}
            <strong style={{ color: "var(--cream)" }}>berättigat intresse</strong> (för säkerhet,
            missbrukshantering och produktförbättring). Ditt telefonnummer behandlas med stöd av
            ditt <strong style={{ color: "var(--cream)" }}>samtycke</strong> — som du lämnar genom
            att skicka in formuläret — och du kan när som helst be oss radera det genom att mejla
            adressen ovan. Användningsdata för analys behandlas enbart med stöd av ditt{" "}
            <strong style={{ color: "var(--cream)" }}>samtycke:</strong> inget analysskript laddas
            innan du sagt ja, och du kan ta tillbaka valet när som helst längre ned på den här
            sidan. Vi säljer aldrig dina uppgifter och delar dem inte med tredje part för
            marknadsföring.
          </p>

          <h2 className="mt-8 text-xl font-semibold text-center" style={{ color: "var(--cream)" }}>
            Tredjepartstjänster vi använder
          </h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <strong style={{ color: "var(--cream)" }}>Supabase:</strong> databas och autentisering
              (data hostas inom EU)
            </li>
            <li>
              <strong style={{ color: "var(--cream)" }}>Cloudflare:</strong> CDN, hosting och
              DDoS-skydd
            </li>
            <li>
              <strong style={{ color: "var(--cream)" }}>PostHog:</strong> analys av hur sajten
              används (EU-instans, data lagras inom EU). Laddas endast efter ditt samtycke.
            </li>
            <li>
              <strong style={{ color: "var(--cream)" }}>Calendly:</strong> tidsbokning för
              coachning. Väljer du en tid skickas ditt namn, din e-postadress och dina svar på
              bokningsfrågorna till Calendly, som skapar mötet och skickar kalenderinbjudan.
              Calendly är personuppgiftsansvarig för sin egen behandling och kan överföra uppgifter
              utanför EU/EES med stöd av EU-kommissionens standardavtalsklausuler. Läs mer i{" "}
              <a
                href="https://calendly.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
                style={{ color: "var(--amber)" }}
              >
                Calendlys integritetspolicy
              </a>
              .
            </li>
            <li>
              <strong style={{ color: "var(--cream)" }}>Stripe:</strong> betalningar för coachning.
              Själva betalningen sker på Stripes egen sida; vi tar emot namn, e-post, telefonnummer,
              belopp och betalningsstatus tillbaka, aldrig kortuppgifter. Stripe är
              personuppgiftsansvarig för sin egen behandling och kan överföra uppgifter utanför
              EU/EES med stöd av EU-kommissionens standardavtalsklausuler. Läs mer i{" "}
              <a
                href="https://stripe.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
                style={{ color: "var(--amber)" }}
              >
                Stripes integritetspolicy
              </a>
              .
            </li>
          </ul>

          <h2 className="mt-8 text-xl font-semibold text-center" style={{ color: "var(--cream)" }}>
            Hur länge sparar vi uppgifterna?
          </h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <strong style={{ color: "var(--cream)" }}>Kontodata:</strong> så länge du har ett
              aktivt konto, plus 30 dagar efter radering (för backup-rotation)
            </li>
            <li>
              <strong style={{ color: "var(--cream)" }}>Spelhistorik:</strong> anonymiseras när
              kontot raderas (statistik behålls i aggregerad form för leaderboard)
            </li>
            <li>
              <strong style={{ color: "var(--cream)" }}>IP-loggar:</strong> max 30 dagar
            </li>
            <li>
              <strong style={{ color: "var(--cream)" }}>Analysdata:</strong> sessionsinspelningar
              max 30 dagar, övrig användningsstatistik max 12 månader
            </li>
            <li>
              <strong style={{ color: "var(--cream)" }}>Köpuppgifter:</strong> sparas så länge de
              behövs för bokföring och för att kunna hantera frågor om köpet. De raderas därför inte
              automatiskt när du raderar ditt konto. Vill du veta exakt vad som finns sparat om ett
              köp, mejla oss.
            </li>
          </ul>

          <h2 className="mt-8 text-xl font-semibold text-center" style={{ color: "var(--cream)" }}>
            Forumet
          </h2>
          <p>
            Det du skriver i{" "}
            <Link to="/forum" className="underline" style={{ color: "var(--amber)" }}>
              forumet
            </Link>{" "}
            är offentligt. Inlägget visas med ditt användarnamn, aldrig med din e-postadress, och är
            läsbart för alla, inklusive sökmotorer och AI-crawlers som indexerar sajten. Räkna med
            att ett foruminlägg kan finnas kvar i sökmotorers cache även efter att det tagits bort
            här.
          </p>
          <p>
            Raderar du ditt konto avidentifieras din användarrad och inläggen står kvar utan namn,
            märkta "Borttagen användare", så att trådarna förblir läsbara för dem som svarat. Vill
            du i stället ha enskilda inlägg borttagna: mejla oss, så tar vi bort dem.
          </p>
          <p>
            Rapporterar du ett inlägg sparas vilket konto som rapporterade, skälet och din
            eventuella kommentar. Det behövs för att kunna hantera missbruk av rapportfunktionen och
            är ett krav för att vi ska kunna uppfylla vår uppsiktsplikt enligt lagen om ansvar för
            elektroniska anslagstavlor (1998:112). Reglerna, och vem som driver forumet, står på{" "}
            <Link to="/forum/regler" className="underline" style={{ color: "var(--amber)" }}>
              forumets regelsida
            </Link>
            .
          </p>

          <h2 className="mt-8 text-xl font-semibold text-center" style={{ color: "var(--cream)" }}>
            Dina rättigheter
          </h2>
          <p>
            Enligt GDPR har du rätt att begära ut, rätta, radera eller begränsa behandlingen av dina
            personuppgifter. Du har även rätt till dataportabilitet och att invända mot
            behandlingen.
          </p>
          <p>
            <strong style={{ color: "var(--cream)" }}>Radera kontot själv:</strong> gå till{" "}
            <strong style={{ color: "var(--cream)" }}>Statistik → Radera konto</strong> när du är
            inloggad. Det tar bort din inloggning, e-postadress och all personlig historik direkt;
            matchresultat behålls enbart i anonymiserad form, och har du köpt coachning sparas
            uppgifterna om det köpet enligt punkten om köpuppgifter ovan. Har du lämnat ditt
            telefonnummer i det formuläret medan du var inloggad raderas det tillsammans med kontot.
            Lämnade du numret utan att vara inloggad kan vi inte koppla det till dig automatiskt —
            mejla oss så tar vi bort det. För övriga rättigheter, kontakta oss på{" "}
            <a
              href="mailto:info@tvakommanollan.se"
              className="underline"
              style={{ color: "var(--amber)" }}
            >
              info@tvakommanollan.se
            </a>{" "}
            så hjälper vi dig. Vi svarar inom 30 dagar. Är du missnöjd med vår hantering kan du
            klaga hos{" "}
            <a
              href="https://www.imy.se"
              className="underline"
              style={{ color: "var(--amber)" }}
              target="_blank"
              rel="noopener noreferrer"
            >
              Integritetsskyddsmyndigheten (IMY)
            </a>
            .
          </p>

          <h2 className="mt-8 text-xl font-semibold text-center" style={{ color: "var(--cream)" }}>
            Cookies och analys
          </h2>
          <p>
            <strong style={{ color: "var(--cream)" }}>Nödvändig lagring:</strong> cookies och
            localStorage som behövs för inloggning, sessionshantering och dina inställningar. Den
            går inte att välja bort, eftersom tjänsten inte fungerar utan den.
          </p>
          <p>
            <strong style={{ color: "var(--cream)" }}>Analys (frivilligt):</strong> säger du ja
            laddas PostHog, som sätter en identifierare för att kunna se att flera besök hör ihop.
            Det används för att förstå vilka delar av sajten som hjälper och var folk fastnar. Säger
            du nej laddas skriptet inte alls, och ingen identifierare sätts.
          </p>
          <p>
            Vi visar <strong style={{ color: "var(--cream)" }}>inga annonser</strong> och har inga
            annonsidentifierare.
          </p>
          <p>
            Oavsett ditt val för vi enkel besöksstatistik i vår egen databas: antal visningar per
            sida och dygn. Den innehåller varken IP-adress, användare eller session och kan inte
            kopplas till dig, och därför kräver den inget samtycke.
          </p>

          <ConsentSettings />

          <h2 className="mt-8 text-xl font-semibold text-center" style={{ color: "var(--cream)" }}>
            Ändringar av denna policy
          </h2>
          <p>
            Om vi gör väsentliga ändringar i hur vi hanterar dina uppgifter meddelar vi dig via mejl
            eller en notis vid inloggning. Mindre ändringar visas genom uppdaterat datum längst upp
            på denna sida.
          </p>
        </section>
      </article>
    </div>
  );
}
