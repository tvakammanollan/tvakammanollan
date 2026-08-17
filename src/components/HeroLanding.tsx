import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { m } from "framer-motion";
import { ArrowRight, Swords, BookOpenText, FileText, Star, Timer, Plus, Minus } from "lucide-react";
import { getLandingStats, type LandingStats } from "@/lib/landing.functions";
import { getNextHpDate } from "@/lib/hp-dates";
import { formatInt } from "@/lib/sv-format";
import { Reveal } from "@/components/landing/MotionFX";

/**
 * Landningssidan (utloggad).
 *
 * Sektionsordningen följer en klassisk konverterande SaaS-landning:
 * hjälte → förtroenderad → problem → tre funktioner → delproven →
 * siffror → omdömen → topplista → frågor → slut-CTA.
 *
 * Alla siffror är riktiga och kommer ur getLandingStats eller ur
 * provarkivet. Omdömena är riktiga personer med riktiga resultat —
 * inga påhittade citat och ingen uppfunnen genomsnittsrating. Ingen
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

/** Riktiga personer, riktiga resultat. Inget av det här är påhittat. */
const OMDOMEN = [
  {
    citat:
      "Det är ett gott tecken när det känns roligt och engagerande att plugga inför högskoleprovet.",
    namn: "Aron",
    resultat: "2,0",
  },
  {
    citat: "HP Kampen har allt som behövs för att lyckas på högskoleprovet.",
    namn: "Gustav",
    resultat: "1,9",
  },
  {
    citat:
      "HP Kampen innehåller verktyg jag hade haft stor nytta av när jag pluggade till högskoleprovet, helt gratis.",
    namn: "Niklas",
    resultat: "1,95",
    roll: "Grundare",
  },
];

/** Hämtat från sajtens egen FAQ så svaren stämmer med resten. */
const FRAGOR = [
  {
    q: "Är HP Kampen verkligen gratis?",
    a: "Ja. Helt gratis. Inga annonser, inget kreditkort, inga in-app-köp och inga premium-paket. Sajten finansieras av grundaren.",
  },
  {
    q: "Är frågorna från riktiga högskoleprov?",
    a: "Ja. Hela ordbanken bygger på publicerade högskoleprov från 1990-talet och framåt. Under Gamla prov kan du dessutom skriva hela riktiga provpass med facit på varje uppgift.",
  },
  {
    q: "Kan jag spela utan konto?",
    a: "Ja, du hoppar rakt in i en match som gäst. Kontot behövs först när du vill att ELO, streak och repetitionshögen ska sparas mellan gångerna.",
  },
  {
    q: "Hur fungerar ELO-systemet?",
    a: "Samma ratingsystem som i schack. Du börjar runt 1000 och talet rör sig efter vem du möter och hur det går. Verbal och kvantitativ del har varsitt tal, eftersom de mäter olika saker.",
  },
  {
    q: "Hur skapar jag en privat match med vänner?",
    a: "Gå till Vänner och bjud in via användarnamn. Du kan också dela en rumslänk som de klickar på för att hoppa rakt in i matchen.",
  },
];

function Stjarnor() {
  return (
    <div className="flex gap-0.5" aria-label="5 av 5">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} className="h-3.5 w-3.5 fill-[#ae2f26] text-[#ae2f26]" aria-hidden />
      ))}
    </div>
  );
}

