import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { fitTitle } from "@/lib/seo-text";
import { RelatedGuides, guideArticleJsonLd, guideArticleMeta } from "@/lib/guider-meta";

/* Niklas egen guide, skriven i jag-form: hur han skulle plugga från noll
   till 2,0. Texten är hans och ska låta som han; rätta stavfel och siffror,
   men skriv inte om tonen. Startsidans runda knapp leder hit. */

const PATH = "/guider/fran-noll-till-2-0";
const URL = `https://tvakommanollan.se${PATH}`;
const HEADLINE = "Komplett guide inför högskoleprovet"; // copy-ok
const DESCRIPTION =
  "Så skulle jag plugga från noll till 2,0 på högskoleprovet: vad du gör innan plugget börjar, vad du prioriterar i varje provdel och hur du håller fokus på provdagen.";

export const Route = createFileRoute("/guider/fran-noll-till-2-0")({
  component: FranNollGuidePage,
  head: () => ({
    meta: pageMeta({
      path: PATH,
      ...guideArticleMeta(PATH),
      title: fitTitle("Guide: plugga till 2,0 på högskoleprovet", "från noll"),
      description: DESCRIPTION,
      ogTitle: `Tvåkommanollan | ${HEADLINE}`,
      ogDescription:
        "Hur jag skulle plugga inför högskoleprovet om jag började från noll: grunder, prioriteringar per delprov och fokus på provdagen.",
    }),
    links: pageLinks(PATH),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Guider", path: "/guider" },
        { name: HEADLINE, path: PATH },
      ]),
      jsonLdScript({
        ...guideArticleJsonLd({
          headline: HEADLINE,
          description: DESCRIPTION,
          url: URL,
          keywords: [
            "plugga inför högskoleprovet",
            "2,0 på högskoleprovet",
            "ORD",
            "kvantitativ del",
          ],
        }),
        author: {
          "@type": "Person",
          name: "Niklas Pellkvist",
          url: "https://www.linkedin.com/in/niklas-pellkvist-a3b1382b2/",
        },
      }),
    ],
  }),
});

function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-12 text-2xl font-semibold" style={{ color: "var(--cream)" }}>
      {children}
    </h2>
  );
}

function H3({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-8 text-lg font-semibold" style={{ color: "var(--cream)" }}>
      {children}
    </h3>
  );
}

function A({ to, children }: { to: string; children: ReactNode }) {
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Link to={to as any} className="underline" style={{ color: "var(--amber)" }}>
      {children}
    </Link>
  );
}

