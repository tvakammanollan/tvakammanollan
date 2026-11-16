import { Link } from "@tanstack/react-router";
import type { LinkProps } from "@tanstack/react-router";
import { Check, Star } from "lucide-react";
import type { LandingStats } from "@/lib/landing.functions";
import { formatInt } from "@/lib/sv-format";
import { OMDOMESKORT } from "@/data/omdomen";
import { allExams } from "@/lib/prov-data";
import { FREE_EXAM_COUNT } from "@/lib/prov-access";
import { FREE_MEK_LIMIT, FREE_ORD_LIMIT, PREMIUM_RADER } from "@/lib/ord-paywall";
import { HP_DAY_START, hpDateLong, hpDateTime, upcomingHpDates } from "@/lib/hp-dates";
import { rankedName } from "@/lib/username";

/**
 * Landningssidans sektioner nedanför hjälten.
 *
 * Siffrorna är kontrollerade mot databasen och provarkivet 2026-08-30:
 * arkivet 4 960 (src/data/prov, 31 × 160), 124 provpass, 8 delprov.
 *
 * ORDBANKEN ÄR 8 761 RADER i databasen (questions där category='ORD',
 * alla med definition). Sidan skriver ändå "10 000+", vilket är Niklas
 * beslut 2026-08-30 och gäller hela sajten: /ord, dashboarden, guiderna,
 * FAQ:n, llms.txt och JSON-LD i index.tsx säger alla 10 000+ sedan
 * tidigare. Landningen var den enda ytan som sa något annat. Ändra inte
 * tillbaka till 8 761 här utan att ändra alla de andra samtidigt, annars
 * säger sajten två olika saker om samma sak.
 *
 * Observera skillnaden mellan ordbanken och arkivets ORD-del: arkivet har
 * 620 ORD-uppgifter som en del av sina 4 960. Att skriva ordbankens tal i
 * delprovstabellen vore alltså fel oavsett vilket tal som används.
 */

/* ---------------------------------------------------------------- remsan */

// Antalet prov räknas ur arkivet. Det stod "30" och "120" här i tre veckor
// efter att höstprovet 2026 lagts in, medan hjälten på samma sida sa 31 och
// 124. Varje prov har 4 provpass, varav 2 verbala (alla med ELF).
const ANTAL_PROV = allExams().length;

const BEVIS = [
  { v: "10\u00a0000+", k: "ord med förklaring" },
  { v: "4 960", k: "uppgifter i arkivet" },
  { v: String(ANTAL_PROV), k: "provtillfällen" },
  { v: String(ANTAL_PROV * 4), k: "provpass med facit" },
  { v: "8", k: "delprov" },
  { v: String(ANTAL_PROV * 2), k: "verbala pass med ELF" },
];

