import { createFileRoute, Link } from "@tanstack/react-router";
import { Lightbulb } from "lucide-react";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { fitTitle } from "@/lib/seo-text";
import { hpDateShort } from "@/lib/hp-dates";

/* =====================================================================
   HUR PLUGGAR MAN INFÖR HÖGSKOLEPROVET. En jämförelse av sätten att
   förbereda sig, där Tvåkommanollan är ett av fem. Sidan finns för
   frågorna "bästa sättet att plugga inför högskoleprovet" och "kurs
   eller inte", som både sökmotorer och AI-assistenter får varje dag.

   Den fungerar bara så länge den är ärlig. Därför:
   - Inga namngivna konkurrenter och inga påståenden om deras priser eller
     innehåll. De ändras utan att vi märker det, och ett felaktigt
     påstående om någon annan är värre än inget. Jämförelsen gäller
     KATEGORIER, och UHR är den enda källan som nämns vid namn.
   - Inga belopp för vårt eget köp. Prismodellen ändras; /pris äger
     siffrorna och den här sidan länkar dit.
   - Avsnittet om var vi inte räcker till ska stå kvar. Utan det är sidan
     en reklamsida med en tabell, och då citeras den inte.
   Ändras fakta om sajten (antal prov, vad som är gratis): rätta här,
   i /pris och i llms.txt samtidigt.
   ===================================================================== */

const PATH = "/plugga-infor-hogskoleprovet";
const SITE = "https://tvakommanollan.se";
const UPPDATERAD = "2026-10-26";
const UHR_TIDIGARE_PROV = "https://www.studera.nu/hogskoleprov/om/forbereda/tidigare/";

interface Metod {
  id: string;
  namn: string;
  kostar: string;
  uppgifter: string;
  rattning: string;
  forklaringar: string;
  styrka: string;
  tankPa: string;
  passar: string;
  egen?: boolean;
}

const METODER: Metod[] = [
  {
    id: "uhr",
    namn: "UHR:s egna prov på studera.nu",
    kostar: "Gratis.",
    uppgifter: "UHR:s egna, från många år tillbaka.",
    rattning:
      "Du rättar själv mot facit i PDF och slår upp poängen i normeringstabellen för samma prov.",
    forklaringar: "Inga. Facit anger bara rätt bokstav.",
    styrka: "Det är originalet. Alla andra som visar riktiga provuppgifter hämtar dem härifrån.",
    tankPa:
      "I de häften som ligger kvar efter provet saknas ofta den engelska läsförståelsen (ELF), av upphovsrättsskäl.",
    passar: "Den som vill ha källan direkt och gärna skriver ut och rättar för hand.",
  },
  {
    id: "bocker",
    namn: "Böcker",
    kostar: "Ett engångsköp.",
    uppgifter: "Varierar. En del använder UHR:s uppgifter, andra är skrivna av författaren.",
    rattning: "Du rättar själv mot facit i boken.",
    forklaringar: "Ofta utförliga. Det är böckernas styrka.",
    styrka:
      "Strategi och lösningsmetoder förklarade i lugn takt, i en ordning som bygger på sig själv.",
    tankPa:
      "Titta på utgivningsåret. Provet fick en ny uppläggning 2011, och en gammal upplaga kan beskriva delprov som inte längre ser ut så.",
    passar: "Den som lär sig bäst av att läsa en förklaring innan den övar.",
  },
  {
    id: "kurs",
    namn: "Kurser med lärare",
    kostar: "Brukar vara det dyraste alternativet.",
    uppgifter: "Oftast UHR:s gamla prov, plus kursens eget material.",
    rattning: "Läraren går igenom uppgifterna.",
    forklaringar: "Ja, och du kan ställa följdfrågor.",
    styrka: "Struktur, ett schema att följa och någon som svarar när du kört fast.",
    tankPa:
      "Kursen ger en plan, men poängen kommer av timmarna du själv lägger på uppgifter mellan passen.",
    passar: "Den som har svårt att komma igång på egen hand.",
  },
  {
    id: "appar",
    namn: "Appar och övningssajter",
    kostar: "Från gratis till prenumeration.",
    uppgifter:
      "Varierar mycket. En del har UHR:s uppgifter, andra egna eller automatiskt genererade.",
    rattning: "Automatisk.",
    forklaringar: "Varierar.",
    styrka: "Går att öva i korta pass, på bussen eller mellan lektionerna.",
    tankPa:
      "Ta reda på varifrån uppgifterna kommer. Egna uppgifter kan vara bra övning, men de är inte samma sak som provets.",
    passar: "Den som vill nöta ord och korta uppgifter lite varje dag.",
  },
  {
    id: "tkn",
    namn: "Tvåkommanollan",
    egen: true,
    kostar:
      "Gamla prov, facit, normering, dueller och forum är gratis. Träning på ORD och MEK utöver de första 40 uppgifterna kostar.",
    uppgifter:
      "Alla 30 provtillfällen från vårprovet 2012 till vårprovet 2026: 4 800 uppgifter med facit. MEK-träningen har dessutom egna uppgifter, märkta som sådana.",
    rattning: "Automatisk, med originaltid och uppskattad normering per provdel.",
    forklaringar:
      "Genomgångar av kvantitativa uppgifter i forumet, och en förklaring till varje ord i ordlistan.",
    styrka:
      "De riktiga proven samlade på ett ställe, med ELF i alla 60 verbala provpass, och med poäng direkt när du lämnat in.",
    tankPa: "Ingen lärare följer dig vecka för vecka, och sajten drivs av en person.",
    passar: "Den som vill skriva många riktiga prov och se exakt var poängen tappas.",
  },
];

