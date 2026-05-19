import { createFileRoute } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript } from "@/lib/page-meta";

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
    <article
      className="mx-auto max-w-3xl px-4 py-12 text-[15px] leading-[1.75]"
      style={{ color: "var(--text-secondary)" }}
    >
      <header className="mb-8">
        <h1
          className="text-3xl font-bold sm:text-4xl"
          style={{ color: "var(--cream)", fontFamily: "var(--font-display)" }}
        >
          Integritetspolicy
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-tertiary)" }}>
          Senast uppdaterad: 2026-05-18
        </p>
      </header>

      <section className="space-y-6">
        <p>
          Denna policy beskriver hur HP Kampen samlar in och hanterar dina
          personuppgifter när du använder hpkampen.se.
        </p>

        <h2
          className="mt-8 text-xl font-semibold"
          style={{ color: "var(--cream)" }}
        >
          Personuppgiftsansvarig
        </h2>
        <p>
          {/* TODO: Fyll i bolagsnamn, org.nr, adress och kontakt-mail. */}
          <em>[Bolagsnamn]</em>, org.nr <em>[XXXXXX-XXXX]</em>,{" "}
          <em>[Adress]</em>. Kontakt:{" "}
          <a
            href="mailto:hej@hpkampen.se"
            className="underline"
            style={{ color: "var(--amber)" }}
          >
            hej@hpkampen.se
          </a>
          .
        </p>

        <h2
          className="mt-8 text-xl font-semibold"
          style={{ color: "var(--cream)" }}
        >
          Vilka uppgifter samlar vi in?
        </h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>E-postadress (vid kontoregistrering)</li>
          <li>Användarnamn (självvalt)</li>
          <li>Matchresultat och ELO-historik</li>
          <li>Teknisk information (IP-adress, webbläsare) för säkerhet</li>
        </ul>

        <h2
          className="mt-8 text-xl font-semibold"
          style={{ color: "var(--cream)" }}
        >
          Varför samlar vi in uppgifterna?
        </h2>
        <p>
          Vi använder uppgifterna för att leverera tjänsten (inloggning, ELO,
          topplistor), förbättra plattformen och förhindra missbruk. Vi säljer
          aldrig dina uppgifter.
        </p>

        <h2
          className="mt-8 text-xl font-semibold"
          style={{ color: "var(--cream)" }}
        >
          Dina rättigheter
        </h2>
        <p>
          Enligt GDPR har du rätt att begära ut, rätta eller radera dina
          uppgifter. Kontakta oss på{" "}
          <a
            href="mailto:hej@hpkampen.se"
            className="underline"
            style={{ color: "var(--amber)" }}
          >
            hej@hpkampen.se
          </a>{" "}
          så hjälper vi dig.
        </p>

        <h2
          className="mt-8 text-xl font-semibold"
          style={{ color: "var(--cream)" }}
        >
          Cookies
        </h2>
        <p>
          Vi använder enbart funktionella cookies som behövs för inloggning
          och sessionshantering. Inga spårningscookies från tredje part.
        </p>

        <p className="mt-10 text-sm" style={{ color: "var(--text-tertiary)" }}>
          {/* TODO: Be ägaren komplettera med data retention-perioder,
              specifik tredjepartstjänst (Supabase, Cloudflare) och rättslig
              grund för respektive behandling. */}
        </p>
      </section>
    </article>
  );
}
