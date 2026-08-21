import { createFileRoute, Link } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { PageHero } from "@/components/layout/PageHero";
import { APP_VERSION_LABEL } from "@/lib/app-version";
import { PrimaryCTA } from "@/components/layout/CTAButtons";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/om")({
  component: OmPage,
  head: () => ({
    meta: pageMeta({
      path: "/om",
      title: "Om oss · varför sajten finns",
      description:
        "Sveriges enda gratis ELO-rankade plattform för högskoleprovet. Läs om grundaren Niklas (1,95 på HP) och varför all träning är gratis.",
      ogTitle: "Om Tvåkommanollan",
      ogDescription: "Sveriges enda gratis ELO-rankade högskoleprovsplattform. Varför vi finns.",
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
          "Om Tvåkommanollan: Sveriges enda gratis ELO-rankade högskoleprovsplattform. Grundad av Niklas som fick 1,95 på Högskoleprovet.",
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
        eyebrow="Om oss"
        title="Vi gör HP"
        cycleWords={["enklare.", "roligare.", "gratis.", "modernt."]}
        subtitle="Tvåkommanollan är Sveriges enda plattform där du tävlar mot vänner i realtid med riktiga frågor från Högskoleprovet. Helt utan kostnad."
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
            Högskoleprovet. Innan jag tog provet använde jag allt jag kunde komma över: gamla prov,
            ordlistor, YouTube-genomgångar och dyra kursplattformar. Det fungerade, men det var
            spretigt, dyrt och oftast tråkigt. Det fanns ingenting som gjorde att jag faktiskt ville
            fortsätta plugga en kväll till.
          </p>
          <p>
            Tvåkommanollan är vad jag önskat fanns när jag pluggade: ett ställe där du kan träna
            riktiga HP-frågor under riktig tidspress, mot någon på din nivå, och se ditt resultat
            klättra över veckorna. Konkurrensen gör att du orkar längre. ELO-systemet ger en ärlig
            bild av var du står. Och allt, varje delprov, varje gammalt prov och varje funktion, är
            gratis. Alltid.
          </p>

          <h2 className="mt-8 text-xl font-semibold text-center" style={{ color: "var(--cream)" }}>
            Varför gratis?
          </h2>
          <p>
            Att plugga inför Högskoleprovet borde inte kosta tusenlappar. De officiella materialen
            är gratis men spridda; privata kursplattformar tar 2 000–10 000 kr för paket som i
            grunden bygger på samma frågor som finns på{" "}
            <a
              className="underline"
              style={{ color: "var(--amber)" }}
              href="https://www.studera.nu"
              target="_blank"
              rel="noopener noreferrer"
            >
              studera.nu
            </a>
            . Tvåkommanollan finansieras av grundaren. Det finns inga annonser och ingen betalspärr.
            Allt pluggmaterial är gratis. Det enda som kostar pengar är personlig coachning, som är
            helt frivillig. Du betalar aldrig med din uppmärksamhet.
          </p>

          <h2 className="mt-8 text-xl font-semibold text-center" style={{ color: "var(--cream)" }}>
            Vad vi tror på
          </h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong style={{ color: "var(--cream)" }}>Riktiga frågor.</strong> Hela ordbanken
              bygger på publicerade högskoleprov från 1990-talet och framåt. Inga uppdiktade
              exempel.
            </li>
            <li>
              <strong style={{ color: "var(--cream)" }}>Konkurrens motiverar.</strong> Det är
              roligare att plugga mot någon. Och du orkar längre.
            </li>
            <li>
              <strong style={{ color: "var(--cream)" }}>ELO är ärligt.</strong> Du ser exakt var du
              står, inte vad en kursplattform vill att du ska tro att du är värd.
            </li>
            <li>
              <strong style={{ color: "var(--cream)" }}>Gratis betyder gratis.</strong> Inga
              annonser, ingen betalspärr, inget premium-läge. Personlig coachning är det enda som
              kostar, och inget i appen kräver den.
            </li>
          </ul>

          <h2 className="mt-8 text-xl font-semibold text-center" style={{ color: "var(--cream)" }}>
            Vart vi är på väg
          </h2>
          <p>
            Tvåkommanollan växer organiskt. Vi lägger till fler funktioner när de efterfrågas och
            förbättrar det som inte funkar tillräckligt bra. Närmast på listan: fler gamla prov,
            bättre statistik per delprov, och studiegrupper för dig som vill plugga med vänner
            regelbundet. Har du önskemål eller hittat en bugg?{" "}
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
          <PrimaryCTA to="/train" icon={<ArrowRight className="h-4 w-4" />}>
            Börja träna gratis
          </PrimaryCTA>
        </div>
      </article>
    </div>
  );
}