const BEGRANSNINGAR = [
  "Ingen lärare följer upp din plan. Behöver du någon som håller dig till ett schema är en kurs bättre.",
  "Guiderna går igenom strategi per delprov, men en bok går djupare för den som vill läsa sig till metoderna.",
  "Vårprovet 2012 har kvantitativa uppgifter som saknar sina figurer. Originalbilderna finns inte kvar någonstans, och kortet säger det rakt ut.",
  "ORD- och MEK-träningen kostar efter de första 40 uppgifterna. Ordlistans uppslag och alla gamla prov är fortfarande gratis.",
  "Sajten drivs av en person. Hittar du ett fel vill vi gärna veta det.",
];

function faq(): Array<{ q: string; a: string }> {
  return [
    {
      q: "Vilket är det bästa sättet att plugga inför högskoleprovet?",
      a: "Skriv gamla prov på tid och rätta dig mot facit. Det är den förberedelse som liknar provet mest. Räkna sedan ut poängen per provdel och lägg mest tid på den del där du tappar flest poäng.",
    },
    {
      q: "Behöver man gå en kurs inför högskoleprovet?",
      a: "Nej. Det går att förbereda sig bra med gamla prov, facit och normeringstabeller, som alla finns gratis. En kurs hjälper mest den som behöver struktur och någon att fråga.",
    },
    {
      q: "Kan man plugga inför högskoleprovet gratis?",
      a: "Ja. UHR publicerar gamla prov med facit på studera.nu. På Tvåkommanollan går alla 30 provtillfällen sedan 2012 att skriva på originaltid med automatisk rättning, utan konto och utan att betala.",
    },
    {
      q: "Var hittar man gamla högskoleprov med facit?",
      a: "Hos UHR på studera.nu, som PDF. På Tvåkommanollan finns samma prov, 4 800 uppgifter från vårprovet 2012 till vårprovet 2026, med facit på varje uppgift och ELF i alla verbala provpass.",
    },
  ];
}

