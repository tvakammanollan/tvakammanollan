import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { m } from "framer-motion";
import {
  ArrowRight,
  Swords,
  BookOpenText,
  FileText,
  Star,
  Timer,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getLandingStats, type LandingStats } from "@/lib/landing.functions";
import { getNextHpDate } from "@/lib/hp-dates";
import { formatDecimal, formatInt } from "@/lib/sv-format";
import { Reveal } from "@/components/landing/MotionFX";
import { CoachingModal } from "@/components/CoachingModal";
import { useCoachingOffer, coachingPriceLabel, coachingTermsLabel } from "@/hooks/useCoachingOffer";

/**
 * Landningssidan (utloggad).
 *
 * Sektionsordningen följer en klassisk konverterande SaaS-landning:
 * hjälte → förtroenderad → problem → tre funktioner → delproven →
 * siffror → omdömen → topplista → frågor → slut-CTA.
 *
 * Alla siffror är riktiga och kommer ur getLandingStats eller ur
 * provarkivet. Omdömena är riktiga personer med riktiga resultat —
 * inga påhittade citat. Snittbetyget under hjälte-CTA:n är räknat ur
 * OMDOMEN och får inte skrivas för hand: SNITTBETYG nedan. Ingen
 * prissektion, sajten är gratis.
 */

const DELPROV = [
  { kod: "ORD", namn: "Ordförståelse", del: "Verbal" },
  { kod: "LÄS", namn: "Svensk läsförståelse", del: "Verbal" },
  { kod: "MEK", namn: "Meningskomplettering", del: "Verbal" },
  { kod: "ELF", namn: "Engelsk läsförståelse", del: "Verbal" },
  { kod: "XYZ", namn: "Matematisk problemlösning", del: "Kvantitativ" },
  { kod: "KVA", namn: "Kvantitativa jämförelser", del: "Kvantitativ" },
  { kod: "NOG", namn: "Kvantitativa resonemang", del: "Kvantitativ" },
  { kod: "DTK", namn: "Diagram, tabeller, kartor", del: "Kvantitativ" },
];

/**
 * Riktiga personer, riktiga resultat. Inget av det här är påhittat.
 * De tre första visas först; resten når man med pilarna.
 *
 * `betyg` utelämnas när personen gav fem stjärnor — det är fallet för
 * alla utom Liang, och en explicit femma på varje rad hade bara gjort
 * det lättare att missa den som inte är det.
 */
const OMDOMEN = [
  {
    citat:
      "Det är ett gott tecken när det känns roligt och engagerande att plugga inför högskoleprovet.",
    namn: "Aron",
    resultat: "2,0",
    alder: "18 år",
  },
  {
    citat: "Tvåkommanollan har allt som behövs för att lyckas på högskoleprovet.",
    namn: "Gustav",
    resultat: "1,9",
    alder: "18 år",
  },
  {
    citat:
      "Tvåkommanollan innehåller verktyg jag hade haft stor nytta av när jag pluggade till högskoleprovet, helt gratis.",
    namn: "Niklas",
    resultat: "1,95",
    roll: "Grundare",
  },
  { citat: "Utmärkt!", namn: "Liang", alder: "19 år", betyg: 4 },
  { citat: "Jättebra!", namn: "Ann" },
  { citat: "Det är skönt att ha allt samlat på ett ställe.", namn: "Theo" },
];

const OMDOME_FARG = ["#ae2f26", "#2f6b3c", "#7a5236"];

/** Snittet av OMDOMEN, inte en siffra någon valt. Just nu 4,8. */
const SNITTBETYG = OMDOMEN.reduce((summa, o) => summa + (o.betyg ?? 5), 0) / OMDOMEN.length;

/**
 * Stjärnor med delfyllnad. Snittet är inte längre ett jämnt tal, och fem
 * fyllda stjärnor bredvid siffran 4,8 säger emot siffran.
 */