export function BevisRemsan() {
  return (
    <section className="border-b border-white/10 bg-secondary" aria-label="Innehållet i siffror">
      {/* Skiljelinjerna är GAPEN, inte kantlinjer per cell.
          Rutnätet har 1px gap och linjefärg som botten; cellerna har
          sektionens egen botten och täcker allt utom gapen. Första
          versionen räknade i stället ut kantlinjer ur `index` med en kedja
          nästlade ternärer (`i % 2`, `i % 3`, `i === 0`) eftersom "först på
          raden" är olika vid 2, 3 och 6 kolumner. Den var oläsbar och hade
          gett fel linjer i samma sekund någon la till ett sjunde tal.
          Så här stämmer det vid varje brytpunkt utan att någon räknar. */}
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid grid-cols-2 gap-px bg-white/10 sm:grid-cols-3 lg:grid-cols-6">
          {BEVIS.map((b) => (
            <div key={b.k} className="bg-secondary px-4 py-3">
              <div className="font-mono text-[24px] font-medium leading-none tabular-nums tracking-tight sm:text-[28px]">
                {b.v}
              </div>
              <div className="mt-2 text-[12.5px] leading-tight text-white/70">{b.k}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- omdömen */

/**
 * Tre personer som skrivit provet, med resultat och egna ord.
 *
 * Datan ligger i `@/data/omdomen` och är från riktiga personer. Två av de
 * tre har byggt sajten, och det står på korten: ett omdöme från grundaren
 * som inte säger att det är grundaren vore vilseledande.
 *
 * Ingen JSON-LD (`review`/`aggregateRating`) byggs av de här. Google godtar
 * inte recensionsmarkup där en organisation recenserar sig själv, och
 * två av tre röster är våra egna.
 *
 * Resultatet står på en färgklick i en av produktfärgerna, samma formspråk
 * som dekorformerna. Stjärnorna är fem därför att alla tre gav fem.
 */
const KORTFARG = ["var(--terracotta)", "var(--lavender)", "var(--sky)"] as const;
const KLICKFORM = [
  "58% 42% 37% 63% / 45% 55% 45% 55%",
  "42% 58% 61% 39% / 52% 38% 62% 48%",
  "63% 37% 47% 53% / 41% 59% 41% 59%",
] as const;

export function Omdomen() {
  return (
    <section id="omdomen" className="border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <h2 className="mb-10 max-w-[18ch] text-[30px] leading-tight tracking-[-0.035em] sm:text-[42px]">
          Tre som skrivit provet
        </h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {OMDOMESKORT.map((o, i) => (
            <figure
              key={o.namn}
              className="flex min-w-0 flex-col rounded-3xl border border-white/10 bg-card p-7 sm:p-8"
            >
              <div className="flex items-center gap-4">
                <div className="relative grid h-[84px] w-[96px] shrink-0 place-items-center">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{ background: KORTFARG[i % 3], borderRadius: KLICKFORM[i % 3] }}
                  />
                  <span className="relative text-[30px] leading-none tracking-[-0.03em]">
                    {o.resultat}
                  </span>
                </div>
                <div className="min-w-0 text-[14px] leading-relaxed text-white/70">
                  <p className="font-semibold text-[var(--cream)]">{o.prov}</p>
                  {o.detalj ? <p>{o.detalj}</p> : null}
                </div>
              </div>

              <div
                className="mt-6 flex gap-1 text-[var(--cream)]"
                role="img"
                aria-label="5 av 5 stjärnor"
              >
                {Array.from({ length: 5 }, (_, n) => (
                  <Star key={n} className="h-4 w-4" fill="currentColor" aria-hidden="true" />
                ))}
              </div>

              <blockquote className="mt-4 text-[16px] leading-relaxed">”{o.citat}”</blockquote>
              {o.bakgrund ? (
                <p className="mt-3 text-[14px] leading-relaxed text-white/70">{o.bakgrund}</p>
              ) : null}

              <div className="flex-1" />
              <figcaption className="mt-6 border-t border-white/10 pt-4 text-[14px] leading-relaxed text-white/70">
                <p className="text-[16px] font-semibold text-[var(--cream)]">
                  {o.namn}, {o.alder}
                </p>
                {o.roller.map((r) => (
                  <p key={r}>{r}</p>
                ))}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Kompakt rubrik för de datatunga sektionerna.
 *
 * Topplistan är en tabell. En 42px-rubrik med en egen lede-spalt
 * bredvid ger den samma tyngd som sidans tes, vilket är fel viktning
 * och dessutom gjorde att fem sektioner i rad såg identiska ut.
 * Här ligger rubrik och lede på samma baslinje, mindre och tätare, så att
 * datan under är det som väger.
 */
function TatRubrik({ titel, lede }: { titel: string; lede: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-baseline gap-x-6 gap-y-2 border-b border-white/10 pb-4">
      <h2 className="text-[24px] leading-tight tracking-[-0.03em] sm:text-[30px]">{titel}</h2>
      <p className="max-w-[52ch] text-[15px] leading-relaxed text-white/70">{lede}</p>
    </div>
  );
}

/* --------------------------------------------------------------- arkivet */

// Läses ur arkivets eget index. Listan stod tidigare handskriven och pekade
// på "2021vt" och "2022vt", som inte finns: de vårarna hade två prov var
// (2021vta/2021vtb), så två av rutorna gav 404 och fyra prov saknades.
const TERMINER = [...allExams()].reverse().map((e) => ({
  term: e.term,
  // "2021vta" skrivs "2021 vt a" så att de två vårproven går att skilja åt.
  text: `${e.term.slice(0, 4)} ${e.term.slice(4, 6)}${e.term.length > 6 ? ` ${e.term.slice(6)}` : ""}`,
  label: e.label,
}));

const ARKIVFAKTA = [
  { n: String(ANTAL_PROV), t: "provtillfällen från 2012 till 2026" },
  { n: String(ANTAL_PROV * 4), t: "provpass à 40 uppgifter" },
  { n: "4 960", t: "uppgifter med facit" },
  { n: String(ANTAL_PROV * 2), t: "verbala pass med ELF" },
];

export function Arkivet() {
  return (
    // Arkivet ligger på nedsänkt yta. Det är sidans enda sektion som byter
    // botten, och den bryter den vertikala rytmen mitt på sidan utan att
    // layouten behöver bli en annan.
    <section id="arkivet" className="border-b border-white/10 bg-secondary">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <div className="mb-8 grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
          <div>
            <h2 className="max-w-[16ch] text-[30px] leading-tight tracking-[-0.035em] sm:text-[42px]">
              Gamla prov med facit
            </h2>
          </div>
          <div>
            <p className="max-w-[46ch] text-[16px] leading-relaxed text-white/70">
              Skriv ett helt pass på tid eller välj ett enskilt delprov. Facit på varje uppgift, och
              poängen räknas ut åt dig så snart du skrivit båda passen i en del.
            </p>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-16">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-1.5">
              {TERMINER.map((t) => (
                <Link
                  key={t.term}
                  to="/gamla-prov/$term"
                  params={{ term: t.term }}
                  title={t.label}
                  className="inline-flex min-h-[44px] items-center rounded-sm border border-white/10 bg-card px-3 font-mono text-[12.5px] tabular-nums text-white/70 transition-colors hover:border-primary hover:text-primary"
                >
                  {t.text}
                </Link>
              ))}
            </div>
            <p className="mt-4 max-w-[52ch] text-[13.5px] text-white/55">
              Vårprovet 2020 ställdes in och skrevs aldrig. Samma häfte användes i oktober samma år,
              och ligger därför under höstprovet.
            </p>
          </div>

          <div>
            <div className="border-t border-white/25">
              {ARKIVFAKTA.map((f) => (
                <div key={f.t} className="flex items-baseline gap-4 border-b border-white/8 py-3.5">
                  <span className="min-w-[76px] font-mono text-[24px] font-medium tabular-nums tracking-tight">
                    {f.n}
                  </span>
                  <span className="text-[14.5px] text-white/70">{f.t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- produktytor */

/**
 * De fyra sätten att plugga, vart och ett i sin produktytas färg.
 *
 * Kopplingen mellan yta och färg är låst i `lib/produktzon.ts` och gäller
 * hela sajten: ser du Sky är du i arkivet. Den här sektionen är första
 * gången en besökare möter den, så färgerna här MÅSTE vara samma som på
 * /gamla-prov, /mek-ovning och /ordlista. Ändra dem där, inte här.
 *
 * Zonfärgerna är ytor och aldrig text: ingen av dem klarar 3:1 mot
 * grundytan. Rubrik och brödtext är Ink eller Graphite, och på Plum vit.
 */
const YTOR = [
  {
    to: "/gamla-prov",
    rubrik: "Skriv ett provpass på tid",
    text: "124 provpass à 40 uppgifter, från vårprovet 2012 till höstprovet 2026. Facit på varje uppgift, normering på varje provdel.",
    cta: "Öppna arkivet",
    yta: "bg-sky",
    textFarg: "text-bark",
    rubrikFarg: "text-[var(--cream)]",
    knapp: "border-2 border-bark text-bark",
  },
  {
    to: "/matchmaking",
    rubrik: "En match är 8 uppgifter på 5 minuter",
    text: "Verbalt eller kvantitativt, mot en vän eller mot kön. Vid lika poäng vinner den som lämnade in först.",
    cta: "Spela en match",
    yta: "bg-terracotta",
    textFarg: "text-[var(--cream-3)]",
    rubrikFarg: "text-[var(--cream)]",
    knapp: "border-2 border-[var(--cream-3)] text-[var(--cream-3)]",
  },
  {
    to: "/mek-ovning",
    rubrik: "Öva MEK, meningskomplettering",
    text: "En mening med luckor, och du väljer orden som passar. Uppgifter ur gamla prov och uppgifter vi skrivit själva, med förklaring efter varje svar.",
    cta: "Öva på MEK",
    yta: "bg-plum",
    textFarg: "text-[var(--navy-3)]",
    rubrikFarg: "text-on-brand",
    knapp: "border-2 border-cream-wash text-cream-wash",
  },
  {
    to: "/ordlista",
    rubrik: "Ordlista med över 10\u00a0000 ord",
    text: "Betydelse, exempelmening, liknande ord och ordklass, och provuppgiften ordet kom från.",
    cta: "Slå upp ett ord",
    yta: "bg-lavender",
    textFarg: "text-[var(--plum)]",
    rubrikFarg: "text-[var(--cream)]",
    knapp: "border-2 border-[var(--plum)] text-[var(--plum)]",
  },
] as const;

/* ------------------------------------------------------------- börja här */

/**
 * Vägen in för den som inte vet något om provet. Sidan räknade tidigare upp
 * fyra ytor utan att säga var man börjar. Stegen följer planen i
 * `/plugga-infor-hogskoleprovet`: mål, nuläge, övning. Siffrorna för
 * gratisdelen kommer ur samma konstanter som spärrarna läser.
 */
const STEG: { rubrik: string; text: string; cta: string; to: LinkProps["to"] }[] = [
  {
    rubrik: "Se vad utbildningen kräver",
    text: "Högskoleprovet är en egen väg in på högskolan, vid sidan av betygen. Resultatet är en poäng mellan 0,0 och 2,0. Slå upp vilken poäng som räckte till ditt program senast.",
    cta: "Poäng per program",
    to: "/hogskoleprovet-poang",
  },
  {
    rubrik: "Skriv ett gammalt prov på tid",
    text: `De ${FREE_EXAM_COUNT} senaste proven är gratis och kräver inget konto. När du lämnat in får du din poäng, och ser hur långt du har kvar.`,
    cta: "Välj ett prov",
    to: "/gamla-prov",
  },
  {
    rubrik: "Öva på det du tappar poäng på",
    text: `Ord och meningskomplettering (MEK) är 40 av provets 160 uppgifter och går att öva i korta pass. De första ${FREE_ORD_LIMIT} orden och ${FREE_MEK_LIMIT} MEK-uppgifterna är gratis.`,
    cta: "Öva ord",
    to: "/ord",
  },
];

export function BorjaHar() {
  return (
    <section id="borja-har" className="border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <h2 className="mb-10 max-w-[18ch] text-[30px] leading-tight tracking-[-0.035em] sm:text-[42px]">
          Börja här
        </h2>
        <ol className="grid gap-4 lg:grid-cols-3">
          {STEG.map((s, i) => (
            <li
              key={s.rubrik}
              className="flex min-w-0 flex-col rounded-3xl border border-white/10 bg-card p-7 sm:p-8"
            >
              <p className="font-mono text-[13px] text-white/55">Steg {i + 1}</p>
              <h3 className="mt-3 text-[22px] leading-tight tracking-[-0.02em]">{s.rubrik}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-white/70">{s.text}</p>
              <div className="flex-1" />
              <Link
                to={s.to}
                className="mt-6 inline-flex min-h-[44px] items-center self-start text-[15px] font-semibold text-primary hover:underline"
              >
                {s.cta}
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Produktytorna() {
  return (
    <section id="ytorna" className="border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <div>
          <h2 className="mb-10 max-w-[18ch] text-[30px] leading-tight tracking-[-0.035em] sm:text-[42px]">
            4 sätt att plugga
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {YTOR.map((y) => (
            <div key={y.to} className="min-w-0">
              <Link
                to={y.to}
                className={`flex h-full flex-col rounded-[40px] p-7 transition hover:brightness-[1.03] sm:p-9 ${y.yta}`}
              >
                <h3 className={`text-[24px] leading-tight tracking-[-0.02em] ${y.rubrikFarg}`}>
                  {y.rubrik}
                </h3>
                <p className={`mt-3 text-[15px] leading-relaxed ${y.textFarg}`}>{y.text}</p>
                <div className="flex-1" />
                <span
                  className={`mt-7 inline-flex min-h-[48px] items-center justify-center self-start rounded-lg px-6 py-3 text-[15px] font-semibold ${y.knapp}`}
                >
                  {y.cta}
                </span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- priset */

/**
 * Vad som kostar och vad som inte gör det.
 *
 * De två betalkorten är var sin produkt i Stripe: en månadsprenumeration för
 * 149 kr per månad och sex månader för 349 kr som engångsköp, båda med moms
 * inräknad (`tax_behavior: inclusive`).
 * Varje kort länkar till `/kassa?plan=…`, där kassan för just det köpet öppnas.
 *
 * Beloppen här är skrivna för hand eftersom sektionen är serverrenderad och
 * inte ska vänta på Stripe. Kassan läser sitt eget pris ur Stripe, så ändras
 * priset där måste `pris` nedan ändras i samma veva, annars lovar kortet ett
 * annat belopp än kassan tar.
 *
 * Knapparna har var sin färg så att de tre köpen går att skilja åt med en
 * blick: vit för gratiskontot, orange (terracotta) för en månad och lila
 * (plum) för 6 månader. Texten på terracotta är Ink och på plum vit, de
 * par paletten godkänt för de ytorna i `styles.css`.
 *
 * Studieupplägget är inte med: vi pivoterar bort från det.
 */
// Månadsköpet är det markerade kortet: terracotta, med raden "Mest populär"
// (Niklas beslut 2026-11-15). 6 månader är ett vanligt vitt kort, så att
// bara ett kort ropar.
const BETALKORT = [
  {
    plan: "1m",
    marke: "Mest populär",
    etikett: "Premium: allt på sajten, per månad",
    pris: "149 kr",
    prisEnhet: "per månad, inklusive moms",
    rader: [...PREMIUM_RADER, "Förnyas varje månad, säg upp när du vill"],
    cta: "Välj per månad",
    yta: "bg-terracotta",
    etikettFarg: "text-[var(--cream)]",
    radFarg: "text-[var(--cream)]",
    ikon: "text-[var(--cream)]",
    knapp: "bg-primary text-on-brand hover:brightness-125",
  },
  {
    plan: "6m",
    marke: null,
    etikett: "Premium: allt på sajten, 6 månader",
    pris: "349 kr",
    prisEnhet: "för 6 månader, inklusive moms. Engångsköp",
    rader: [...PREMIUM_RADER, "Engångsköp som inte förnyas"],
    cta: "Välj 6 månader",
    yta: "bg-card border border-white/10",
    etikettFarg: "text-white/55",
    radFarg: "text-white/70",
    ikon: "text-success",
    knapp: "bg-plum text-on-brand hover:brightness-125",
  },
] as const;

/** Så länge gäller 6-månadersköpet, i dagar (för raden om provdagen). */
const SEX_MANADER_DAGAR = 182;

/**
 * `kompakt` är /pris-läget: sidans h1 står redan ovanför, så blockets egen
 * rubrik utelämnas, luften krymps och på mobil läggs gratiskortet sist.
 * Utan det tog rubrik plus rubrik plus 0 kr-kortet hela första skärmen och
 * priset syntes först efter en skroll, på en sida som bara handlar om priset.
 */
export function Priset({ kompakt = false }: { kompakt?: boolean }) {
  // Räknas vid rendering, aldrig på modulnivå (Workerns klocka står på 1970
  // medan modulen laddas). Raden visas bara när nästa prov ligger inom de
  // 6 månader köpet gäller.
  const nastaProv = upcomingHpDates()[0];
  const dagarTillProv = nastaProv
    ? (new Date(hpDateTime(nastaProv.date, HP_DAY_START)).getTime() - Date.now()) / 86_400_000
    : null;
  const rackerTillProvet =
    nastaProv && dagarTillProv !== null && dagarTillProv < SEX_MANADER_DAGAR
      ? `Räcker till provet ${hpDateLong(nastaProv.date)}`
      : null;
  return (
    <section id="priset" className="border-b border-white/10 bg-secondary">
      <div className={`mx-auto max-w-6xl px-4 ${kompakt ? "py-6 sm:py-10" : "py-14 sm:py-20"}`}>
        {kompakt ? null : (
          <div>
            <h2 className="mb-10 max-w-[20ch] text-[30px] leading-tight tracking-[-0.035em] sm:text-[42px]">
              Vad som är gratis och vad som kostar
            </h2>
          </div>
        )}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className={`min-w-0 ${kompakt ? "order-last lg:order-none" : ""}`}>
            <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-card p-7 sm:p-8">
              <p className="text-xs font-semibold text-white/55">Konto</p>
              <p className="mt-4 text-[40px] leading-none tracking-[-0.03em]">0 kr</p>
              <ul className="mt-6 space-y-3 text-[15px] leading-relaxed text-white/70">
                {[
                  "De 2 senaste proven med facit och rättning",
                  "Matcherna, verbalt och kvantitativt",
                  "20 ord och 10 MEK-uppgifter i träningsläget",
                  "Normering, poängräknare, facit och forum",
                ].map((rad) => (
                  <li key={rad} className="flex gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {rad}
                  </li>
                ))}
              </ul>
              <div className="flex-1" />
              <Link
                to="/signup"
                className="mt-7 inline-flex min-h-[48px] items-center justify-center self-start rounded-lg border border-[var(--cream)] bg-card px-6 py-3 text-[15px] font-semibold text-[var(--cream)] transition hover:bg-secondary"
              >
                Skapa konto
              </Link>
            </div>
          </div>

          {BETALKORT.map((k) => (
            <div key={k.cta} className="min-w-0">
              <div className={`flex h-full flex-col rounded-3xl p-7 sm:p-8 ${k.yta}`}>
                <p className={`text-xs font-semibold ${k.etikettFarg}`}>
                  {k.marke ? (
                    <span className="mb-1 block text-[15px] font-bold">{k.marke}</span>
                  ) : null}
                  {k.etikett}
                </p>
                <p className="mt-4 text-[40px] leading-none tracking-[-0.03em]">{k.pris}</p>
                <p className={`mt-2 text-[13px] ${k.radFarg}`}>{k.prisEnhet}</p>
                <ul className={`mt-6 space-y-3 text-[15px] leading-relaxed ${k.radFarg}`}>
                  {[
                    ...k.rader,
                    ...(k.plan === "6m" && rackerTillProvet ? [rackerTillProvet] : []),
                  ].map((rad) => (
                    <li key={rad} className="flex gap-2.5">
                      <Check className={`mt-0.5 h-4 w-4 shrink-0 ${k.ikon}`} />
                      {rad}
                    </li>
                  ))}
                </ul>
                <div className="flex-1" />
                <Link
                  to="/kassa"
                  search={{ plan: k.plan }}
                  className={`mt-7 inline-flex min-h-[48px] items-center justify-center self-start rounded-lg px-6 py-3 text-[15px] font-semibold transition ${k.knapp}`}
                >
                  {k.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
        <AngerRad className="mt-6 text-[13px] leading-relaxed text-white/60" />
      </div>
    </section>
  );
}

/**
 * Vad som gäller om man ångrar sig, med villkorens ord (`/villkor`,
 * avsnittet Ångerrätt). Står under priskorten, i kassan och i spärrutan.
 * Ändras villkoren ska den här raden ändras med dem.
 */
export function AngerRad({ className }: { className?: string }) {
  return (
    <p className={className}>
      Premium blir tillgängligt direkt efter betalningen, och ångerrätten gäller därför inte.
      Månadsköpet säger du upp när du vill och behåller då månaden ut. Hela texten står i{" "}
      <Link to="/villkor" className="underline underline-offset-2">
        villkoren
      </Link>
      .
    </p>
  );
}

/* ------------------------------------------------------------- topplistan */

export function Topplistan({ stats }: { stats: LandingStats | null }) {
  const rader = (stats?.topPlayers ?? []).filter((p) => p.type === "verbal").slice(0, 6);
  if (rader.length === 0) return null;
  const hogst = rader[0]?.elo ?? 1;

  return (
    <section id="topplistan" className="border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <TatRubrik
          titel="Topplistan"
          lede="Verbal ELO, uppdaterad efter varje match. Du möter spelare nära din egen nivå."
        />

        {/* `min-w-0` på grid-itemet är inte kosmetik: ett grid-item har
            `min-width: auto` och kan därför inte krympa under sitt innehåll.
            Tabellen har `min-w-[420px]`, så utan detta växte den scrollande
            behållaren till 420px i en 380px viewport i stället för att
            scrolla, och gav hela sidan 56px sidoscroll. */}
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:gap-16">
          <div className="min-w-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px]">
                <thead>
                  <tr className="border-b border-white/25">
                    <th className="w-[46px] pb-2.5 text-left font-mono text-xs font-normal text-white/55">
                      #
                    </th>
                    <th className="pb-2.5 pr-3 text-left font-mono text-xs font-normal text-white/55">
                      Spelare
                    </th>
                    <th className="w-[150px] pb-2.5 pr-3 text-left font-mono text-xs font-normal text-white/55">
                      Form
                    </th>
                    <th className="w-[90px] pb-2.5 text-right font-mono text-xs font-normal text-white/55">
                      ELO
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rader.map((p, i) => (
                    <tr key={p.username + i} className="border-b border-white/8">
                      <td className="py-3 font-mono text-[13px] tabular-nums text-white/55">
                        {i + 1}
                      </td>
                      <td className="py-3 pr-3 text-[15px] font-bold">{rankedName(p.username)}</td>
                      <td className="py-3 pr-3">
                        <span className="block h-1.5 min-w-[70px] overflow-hidden rounded-sm bg-secondary">
                          <span
                            className={`block h-full ${i === 0 ? "bg-primary" : "bg-bark"}`}
                            style={{ width: `${Math.round((p.elo / hogst) * 100)}%` }}
                          />
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono text-[14.5px] font-medium tabular-nums">
                        {formatInt(p.elo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div>
              <p className="font-mono text-xs text-white/55">Var du hamnar</p>
              <p className="mt-3 max-w-[44ch] text-[15px] leading-relaxed text-white/70">
                Alla börjar på 1000. Siffran rör sig mycket de första matcherna och är stabil efter
                ungefär tolv.
              </p>
              <Link
                to="/leaderboard"
                className="mt-5 inline-flex min-h-[48px] items-center rounded-md border border-white/25 px-6 text-[14px] font-bold transition-colors hover:bg-white/[0.05]"
              >
                Se hela topplistan
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ slut */

export function SlutCta({ dagarKvar, datum }: { dagarKvar: number | null; datum: string | null }) {
  return (
    <section className="border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <div>
          <h2 className="max-w-[13ch] text-[38px] leading-[1.02] tracking-[-0.045em] sm:text-[60px]">
            Börja med en match
          </h2>
        </div>
        {dagarKvar !== null ? (
          <div>
            <div className="mt-6 flex flex-wrap items-baseline gap-4">
              <span className="font-mono text-[46px] font-medium leading-none tabular-nums tracking-[-0.045em] text-primary sm:text-[68px]">
                {formatInt(dagarKvar)}
              </span>
              <span className="max-w-[26ch] text-[16px] text-white/70">
                {dagarKvar === 1 ? "dag" : "dagar"} kvar till provet
                {datum ? ` den ${datum}` : ""}.
              </span>
            </div>
          </div>
        ) : null}
        <div>
          <Link
            to="/matchmaking"
            search={{ type: "verbal" }}
            className="mt-8 inline-flex min-h-[52px] items-center justify-center rounded-md bg-primary px-8 text-[15px] font-bold text-on-brand transition-colors hover:bg-primary-deep"
          >
            Spela en match
          </Link>
        </div>
        <p className="mt-4 text-[13.5px] text-white/55">
          En match är 8 uppgifter på 5 minuter. Du behöver inget konto för att prova.
        </p>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- resurser */

/**
 * Länkar till sajtens informationssidor. Startsidan är sajtens starkaste
 * sida, och utan det här blocket nådde den varken normeringen, orden per
 * prov, formlerna, resultatsidan eller programsidorna annat än via
 * sidfoten. Ingen animation: blocket ska stå färdigt i den serverrenderade
 * HTML:en.
 */
const RESURSER: Array<{ to: LinkProps["to"]; titel: string; text: string }> = [
  {
    to: "/hogskoleprovet-normering",
    titel: "Normering",
    text: "Hur många rätt som krävts för 2,0 på varje prov sedan 2012.",
  },
  {
    to: "/hogskoleprovet-antal-ratt",
    titel: "Hur många rätt för 1,5?",
    text: "Antal rätt som krävts för varje poäng från 0,5 till 2,0.",
  },
  {
    to: "/hogskoleprovet-facit",
    titel: "Facit senaste provet",
    text: "Alla svar, kontrollerade mot UHR, och trolig normering.",
  },
  {
    to: "/hogskoleprovet-resultat",
    titel: "När kommer resultatet?",
    text: "Datum, var du hämtar det och hur länge det gäller.",
  },
  {
    to: "/hogskoleprovet-poang",
    titel: "HP-poäng per program",
    text: "Vad läkare, jurist, civilingenjör och fler krävde senast.",
  },
  {
    to: "/hogskoleprovet-ord",
    titel: "Orden på varje prov",
    text: "Alla ORD-uppgifter från 31 prov, med rätt svar.",
  },
  {
    to: "/hogskoleprovet-formler",
    titel: "Formler",
    text: "Formlerna till XYZ och KVA, med uppgifter ur gamla prov.",
  },
  {
    to: "/ordlista",
    titel: "Ordlista",
    text: "Över 10 000 ord med betydelse, exempelmening och liknande ord.",
  },
  {
    to: "/forum",
    titel: "Forum",
    text: "Frågor, svar och genomgångar av provuppgifter.",
  },
];

export function Resurser() {
  return (
    <section id="resurser" className="border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <h2 className="max-w-[20ch] text-[30px] leading-tight tracking-[-0.035em] sm:text-[42px]">
          Mer om högskoleprovet
        </h2>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {RESURSER.map((r) => (
            <li key={r.to}>
              <Link
                to={r.to}
                className="block h-full rounded-xl border border-white/10 bg-card p-4 transition-colors hover:border-primary"
              >
                <span className="block text-[16px] font-semibold text-[var(--cream)]">
                  {r.titel}
                </span>
                <span className="mt-1 block text-[14px] leading-snug text-white/65">{r.text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