export function HeroLanding() {
  const fetchStats = useServerFn(getLandingStats);
  const [stats, setStats] = useState<LandingStats | null>(null);
  const [open, setOpen] = useState<number | null>(0);

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
          Gratis · inga annonser · inget kort
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
          Möt någon i realtid med riktiga HP-frågor. ELO som rör sig efter varje match, 8 000 ord
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
            <Stjarnor />
            <span className="font-semibold text-white/75">5,0</span>
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
            { icon: BookOpenText, t: "8 000+ ord", s: "ur prov sedan 1990-talet" },
            { icon: FileText, t: "30 provtillfällen", s: "4 363 uppgifter med facit" },
            { icon: Swords, t: "8 delprov", s: "verbalt och kvantitativt" },
          ].map(({ icon: Icon, t, s }, i) => (
            <Reveal key={t} delay={i * 0.06}>
              <div className="flex items-center gap-3 px-2 py-6">
                <Icon className="h-5 w-5 shrink-0 text-[#ae2f26]" aria-hidden />
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
              s: "8 000 ord med upprepning i intervaller. Ord du missar kommer tillbaka och lämnar högen först när du suttit dem fem gånger i rad.",
              to: "/ord" as const,
              cta: "Öva ord",
            },
            {
              icon: FileText,
              t: "Gamla prov",
              s: "30 provtillfällen, 118 provpass, facit på varje uppgift. Kör ett helt pass med klocka eller plocka enskilda delprov.",
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
                <m.div whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 320, damping: 24 }}>
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

      {/* ---------- riktiga siffror ---------- */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:py-24">
          <Reveal>
            <h2 className="text-center text-[28px] tracking-tight sm:text-[36px]">
              Siffrorna är inte påhittade
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { l: "Spelare", v: stats && formatInt(stats.totalPlayers), s: "registrerade konton" },
              { l: "Matcher", v: stats && formatInt(stats.totalMatches), s: "spelade sedan starten" },
              { l: "Online nu", v: stats && formatInt(stats.activePlayers), s: "senaste kvarten" },
              {
                l: "Högsta ELO",
                v: stats && formatInt(Math.max(stats.topVerbalElo, stats.topMathElo)),
                s: "just nu",
              },
            ].map((x, i) => (
              <Reveal key={x.l} delay={i * 0.06}>
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">
                    {x.l}
                  </div>
                  <div className="mt-2 font-mono text-4xl tabular-nums">{x.v ?? "–"}</div>
                  <div className="mt-1.5 text-sm text-white/60">{x.s}</div>
                </div>
              </Reveal>
            ))}
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
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {OMDOMEN.map((o, i) => (
              <Reveal key={o.namn} delay={i * 0.08}>
                <m.figure
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-6"
                >
                  <Stjarnor />
                  <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-white/75">
                    {o.citat}
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 border-t border-white/10 pt-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ae2f26] font-display text-[15px] text-[#fff8f5]">
                      {o.namn[0]}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[14px] font-semibold">{o.namn}</span>
                      <span className="block text-[12px] text-white/55">
                        {o.roll ? o.roll + " · " : ""}
                        {o.resultat} på provet
                      </span>
                    </span>
                  </figcaption>
                </m.figure>
              </Reveal>
            ))}
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

      {/* ---------- frågor ---------- */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-2xl px-4 py-20 sm:py-24">
          <Reveal>
            <h2 className="text-center text-[28px] tracking-tight sm:text-[36px]">
              Vanliga frågor
            </h2>
          </Reveal>
          <div className="mt-10 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10">
            {FRAGOR.map((f, i) => (
              <div key={f.q}>
                <button
                  type="button"
                  onClick={() => setOpen(open === i ? null : i)}
                  aria-expanded={open === i}
                  className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left text-[16px] font-medium transition-colors hover:bg-white/[0.03]"
                >
                  {f.q}
                  <span className="shrink-0 text-white/45" aria-hidden>
                    {open === i ? (
                      <Minus className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </span>
                </button>
                {open === i ? (
                  <m.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.24 }}
                    className="overflow-hidden px-5 pb-5 text-[15px] leading-relaxed text-white/65"
                  >
                    {f.a}
                  </m.p>
                ) : null}
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link
              to="/faq"
              className="group inline-flex min-h-11 items-center gap-1.5 text-[14px] font-semibold text-[#ae2f26] hover:underline"
            >
              Fler frågor
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </div>
        </div>
      </section>

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
            Gratis, inga annonser, inget kort
          </div>
        </div>
      </section>
    </div>
  );
}