function Stjarnor({ betyg = 5 }: { betyg?: number }) {
  return (
    <div
      className="flex select-none gap-0.5"
      aria-label={`${formatDecimal(betyg, Number.isInteger(betyg) ? 0 : 1)} av 5`}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const fyllnad = Math.max(0, Math.min(1, betyg - i));
        return (
          <span key={i} className="relative inline-flex h-3.5 w-3.5" aria-hidden>
            <Star className="h-3.5 w-3.5 text-[#ae2f26]" />
            {fyllnad > 0 ? (
              <span
                className="absolute inset-y-0 left-0 overflow-hidden"
                style={{ width: `${fyllnad * 100}%` }}
              >
                <Star className="h-3.5 w-3.5 fill-[#ae2f26] text-[#ae2f26]" />
              </span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}

export function HeroLanding() {
  const fetchStats = useServerFn(getLandingStats);
  const [stats, setStats] = useState<LandingStats | null>(null);
  const [omdomeIdx, setOmdomeIdx] = useState(0);
  const [coachingOpen, setCoachingOpen] = useState(false);
  const coachingErbjudande = useCoachingOffer().offer;
  const coachingPris = coachingPriceLabel(coachingErbjudande);
  const coachingVillkor = coachingTermsLabel(coachingErbjudande);

  useEffect(() => {
    let alive = true;
    fetchStats()
      .then((s) => alive && setStats(s))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [fetchStats]);

  const next = getNextHpDate();
  const dagarKvar = next
    ? Math.max(0, Math.ceil((next.date.getTime() - Date.now()) / 86_400_000))
    : null;

  return (
    <div className="w-full">
      {/* ---------- hjälte ---------- */}
      <section className="mx-auto max-w-4xl px-4 pb-14 pt-16 text-center sm:pt-24">
        <m.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/55"
        >
          Gratis · riktiga provfrågor · ELO i realtid
        </m.p>

        <m.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.06 }}
          className="mx-auto mt-6 max-w-3xl text-[42px] leading-[1.03] tracking-tight sm:text-[68px]"
        >
          Plugga tills det sitter.
        </m.h1>

        <m.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12 }}
          className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-white/70"
        >
          Möt någon i realtid med riktiga HP-frågor. ELO som rör sig efter varje match, 10 000 ord
          med upprepning i intervaller, och 30 gamla prov med facit.
        </m.p>

        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18 }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            to="/matchmaking"
            search={{ type: "verbal" }}
            className="group inline-flex h-[54px] items-center justify-center gap-2 rounded-xl bg-[#ae2f26] px-8 text-[15px] font-semibold text-[#fff8f5] transition-all hover:bg-[#8f2620] hover:shadow-[0_10px_30px_-12px_rgba(174,47,38,0.7)]"
          >
            Starta en duell
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
          <Link
            to="/gamla-prov"
            className="inline-flex h-[54px] items-center justify-center rounded-xl border border-white/15 px-8 text-[15px] font-semibold transition-colors hover:bg-white/[0.04]"
          >
            Se gamla prov
          </Link>
        </m.div>

        {/* social proof direkt under CTA, som Orkael */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.28 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-white/60"
        >
          <span className="inline-flex items-center gap-2">
            <Stjarnor betyg={SNITTBETYG} />
            <span className="font-semibold text-white/75">{formatDecimal(SNITTBETYG, 1)}</span>
          </span>
          {stats ? (
            <>
              <span>{formatInt(stats.totalPlayers)} spelare</span>
              <span>{formatInt(stats.totalMatches)} matcher spelade</span>
            </>
          ) : null}
        </m.div>
      </section>

      {/* ---------- förtroenderad ---------- */}
      <section className="border-y border-white/10">
        <div className="mx-auto grid max-w-5xl grid-cols-1 divide-y divide-white/10 px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            {
              icon: BookOpenText,
              t: "10 000+ ord",
              s: "ur prov sedan 1990-talet",
              c: "#2f6b3c",
            },
            { icon: FileText, t: "30 gamla prov", s: "120 provpass med facit", c: "#7a5236" },
            { icon: Swords, t: "8 delprov", s: "verbalt och kvantitativt", c: "#ae2f26" },
          ].map(({ icon: Icon, t, s, c }, i) => (
            <Reveal key={t} delay={i * 0.06}>
              <div className="flex items-center gap-3 px-2 py-6">
                <Icon className="h-5 w-5 shrink-0" style={{ color: c }} aria-hidden />
                <div>
                  <div className="text-[15px] font-semibold">{t}</div>
                  <div className="text-sm text-white/60">{s}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- problemet ---------- */}
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:py-24">
        <Reveal>
          <h2 className="text-[30px] leading-tight tracking-tight sm:text-[42px]">
            Problemet är sällan att du inte kan.
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-white/70">
            Det är att du inte vet vad du ska plugga härnäst. Ett pass här, ett gammalt prov där,
            och ingen aning om det gav något. Siffran rör sig inte förrän på provdagen.
          </p>
        </Reveal>
        <Reveal delay={0.14}>
          <p className="mx-auto mt-4 max-w-xl text-[17px] leading-relaxed text-white/70">
            Här räknas varje svar in direkt. Du ser glappet mellan verbal och kvantitativ del med en
            gång, och det är oftast där nästa poäng ligger.
          </p>
        </Reveal>
      </section>

      {/* ---------- tre sätt att träna ---------- */}
      <section className="mx-auto max-w-5xl px-4 pb-20 sm:pb-24">
        <Reveal>
          <h2 className="text-center text-[28px] tracking-tight sm:text-[36px]">
            Tre sätt att träna
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Swords,
              t: "Dueller i realtid",
              s: "Möt en riktig motståndare med klockan igång. ELO justeras efter varje match, separat för verbal och kvantitativ del.",
              to: "/matchmaking" as const,
              search: { type: "verbal" as const },
              cta: "Starta en duell",
            },
            {
              icon: BookOpenText,
              t: "Ordträning",
              s: "10 000 ord med upprepning i intervaller. Ord du missar kommer tillbaka och lämnar högen först när du suttit dem fem gånger i rad.",
              to: "/ord" as const,
              cta: "Öva ord",
            },
            {
              icon: FileText,
              t: "Gamla prov",
              s: "30 provtillfällen, 120 provpass, facit på varje uppgift. Kör ett helt pass med klocka eller plocka enskilda delprov.",
              to: "/gamla-prov" as const,
              cta: "Se arkivet",
            },
          ].map(({ icon: Icon, t, s, to, search, cta }, i) => (
            <Reveal key={t} delay={i * 0.08}>
              <m.div
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-6"
              >
                <Icon className="h-6 w-6 text-[#ae2f26]" aria-hidden />
                <h3 className="mt-5 text-[20px] tracking-tight">{t}</h3>
                <p className="mt-2.5 flex-1 text-[15px] leading-relaxed text-white/65">{s}</p>
                <Link
                  to={to}
                  {...(search ? { search } : {})}
                  className="group mt-6 inline-flex min-h-11 items-center gap-1.5 text-[14px] font-semibold text-[#ae2f26] hover:underline"
                >
                  {cta}
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              </m.div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- delproven ---------- */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:py-24">
          <Reveal>
            <h2 className="text-center text-[28px] tracking-tight sm:text-[36px]">
              Alla åtta delprov
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {DELPROV.map((d, i) => (
              <Reveal key={d.kod} delay={(i % 4) * 0.05}>
                <m.div
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 320, damping: 24 }}
                >
                  <Link
                    to="/ova/$delprov"
                    params={{ delprov: d.kod.toLowerCase() }}
                    className="block rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition-colors hover:bg-white/[0.05]"
                  >
                    <div className="font-display text-[24px] tracking-tight">{d.kod}</div>
                    <div className="mt-1 text-[13px] text-white/60">{d.namn}</div>
                    <div className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white/45">
                      {d.del}
                    </div>
                  </Link>
                </m.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- vad som finns i banken ---------- */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:py-24">
          <Reveal>
            <h2 className="text-center text-[28px] tracking-tight sm:text-[36px]">
              Allt som någonsin publicerats, på ett ställe
            </h2>
          </Reveal>
          <Reveal delay={0.06}>
            <p className="mx-auto mt-5 max-w-xl text-center text-[16px] leading-relaxed text-white/65">
              Provhäftena finns utspridda hos UHR i olika format och försvinner ur listorna med
              tiden. Här är de inlästa, uppdelade per delprov och sökbara.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { l: "Ord i databasen", v: "10 000+", s: "med definitioner", c: "#2f6b3c" },
              { l: "Uppgifter", v: "15 000+", s: "ord och provfrågor", c: "#7a5236" },
              { l: "Gamla prov", v: "30", s: "VT2012 och framåt", c: "#ae2f26" },
              { l: "Provpass", v: "120", s: "hela pass med klocka", c: "#2f6b3c" },
            ].map((x, i) => (
              <Reveal key={x.l} delay={i * 0.06}>
                <m.div
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 320, damping: 24 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-6"
                >
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">
                    {x.l}
                  </div>
                  <div className="mt-2 font-mono text-4xl tabular-nums" style={{ color: x.c }}>
                    {x.v}
                  </div>
                  <div className="mt-1.5 text-sm text-white/60">{x.s}</div>
                </m.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- coachning ---------- */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:py-24">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-8 sm:p-12">
            <Reveal>
              <p
                className="text-[11px] font-bold uppercase tracking-[0.16em]"
                style={{ color: "#2f6b3c" }}
              >
                Personlig coachning
              </p>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="mt-4 text-[28px] leading-tight tracking-tight sm:text-[36px]">
                Vill du ha ett upplägg som är gjort för dig?
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-white/70">
                Träningen här tar dig långt på egen hand. Men vet du inte var du ska lägga tiden går
                det att få ett studieupplägg av någon som själv skrivit högt på provet, byggt efter
                var du står och hur lång tid du har kvar.
              </p>
            </Reveal>
            <Reveal delay={0.18}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => setCoachingOpen(true)}
                  className="group inline-flex h-[52px] items-center justify-center gap-2 rounded-xl px-7 text-[15px] font-semibold text-[#fff8f5] transition-all hover:brightness-110"
                  style={{ background: "#2f6b3c" }}
                >
                  {coachingPris ? `Kom igång för ${coachingPris}` : "Läs mer om coachning"}
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </button>
                <span className="text-sm text-white/55">
                  {coachingVillkor ? `${coachingVillkor} · ` : ""}Begränsat antal platser
                </span>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- omdömen ---------- */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:py-24">
          <Reveal>
            <h2 className="text-center text-[28px] tracking-tight sm:text-[36px]">
              Vad de som skrivit provet säger
            </h2>
          </Reveal>
          <div className="relative mt-12">
            {/* Tre i taget på desktop, ett på mobil. Pilarna roterar
                fönstret så att Ann och Theo nås utan att trängas in i
                förstaintrycket. */}
            <div className="grid gap-4 md:grid-cols-3">
              {[0, 1, 2].map((slot) => {
                const o = OMDOMEN[(omdomeIdx + slot) % OMDOMEN.length];
                return (
                  <m.figure
                    key={o.namn}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: slot * 0.05 }}
                    whileHover={{ y: -4 }}
                    className={`flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-6 ${slot > 0 ? "hidden md:flex" : ""}`}
                  >
                    <Stjarnor betyg={o.betyg ?? 5} />
                    <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-white/75">
                      {o.citat}
                    </blockquote>
                    <figcaption className="mt-6 flex items-center gap-3 border-t border-white/10 pt-4">
                      <span
                        className="flex h-9 w-9 items-center justify-center rounded-full font-display text-[15px] text-[#fff8f5]"
                        style={{ background: OMDOME_FARG[o.namn.charCodeAt(0) % 3] }}
                      >
                        {o.namn[0]}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[14px] font-semibold">{o.namn}</span>
                        <span className="block text-[12px] text-white/55">
                          {[o.roll, o.alder, o.resultat ? o.resultat + " på provet" : null]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                    </figcaption>
                  </m.figure>
                );
              })}
            </div>

            <div className="mt-8 flex select-none items-center justify-center gap-3">
              <button
                type="button"
                aria-label="Föregående omdömen"
                onClick={() => setOmdomeIdx((i) => (i - 1 + OMDOMEN.length) % OMDOMEN.length)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 transition-colors hover:bg-white/[0.05]"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </button>
              <div className="flex gap-1.5" aria-hidden>
                {OMDOMEN.map((o, i) => (
                  <span
                    key={o.namn}
                    className="h-1.5 w-1.5 rounded-full transition-colors"
                    style={{ background: i === omdomeIdx ? "#ae2f26" : "rgba(46,30,20,0.22)" }}
                  />
                ))}
              </div>
              <button
                type="button"
                aria-label="Fler omdömen"
                onClick={() => setOmdomeIdx((i) => (i + 1) % OMDOMEN.length)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 transition-colors hover:bg-white/[0.05]"
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- topplista ---------- */}
      {stats && stats.topPlayers.length > 0 ? (
        <section className="border-t border-white/10">
          <div className="mx-auto max-w-3xl px-4 py-20 sm:py-24">
            <Reveal>
              <h2 className="text-center text-[28px] tracking-tight sm:text-[36px]">
                Högst just nu
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="mt-10 overflow-hidden rounded-2xl border border-white/10">
                <table className="w-full text-[15px]">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02]">
                      <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-white/55">
                        Spelare
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-white/55">
                        Del
                      </th>
                      <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.12em] text-white/55">
                        ELO
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topPlayers.slice(0, 6).map((p, i) => (
                      <tr
                        key={p.username + p.type + i}
                        className="border-b border-white/10 transition-colors last:border-0 hover:bg-white/[0.03]"
                      >
                        <td className="px-4 py-3 font-medium">{p.username}</td>
                        <td className="px-4 py-3 text-white/60">
                          {p.type === "verbal" ? "Verbal" : "Kvantitativ"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {formatInt(p.elo)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Reveal>
            <div className="mt-6 text-center">
              <Link
                to="/leaderboard"
                className="group inline-flex min-h-11 items-center gap-1.5 text-[14px] font-semibold text-[#ae2f26] hover:underline"
              >
                Hela topplistan
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* ---------- slut ---------- */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <Reveal>
            <h2 className="text-[34px] leading-tight tracking-tight sm:text-[48px]">
              Börja med en match.
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mx-auto mt-5 max-w-md text-[16px] text-white/65">
              Inget konto behövs för att testa. Det tar tre minuter.
              {dagarKvar !== null ? ` ${dagarKvar} dagar kvar till provet.` : ""}
            </p>
          </Reveal>
          <Reveal delay={0.14}>
            <Link
              to="/matchmaking"
              search={{ type: "verbal" }}
              className="group mt-9 inline-flex h-[54px] items-center justify-center gap-2 rounded-xl bg-[#ae2f26] px-9 text-[15px] font-semibold text-[#fff8f5] transition-all hover:bg-[#8f2620] hover:shadow-[0_10px_30px_-12px_rgba(174,47,38,0.7)]"
            >
              Starta en duell
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </Reveal>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-white/50">
            <Timer className="h-3.5 w-3.5" aria-hidden />
            Inget konto behövs för att testa
          </div>
        </div>
      </section>

      {/* Köpet kräver inget konto — besökaren som vill ha ett upplägg ska inte
          först tvingas registrera sig. Stripe samlar in mejl och telefon. */}
      <CoachingModal open={coachingOpen} onOpenChange={setCoachingOpen} source="landing" />
    </div>
  );
}
