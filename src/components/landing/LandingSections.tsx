import { Link } from "@tanstack/react-router";
import { m } from "framer-motion";
import { Check } from "lucide-react";
import { Reveal } from "@/components/landing/MotionFX";
import type { LandingStats } from "@/lib/landing.functions";
import { formatDecimal, formatInt } from "@/lib/sv-format";
import { rankedName } from "@/lib/username";

/**
 * Landningssidans sektioner nedanför hjälten.
 *
 * Siffrorna är kontrollerade mot databasen och provarkivet 2026-08-30:
 * arkivet 4 800 (src/data/prov, 30 × 160), 120 provpass, 8 delprov.
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
 * 600 ORD-uppgifter som en del av sina 4 800. Att skriva ordbankens tal i
 * delprovstabellen vore alltså fel oavsett vilket tal som används.
 */

/* ---------------------------------------------------------------- remsan */

const BEVIS = [
  { v: "10\u00a0000+", k: "ord med förklaring" },
  { v: "4 800", k: "uppgifter i arkivet" },
  { v: "30", k: "provtillfällen" },
  { v: "120", k: "provpass med facit" },
  { v: "8", k: "delprov" },
  { v: "60", k: "verbala pass med ELF" },
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

/* ----------------------------------------------------------------- skalan */

/**
 * Signaturen: provets egen skala 0,6–2,0 som en linjal.
 *
 * ALLT SOM SITTER PÅ LINJEN ÄR CENTRERAT PÅ SIN POSITION, alltså sticker
 * det ut med halva sin bredd i ändarna. Första versionen löste det med
 * `overflow-hidden` på behållaren, vilket inte flyttar in något utan bara
 * KLIPPER det: `0,6` kapades 12px och `2,0` 10px på varje skärmbredd,
 * desktop inkluderad, och den högra markören 16px till vid 380px.
 *
 * Lösningen är sidopadding på behållaren i stället för klippning. Linjen
 * blir 16px kortare i vardera änden, vilket är precis det utrymme en
 * centrerad ändpunktsetikett behöver (halva "0,6" är ~12px).
 *
 * Av samma skäl bär markörerna bara sitt VÄRDE på linjen (~30px breda,
 * ryms överallt) medan orden står i teckenförklaringen under. Det tog
 * också bort behovet av två stjälkhöjder: "1,15" och "1,75" ligger 35
 * procentenheter isär och kan inte kollidera.
 */
const MARKORER = [
  { pos: 43, ton: "apple" as const, varde: 1.15, ord: "Efter tolv matcher" },
  { pos: 78, ton: "bark" as const, varde: 1.75, ord: "Högst på sajten" },
];

function Linjal() {
  const streck = Array.from({ length: 15 }, (_, i) => 0.6 + i * 0.1);
  return (
    <div className="relative px-4 pb-10 pt-16">
      <div className="relative h-[2px] bg-foreground">
        {streck.map((v) => {
          const stor = Math.round(v * 10) % 2 === 0;
          return (
            <span
              key={v.toFixed(1)}
              className={`absolute top-0 -translate-x-1/2 ${stor ? "h-5 w-[2px] bg-foreground" : "h-[11px] w-px bg-white/25"}`}
              style={{ left: `${((v - 0.6) / 1.4) * 100}%` }}
            >
              {stor ? (
                <span className="absolute left-0 top-6 -translate-x-1/2 whitespace-nowrap font-mono text-[12.5px] font-medium tabular-nums">
                  {formatDecimal(v, 1)}
                </span>
              ) : null}
            </span>
          );
        })}
        {MARKORER.map((m) => (
          <Markor key={m.ord} pos={m.pos} ton={m.ton} varde={m.varde} />
        ))}
      </div>
    </div>
  );
}

function Markor({ pos, varde, ton }: { pos: number; varde: number; ton: "apple" | "bark" }) {
  const farg = ton === "apple" ? "bg-primary" : "bg-bark";
  return (
    <span
      className="absolute bottom-[calc(100%+6px)] -translate-x-1/2 whitespace-nowrap text-center"
      style={{ left: `${pos}%` }}
    >
      <span
        className={`inline-block rounded-sm px-2 py-1 font-mono text-[12.5px] font-medium tabular-nums text-on-brand ${farg}`}
      >
        {formatDecimal(varde, 2)}
      </span>
      <span className={`mx-auto block h-[18px] w-[2px] ${farg}`} />
    </span>
  );
}

/** Orden till markörerna. På linjen får bara siffran plats. */
function Teckenforklaring() {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
      {MARKORER.map((m) => (
        <span key={m.ord} className="inline-flex items-center gap-2 text-[14px] text-white/70">
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-sm ${m.ton === "apple" ? "bg-primary" : "bg-bark"}`}
            aria-hidden
          />
          {m.ord}
          <b className="font-mono font-medium tabular-nums text-foreground">
            {formatDecimal(m.varde, 2)}
          </b>
        </span>
      ))}
    </div>
  );
}

export function EloSkalan() {
  return (
    <section id="skalan" className="border-b border-white/10">
      {/* Sidans tes får mest luft och en egen rubriksättning: bred,
          enspaltig, större. De andra sektionerna ska inte se ut så här. */}
      <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
        <Reveal>
          <h2 className="max-w-[20ch] text-[34px] leading-[1.05] tracking-[-0.04em] sm:text-[52px]">
            Du får veta var du står nu, inte på provdagen.
          </h2>
        </Reveal>
        <Reveal delay={0.06}>
          <p className="mt-5 max-w-[62ch] text-[17px] leading-relaxed text-white/70">
            Rättar du ett prov själv får du veta vad du kunde den dagen. Din ELO mäts mot andra som
            pluggar samma sak, flyttas efter varje match, och går att läsa av direkt på provets egen
            skala.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div>
            <Linjal />
            <Teckenforklaring />
          </div>
        </Reveal>

        <div className="grid gap-7 border-t border-white/10 pt-6 sm:grid-cols-2">
          <p className="max-w-[48ch] text-[15px] leading-relaxed text-white/70">
            <b className="font-bold text-foreground">Att vinna uppåt ger mer.</b> Slår du någon som
            ligger över dig stiger siffran mer än annars. Ju högre upp du kommer desto trögare rör
            den sig, så de sista tiondelarna kostar långt fler matcher än de första.
          </p>
          <p className="max-w-[48ch] text-[15px] leading-relaxed text-white/70">
            <b className="font-bold text-foreground">
              Verbalt och kvantitativt räknas var för sig.
            </b>{" "}
            Glappet mellan dina två siffror syns med en gång, och nästa tiondel ligger nästan alltid
            i den svagare. Totalpoängen är snittet av delarna, precis som på provet.
          </p>
        </div>
      </div>
    </section>
  );
}

/**
 * Kompakt rubrik för de datatunga sektionerna.
 *
 * Delproven och topplistan är tabeller. En 42px-rubrik med en egen
 * lede-spalt bredvid ger dem samma tyngd som sidans tes, vilket är fel
 * viktning och dessutom gjorde att fem sektioner i rad såg identiska ut.
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

/* -------------------------------------------------------------- delproven */

const DELPROV = [
  { kod: "ORD", slug: "ord", namn: "Ordförståelse", del: "Verbal", n: 600 },
  { kod: "LÄS", slug: "las", namn: "Svensk läsförståelse", del: "Verbal", n: 600 },
  { kod: "MEK", slug: "mek", namn: "Meningskomplettering", del: "Verbal", n: 600 },
  { kod: "ELF", slug: "elf", namn: "Engelsk läsförståelse", del: "Verbal", n: 600 },
  { kod: "XYZ", slug: "xyz", namn: "Matematisk problemlösning", del: "Kvantitativ", n: 720 },
  { kod: "KVA", slug: "kva", namn: "Kvantitativa jämförelser", del: "Kvantitativ", n: 600 },
  { kod: "NOG", slug: "nog", namn: "Kvantitativa resonemang", del: "Kvantitativ", n: 360 },
  { kod: "DTK", slug: "dtk", namn: "Diagram, tabeller och kartor", del: "Kvantitativ", n: 720 },
];

export function Delproven() {
  return (
    <section id="delprov" className="border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <TatRubrik
          titel="Åtta delprov, samma bank som provet."
          lede="Träna ett i taget, eller kör ett helt provpass med klockan igång. Varje uppgift kommer ur ett publicerat prov och har sitt eget facit."
        />

        <Reveal delay={0.1}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px]">
              <thead>
                <tr className="border-b border-white/25">
                  <th className="w-[76px] pb-2.5 pr-3 text-left font-mono text-[11px] font-normal uppercase tracking-[0.13em] text-white/55">
                    Kod
                  </th>
                  <th className="pb-2.5 pr-3 text-left font-mono text-[11px] font-normal uppercase tracking-[0.13em] text-white/55">
                    Delprov
                  </th>
                  <th className="w-[130px] pb-2.5 pr-3 text-left font-mono text-[11px] font-normal uppercase tracking-[0.13em] text-white/55">
                    Del
                  </th>
                  <th className="w-[120px] pb-2.5 text-right font-mono text-[11px] font-normal uppercase tracking-[0.13em] text-white/55">
                    I arkivet
                  </th>
                </tr>
              </thead>
              <tbody>
                {DELPROV.map((d) => (
                  <tr
                    key={d.kod}
                    className="border-b border-white/8 transition-colors hover:bg-white/[0.03]"
                  >
                    <td className="py-0 pr-3">
                      <Link
                        to="/ova/$delprov"
                        params={{ delprov: d.slug }}
                        className="flex min-h-[44px] items-center font-display text-[19px] font-bold tracking-tight hover:text-primary"
                      >
                        {d.kod}
                      </Link>
                    </td>
                    <td className="py-3 pr-3 text-[15px]">{d.namn}</td>
                    <td className="py-3 pr-3">
                      <span
                        className={`inline-block rounded-sm px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.08em] ${
                          d.del === "Verbal" ? "bg-primary/10 text-primary" : "bg-bark/10 text-bark"
                        }`}
                      >
                        {d.del}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono text-[14.5px] font-medium tabular-nums">
                      {formatInt(d.n)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>

        <p className="mt-5 max-w-[62ch] text-[13.5px] text-white/55">
          Ordträningen har utöver arkivets 600 en egen bank på 10&nbsp;000+ uppslag, varje ord med
          förklaring, exempelmening och de uppgifter det kommit ur.{" "}
          <Link to="/ordlista" className="font-bold text-primary hover:underline">
            Bläddra i ordlistan
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- arkivet */

const TERMINER = [
  "2012vt",
  "2012ht",
  "2013vt",
  "2013ht",
  "2014vt",
  "2014ht",
  "2015vt",
  "2015ht",
  "2016vt",
  "2016ht",
  "2017vt",
  "2017ht",
  "2018vt",
  "2018ht",
  "2019vt",
  "2019ht",
  "2020ht",
  "2021vt",
  "2021ht",
  "2022vt",
  "2022ht",
  "2023vt",
  "2023ht",
  "2024vt",
  "2024ht",
  "2025vt",
  "2025ht",
  "2026vt",
];

const ARKIVFAKTA = [
  { n: "30", t: "provtillfällen, alla kompletta" },
  { n: "120", t: "provpass à 40 uppgifter" },
  { n: "4 800", t: "uppgifter med facit" },
  { n: "60", t: "verbala pass med ELF i behåll" },
];

export function Arkivet() {
  return (
    // Arkivet ligger på nedsänkt yta. Det är sidans enda sektion som byter
    // botten, och den bryter den vertikala rytmen mitt på sidan utan att
    // layouten behöver bli en annan.
    <section id="arkivet" className="border-b border-white/10 bg-secondary">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <div className="mb-8 grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
          <Reveal>
            <h2 className="max-w-[16ch] text-[30px] leading-tight tracking-[-0.035em] sm:text-[42px]">
              Varje prov som gått att få tag på.
            </h2>
          </Reveal>
          <Reveal delay={0.06}>
            <p className="max-w-[46ch] text-[16px] leading-relaxed text-white/70">
              Kör ett helt pass på tid som på riktigt, eller plocka ut det delprov du vill åt. Facit
              på varje uppgift, och poängen räknas ut åt dig så snart du skrivit båda passen i en
              del.
            </p>
          </Reveal>
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-16">
          <Reveal className="min-w-0">
            <div className="flex flex-wrap gap-1.5">
              {TERMINER.map((t) => (
                <Link
                  key={t}
                  to="/gamla-prov/$term"
                  params={{ term: t }}
                  className="inline-flex min-h-[44px] items-center rounded-sm border border-white/10 bg-card px-3 font-mono text-[12.5px] tabular-nums text-white/70 transition-colors hover:border-primary hover:text-primary"
                >
                  {t.slice(0, 4)} {t.slice(4)}
                </Link>
              ))}
            </div>
            <p className="mt-4 max-w-[52ch] text-[13.5px] text-white/55">
              Vårprovet 2020 ställdes in och skrevs aldrig. Samma häfte användes i oktober samma år,
              och ligger därför under höstprovet.
            </p>
          </Reveal>

          <Reveal delay={0.08}>
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
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- topplistan */

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
    etikett: "Gamla prov",
    rubrik: "Skriv ett helt provpass under tiden det ska ta.",
    text: "120 provpass à 40 uppgifter, från vårprovet 2012 till vårprovet 2026. Facit på varje uppgift, normering på varje provdel.",
    cta: "Öppna arkivet",
    yta: "bg-sky",
    etikettFarg: "text-bark",
    textFarg: "text-bark",
    rubrikFarg: "text-[var(--cream)]",
    knapp: "border-2 border-bark text-bark",
  },
  {
    to: "/matchmaking",
    etikett: "Duellen",
    rubrik: "En duell är åtta uppgifter på fem minuter.",
    text: "Verbalt eller kvantitativt, mot en vän eller mot kön. Vid lika poäng vinner den som lämnade in först.",
    cta: "Starta en duell",
    yta: "bg-terracotta",
    etikettFarg: "text-[var(--cream-3)]",
    textFarg: "text-[var(--cream-3)]",
    rubrikFarg: "text-[var(--cream)]",
    knapp: "border-2 border-[var(--cream-3)] text-[var(--cream-3)]",
  },
  {
    to: "/mek-ovning",
    etikett: "MEK",
    rubrik: "Vi skriver egna MEK-uppgifter.",
    text: "Uppgifter vi skriver själva och blindprövar innan de publiceras. Arkivets MEK ligger kvar bredvid.",
    cta: "Öva på MEK",
    yta: "bg-plum",
    etikettFarg: "text-cream-wash",
    textFarg: "text-[var(--navy-3)]",
    rubrikFarg: "text-on-brand",
    knapp: "border-2 border-cream-wash text-cream-wash",
  },
  {
    to: "/ordlista",
    etikett: "Ordlistan",
    rubrik: "Alla ord förklarade, med provfrågan de kom från.",
    text: "Över 10\u00a0000 ord med betydelse, exempelmening, liknande ord och ordklass.",
    cta: "Slå upp ett ord",
    yta: "bg-lavender",
    etikettFarg: "text-[var(--plum)]",
    textFarg: "text-[var(--plum)]",
    rubrikFarg: "text-[var(--cream)]",
    knapp: "border-2 border-[var(--plum)] text-[var(--plum)]",
  },
] as const;

export function Produktytorna() {
  return (
    <section id="ytorna" className="border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <Reveal>
          <h2 className="mb-10 max-w-[18ch] text-[30px] leading-tight tracking-[-0.035em] sm:text-[42px]">
            Fyra sätt att plugga. Allt på samma konto.
          </h2>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2">
          {YTOR.map((y, i) => (
            <Reveal key={y.to} delay={i * 0.05} className="min-w-0">
              <Link
                to={y.to}
                className={`flex h-full flex-col rounded-[40px] p-7 transition hover:brightness-[1.03] sm:p-9 ${y.yta}`}
              >
                <p
                  className={`text-[11px] font-semibold uppercase tracking-[0.1em] ${y.etikettFarg}`}
                >
                  {y.etikett}
                </p>
                <h3 className={`mt-5 text-[24px] leading-tight tracking-[-0.02em] ${y.rubrikFarg}`}>
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
            </Reveal>
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
 * **Siffran måste stämma med Stripe.** Det finns exakt ett aktivt pris för
 * ordlistan: 150 kr för sex månader. Artboarden föreslår en uppdelning på
 * en månad för 150 och sex för 350, men den produkten finns inte i Stripe,
 * och en landningssida som lovar ett pris kassan inte kan ta är värre än
 * ingen prissektion alls. Skapa priset först, ändra `ACCESS_MONTHS`, och
 * skriv om det här sedan — i den ordningen.
 *
 * Studieupplägget är inte med: vi pivoterar bort från det.
 */
export function Priset() {
  return (
    <section id="priset" className="border-b border-white/10 bg-secondary">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <Reveal>
          <h2 className="mb-10 max-w-[20ch] text-[30px] leading-tight tracking-[-0.035em] sm:text-[42px]">
            Det mesta är gratis. Hela ordlistan och MEK kostar.
          </h2>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2">
          <Reveal className="min-w-0">
            <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-card p-7 sm:p-9">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/55">
                Konto
              </p>
              <p className="mt-4 text-[40px] leading-none tracking-[-0.03em]">0 kr</p>
              <ul className="mt-6 space-y-3 text-[15px] leading-relaxed text-white/70">
                {[
                  "Alla 30 provtillfällen med facit",
                  "Duellerna, båda provdelarna",
                  "40 ord och 40 MEK-uppgifter i träningsläget",
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
                className="mt-7 inline-flex min-h-[48px] items-center justify-center self-start rounded-lg bg-primary px-6 py-3 text-[15px] font-semibold text-on-brand transition hover:brightness-125"
              >
                Skapa konto
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.06} className="min-w-0">
            <div className="flex h-full flex-col rounded-3xl bg-lavender p-7 sm:p-9">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--plum)]">
                Hela ordlistan och MEK
              </p>
              <p className="mt-4 text-[40px] leading-none tracking-[-0.03em] text-[var(--cream)]">
                150 kr
              </p>
              <ul className="mt-6 space-y-3 text-[15px] leading-relaxed text-[var(--plum)]">
                {[
                  "Över 10\u00a0000 ord i träningsläget",
                  "Alla MEK-uppgifter, arkivets och våra egna",
                  "Ett köp låser upp båda",
                  "Gäller sex månader, engångsköp",
                ].map((rad) => (
                  <li key={rad} className="flex gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" />
                    {rad}
                  </li>
                ))}
              </ul>
              <div className="flex-1" />
              <Link
                to="/ord"
                className="mt-7 inline-flex min-h-[48px] items-center justify-center self-start rounded-lg border-2 border-[var(--plum)] px-6 py-3 text-[15px] font-semibold text-[var(--plum)]"
              >
                Läs mer
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function Topplistan({ stats }: { stats: LandingStats | null }) {
  const rader = (stats?.topPlayers ?? []).filter((p) => p.type === "verbal").slice(0, 6);
  if (rader.length === 0) return null;
  const hogst = rader[0]?.elo ?? 1;

  return (
    <section id="topplistan" className="border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <TatRubrik
          titel="Högst just nu."
          lede="Verbal ELO, uppdaterad i samma sekund en match tar slut. Du matchas mot någon nära din egen nivå, inte mot den som ligger överst."
        />

        {/* `min-w-0` på grid-itemet är inte kosmetik: ett grid-item har
            `min-width: auto` och kan därför inte krympa under sitt innehåll.
            Tabellen har `min-w-[420px]`, så utan detta växte den scrollande
            behållaren till 420px i en 380px viewport i stället för att
            scrolla, och gav hela sidan 56px sidoscroll. */}
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:gap-16">
          <Reveal className="min-w-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px]">
                <thead>
                  <tr className="border-b border-white/25">
                    <th className="w-[46px] pb-2.5 text-left font-mono text-[11px] font-normal uppercase tracking-[0.13em] text-white/55">
                      #
                    </th>
                    <th className="pb-2.5 pr-3 text-left font-mono text-[11px] font-normal uppercase tracking-[0.13em] text-white/55">
                      Spelare
                    </th>
                    <th className="w-[150px] pb-2.5 pr-3 text-left font-mono text-[11px] font-normal uppercase tracking-[0.13em] text-white/55">
                      Form
                    </th>
                    <th className="w-[90px] pb-2.5 text-right font-mono text-[11px] font-normal uppercase tracking-[0.13em] text-white/55">
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
          </Reveal>

          <Reveal delay={0.08}>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/55">
                Var du hamnar
              </p>
              <p className="mt-3 max-w-[44ch] text-[15px] leading-relaxed text-white/70">
                Alla börjar på 1000. De första matcherna kastar siffran fram och tillbaka, sedan
                lugnar den sig. Runt tolv matcher in är den värd att lita på.
              </p>
              <Link
                to="/leaderboard"
                className="mt-5 inline-flex min-h-[48px] items-center rounded-md border border-white/25 px-6 text-[14px] font-bold transition-colors hover:bg-white/[0.05]"
              >
                Se hela topplistan
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- omdömen */

/* -------------------------------------------------------------- coachning */

const COACH_INGAR = [
  "Du väljer en tid i kalendern innan du betalar.",
  "Vi går igenom dina siffror och var tiondelarna faktiskt ligger.",
  "Du får ett upplägg att följa fram till provdagen.",
];

/* ------------------------------------------------------------------ slut */

export function SlutCta({ dagarKvar, datum }: { dagarKvar: number | null; datum: string | null }) {
  return (
    <section className="border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <Reveal>
          <h2 className="max-w-[13ch] text-[38px] leading-[1.02] tracking-[-0.045em] sm:text-[60px]">
            Börja med en match.
          </h2>
        </Reveal>
        {dagarKvar !== null ? (
          <Reveal delay={0.06}>
            <div className="mt-6 flex flex-wrap items-baseline gap-4">
              <span className="font-mono text-[46px] font-medium leading-none tabular-nums tracking-[-0.045em] text-primary sm:text-[68px]">
                {formatInt(dagarKvar)}
              </span>
              <span className="max-w-[26ch] text-[16px] text-white/70">
                {dagarKvar === 1 ? "dag" : "dagar"} kvar till provet
                {datum ? ` den ${datum}` : ""}.
              </span>
            </div>
          </Reveal>
        ) : null}
        <Reveal delay={0.12}>
          <Link
            to="/matchmaking"
            search={{ type: "verbal" }}
            className="mt-8 inline-flex min-h-[52px] items-center justify-center rounded-md bg-primary px-8 text-[15px] font-bold text-on-brand transition-colors hover:bg-primary-deep"
          >
            Starta en duell
          </Link>
        </Reveal>
        <p className="mt-4 text-[13.5px] text-white/55">
          Fem minuter, åtta frågor, en motståndare. Inget konto behövs för att testa.
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
const RESURSER: Array<{ to: string; titel: string; text: string }> = [
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
    text: "Alla ORD-uppgifter från 30 prov, med rätt svar.",
  },
  {
    to: "/hogskoleprovet-formler",
    titel: "Formler",
    text: "Allt du behöver till XYZ och KVA, med riktiga uppgifter.",
  },
  {
    to: "/ordlista",
    titel: "Ordlista",
    text: "Varje ord som förekommit på provet, med betydelse.",
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
          Allt om högskoleprovet, på ett ställe.
        </h2>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {RESURSER.map((r) => (
            <li key={r.to}>
              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                to={r.to as any}
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
