import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck } from "lucide-react";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { fitTitle } from "@/lib/seo-text";
import { hpDateLong, hpDateShort } from "@/lib/hp-dates";
import { formatInt } from "@/lib/sv-format";

/* =====================================================================
   RESULTATET PÅ HÖGSKOLEPROVET. "när kommer resultatet högskoleprovet"
   toppar varje höst och vår. Alla fakta här är hämtade ur UHR:s och
   studera.nu:s egna sidor (länkade på sidan). Nästa prov: uppdatera
   SENASTE med datum ur UHR:s pressmeddelande inför provet. Gissa aldrig
   ett resultatdatum.
   ===================================================================== */

const PATH = "/hogskoleprovet-resultat";

const SENASTE = {
  label: "höstprovet 2026",
  provdag: "2026-10-18",
  resultat: "2026-11-25",
  anmalda: 77488,
  kalla:
    "https://www.uhr.se/om-uhr/nyheter/pressmeddelanden/2026-pressmeddelanden/over-77-000-anmalda-till-sondagens-hogskoleprov/",
  uppdaterad: "2026-10-24",
};

const RESULTAT_INFO = "https://www.studera.nu/hogskoleprov/resultat/resultat/";

function faq(): Array<{ q: string; a: string }> {
  return [
    {
      q: `När kommer resultatet på ${SENASTE.label}?`,
      a: `Enligt UHR kan provdeltagarna ta del av resultaten den ${hpDateShort(SENASTE.resultat)}. Provet skrevs ${hpDateLong(SENASTE.provdag)}.`,
    },
    {
      q: "Var ser jag mitt resultat?",
      a: "Du loggar in på kontot du skapade när du anmälde dig på hogskoleprov.nu. Har du svenskt personnummer förs resultatet dessutom automatiskt in i antagningssystemet, och det syns under Meriter på antagning.se.",
    },
    {
      q: "Hur länge gäller resultatet?",
      a: "Resultatet gäller till utgången av det kalenderhalvår som infaller 8 år efter provtillfället.",
    },
    {
      q: "Vilket resultat räknas om jag skrivit provet flera gånger?",
      a: "Det är alltid ditt bästa giltiga resultat som används vid urvalet till högskolan.",
    },
    {
      q: "Kan jag räkna ut mitt resultat innan det kommer?",
      a: "Ja, ungefär. Rätta dig mot facit och räkna antal rätt på den verbala och den kvantitativa delen. Varje del normeras för sig, och resultatet är medelvärdet av delarnas poäng.",
    },
  ];
}

export const Route = createFileRoute("/hogskoleprovet-resultat")({
  head: () => ({
    meta: pageMeta({
      path: PATH,
      title: fitTitle("När kommer resultatet på högskoleprovet?"),
      description: `Resultatet på ${SENASTE.label} kommer ${hpDateShort(SENASTE.resultat)}. Så hämtar du det, hur länge det gäller och vilket resultat som räknas vid antagning.`,
      ogTitle: `Resultatet på ${SENASTE.label} kommer ${hpDateShort(SENASTE.resultat)}`,
    }),
    links: pageLinks(PATH),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Resultat", path: PATH },
      ]),
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
  component: ResultatPage,
});

function ResultatPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
      <nav className="text-xs text-white/45" aria-label="Brödsmulor">
        <Link to="/" className="hover:text-white/70">
          Hem
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-white/70">Resultat</span>
      </nav>

      <header className="mt-4">
        <p className="text-sm text-white/65">
          Uppdaterat {hpDateShort(SENASTE.uppdaterad)}
        </p>
        <h1
          className="mt-2 text-[28px] font-bold leading-tight text-[var(--cream)] sm:text-[40px]"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
        >
          När kommer resultatet på högskoleprovet?
        </h1>
      </header>

      <section className="mt-6 rounded-2xl border border-primary/25 bg-primary/[0.06] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <CalendarCheck className="mt-1 h-6 w-6 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="text-[18px] font-bold text-[var(--cream)] sm:text-[22px]">
              Resultatet på {SENASTE.label} kommer {hpDateShort(SENASTE.resultat)}.
            </p>
            <p className="mt-1 text-[14.5px] leading-relaxed text-white/60">
              Provet skrevs {hpDateLong(SENASTE.provdag)} och {formatInt(SENASTE.anmalda)} personer
              var anmälda. Källa:{" "}
              <a
                href={SENASTE.kalla}
                target="_blank"
                rel="noopener"
                className="underline underline-offset-2 hover:text-[var(--cream)]"
              >
                UHR:s pressmeddelande
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2
          className="text-[20px] font-bold text-[var(--cream)] sm:text-[24px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Räkna ut ditt resultat redan nu
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-white/60">
          Du behöver inte vänta för att få en bra uppskattning. Rätta dig mot facit, räkna antal
          rätt per del och jämför med normeringen på tidigare prov.
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <Link
            to="/hogskoleprovet-facit"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-brand transition hover:brightness-110"
          >
            Facit och trolig normering
          </Link>
          <Link
            to="/hogskoleprovet-normering"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-white/12 px-5 py-2.5 text-sm font-semibold text-[var(--cream)] transition hover:border-primary/50"
          >
            Normering tidigare prov
          </Link>
          <Link
            to="/hogskoleprovet-poangraknare"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-white/12 px-5 py-2.5 text-sm font-semibold text-[var(--cream)] transition hover:border-primary/50"
          >
            Poängräknare
          </Link>
        </div>
      </section>

      <section className="mt-12">
        <h2
          className="text-[20px] font-bold text-[var(--cream)] sm:text-[24px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Vanliga frågor om resultatet
        </h2>
        <dl className="mt-4 divide-y divide-white/8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm">
          {faq().map(({ q, a }) => (
            <div key={q} className="px-5 py-4">
              <dt className="text-[15px] font-semibold text-[var(--cream)]">{q}</dt>
              <dd className="mt-1.5 text-[14.5px] leading-relaxed text-white/65">{a}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-[12px] text-white/45">
          Mer om hur resultatet används finns hos{" "}
          <a
            href={RESULTAT_INFO}
            target="_blank"
            rel="noopener"
            className="underline underline-offset-2 hover:text-white/70"
          >
            studera.nu
          </a>
          .
        </p>
      </section>

      <section className="mt-12 rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm sm:p-8">
        <h2
          className="text-[20px] font-bold text-[var(--cream)] sm:text-[24px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Räcker resultatet till din utbildning?
        </h2>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-white/60">
          Se vad som krävdes i högskoleprovsgruppen på populära program, och vad du behöver öva på
          inför nästa prov.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Link
            to="/hogskoleprovet-poang"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-white/12 px-5 py-2.5 text-sm font-semibold text-[var(--cream)] transition hover:border-primary/50"
          >
            Poäng och antagning
          </Link>
          <Link
            to="/hogskoleprovet-datum"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-white/12 px-5 py-2.5 text-sm font-semibold text-[var(--cream)] transition hover:border-primary/50"
          >
            Nästa provdatum
          </Link>
          <Link
            to="/gamla-prov"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-white/12 px-5 py-2.5 text-sm font-semibold text-[var(--cream)] transition hover:border-primary/50"
          >
            Gamla prov
          </Link>
        </div>
      </section>
    </div>
  );
}
