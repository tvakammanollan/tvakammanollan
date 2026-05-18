import { createFileRoute } from "@tanstack/react-router";
import { pageMeta, pageLinks } from "@/lib/page-meta";

export const Route = createFileRoute("/om")({
  component: OmPage,
  head: () => ({
    meta: pageMeta({
      path: "/om",
      title: "Om HP Kampen · varför sajten finns",
      description:
        "HP Kampen är Sveriges enda gratis ELO-rankade högskoleprovsplattform. Läs om grundaren, varför sajten är gratis och vart vi är på väg.",
      ogTitle: "Om HP Kampen",
      ogDescription:
        "Sveriges enda gratis ELO-rankade högskoleprovsplattform. Varför vi finns.",
    }),
    links: pageLinks("/om"),
  }),
});

function OmPage() {
  return (
    <article
      className="mx-auto max-w-3xl px-4 py-12 text-[15px] leading-[1.75]"
      style={{ color: "var(--text-secondary)" }}
    >
      <header className="mb-10">
        <p
          className="text-xs uppercase tracking-[0.25em]"
          style={{ color: "#a5b4fc" }}
        >
          Om oss
        </p>
        <h1
          className="mt-2 text-3xl font-bold sm:text-5xl"
          style={{ color: "var(--cream)", fontFamily: "var(--font-display)" }}
        >
          Bättre HP-träning ska vara gratis.
        </h1>
      </header>

      <section className="space-y-6">
        <h2
          className="mt-4 text-xl font-semibold"
          style={{ color: "var(--cream)" }}
        >
          Grundaren
        </h2>
        <p>
          {/* TODO: Niklas, fyll i din historia: bakgrund, första HP-resultat,
              varför du byggde sajten. Lägg gärna in ett foto i public/founder.jpg. */}
          <em>
            [Niklas berättar i 4–6 meningar varför HP Kampen finns: vilket
            problem den löser och vad han själv saknade när han pluggade.]
          </em>
        </p>

        <h2
          className="mt-8 text-xl font-semibold"
          style={{ color: "var(--cream)" }}
        >
          Varför gratis?
        </h2>
        <p>
          Att plugga inför Högskoleprovet borde inte kosta tusenlappar.
          Officiella material är gratis men spridda. Privata kursplattformar
          är dyra och fokuserar mer på sina paket än på din inlärning. HP
          Kampen är finansierad av grundaren och utan annonser.
        </p>

        <h2
          className="mt-8 text-xl font-semibold"
          style={{ color: "var(--cream)" }}
        >
          Vad vi tror på
        </h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>Riktiga frågor från riktiga prov. Inga uppdiktade exempel.</li>
          <li>Konkurrens gör att man tränar längre.</li>
          <li>ELO-ranking ger en ärlig spegelbild av din nivå.</li>
          <li>
            Gratis betyder gratis. Inga premium-paket, inga in-app-köp,
            inga annonser.
          </li>
        </ul>

        <h2
          className="mt-8 text-xl font-semibold"
          style={{ color: "var(--cream)" }}
        >
          Kontakt
        </h2>
        <p>
          E-post:{" "}
          <a
            href="mailto:hej@hpkampen.se"
            className="underline"
            style={{ color: "var(--amber)" }}
          >
            hej@hpkampen.se
          </a>
        </p>

        <p className="mt-10 text-sm" style={{ color: "var(--text-tertiary)" }}>
          {/* TODO: Lägg till pressomnämnanden, eventuellt team, sociala
              medier-länkar och press kit när det finns. */}
        </p>
      </section>
    </article>
  );
}
