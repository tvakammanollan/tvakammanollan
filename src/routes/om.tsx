import { createFileRoute, Link } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { PageHero } from "@/components/layout/PageHero";
import { APP_VERSION_LABEL } from "@/lib/app-version";
import { PrimaryCTA } from "@/components/layout/CTAButtons";

export const Route = createFileRoute("/om")({
  component: OmPage,
  head: () => ({
    meta: pageMeta({
      path: "/om",
      title: "Om oss: varför sajten finns",
      description:
        "Tvåkommanollan har alla högskoleprov sedan 2012 med facit, matcher med ELO-ranking och en ordlista. Om grundaren Niklas och varför det mesta är gratis.",
      ogTitle: "Om Tvåkommanollan",
      ogDescription: "Vem som driver sajten och varför det mesta är gratis.",
    }),
    links: pageLinks("/om"),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Om Tvåkommanollan", path: "/om" },
      ]),
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "AboutPage",
        name: "Om Tvåkommanollan",
        url: "https://tvakommanollan.se/om",
        description:
          "Om Tvåkommanollan: övning inför högskoleprovet med alla gamla prov sedan 2012, matcher med ELO-ranking och en ordlista. Grundad av Niklas, som fick 1,95 på högskoleprovet.",
        publisher: { "@id": "https://tvakommanollan.se/#org" },
        about: { "@id": "https://tvakommanollan.se/#niklas" },
      }),
    ],
  }),
});

function OmPage() {
  return (
    <div className="min-h-screen">
      <PageHero
        title="Om Tvåkommanollan"
        align="center"
        variant="content"
      />
      <article
        className="mx-auto max-w-3xl px-4 pb-24 text-[15px] leading-[1.75] sm:px-6"
        style={{ color: "var(--text-secondary)" }}
      >
        <section className="space-y-6">
          <h2 className="mt-4 text-xl font-semibold text-center" style={{ color: "var(--cream)" }}>
            Grundaren
          </h2>
          <p>
            Jag heter <strong style={{ color: "var(--cream)" }}>Niklas</strong> och fick 1,95 på
            högskoleprovet. När jag pluggade använde jag gamla prov, ordlistor, YouTube-genomgångar
            och betalkurser. Det fungerade, men materialet låg på många ställen och det var svårt
            att hålla i gång pluggandet kväll efter kväll.
          </p>
          <p>
            Tvåkommanollan är det jag själv hade velat ha: gamla prov som går att skriva på tid,
            matcher mot någon på ungefär samma nivå och en siffra som visar hur det går över
            veckorna. Det mesta är gratis: alla gamla prov, matcherna, normeringen och forumet.
            Ordlistan och MEK har en gratisdel och kostar sedan 149 kr per månad eller 349 kr för 6
            månader.
          </p>

          <h2 className="mt-8 text-xl font-semibold text-center" style={{ color: "var(--cream)" }}>
            Varför är det mesta gratis?
          </h2>
          <p>
            De gamla proven är UHR:s eget material och finns öppet på{" "}
            <a
              className="underline"
              style={{ color: "var(--amber)" }}
              href="https://www.studera.nu"
              target="_blank"
              rel="noopener noreferrer"
            >
              studera.nu
            </a>
            , så dem tar vi inte betalt för. Sajten har inga annonser och drivs av mig. Gamla prov,
            matcherna, normeringen och forumet är gratis, liksom de första 40 orden och 40
            MEK-uppgifterna. Hela ordlistan och alla MEK-uppgifter kostar 149 kr per månad eller 349 kr
            för 6 månader.{" "}
            <Link to="/pris" className="underline" style={{ color: "var(--amber)" }}>
              Mer om priset
            </Link>
            .
          </p>

          <h2 className="mt-8 text-xl font-semibold text-center" style={{ color: "var(--cream)" }}>
            Hur sajten är tänkt
          </h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong style={{ color: "var(--cream)" }}>Uppgifter ur gamla prov.</strong>{" "}
              Provarkivet är UHR:s egna prov, och ordlistan bygger till största delen på
              publicerade högskoleprov. Uppgifter vi skrivit själva är märkta.
            </li>
            <li>
              <strong style={{ color: "var(--cream)" }}>Matcher.</strong> Det är lättare att
              fortsätta plugga när man har någon att möta.
            </li>
            <li>
              <strong style={{ color: "var(--cream)" }}>ELO.</strong> Siffran räknas om efter varje
              match och visar hur du ligger till mot andra som övar.
            </li>
            <li>
              <strong style={{ color: "var(--cream)" }}>Gratis utan villkor.</strong> Det som är
              gratis har inga annonser och kräver inget kort. Det som kostar står på prissidan.
            </li>
          </ul>

          <h2 className="mt-8 text-xl font-semibold text-center" style={{ color: "var(--cream)" }}>
            Önskemål och buggar
          </h2>
          <p>
            Saknar du något eller har du hittat en bugg?{" "}
            <Link to="/kontakt" className="underline" style={{ color: "var(--amber)" }}>
              Hör av dig
            </Link>
            .
          </p>

          <h2 className="mt-8 text-xl font-semibold text-center" style={{ color: "var(--cream)" }}>
            Resurser
          </h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <Link to="/guider" className="underline" style={{ color: "var(--amber)" }}>
                Guider till alla 8 delprov
              </Link>
              : strategi, tidsdisposition och tips per delprov
            </li>
            <li>
              <Link to="/gamla-prov" className="underline" style={{ color: "var(--amber)" }}>
                Gamla prov 2012–2026
              </Link>
              : alla 30 provtillfällen, 120 provpass och 4 800 uppgifter. Skriv hela provpass med
              facit och normering
            </li>
            <li>
              <Link to="/faq" className="underline" style={{ color: "var(--amber)" }}>
                Vanliga frågor
              </Link>
              : svar på det vi får mest mejl om
            </li>
          </ul>

          <h2 className="mt-8 text-xl font-semibold text-center" style={{ color: "var(--cream)" }}>
            Kontakt
          </h2>
          <p>
            E-post:{" "}
            <a
              href="mailto:info@tvakommanollan.se"
              className="underline"
              style={{ color: "var(--amber)" }}
            >
              info@tvakommanollan.se
            </a>
            . Har du hittat en bugg eller har ett önskemål? Använd gärna knappen &quot;Rapportera
            bugg&quot; längst ner på sidan. Då följer det med vilken sida du var på, vilket gör att
            vi kan börja leta direkt.
          </p>

          {/* Versionen läses ur package.json (se app-version.ts). Stod
              tidigare som en handskriven siffra, och en sådan blir gammal
              utan att någon märker det. */}
          <p className="pt-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
            Tvåkommanollan {APP_VERSION_LABEL}
          </p>
        </section>

        <div className="mt-16 flex justify-center">
          <PrimaryCTA to="/train">
            Börja träna gratis
          </PrimaryCTA>
        </div>
      </article>
    </div>
  );
}
