import { createFileRoute } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript } from "@/lib/page-meta";
import { PageHero } from "@/components/layout/PageHero";

export const Route = createFileRoute("/integritetspolicy")({
  component: IntegritetspolicyPage,
  head: () => ({
    meta: pageMeta({
      path: "/integritetspolicy",
      title: "Integritetspolicy · HP Kampen",
      description:
        "Hur HP Kampen samlar in, använder och skyddar dina personuppgifter enligt GDPR.",
      ogTitle: "Integritetspolicy · HP Kampen",
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
        eyebrow="Juridik"
        title="Integritetspolicy"
        subtitle="Senast uppdaterad: 2026-05-18"
        variant="compact"
      />
      <article
        className="mx-auto max-w-3xl px-4 pb-24 text-[15px] leading-[1.75] sm:px-6"
        style={{ color: "var(--text-secondary)" }}
      >
        <section className="space-y-6">
          <p>
            Denna policy beskriver hur HP Kampen samlar in och hanterar dina personuppgifter när du
            använder hpkampen.se.
          </p>

          <h2 className="mt-8 text-xl font-semibold" style={{ color: "var(--cream)" }}>
            Personuppgiftsansvarig
          </h2>
          <p>
            HP Kampen drivs av <strong style={{ color: "var(--cream)" }}>Niklas Pellkvist</strong>{" "}
            som privatperson. Sajten är gratis och har ingen kommersiell verksamhet kopplad till
            sig. Kontakt:{" "}
            <a
              href="mailto:info@hpkampen.se"
              className="underline"
              style={{ color: "var(--amber)" }}
            >
              info@hpkampen.se
            </a>
            .
          </p>

          <h2 className="mt-8 text-xl font-semibold" style={{ color: "var(--cream)" }}>
            Vilka uppgifter samlar vi in?
          </h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong style={{ color: "var(--cream)" }}>E-postadress</strong> — vid
              kontoregistrering (för inloggning och eventuell återställning av lösenord)
            </li>
            <li>
              <strong style={{ color: "var(--cream)" }}>Användarnamn</strong> — självvalt, visas på
              topplistan och i matcher
            </li>
            <li>
              <strong style={{ color: "var(--cream)" }}>Spelhistorik</strong> — matchresultat,
              ELO-utveckling, statistik per delprov
            </li>
            <li>
              <strong style={{ color: "var(--cream)" }}>Teknisk information</strong> — IP-adress och
              webbläsarversion, enbart för säkerhet och felsökning (anonymiseras efter 30 dagar)
            </li>
          </ul>

          <h2 className="mt-8 text-xl font-semibold" style={{ color: "var(--cream)" }}>
            Rättslig grund och syften
          </h2>
          <p>
            Vi behandlar uppgifterna med stöd av{" "}
            <strong style={{ color: "var(--cream)" }}>avtal</strong> (för att leverera tjänsten du
            har skapat konto för) och{" "}
            <strong style={{ color: "var(--cream)" }}>berättigat intresse</strong> (för säkerhet,
            missbrukshantering och produktförbättring). Vi säljer aldrig dina uppgifter och delar
            dem inte med tredje part för marknadsföring.
          </p>

          <h2 className="mt-8 text-xl font-semibold" style={{ color: "var(--cream)" }}>
            Tredjepartstjänster vi använder
          </h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <strong style={{ color: "var(--cream)" }}>Supabase</strong> — databas och
              autentisering (data hostas inom EU)
            </li>
            <li>
              <strong style={{ color: "var(--cream)" }}>Cloudflare</strong> — CDN, hosting och
              DDoS-skydd
            </li>
          </ul>

          <h2 className="mt-8 text-xl font-semibold" style={{ color: "var(--cream)" }}>
            Hur länge sparar vi uppgifterna?
          </h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <strong style={{ color: "var(--cream)" }}>Kontodata</strong> — så länge du har ett
              aktivt konto, plus 30 dagar efter radering (för backup-rotation)
            </li>
            <li>
              <strong style={{ color: "var(--cream)" }}>Spelhistorik</strong> — anonymiseras när
              kontot raderas (statistik behålls i aggregerad form för leaderboard)
            </li>
            <li>
              <strong style={{ color: "var(--cream)" }}>IP-loggar</strong> — max 30 dagar
            </li>
          </ul>

          <h2 className="mt-8 text-xl font-semibold" style={{ color: "var(--cream)" }}>
            Dina rättigheter
          </h2>
          <p>
            Enligt GDPR har du rätt att begära ut, rätta, radera eller begränsa behandlingen av dina
            personuppgifter. Du har även rätt till dataportabilitet och att invända mot
            behandlingen. Kontakta oss på{" "}
            <a
              href="mailto:info@hpkampen.se"
              className="underline"
              style={{ color: "var(--amber)" }}
            >
              info@hpkampen.se
            </a>{" "}
            så hjälper vi dig — vi svarar inom 30 dagar. Är du missnöjd med vår hantering kan du
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

          <h2 className="mt-8 text-xl font-semibold" style={{ color: "var(--cream)" }}>
            Cookies
          </h2>
          <p>
            Vi använder enbart funktionella cookies som behövs för inloggning och sessionshantering.
            Inga spårningscookies, inga annonsidentifierare och ingen tredje part-analys.
          </p>

          <h2 className="mt-8 text-xl font-semibold" style={{ color: "var(--cream)" }}>
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
