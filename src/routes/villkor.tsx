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
          drivs av{" "}
          <em>{/* TODO: bolagsnamn */}[Bolagsnamn]</em> (org.nr{" "}
          <em>[XXXXXX-XXXX]</em>).
        </p>

        <h2
          className="mt-8 text-xl font-semibold"
          style={{ color: "var(--cream)" }}
        >
          Användning
        </h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>HP Kampen är gratis att använda.</li>
          <li>Du måste vara minst 13 år för att skapa konto.</li>
          <li>Ett konto per person. Inga botar eller automatiserad användning.</li>
          <li>
            Innehållet (frågor, ord, övningsmaterial) får inte skrapas,
            kopieras eller återanvändas kommersiellt.
          </li>
        </ul>

        <h2
          className="mt-8 text-xl font-semibold"
          style={{ color: "var(--cream)" }}
        >
          Kontosäkerhet
        </h2>
        <p>
          Du ansvarar för att hålla ditt lösenord säkert. Misstänker du
          obehörig åtkomst, kontakta oss omedelbart.
        </p>

        <h2
          className="mt-8 text-xl font-semibold"
          style={{ color: "var(--cream)" }}
        >
          Innehåll och ansvar
        </h2>
        <p>
          Frågor på HP Kampen baseras på publicerade högskoleprov. Vi
          eftersträvar korrekthet men kan inte garantera att alla svar är
          felfria. Hittar du fel: rapportera via bug-knappen.
        </p>

        <h2
          className="mt-8 text-xl font-semibold"
          style={{ color: "var(--cream)" }}
        >
          Avstängning
        </h2>
        <p>
          Vi kan stänga av konton som bryter mot dessa villkor (fusk,
          chikan, missbruk av tjänsten).
        </p>

        <h2
          className="mt-8 text-xl font-semibold"
          style={{ color: "var(--cream)" }}
        >
          Ändringar
        </h2>
        <p>
          Vi kan uppdatera villkoren. Vid större ändringar meddelar vi via
          e-post eller på sajten.
        </p>

        <p className="mt-10 text-sm" style={{ color: "var(--text-tertiary)" }}>
          {/* TODO: Lägg till tvistlösning, tillämplig lag (svensk rätt),
              upphovsrätt till material samt licensiering av HP-frågor från
              UHR — be jurist granska före publicering. */}
        </p>
      </section>
    </article>
  );
}
