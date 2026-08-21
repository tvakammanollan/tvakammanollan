import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { fitTitle } from "@/lib/seo-text";
import { RelatedGuides, guideArticleJsonLd } from "@/lib/guider-meta";

export const Route = createFileRoute("/guider/bra-resultat")({
  component: BraResultatGuidePage,
  head: () => ({
    meta: pageMeta({
      path: "/guider/bra-resultat",
      title: fitTitle("Hur får man bra resultat på HP? · Komplett guide", "· Tvåkommanollan"),
      description:
        "Komplett guide: hur du planerar studier, väljer rätt fokusområden och maximerar ditt HP-resultat. Från 1.0 till 2.0 med rätt strategi.",
      ogTitle: "Tvåkommanollan | Bra resultat på HP",
      ogDescription:
        "Studieplan 6–8 veckor, kartläggning av delprov och mentala tips för provdagen. Från 1.0 till 2.0.",
    }),
    links: pageLinks("/guider/bra-resultat"),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Guider", path: "/guider" },
        { name: "Hur får man bra HP-resultat?", path: "/guider/bra-resultat" },
      ]),
      jsonLdScript(
        guideArticleJsonLd({
          headline: "Hur får man bra resultat på HP? · Komplett guide",
          description:
            "Komplett guide: hur du planerar studier, väljer rätt fokusområden och maximerar ditt HP-resultat.",
          url: "https://tvakommanollan.se/guider/bra-resultat",
        }),
      ),
      // HowTo schema — Google rich-result eligibility för studieplanen
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: "Studieplan för att lyckas på Högskoleprovet",
        description:
          "En komplett 6–8 veckors studieplan för att maximera HP-resultatet, från kartläggning till provdagen.",
        totalTime: "P8W",
        step: [
          {
            "@type": "HowToStep",
            position: 1,
            name: "Kartläggning",
            text: "Gör ett gammalt prov och räkna ut din startnivå per delprov. Identifiera dina svagaste delprov.",
          },
          {
            "@type": "HowToStep",
            position: 2,
            name: "Vecka 1–2: fokusera på svagaste delprov",
            text: "Lägg träningstiden där förbättringsmarginalen är störst. Verbal eller matte: välj din starkare sida och gör den perfekt.",
          },
          {
            "@type": "HowToStep",
            position: 3,
            name: "Vecka 3–5: daglig träning",
            text: "Träna ORD, MEK, LÄS/ELF eller XYZ, KVA, NOG, DTK dagligen via Tvåkommanollan. Kort intensiv träning är mer effektivt än långa pass.",
          },
          {
            "@type": "HowToStep",
            position: 4,
            name: "Vecka 6–7: gamla prov under tidspress",
            text: "Skriv hela provpass under riktiga tidsgränser för att vänja dig vid pressen.",
          },
          {
            "@type": "HowToStep",
            position: 5,
            name: "Vecka 8: vila och mental förberedelse",
            text: "Lätt repetition, vila och mental förberedelse inför provdagen.",
          },
          {
            "@type": "HowToStep",
            position: 6,
            name: "Provdagen",
            text: "Frukost och vatten. Var på plats i god tid. Börja med det lättaste delprovet i passet. Hoppa aldrig. Gissa alltid när du kör fast.",
          },
        ],
      }),
    ],
  }),
});

