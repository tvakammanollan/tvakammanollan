import { createFileRoute, Link } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { HpCountdown } from "@/components/ui/HpCountdown";
import { HP_DATES } from "@/lib/hp-dates";
import { ArrowRight, CalendarDays, ScrollText } from "lucide-react";
import { formatDateLong } from "@/lib/sv-format";

/* =====================================================================
   SEO: dedikerad sida för "högskoleprovet datum / när är nästa HP" — en av
   de mest sökta HP-frågorna, utan egen sida tidigare. Statiskt SSR-innehåll
   + nedräkning + Event-strukturerad data per kommande provdatum.
   ===================================================================== */

function fmtLong(iso: string): string {
  return formatDateLong(new Date(iso + "T08:00:00+02:00"));
}

export const Route = createFileRoute("/hogskoleprovet-datum")({
  head: () => ({
    meta: pageMeta({
      path: "/hogskoleprovet-datum",
      title: "Högskoleprovet datum 2026 & 2027 – när är nästa prov? · HP Kampen",
      description:
        "Alla kommande datum för högskoleprovet (HP): höstprovet 2026, vårprovet 2027 och framåt. Se nedräkning till nästa prov, när anmälan öppnar och börja öva gratis.",
      ogTitle: "Högskoleprovet datum – när är nästa prov?",
      ogDescription: "Kommande HP-datum, nedräkning och anmälningsinfo. Öva gratis på HP Kampen.",
    }),
    links: pageLinks("/hogskoleprovet-datum"),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Högskoleprovet datum", path: "/hogskoleprovet-datum" },
      ]),
      ...HP_DATES.map((d) =>
        jsonLdScript({
          "@context": "https://schema.org",
          "@type": "Event",
          name: `Högskoleprovet – ${d.label}`,
          startDate: `${d.date}T08:00:00+02:00`,
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
          eventStatus: "https://schema.org/EventScheduled",
          inLanguage: "sv-SE",
          location: {
            "@type": "Place",
            name: "Provorter i hela Sverige",
            address: { "@type": "PostalAddress", addressCountry: "SE" },
          },
          organizer: {
            "@type": "Organization",
            name: "Universitets- och högskolerådet (UHR)",
            url: "https://www.studera.nu/",
          },
          description: `Datum för ${d.label}. Anmälan görs via antagning.se.`,
        }),
      ),
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

      <header className="mt-4">
        <h1
          className="text-[28px] font-bold leading-tight text-[var(--cream)] sm:text-[40px]"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
        >
          Högskoleprovet datum 2026 &amp; 2027
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/60">
          Högskoleprovet (HP) hålls två gånger om året – ett{" "}
          <strong className="text-white/80">vårprov</strong> och ett{" "}
          <strong className="text-white/80">höstprov</strong>, nästan alltid en lördag. Här är alla
          kommande provdatum, en nedräkning till nästa prov och när anmälan brukar öppna.
        </p>
      </header>

      {/* Nedräkning till nästa prov */}
      <div className="mt-6">
        <HpCountdown />
      </div>

      {/* Kommande datum */}
      <section className="mt-10">
        <h2
          className="flex items-center gap-2 text-[20px] font-bold text-[var(--cream)] sm:text-[24px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <CalendarDays className="h-5 w-5 text-[#ae2f26]" />
          Kommande provdatum
        </h2>
        <ul className="mt-4 divide-y divide-white/8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm">
          {HP_DATES.map((d) => (
            <li key={d.date} className="flex items-center justify-between gap-3 px-5 py-4">
              <div>
                <div className="text-[15px] font-semibold capitalize text-[var(--cream)]">
                  {fmtLong(d.date)}
                </div>
                <div className="mt-0.5 text-xs text-white/50">
                  {d.session === "vår" ? "Vårprovet" : "Höstprovet"}
                </div>
              </div>
              <span className="shrink-0 rounded-full border border-[#ae2f26]/25 bg-[#ae2f26]/10 px-3 py-1 text-xs font-semibold text-[#ae2f26]">
                {d.label}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-white/40">
          Datum för senare prov publiceras av UHR ungefär ett år i förväg och uppdateras här
          löpande.
        </p>
      </section>

      {/* Anmälan */}
      <section className="mt-10">
        <h2
          className="text-[20px] font-bold text-[var(--cream)] sm:text-[24px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          När öppnar anmälan?
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-white/60">
          Anmälan till högskoleprovet öppnar ungefär tre månader före provdagen och stänger oftast
          en månad innan. Höstprovets anmälan brukar öppna i mitten av augusti och vårprovets i
          mitten av januari. Du anmäler dig och betalar provavgiften via{" "}
          <a
            href="https://www.antagning.se/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#ae2f26] hover:underline"
          >
            antagning.se
          </a>
          . Officiella datum och provorter hittar du hos{" "}
          <a
            href="https://www.studera.nu/"
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
          className="text-[20px] font-bold text-[var(--cream)] sm:text-[24px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Börja plugga redan idag
        </h2>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-white/60">
          Ju tidigare du börjar, desto högre resultat. Öva på riktiga frågor från gamla prov, träna
          ord och tävla mot andra – helt gratis.
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
