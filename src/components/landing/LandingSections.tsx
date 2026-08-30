import { Link } from "@tanstack/react-router";
import { m } from "framer-motion";
import { Check } from "lucide-react";
import { Reveal } from "@/components/landing/MotionFX";
import { Stjarnor } from "@/components/landing/LandingHero";
import type { LandingStats } from "@/lib/landing.functions";
import { formatDecimal, formatInt } from "@/lib/sv-format";
import { rankedName } from "@/lib/username";
import { OMDOMEN, SNITTBETYG } from "@/data/omdomen";

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
  { v: "10 000+", k: "ord med förklaring" },
  { v: "4 800", k: "uppgifter i arkivet" },
  { v: "30", k: "provtillfällen" },
  { v: "120", k: "provpass med facit" },
  { v: "8", k: "delprov" },
  { v: "60", k: "verbala pass med ELF" },
];

export function BevisRemsan() {
  return (
    <section className="border-b border-white/10 bg-secondary" aria-label="Innehållet i siffror">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-5 px-4 py-6 sm:grid-cols-3 lg:grid-cols-6">
        {BEVIS.map((b, i) => (
          <div
            key={b.k}
            className={`px-4 ${i % 2 === 0 ? "border-l-0 pl-0" : "border-l border-white/10"} sm:border-l sm:border-white/10 sm:pl-4 ${i % 3 === 0 ? "sm:border-l-0 sm:pl-0" : ""} lg:border-l lg:border-white/10 lg:pl-4 ${i === 0 ? "lg:border-l-0 lg:pl-0" : ""}`}
          >
            <div className="font-mono text-[24px] font-medium leading-none tabular-nums tracking-tight sm:text-[28px]">
              {b.v}
            </div>
            <div className="mt-2 text-[12.5px] leading-tight text-white/70">{b.k}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- skalan */

/**
 * Signaturen: provets egen skala 0,6–2,0 som en linjal.
 *
 * Markörernas flaggor klamras inom linjen medan stjälken fortsätter peka
 * på sitt riktiga värde. Utan klampningen sticker den högra flaggan ut ur
 * viewporten på telefon och ger hela sidan en sidoscroll. De två ligger på
 * var sin våning (olika stjälkhöjd) eftersom de annars lägger sig ovanpå
 * varandra så fort linjen blir smalare än flaggorna.
 */
function Linjal() {
  const streck = Array.from({ length: 15 }, (_, i) => 0.6 + i * 0.1);
  return (
    <div className="relative pb-10 pt-[104px]">
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
        <Markor pos={78} ton="bark" hog etikett="Högst på sajten · 1,75" />
        <Markor pos={43} ton="apple" etikett="Efter tolv matcher · 1,15" />
      </div>
    </div>
  );
}

function Markor({
  pos,
  etikett,
  ton,
  hog = false,
}: {
  pos: number;
  etikett: string;
  ton: "apple" | "bark";
  hog?: boolean;
}) {
  const farg = ton === "apple" ? "bg-primary" : "bg-bark";
  return (
    <span
      className="absolute bottom-[calc(100%+6px)] -translate-x-1/2 whitespace-nowrap text-center"
      style={{ left: `${pos}%`, maxWidth: "min(100%, 15rem)" }}
    >
      <span
        className={`inline-block rounded-sm px-2.5 py-1 font-mono text-[12.5px] font-medium text-on-brand ${farg}`}
      >
        {etikett}
      </span>
      <span className={`mx-auto block w-[2px] ${farg} ${hog ? "h-[54px]" : "h-[18px]"}`} />
    </span>
  );
}

export function EloSkalan() {
  return (
    <section id="skalan" className="border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
          <Reveal>
            <h2 className="max-w-[16ch] text-[30px] leading-tight tracking-[-0.035em] sm:text-[42px]">
              Du får veta var du står nu, inte på provdagen.
            </h2>
          </Reveal>
          <Reveal delay={0.06}>
            <p className="max-w-[46ch] text-[16px] leading-relaxed text-white/70">
              Rättar du ett prov själv får du veta vad du kunde den dagen. Din ELO mäts mot andra
              som pluggar samma sak, flyttas efter varje match, och går att läsa av direkt på
              provets egen skala.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div className="overflow-hidden">
            <Linjal />
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
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <div className="mb-8 grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
          <Reveal>
            <h2 className="max-w-[16ch] text-[30px] leading-tight tracking-[-0.035em] sm:text-[42px]">
              Åtta delprov, samma bank som provet.
            </h2>
          </Reveal>
          <Reveal delay={0.06}>
            <p className="max-w-[46ch] text-[16px] leading-relaxed text-white/70">
              Träna ett i taget, eller kör ett helt provpass med klockan igång. Varje uppgift kommer
              ur ett publicerat prov och har sitt eget facit.
            </p>
          </Reveal>
        </div>

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
          Ordträningen har utöver arkivets 600 en egen bank på 10 000+ uppslag, varje ord med
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
    <section id="arkivet" className="border-b border-white/10">
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
          <Reveal>
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

export function Topplistan({ stats }: { stats: LandingStats | null }) {
  const rader = (stats?.topPlayers ?? []).filter((p) => p.type === "verbal").slice(0, 6);
  if (rader.length === 0) return null;
  const hogst = rader[0]?.elo ?? 1;

  return (
    <section id="topplistan" className="border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <div className="mb-8 grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
          <Reveal>
            <h2 className="text-[30px] leading-tight tracking-[-0.035em] sm:text-[42px]">
              Högst just nu.
            </h2>
          </Reveal>
          <Reveal delay={0.06}>
            <p className="max-w-[46ch] text-[16px] leading-relaxed text-white/70">
              Verbal ELO, uppdaterad i samma sekund en match tar slut. Du matchas mot någon nära din
              egen nivå, inte mot den som ligger överst.
            </p>
          </Reveal>
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:gap-16">
          <Reveal>
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

export function Omdomen() {
  return (
    <section className="border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <div className="mb-8 grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
          <Reveal>
            <div>
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-[40px] font-medium leading-none tabular-nums tracking-tight">
                  {formatDecimal(SNITTBETYG, 1)}
                </span>
                <Stjarnor betyg={SNITTBETYG} storlek={16} />
                <span className="text-[14px] text-white/70">
                  av 5, från {OMDOMEN.length} som skrivit provet
                </span>
              </div>
              <h2 className="mt-4 max-w-[16ch] text-[30px] leading-tight tracking-[-0.035em] sm:text-[42px]">
                Vad de säger som redan gjort det.
              </h2>
            </div>
          </Reveal>
          <Reveal delay={0.06}>
            <p className="max-w-[46ch] text-[16px] leading-relaxed text-white/70">
              Riktiga personer med riktiga resultat. Snittet är uträknat ur listan, inte satt för
              hand.
            </p>
          </Reveal>
        </div>

        {/* Tre i taget, resten genom att skrolla i sidled.
            Ordningen i OMDOMEN är inte godtycklig: Aron, Gustav och Niklas
            står först därför att de är de tre som har ett resultat att peka
            på (2,0, 1,9 och 1,95), och det är dem förstaintrycket ska bäras
            av. De övriga tre är korta och når man med en swipe.

            Native scroll med snap, inte en karusell med pilar och prickar.
            Skälet är att karusellmaskineriet vägde mer än innehållet: sex
            citat varav två är ett ord långa behöver ingen kontrollpanel.
            Behållaren har egen overflow-x så sidan aldrig scrollar i sidled. */}
        <div
          className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]"
          role="group"
          aria-label="Omdömen, skrolla i sidled för fler"
        >
          {OMDOMEN.map((o, i) => (
            <figure
              key={o.namn}
              className="flex shrink-0 snap-start basis-[86%] flex-col rounded-xl border border-white/10 bg-card p-6 sm:basis-[calc(50%-10px)] lg:basis-[calc(33.333%-14px)]"
            >
              <Stjarnor betyg={o.betyg ?? 5} />
              <blockquote className="mt-4 flex-1 text-[16.5px] leading-relaxed">
                {o.citat}
              </blockquote>
              <figcaption className="mt-5 border-t border-white/8 pt-4 text-[13.5px] text-white/70">
                <b className="font-bold text-foreground">{o.namn}</b>
                {[o.roll, o.alder, o.resultat ? `${o.resultat} på provet` : null]
                  .filter(Boolean)
                  .map((d) => `, ${d}`)
                  .join("")}
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-4 text-[13px] text-white/55">
          Skrolla i sidled för de {OMDOMEN.length - 3} övriga.
        </p>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- coachning */

const COACH_INGAR = [
  "Du väljer en tid i kalendern innan du betalar.",
  "Vi går igenom dina siffror och var tiondelarna faktiskt ligger.",
  "Du får ett upplägg att följa fram till provdagen.",
];

export function Coachningen({
  pris,
  villkor,
  onOppna,
  sektionRef,
}: {
  pris: string | null;
  villkor: string | null;
  onOppna: () => void;
  sektionRef: (el: HTMLElement | null) => void;
}) {
  return (
    <section ref={sektionRef} id="coachning" className="border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="grid items-center gap-8 rounded-xl border border-success-line bg-success-soft p-7 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)] lg:gap-14">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-success">
              Personlig coachning
            </p>
            <h2 className="mt-3 max-w-[18ch] text-[26px] leading-tight tracking-[-0.03em] sm:text-[34px]">
              Träningen tar dig långt. Ett upplägg tar dig hela vägen.
            </h2>
            <p className="mt-4 max-w-[52ch] text-[16px] leading-relaxed text-white/70">
              Allt annat här är gratis och sköter sig självt. Det här är det enda som kostar: en
              genomgång med någon som själv skrev 1,95, och ett schema byggt efter var du står och
              hur många veckor du har kvar.
            </p>
            <ul className="mt-5 grid gap-2.5">
              {COACH_INGAR.map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-[15px]">
                  <Check className="mt-[3px] h-4 w-4 shrink-0 text-success" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div>
            {pris ? (
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[42px] font-medium leading-none tabular-nums tracking-tight text-success">
                  {pris}
                </span>
              </div>
            ) : null}
            <m.button
              type="button"
              onClick={onOppna}
              whileTap={{ scale: 0.985 }}
              className="mt-4 inline-flex min-h-[52px] w-full items-center justify-center rounded-md bg-success px-7 text-[15px] font-bold text-success-ink transition-opacity hover:opacity-90"
            >
              {pris ? "Boka en tid" : "Läs mer om coachning"}
            </m.button>
            <p className="mt-3 text-[13px] text-white/55">
              {villkor ? `${villkor}. ` : ""}Inget konto behövs. Begränsat antal platser.
            </p>
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