export const Route = createFileRoute("/plugga-infor-hogskoleprovet")({
  head: () => ({
    meta: pageMeta({
      path: PATH,
      title: fitTitle("Hur pluggar man inför högskoleprovet?"),
      description:
        "Gamla prov, böcker, kurser, appar och Tvåkommanollan jämförda på pris, riktiga provuppgifter, rättning och vem de passar. Med det vi själva inte är bäst på.",
      ogTitle: "Hur pluggar man inför högskoleprovet? Fem sätt jämförda",
    }),
    links: pageLinks(PATH),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Plugga inför högskoleprovet", path: PATH },
      ]),
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "Hur pluggar man inför högskoleprovet? Fem sätt jämförda",
        inLanguage: "sv-SE",
        dateModified: UPPDATERAD,
        mainEntityOfPage: `${SITE}${PATH}`,
        author: { "@id": `${SITE}/#niklas` },
        publisher: { "@id": `${SITE}/#org` },
      }),
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faq().map(({ q, a }) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      }),
    ],
  }),
  component: PluggaPage,
});

const H2 = "text-[20px] font-bold text-[var(--cream)] sm:text-[24px]";
const H2_STYLE = { fontFamily: "var(--font-display)" } as const;

function PluggaPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
      <nav className="text-xs text-white/45" aria-label="Brödsmulor">
        <Link to="/" className="hover:text-white/70">
          Hem
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-white/70">Plugga inför högskoleprovet</span>
      </nav>

      <header className="mt-4">
        <p className="text-sm text-white/65">
          Uppdaterat {hpDateShort(UPPDATERAD)}
        </p>
        <h1
          className="mt-2 text-[28px] font-bold leading-tight text-[var(--cream)] sm:text-[40px]"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
        >
          Hur pluggar man inför högskoleprovet?
        </h1>
        <p className="mt-3 text-[16px] leading-relaxed text-white/65">
          Fem sätt att förbereda sig, jämförda på vad de kostar, vad de ger och vem de passar.
        </p>
      </header>

      <section className="mt-6 rounded-2xl border border-primary/25 bg-primary/[0.06] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <Lightbulb className="mt-1 h-6 w-6 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="text-[17px] font-bold leading-snug text-[var(--cream)] sm:text-[19px]">
              Skriv gamla prov på tid och rätta dig mot facit.
            </p>
            <p className="mt-1.5 text-[14.5px] leading-relaxed text-white/65">
              Det är den förberedelse som liknar provet mest, och den är gratis. Kurser, böcker och
              appar är bra komplement när du vet vilka delprov du tappar poäng på, men de ersätter
              inte de riktiga proven.
            </p>
          </div>
        </div>
      </section>

      <p className="mt-4 text-[13px] leading-relaxed text-white/55">
        Sidan är skriven av Tvåkommanollan, som själva är ett av alternativen. Vi har försökt vara
        rättvisa, och det vi inte är bäst på står i ett eget avsnitt längre ner.
      </p>

      <section className="mt-10">
        <h2 className={H2} style={H2_STYLE}>
          Fem sätt att plugga, sida vid sida
        </h2>
        <div className="mt-4 space-y-4">
          {METODER.map((m) => (
            <article
              key={m.id}
              id={m.id}
              className={
                m.egen
                  ? "rounded-2xl border border-primary/30 bg-white/[0.02] p-5 sm:p-6"
                  : "rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6"
              }
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[18px] font-bold text-[var(--cream)]">{m.namn}</h3>
                {m.egen && (
                  <span className="text-[11px] font-semibold text-primary">
                    Det här är vi
                  </span>
                )}
              </div>
              <dl className="mt-3 grid gap-x-6 gap-y-2.5 text-[14.5px] leading-relaxed sm:grid-cols-[9rem_1fr]">
                <Rad term="Kostar" text={m.kostar} />
                <Rad term="Uppgifterna" text={m.uppgifter} />
                <Rad term="Rättning" text={m.rattning} />
                <Rad term="Förklaringar" text={m.forklaringar} />
                <Rad term="Styrka" text={m.styrka} />
                <Rad term="Tänk på" text={m.tankPa} />
                <Rad term="Passar" text={m.passar} />
              </dl>
              {m.id === "uhr" && (
                <a
                  href={UHR_TIDIGARE_PROV}
                  target="_blank"
                  rel="noopener"
                  className="mt-4 inline-flex text-[14px] font-semibold text-primary underline-offset-2 hover:underline"
                >
                  Tidigare prov hos UHR
                </a>
              )}
              {m.egen && (
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[14px] font-semibold">
                  <Link
                    to="/gamla-prov"
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    Gamla prov
                  </Link>
                  <Link to="/pris" className="text-primary underline-offset-2 hover:underline">
                    Vad som kostar
                  </Link>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className={H2} style={H2_STYLE}>
          Där Tvåkommanollan inte räcker till
        </h2>
        <ul className="mt-4 list-disc space-y-2.5 pl-5">
          {BEGRANSNINGAR.map((rad) => (
            <li key={rad} className="text-[15px] leading-relaxed text-white/70">
              {rad}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[14px] text-white/55">
          Fel och synpunkter tas emot på{" "}
          <Link to="/kontakt" className="underline underline-offset-2 hover:text-white/80">
            kontaktsidan
          </Link>
          .
        </p>
      </section>

      <section className="mt-12">
        <h2 className={H2} style={H2_STYLE}>
          Så kombinerar du dem
        </h2>
        <ol className="mt-4 space-y-3 text-[15px] leading-relaxed text-white/70">
          <Steg n={1}>
            Skriv ett helt gammalt prov på tid tidigt, för att se var du står. Vilket prov som helst
            går bra.
          </Steg>
          <Steg n={2}>
            Räkna ut poängen per provdel med{" "}
            <Link to="/hogskoleprovet-normering" className="text-primary hover:underline">
              normeringen
            </Link>
            . Den verbala och den kvantitativa delen normeras var för sig.
          </Steg>
          <Steg n={3}>
            Lägg mest tid på delprovet där du tappar flest poäng. Det är där en bok, en kurs eller{" "}
            <Link to="/guider" className="text-primary hover:underline">
              en guide
            </Link>{" "}
            gör mest nytta.
          </Steg>
          <Steg n={4}>
            Öva ord lite varje dag. Ordförråd byggs långsamt, så korta pass ofta ger mer än långa
            pass sällan.
          </Steg>
          <Steg n={5}>Skriv fler hela prov på tid närmare provdagen, och jämför poängen.</Steg>
        </ol>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Link
            to="/gamla-prov"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-brand transition hover:brightness-110"
          >
            Skriv ett gammalt prov
          </Link>
          <Link
            to="/hogskoleprovet-poangraknare"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-white/12 px-5 py-2.5 text-sm font-semibold text-[var(--cream)] transition hover:border-primary/50"
          >
            Poängräknare
          </Link>
          <Link
            to="/hogskoleprovet-datum"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-white/12 px-5 py-2.5 text-sm font-semibold text-[var(--cream)] transition hover:border-primary/50"
          >
            Nästa provdatum
          </Link>
        </div>
      </section>

      <section className="mt-12">
        <h2 className={H2} style={H2_STYLE}>
          Vanliga frågor
        </h2>
        <dl className="mt-4 divide-y divide-white/8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
          {faq().map(({ q, a }) => (
            <div key={q} className="px-5 py-4">
              <dt className="text-[15px] font-semibold text-[var(--cream)]">{q}</dt>
              <dd className="mt-1.5 text-[14.5px] leading-relaxed text-white/65">{a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

function Rad({ term, text }: { term: string; text: string }) {
  return (
    <>
      <dt className="font-semibold text-[var(--cream)]">{term}</dt>
      <dd className="-mt-2 text-white/65 sm:mt-0">{text}</dd>
    </>
  );
}

function Steg({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[12px] font-bold text-primary">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}