function BraResultatGuidePage() {
  return (
    <article
      className="mx-auto max-w-3xl px-4 py-12 text-[15px] leading-[1.75]"
      style={{ color: "var(--text-secondary)" }}
    >
      <header className="mb-10">
        <p
          className="text-xs font-semibold uppercase tracking-[0.25em]"
          style={{ color: "var(--teal)" }}
        >
          Strategi
        </p>
        <h1
          className="mt-2 text-3xl font-bold sm:text-4xl"
          style={{ color: "var(--cream)", fontFamily: "var(--font-display)" }}
        >
          Hur får man bra resultat på HP?
        </h1>
      </header>

      <p className="mb-8">
        Det finns inget hemligt recept, men det finns ett systematiskt tillvägagångssätt som
        konsekvent ger förbättringar. Nyckeln är att träna smart, inte bara hårt: identifiera dina
        svagaste delprov, lägg fokus där förbättringsmarginalen är störst och simulera
        provförhållanden regelbundet.
      </p>

      <section className="space-y-6">
        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Börja med en kartläggning
        </h2>
        <p>
          Gör ett komplett gammalt prov under riktiga förhållanden, alltså tid, tystnad och inga
          hjälpmedel, och räkna sedan ut din råpoäng per delprov. Det ger dig en ärlig bild av din
          startnivå. Identifiera:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Vilket delprov ger dig flest fel?</li>
          <li>Är det tidsbristen eller kunskapsluckor som orsakar felen?</li>
          <li>Är du starkare verbalt eller kvantitativt?</li>
        </ul>
        <p>Svaret på dessa frågor bestämmer var du ska lägga din tid.</p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Fokusera på rätt delprov
        </h2>
        <p>
          Förbättringsmarginalen är störst i mitten av betygsskalan. Att gå från 1.0 till 1.5 kräver
          ungefär lika mycket träning som att gå från 1.5 till 1.8, men att gå från 1.9 till 2.0
          kräver enorm precision och lämnar mycket lite utrymme för fel.
        </p>
        <p>
          Om du är tydligt starkare verbalt eller kvantitativt: gör den sidan nästintill perfekt.
          Maximera poängen i din styrka och täck upp svagheterna tillräckligt för att inte förlora
          mer poäng än nödvändigt.
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Studieplan (6–8 veckor)
        </h2>
        <ul className="list-none space-y-3 pl-4">
          <li>
            <strong style={{ color: "var(--cream)" }}>
              Vecka 1–2: Kartläggning och grundläggning
            </strong>
            <br />
            Gör ett gammalt prov, analysera resultaten, läs guiderna för dina svagaste delprov och
            börja träna dem dagligen i korta pass (20–30 min).
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Vecka 3–5: Fokusträning</strong>
            <br />
            Daglig träning med Tvåkommanollan på prioriterade delprov. Varva solo-träning (ostressad
            teknikövning) med live-matcher (tidspress och konkurrens). Sikta på 30–45 min per dag.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>
              Vecka 6–7: Gamla prov under riktiga förhållanden
            </strong>
            <br />
            Skriv kompletta gamla prov med äkta tidsgränser. Analysera varje fel. Var det tidsbrist,
            kunskapslucka eller slarv? Justera fokus baserat på var felen fortfarande uppstår.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>
              Vecka 8: Lätt repetition och förberedelse
            </strong>
            <br />
            Inga nya moment. Korta dagliga träningspass för att hålla formen. Vila, sömn och mental
            förberedelse. Genomgång av provets format och regler så att inget är oväntat på
            provdagen.
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Mentala tips provdagen
        </h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--cream)" }}>Frukost och vatten:</strong> blodsockret
            påverkar koncentrationen. Ät en riktig frukost och ha vatten med dig om det tillåts.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Var på plats i god tid:</strong> stressad
            ankomst sätter kroppen i alarmberedskap och sänker prestationen. Planera buffert.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Börja med det lättaste:</strong> i varje
            provpass: starta med det moment du känner dig tryggast i. Det bygger självförtroende och
            säkerställer tidiga poäng.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Gissa alltid, lämna aldrig blankt:</strong>{" "}
            ingen uppgift ska lämnas obesvarad. Inget avdrag för fel.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Lita på din förberedelse:</strong> du har
            tränat. Övertänk inte enskilda uppgifter. Gå på din första instinkt om du är osäker.
            Forskning visar att den ofta är rätt.
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Resurser
        </h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <Link to="/train" className="underline" style={{ color: "var(--amber)" }}>
              Tvåkommanollan
            </Link>
            : gratis live-matcher och solo-träning på riktiga HP-frågor
          </li>
          <li>
            <Link to="/gamla-prov" className="underline" style={{ color: "var(--amber)" }}>
              Gamla prov
            </Link>
            : skriv kompletta provpass med facit
          </li>
          <li>
            <Link to="/faq" className="underline" style={{ color: "var(--amber)" }}>
              FAQ
            </Link>
            : svar på vanliga frågor om HP, anmälan och resultat
          </li>
        </ul>

        <p className="mt-8">
          <Link
            to="/signup"
            className="inline-flex items-center gap-1.5 underline"
            style={{ color: "var(--amber)" }}
          >
            Skapa gratis konto och börja träna
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </p>
      </section>

      <RelatedGuides
        currentPath="/guider/bra-resultat"
        relatedPaths={["/guider/tidspress", "/guider/las", "/guider/xyz", "/guider/ord"]}
      />
    </article>
  );
}
