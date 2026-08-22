import { createFileRoute, Link } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { describeWithin, fitTitle } from "@/lib/seo-text";
import { HpCountdown } from "@/components/ui/HpCountdown";
import { HP_DATES, HP_FEE_SEK, HP_REGISTRATION_URL, hpDateLong, hpDateShort } from "@/lib/hp-dates";
import {
  HP_EVENT_IMAGES,
  hasRegistrationWindow,
  hpEvents,
  registrationPeriodText,
} from "@/lib/hp-event";
import { ArrowRight, CalendarDays, Clock, ScrollText } from "lucide-react";

/* =====================================================================
   SEO: dedikerad sida för "högskoleprovet datum / när är nästa HP" — en av
   de mest sökta HP-frågorna. Statiskt SSR-innehåll + nedräkning +
   Event-strukturerad data per kommande provdatum.

   Event-objekten byggs i src/lib/hp-event.ts och är testade. Det som står i
   dem — provdag, tider, anmälningsperiod, avgift — ska också stå synligt på
   sidan: Google kräver att strukturerad data speglar sidans innehåll, och
   den som söker efter provdatum vill läsa det, inte hitta det i sidkällan.
   ===================================================================== */

/** Provdagens gång enligt UHR:s schema (studera.nu → Schema, kallelse och praktiskt). */
const PROVDAGEN: ReadonlyArray<{ tid: string; vad: string }> = [
  { tid: "08.10", vad: "Legitimationskontroll och placering" },
  { tid: "08.30", vad: "Introduktion till provdagen" },
  { tid: "09.00", vad: "Provpass 1, därefter fyra pass till på 55 minuter var" },
  { tid: "12.55", vad: "Lunch, drygt en timme" },
  { tid: "16.25", vad: "Sista provpasset slutar" },
  { tid: "16.55", vad: "Information och hemgång" },
];

export const Route = createFileRoute("/hogskoleprovet-datum")({
  head: () => ({
    meta: pageMeta({
      path: "/hogskoleprovet-datum",
      title: fitTitle("Högskoleprovet datum 2026 & 2027: när är nästa prov?"),
      // Datumen stod handskrivna här och skulle bli fel dagen HP_DATES ändras
      // — samma fel som redan städats bort ur FAQ:n och FAQPage-datan. De
      // härleds nu ur listan, och beskrivningen kortas till det Google visar.
      description: describeWithin(
        `Alla kommande datum för högskoleprovet: ${HP_DATES.map(
          (d) => `${d.session === "höst" ? "höstprovet" : "vårprovet"} ${hpDateShort(d.date)}`,
        ).join(" och ")}.`,
        "Nedräkning, anmälningsperiod och provavgift.",
      ),
      ogTitle: "Högskoleprovet datum: när är nästa prov?",
      ogDescription:
        "Kommande HP-datum, nedräkning och anmälningsinfo. Öva gratis på Tvåkommanollan.",
      ogImage: HP_EVENT_IMAGES[0],
      ogImageWidth: 1200,
      ogImageHeight: 675,
      ogImageAlt: "Högskoleprovet: provdatum, nedräkning och anmälan",
    }),
    links: pageLinks("/hogskoleprovet-datum"),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Högskoleprovet datum", path: "/hogskoleprovet-datum" },
      ]),
      ...hpEvents().map(jsonLdScript),
    ],
  }),
  component: DatumPage,
});

function DatumPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
      <nav className="text-xs text-white/45" aria-label="Brödsmulor">
        <Link to="/" className="hover:text-white/70">
          Hem
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-white/70">Högskoleprovet datum</span>
      </nav>

      <header className="mt-4 text-center">
        <h1
          className="text-[28px] font-bold leading-tight text-[var(--cream)] sm:text-[40px]"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
        >
          Högskoleprovet datum 2026 &amp; 2027
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-white/60">
          Högskoleprovet (HP) hålls två gånger om året:{" "}
          <strong className="text-white/80">vårprovet på en lördag i april</strong> och{" "}
          <strong className="text-white/80">höstprovet på en söndag i oktober</strong>. Här är alla
          kommande provdatum, en nedräkning till nästa prov, anmälningsperioderna och hur provdagen
          ser ut.
        </p>
      </header>

      {/* Nedräkning till nästa prov */}
      <div className="mt-6">
        <HpCountdown />
      </div>

      {/* Kommande datum */}
      <section className="mt-10">
        <h2
          className="flex items-center justify-center gap-2 text-[20px] font-bold text-[var(--cream)] sm:text-[24px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <CalendarDays className="h-5 w-5 text-[#ae2f26]" />
          Kommande provdatum
        </h2>
        <ul className="mt-4 divide-y divide-white/8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm">
          {HP_DATES.map((d) => (
            <li key={d.date} className="flex items-center justify-between gap-3 px-5 py-4">
              <div>
                <div className="text-[15px] font-semibold text-[var(--cream)] first-letter:uppercase">
                  {hpDateLong(d.date)}
                </div>
                <div className="mt-0.5 text-xs text-white/50">
                  {d.session === "vår" ? "Vårprovet" : "Höstprovet"}
                  {hasRegistrationWindow(d) && <> · Anmälan {registrationPeriodText(d)}</>}
                </div>
              </div>
              <span className="shrink-0 rounded-full border border-[#ae2f26]/25 bg-[#ae2f26]/10 px-3 py-1 text-xs font-semibold text-[#ae2f26]">
                {d.label}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-white/40">
          Datum för senare prov publiceras av UHR ungefär ett år i förväg och läggs in här när de är
          officiella.
        </p>
      </section>

      {/* Provdagen */}
      <section className="mt-10">
        <h2
          className="flex items-center justify-center gap-2 text-[20px] font-bold text-[var(--cream)] sm:text-[24px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <Clock className="h-5 w-5 text-[#ae2f26]" />
          Så ser provdagen ut
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-white/60">
          Provet består av fem provpass på 55 minuter vardera. Fyra räknas, ett är ett
          utprövningspass som inte ger poäng. Med raster och lunch är du på plats i drygt åtta
          timmar.
        </p>
        <ul className="mt-4 divide-y divide-white/8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm">
          {PROVDAGEN.map((rad) => (
            <li key={rad.tid} className="flex items-baseline gap-4 px-5 py-3">
              <span className="w-14 shrink-0 text-sm font-semibold tabular-nums text-[#ae2f26]">
                {rad.tid}
              </span>
              <span className="text-[15px] text-white/70">{rad.vad}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-white/40">
          Exakta tider och provort står i kallelsen. Skriver du anpassat prov är dagen längre.
        </p>
      </section>

      {/* Anmälan */}
      <section className="mt-10">
        <h2
          className="text-center text-[20px] font-bold text-[var(--cream)] sm:text-[24px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Anmälan och provavgift
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-white/60">
          Du anmäler dig på{" "}
          <a
            href={HP_REGISTRATION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#ae2f26] hover:underline"
          >
            hogskoleprov.nu
          </a>{" "}
          , inte på antagning.se (som är ansökan till utbildningar). Anmälan är öppen under en kort
          period, ungefär en vecka, ett par månader före provdagen: se datumen i listan ovan. Missar
          du den går det inte att anmäla sig i efterhand.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-white/60">
          Provavgiften är <strong className="text-white/80">{HP_FEE_SEK} kronor</strong> och betalas
          med kort eller Swish i samband med anmälan. Avgiften återbetalas inte om du uteblir.
          Officiell information om provet, provorter och anpassat prov finns hos{" "}
          <a
            href="https://www.studera.nu/hogskoleprov/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#ae2f26] hover:underline"
          >
            UHR (studera.nu)
          </a>
          .
        </p>
      </section>

      {/* CTA: börja plugga */}
      <section className="mt-12 rounded-2xl border border-[#ae2f26]/25 bg-[#ae2f26]/[0.06] p-6 sm:p-8">
        <h2
          className="text-center text-[20px] font-bold text-[var(--cream)] sm:text-[24px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Börja plugga redan idag
        </h2>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-white/60">
          Ju tidigare du börjar, desto högre resultat. Öva på riktiga frågor från gamla prov, träna
          ord och tävla mot andra. Allt är gratis.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Link
            to="/gamla-prov"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#ae2f26] px-5 py-2.5 text-sm font-semibold text-[#fff8f5] transition hover:brightness-110"
          >
            Öva på gamla prov
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/ord"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            params={{} as any}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-5 py-2.5 text-sm font-semibold text-[var(--cream)] transition hover:border-[#ae2f26]/50"
          >
            Träna ord
          </Link>
          <Link
            to="/guider"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-5 py-2.5 text-sm font-semibold text-[var(--cream)] transition hover:border-[#ae2f26]/50"
          >
            <ScrollText className="h-4 w-4" />
            Guider per delprov
          </Link>
        </div>
      </section>
    </div>
  );
}