function FranNollGuidePage() {
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
          {HEADLINE}
        </h1>
        <p className="mt-3 text-sm">Av Niklas Pellkvist, grundare av Tvåkommanollan</p>
      </header>

      <p className="mb-6">
        Hur jag skulle gå tillväga för att plugga inför högskoleprovet, om jag skulle börja från
        noll.
      </p>
      <p>
        Guiden är till för dig som vill nå 2,0 på högskoleprovet. Är ditt mål inte lika högt kan
        vissa steg kompromissas med.
      </p>

      <nav
        aria-label="Innehåll"
        className="mt-8 rounded-2xl border p-5"
        style={{ borderColor: "var(--line)" }}
      >
        <p className="text-sm font-semibold" style={{ color: "var(--cream)" }}>
          Innehåll
        </p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
          <li>
            <a href="#grunder" className="underline">
              Grunder, innan plugget börjar
            </a>
          </li>
          <li>
            <a href="#prioritera" className="underline">
              Vad du ska prioritera
            </a>
          </li>
          <li>
            <a href="#verbala" className="underline">
              Hur du pluggar inför den verbala delen
            </a>
          </li>
          <li>
            <a href="#provdagen" className="underline">
              Fokus under provdagen
            </a>
          </li>
          <li>
            <a href="#avslutning" className="underline">
              Avslutande tankar
            </a>
          </li>
        </ol>
      </nav>

      <section className="space-y-4">
        <H2>
          <span id="grunder">Grunder, innan plugget börjar</span>
        </H2>

        <H3>Allmänt</H3>
        <p>
          Om du ska nå 2,0 kommer du att behöva lära dig ett system för att kunna fokusera under
          långa perioder. Det gäller särskilt när du övar in ord. Det är också mycket viktigt att
          tiden du pluggar är aktiv pluggtid. Jag lade nog ungefär 75 % av all pluggtid enbart på
          att plugga ord.
        </p>
        <p>
          Om du har svårt att fokusera rekommenderar jag starkt att läsa <em>Deep Work</em> av Cal
          Newport. Ja, det tar tid som du hade kunnat lägga på att plugga, men avkastningen är
          extremt hög.
        </p>
        <p>
          Kolla på Jon Erik Nordstrand på Youtube för hans teknik- och taktikvideor om du vill ha
          ett mer utförligt tillvägagångssätt för varje del.
        </p>

        <H3>För den kvantitativa delen</H3>
        <p>
          Öva upp din multiplikationstabell. Ja, det känns nästan förnedrande, men om du kan 1–12
          utantill utan att behöva tänka tjänar du ett antal minuter på ett provpass. Du tjänar
          också tid på att inte behöva känna dig osäker på om du har svarat rätt eller fel.
        </p>

        <H3>För den verbala delen</H3>
        <p>
          Något viktigt att ta ställning till innan du börjar kötta igenom provpass och
          övningsuppgifter är hur du ska mäta din progress. Om du gör övningsuppgifter från gamla
          prov (2011–2026) kommer det att påverka ditt resultat när du gör fullständiga prov.
          Alternativ ett är att öronmärka en batch med prov som du inte gör några övningsuppgifter
          ifrån. Alternativ två är att ta hänsyn till att du redan kan vissa av frågorna och inte
          lita blint på att ett övningsprov hade gett dig samma resultat på provdagen.
        </p>

        <H2>
          <span id="prioritera">Vad du ska prioritera</span>
        </H2>

        <H3>Är det lättast att höja den verbala eller den kvantitativa delen?</H3>
        <p>
          {/* copy-ok */}
          Det är överlägset lättast att höja den kvantitativa delen, nästan oavsett om du har lätt
          för matte eller inte. Nästintill samma frågor kommer varje år, bortsett från DTK, och
          därför kan du snabbt lära dig mönstren och hur sådana uppgifter löses. För att öva inför
          den kvantitativa delen skulle jag dela upp lärandet i tre steg.
        </p>
        <ol className="list-decimal space-y-2 pl-6">
          <li>Bli väldigt vass på multiplikationstabellen.</li>
          <li>
            Lär dig <A to="/hogskoleprovet-formler">formlerna som behövs inför provet</A>. Det tar
            max 1 timme.
          </li>
          <li>
            Skriv <A to="/gamla-prov">gamla prov</A> tills du snittar 76 poäng eller mer.
          </li>
        </ol>
        <p>
          Det är inte mer komplicerat än så. Du tjänar tid på steg 1, minimerar fel och sparar tid
          genom steg 2, och sedan är det bara att sy ihop säcken, vilket du gör via steg 3.
        </p>
        <p>
          Om stegen inte fungerar, eller om du inte presterar lika bra på provdagen som när du övar:
          se avsnittet om{" "}
          <a href="#provdagen" className="underline">
            fokus under provdagen
          </a>
          .
        </p>

        <H2>
          <span id="verbala">Hur du pluggar inför den verbala delen</span>
        </H2>
        <p>Den verbala delen tar mycket längre tid att plugga och att höja sig i.</p>
        <p>Listat efter vad som tar mest tid att plugga:</p>
        <ol className="list-decimal space-y-1 pl-6">
          <li>ORD</li>
          <li>LÄS</li>
          <li>ELF och MEK</li>
        </ol>

        <H3>ORD</H3>
        <p>
          Personligen spenderade jag 75 % av all pluggtid på att traggla ORD. Vissa menar att ORD
          inte går att plugga. Stämmer det?
        </p>
        <p>
          Nej, det stämmer såklart inte. Det går absolut att plugga in ORD om du är tillräckligt
          envis. Frågan är i stället om det är värt det för dig med dina mål. Med de resurser som
          fanns på marknaden när jag pluggade skulle jag säga att det inte var värt det för den som
          siktade under 1,9. Nu, med Tvåkommanollan, är <A to="/ord">ordlistan</A> det jag har lagt
          mest tid på att få att fungera så bra som möjligt, dels för de som siktar på 2,0, men
          också för de som fick 10 av 20 på förra provet och vill höja sig men inte vet var de ska
          börja.
        </p>
        <p>
          En ny funktion i ordlistan är en beräknad sannolikhet för hur troligt det är att ett ord
          kommer på nästa högskoleprov. Alla som är seriösa med att plugga inför högskoleprovet
          borde göra åtminstone de ord som har hög sannolikhet att komma på nästa prov. Samtidigt
          finns det många ställen som erbjuder gamla ord från prov. Det är bra, men det finns ingen
          anledning att plugga på ord från förra provet, eftersom sannolikheten att de kommer igen
          på nästa prov är minimal. Ordlistan på Tvåkommanollan har nästan 9 000 ord som är
          sannolika att komma på nästa prov, och du kan öva på dem i fallande ordning. Du kan också
          klassificera orden själv med 4 färger, så att du kan sortera dem i sådana du kan, sådana
          du ska öva på igen, sådana som är jättesvåra och så vidare.
        </p>
        <p>
          {/* copy-ok */}
          När jag pluggade använde jag Hpappens ordlista, vilket absolut fungerar, men den är
          aningen dyr och det är svårt att klassificera orden själv. Gratisresurser finns också, som
          Memrise och HP-akuten. Där tappar du tid och effektivitet i form av ett sämre gränssnitt,
          ord utan beräknad sannolikhet och ingen enkel egen klassificering.
        </p>

        <H3>LÄS</H3>
        <p>
          Personligen tycker jag att det är mycket lättare att läsa på utskrivet papper. Jag skulle
          skriva ut prov från 2000–2011 med ett separat LÄS-delprov (finns på hpguiden eller
          studera.nu) och öva på dem.
        </p>

        <H3>MEK</H3>
        <p>
          Meningskomplettering är svårt att plugga eftersom det inte finns många uppgifter att öva
          på. Därför har vi på Tvåkommanollan skrivit{" "}
          <A to="/mek-ovning">egna meningskompletteringsuppgifter</A> som går att öva på. Den
          resursen rekommenderar jag starkt. Jag använde Hpappens resurser, som erbjuder ungefär 200
          egna uppgifter. Tvåkommanollan har 2 000.
        </p>

        <H3>ELF</H3>
        <p>
          Kolla på Jon Erik Nordstrands teknik- och taktikvideor om hur du ska plugga inför ELF. Det
          är mer komplext och han förklarar det bättre. Jag gjorde enbart ELF när jag skrev gamla
          prov, men om du vill ha mer övning finns det saker du kan göra.
        </p>

        <H2>
          <span id="provdagen">Fokus under provdagen</span>
        </H2>
        <ul className="list-disc space-y-3 pl-6">
          <li>Se till att få bra sömn, och ställ gärna om dygnsrytmen några dagar innan.</li>
          <li>Ha överstrykningspennor, vanliga pennor och en linjal med dig.</li>
          <li>
            Drick vatten mellan varje provpass. Uttorkning påverkar din kognitiva förmåga mer än man
            kan tro. Ät något mellan varje provpass: en halv proteinbar, en halv banan eller något
            liknande. Du måste ha stabila energinivåer under hela provdagen.
          </li>
          <li>
            Om du planerar att ta koffein, ta det i jämna omgångar. Du ska <strong>inte</strong>{" "}
            dricka en hel Nocco under en paus, det ger ingen stabil effekt av koffeinet. Sikta på
            ungefär 40–50 mg mellan varje pass om koffein är något du använder. Använder du andra
            kosttillskott för att optimera fokus, som L-teanin eller nootropika i allmänhet, se till
            att ta dem i lagom dosering och utspritt över dagen. De kan ha en betydande påverkan på
            ditt fokus och din prestation. Gör egen research innan du bestämmer dig. Personligen
            gillar jag Complete Nootropics från Bulk och till det extra koffein från Red Bull eller
            koffeintabletter.
          </li>
        </ul>

        <H2>
          <span id="avslutning">Avslutande tankar</span>
        </H2>
        <p>
          Konkurrensen ökar för varje högskoleprov och{" "}
          <A to="/hogskoleprovet-normering">normeringsgränserna</A> har trendat uppåt de senaste
          åren. Det säger inte något säkert om hur det kommer att se ut i framtiden, men när du gör
          ett prov från till exempel 2014 kan normeringsgränserna vara mycket låga. Det beror{" "}
          <strong>inte</strong> på att provet var svårare i någon större utsträckning.
        </p>
        <p>Lycka till.</p>
        <p>
          Har du fler frågor når du oss på{" "}
          <a
            href="mailto:info@tvakommanollan.se"
            className="underline"
            style={{ color: "var(--amber)" }}
          >
            info@tvakommanollan.se
          </a>
          . Du kan också skriva till mig personligen på{" "}
          <a
            href="https://www.linkedin.com/in/niklas-pellkvist-a3b1382b2/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            style={{ color: "var(--amber)" }}
          >
            LinkedIn
          </a>
          .
        </p>
      </section>

      <RelatedGuides
        currentPath={PATH}
        relatedPaths={["/guider/ord", "/guider/mek", "/guider/bra-resultat", "/guider/tidspress"]}
      />
    </article>
  );
}
