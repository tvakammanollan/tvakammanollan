import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Swords, BookOpenText, FileText, Timer, Users, Activity } from "lucide-react";
import { getLandingStats, type LandingStats } from "@/lib/landing.functions";
import { getNextHpDate } from "@/lib/hp-dates";
import { formatInt } from "@/lib/sv-format";
import { KunskapsTrad } from "@/components/landing/KunskapsTrad";

/**
 * Landningssidan (utloggad).
 *
 * Byggd om från grunden i Lunden-vändningen. Den gamla versionen var
 * 1033 rader byggda för det mörka temat, med en WebGL-shader i
 * bakgrunden som inte går att rädda på creme.
 *
 * Sektionsordningen följer en klassisk SaaS-landning: hjälte →
 * förtroenderad → problem → tre funktioner → delproven → siffror →
 * topplista → nedräkning → frågor → slut-CTA.
 *
 * ALLA siffror är riktiga och kommer ur getLandingStats eller ur
 * provarkivet. Inga påhittade testimonials, inga uppfunna betyg och
 * ingen prissektion — sajten är gratis, så det finns inget att välja
 * mellan.
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

const FRAGOR = [
  {
    q: "Kostar det något?",
    a: "Nej. Det finns inget kort att lägga in, ingen provperiod som tar slut och inga annonser mellan uppgifterna. Provet är dyrt nog som det är.",
  },
  {
    q: "Behöver jag konto för att testa?",
    a: "Nej, du kan spela en match direkt som gäst. Kontot behövs först när du vill att ELO, streak och repetitionshögen ska sparas mellan gångerna.",
  },
  {
    q: "Är uppgifterna riktiga provfrågor?",
    a: "Ja. Gamla prov kommer från UHR:s egna provhäften och ordträningen bygger på ordförståelsedelen från prov ända tillbaka till 1977. Facit följer med varje uppgift.",
  },
  {
    q: "Vad är ELO?",
    a: "Samma ratingsystem som i schack. Du börjar runt 1000 och talet rör sig efter vem du möter och hur det går. Verbal och kvantitativ del har varsitt tal, eftersom de mäter olika saker.",
  },
];

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">{label}</div>
      <div className="mt-2 font-mono text-3xl tabular-nums">{value}</div>
      {sub ? <div className="mt-1 text-sm text-white/60">{sub}</div> : null}
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
      <section className="mx-auto max-w-5xl px-4 pb-10 pt-14 text-center sm:pt-20">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/55">
          Högskoleprovet
        </p>
        <h1 className="mx-auto mt-5 max-w-3xl text-[38px] leading-[1.05] tracking-tight sm:text-[58px]">
          Plugga tills det växer.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-white/70">
          Dueller, ordträning och gamla prov drar åt samma håll. Allt du gör matas in i en enda
          mätare: ett träd som blir större ju närmare 2,0 du kommer.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/matchmaking"
            search={{ type: "verbal" }}
            className="inline-flex h-[52px] items-center justify-center gap-2 rounded-xl bg-[#ae2f26] px-7 text-[15px] font-semibold text-[#fff8f5] transition-colors hover:bg-[#8f2620]"
          >
            Starta en duell
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            to="/hogskoleprovet-poangraknare"
            className="inline-flex h-[52px] items-center justify-center rounded-xl border border-white/15 px-7 text-[15px] font-semibold transition-colors hover:bg-white/[0.04]"
          >
            Räkna ut mitt normerade
          </Link>
        </div>

        <p className="mt-5 text-sm text-white/55">Gratis. Inga annonser. Inget kort.</p>

        <div className="mx-auto mt-10 h-[300px] w-full max-w-2xl sm:h-[380px]">
          <KunskapsTrad score={1.45} />
        </div>
      </section>

      {/* ---------- förtroenderad ---------- */}
      <section className="border-y border-white/10">
        <div className="mx-auto grid max-w-5xl grid-cols-1 divide-y divide-white/10 px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            { icon: BookOpenText, t: "8 000+ ord", s: "ur prov sedan 1977" },
            { icon: FileText, t: "30 provtillfällen", s: "4 363 uppgifter med facit" },
            { icon: Swords, t: "8 delprov", s: "verbalt och kvantitativt" },
          ].map(({ icon: Icon, t, s }) => (
            <div key={t} className="flex items-center gap-3 px-2 py-5">
              <Icon className="h-5 w-5 shrink-0 text-[#ae2f26]" aria-hidden />
              <div>
                <div className="text-[15px] font-semibold">{t}</div>
                <div className="text-sm text-white/60">{s}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- problemet ---------- */}
      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:py-20">
        <h2 className="text-[28px] leading-tight tracking-tight sm:text-[38px]">
          Problemet är sällan att du inte kan.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-white/70">
          Det är att du inte vet vad du ska plugga härnäst. Ett pass här, ett gammalt prov där, och
          ingen aning om det gav något. Siffran rör sig inte förrän på provdagen, och då är det för
          sent att ändra riktning.
        </p>
        <p className="mx-auto mt-4 max-w-xl text-[17px] leading-relaxed text-white/70">
          Här räknas varje svar in i samma prognos. Du ser glappet mellan verbal och kvantitativ del
          direkt, och det är oftast där nästa poäng ligger.
        </p>
      </section>

      {/* ---------- tre sätt att träna ---------- */}
      <section className="mx-auto max-w-5xl px-4 pb-16 sm:pb-20">
        <h2 className="text-center text-[26px] tracking-tight sm:text-[32px]">
          Tre sätt att träna, en mätare
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Swords,
              t: "Dueller i realtid",
              s: "Möt en riktig motståndare med klockan igång. ELO justeras efter varje match, separat för verbal och kvantitativ del.",
              to: "/matchmaking",
              cta: "Starta en duell",
            },
            {
              icon: BookOpenText,
              t: "Ordträning",
              s: "8 000 ord med upprepning i intervaller. Ord du missar kommer tillbaka, och försvinner ur högen först när du suttit dem fem gånger i rad.",
              to: "/ord",
              cta: "Öva ord",
            },
            {
              icon: FileText,
              t: "Gamla prov",
              s: "30 provtillfällen från VT2012 och framåt, 118 provpass med facit på varje uppgift. Kör ett helt pass med klocka eller plocka enskilda delprov.",
              to: "/gamla-prov",
              cta: "Se arkivet",
            },
          ].map(({ icon: Icon, t, s, to, cta }) => (
            <div
              key={t}
              className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-6"
            >
              <Icon className="h-6 w-6 text-[#ae2f26]" aria-hidden />
              <h3 className="mt-4 text-[19px] tracking-tight">{t}</h3>
              <p className="mt-2 flex-1 text-[15px] leading-relaxed text-white/65">{s}</p>
              <Link
                to={to}
                className="mt-5 inline-flex min-h-11 items-center gap-1.5 text-[14px] font-semibold text-[#ae2f26] hover:underline"
              >
                {cta}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- delproven ---------- */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
          <h2 className="text-center text-[26px] tracking-tight sm:text-[32px]">
            Åtta delprov, åtta grenar
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-center text-[15px] text-white/65">
            Varje delprov har egen struktur och egen frågetyp. Du kan träna dem var för sig eller
            möta dem blandat i en duell.
          </p>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {DELPROV.map((d) => (
              <Link
                key={d.kod}
                to="/ova/$delprov"
                params={{ delprov: d.kod.toLowerCase() }}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition-colors hover:bg-white/[0.04]"
              >
                <div className="font-display text-[22px] tracking-tight">{d.kod}</div>
                <div className="mt-1 text-[13px] text-white/60">{d.namn}</div>
                <div className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white/45">
                  {d.del}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- riktiga siffror ---------- */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
          <div className="flex items-center justify-center gap-2">
            <Activity className="h-4 w-4 text-[#2f6b3c]" aria-hidden />
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/55">
              Just nu
            </span>
          </div>
          <h2 className="mt-4 text-center text-[26px] tracking-tight sm:text-[32px]">
            Siffrorna är inte påhittade
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Spelare"
              value={stats ? formatInt(stats.totalPlayers) : "–"}
              sub="registrerade konton"
            />
            <Stat
              label="Matcher spelade"
              value={stats ? formatInt(stats.totalMatches) : "–"}
              sub="sedan starten"
            />
            <Stat
              label="Online nu"
              value={stats ? formatInt(stats.activePlayers) : "–"}
              sub="senaste kvarten"
            />
            <Stat
              label="Högsta ELO"
              value={stats ? formatInt(Math.max(stats.topVerbalElo, stats.topMathElo)) : "–"}
              sub="verbal eller kvantitativ"
            />
          </div>
        </div>
      </section>

      {/* ---------- topplista ---------- */}
      {stats && stats.topPlayers.length > 0 ? (
        <section className="border-t border-white/10">
          <div className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
            <div className="flex items-center justify-center gap-2">
              <Users className="h-4 w-4 text-[#ae2f26]" aria-hidden />
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/55">
                Topplistan
              </span>
            </div>
            <h2 className="mt-4 text-center text-[26px] tracking-tight sm:text-[32px]">
              De som ligger högst just nu
            </h2>
            <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
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
                    <tr key={p.username + p.type + i} className="border-b border-white/10 last:border-0">
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
            <div className="mt-6 text-center">
              <Link
                to="/leaderboard"
                className="inline-flex min-h-11 items-center gap-1.5 text-[14px] font-semibold text-[#ae2f26] hover:underline"
              >
                Hela topplistan
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* ---------- nedräkning ---------- */}
      {dagarKvar !== null ? (
        <section className="border-t border-white/10">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:py-20">
            <Timer className="mx-auto h-5 w-5 text-[#8e552a]" aria-hidden />
            <h2 className="mt-4 text-[26px] tracking-tight sm:text-[32px]">
              {dagarKvar} dagar till skörd
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/65">
              Så länge är det till nästa högskoleprov. Ett pass om dagen räcker för att flytta
              prognosen märkbart på den tiden.
            </p>
            <Link
              to="/hogskoleprovet-datum"
              className="mt-6 inline-flex min-h-11 items-center gap-1.5 text-[14px] font-semibold text-[#ae2f26] hover:underline"
            >
              Alla provdatum
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </section>
      ) : null}

      {/* ---------- frågor ---------- */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:py-20">
          <h2 className="text-center text-[26px] tracking-tight sm:text-[32px]">Vanliga frågor</h2>
          <div className="mt-8 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10">
            {FRAGOR.map((f, i) => (
              <div key={f.q}>
                <button
                  type="button"
                  onClick={() => setOpen(open === i ? null : i)}
                  aria-expanded={open === i}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[16px] font-medium transition-colors hover:bg-white/[0.02]"
                >
                  {f.q}
                  <span className="shrink-0 text-white/45" aria-hidden>
                    {open === i ? "–" : "+"}
                  </span>
                </button>
                {open === i ? (
                  <p className="px-5 pb-5 text-[15px] leading-relaxed text-white/65">{f.a}</p>
                ) : null}
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link
              to="/faq"
              className="inline-flex min-h-11 items-center gap-1.5 text-[14px] font-semibold text-[#ae2f26] hover:underline"
            >
              Fler frågor
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- slut ---------- */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h2 className="text-[30px] leading-tight tracking-tight sm:text-[42px]">
            Börja med en match.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[16px] text-white/65">
            Du behöver inget konto för att testa. Det tar tre minuter.
          </p>
          <Link
            to="/matchmaking"
            search={{ type: "verbal" }}
            className="mt-8 inline-flex h-[52px] items-center justify-center gap-2 rounded-xl bg-[#ae2f26] px-8 text-[15px] font-semibold text-[#fff8f5] transition-colors hover:bg-[#8f2620]"
          >
            Starta en duell
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
}
