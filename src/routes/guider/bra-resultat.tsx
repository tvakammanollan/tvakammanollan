import { createFileRoute, Link } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { fitTitle } from "@/lib/seo-text";
import { RelatedGuides, guideArticleJsonLd, guideArticleMeta } from "@/lib/guider-meta";

export const Route = createFileRoute("/guider/bra-resultat")({
  component: BraResultatGuidePage,
  head: () => ({
    meta: pageMeta({
      path: "/guider/bra-resultat",
      ...guideArticleMeta("/guider/bra-resultat"),
      title: fitTitle("Hur får man bra resultat på HP?", "studieplan"),
      description:
        "Hur du planerar pluggandet, väljer vilka delprov du ska lägga tiden på och övar under provförhållanden.",
      ogTitle: "Tvåkommanollan | Bra resultat på HP",
      ogDescription:
        "Studieplan på 6–8 veckor: kartlägg dina delprov, öva dagligen och skriv gamla prov på tid.",
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
          headline: "Hur får man bra resultat på HP?",
          description:
            "Hur du planerar pluggandet, väljer vilka delprov du ska lägga tiden på och övar under provförhållanden.",
          url: "https://tvakommanollan.se/guider/bra-resultat",
        }),
      ),
      // HowTo schema — Google rich-result eligibility för studieplanen
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: "Studieplan för att lyckas på högskoleprovet",
        description: "En studieplan på 6–8 veckor, från kartläggning till provdagen.",
        totalTime: "P8W",
        step: [
          {
            "@type": "HowToStep",
            position: 1,
            name: "Kartläggning",
            text: "Skriv ett gammalt prov och räkna ut din råpoäng per delprov.",
          },
          {
            "@type": "HowToStep",
            position: 2,
            name: "Vecka 1–2: fokusera på svagaste delprov",
            text: "Lägg tiden på de delprov där du har flest fel.",
          },
          {
            "@type": "HowToStep",
            position: 3,
            name: "Vecka 3–5: daglig träning",
            text: "Träna ORD, MEK, LÄS/ELF eller XYZ, KVA, NOG, DTK varje dag. Korta pass varje dag ger mer än långa pass någon gång i veckan.",
          },
          {
            "@type": "HowToStep",
            position: 4,
            name: "Vecka 6–7: gamla prov under tidspress",
            text: "Skriv hela provpass på tid, 55 minuter per pass.",
          },
          {
            "@type": "HowToStep",
            position: 5,
            name: "Vecka 8: repetition",
            text: "Korta pass, sömn och en genomgång av provets regler och tider.",
          },
          {
            "@type": "HowToStep",
            position: 6,
            name: "Provdagen",
            text: "Ät frukost och var på plats i god tid. Börja varje pass med det delprov du är säkrast på, och lämna ingen uppgift tom.",
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
        <h1
          className="mt-2 text-3xl font-bold sm:text-4xl"
          style={{ color: "var(--cream)", fontFamily: "var(--font-display)" }}
        >
          Hur får man bra resultat på HP?
        </h1>
      </header>

      <p className="mb-8">
        Ta reda på vilka delprov du är svagast i, lägg tiden där du har mest att hämta och skriv
        hela provpass på tid regelbundet.
      </p>

      <section className="space-y-6">
        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Börja med en kartläggning
        </h2>
        <p>
          Skriv ett helt gammalt prov på tid, i tystnad och utan hjälpmedel, och räkna sedan ut din
          råpoäng per delprov. Då vet du var du börjar. Titta efter:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Vilket delprov ger dig flest fel?</li>
          <li>Är det tidsbristen eller kunskapsluckor som orsakar felen?</li>
          <li>Är du starkare verbalt eller kvantitativt?</li>
        </ul>
        <p>Svaren avgör var du ska lägga tiden.</p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Välj delprov
        </h2>
        <p>
          Det är lättast att höja sig i mitten av skalan. Ju närmare 2,0 du kommer, desto färre fel
          får du göra, så varje tiondel kostar mer övning.
        </p>
        <p>
          Om du är tydligt starkare verbalt eller kvantitativt: börja där. Ta så många poäng som
          möjligt i din starka del och öva den svaga tills den inte drar ned snittet mer än
          nödvändigt.
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Studieplan (6–8 veckor)
        </h2>
        <ul className="list-none space-y-3 pl-4">
          <li>
            <strong style={{ color: "var(--cream)" }}>Vecka 1–2: Kartläggning</strong>
            <br />
            Skriv ett gammalt prov, se vilka delprov som gick sämst, läs guiderna till dem och börja
            öva dem 20–30 minuter om dagen.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Vecka 3–5: Daglig övning</strong>
            <br />
            Öva varje dag på de delprov du valt. Varva övning utan klocka med matcher på tid. Sikta
            på 30–45 min per dag.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Vecka 6–7: Gamla prov på tid</strong>
            <br />
            Skriv hela gamla prov på tid. Gå igenom varje fel: var det tidsbrist, något du inte
            kunde eller slarv? Lägg tiden där felen fortfarande kommer.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Vecka 8: Repetition</strong>
            <br />
            Inga nya moment. Öva korta pass, sov ordentligt och läs igenom provets regler och tider
            så att inget överraskar dig på provdagen.
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Provdagen
        </h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--cream)" }}>Frukost och vatten:</strong> provdagen är
            lång. Ät frukost och ta med vatten och något att äta i pauserna.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Var på plats i god tid:</strong> räkna med
            marginal för resan, så slipper du börja provet stressad.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Börja med det lättaste:</strong> börja varje
            provpass med det delprov du är säkrast på, så har du de poängen klara.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Lämna inget tomt:</strong> fel svar ger inget
            avdrag, så svara på allt.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Fastna inte:</strong> är du osäker, välj det
            du tror mest på och gå vidare.
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
            : matcher och träning utan klocka
          </li>
          <li>
            <Link to="/gamla-prov" className="underline" style={{ color: "var(--amber)" }}>
              Gamla prov
            </Link>
            : skriv hela provpass med facit
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
            Skapa konto
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
