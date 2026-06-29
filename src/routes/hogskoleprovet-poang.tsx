import { createFileRoute, Link } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { ArrowRight, Calculator, GraduationCap, TrendingUp } from "lucide-react";

/* =====================================================================
   SEO: "högskoleprovet poäng / antagning" — hög sökvolym ("vad krävs på
   högskoleprovet", "högskoleprovet antagning", "urvalsgrupp HP"). Distinkt
   från /guider/normering (som förklarar UTRÄKNINGEN). Statiskt SSR.
   ===================================================================== */

export const Route = createFileRoute("/hogskoleprovet-poang")({
  head: () => ({
    meta: pageMeta({
      path: "/hogskoleprovet-poang",
      title: "Högskoleprovet poäng & antagning – vad krävs? · HP Kampen",
      description:
        "Vad betyder högskoleprovets poäng (0,0–2,0) och hur används den vid antagning? Urvalsgrupper, hur många platser som går via HP, giltighetstid och ungefärliga antagningspoäng för populära utbildningar.",
      ogTitle: "Högskoleprovet poäng & antagning – så funkar det",
      ogDescription:
        "Så används HP-poängen vid antagning till högskola: urvalsgrupper, andel platser och vad som krävs. Öva gratis på HP Kampen.",
    }),
    links: pageLinks("/hogskoleprovet-poang"),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Poäng & antagning", path: "/hogskoleprovet-poang" },
      ]),
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "Högskoleprovet poäng och antagning – så funkar det",
        description:
          "Vad högskoleprovets poäng betyder och hur den används vid antagning till högskola och universitet.",
        inLanguage: "sv-SE",
        about: { "@type": "Thing", name: "Högskoleprovet antagning" },
        isPartOf: { "@id": "https://hpkampen.se/#website" },
        publisher: { "@id": "https://hpkampen.se/#org" },
        mainEntityOfPage: "https://hpkampen.se/hogskoleprovet-poang",
      }),
    ],
  }),
  component: PoangPage,
});

function PoangPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
      <nav className="text-xs text-white/45" aria-label="Brödsmulor">
        <Link to="/" className="hover:text-white/70">
          Hem
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-white/70">Poäng &amp; antagning</span>
      </nav>

      <header className="mt-4">
        <h1
          className="text-[28px] font-bold leading-tight text-[#e8e4da] sm:text-[40px]"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
        >
          Högskoleprovet poäng &amp; antagning
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/60">
          Högskoleprovet ger ett resultat mellan{" "}
          <strong className="text-white/80">0,0 och 2,0</strong>. Här går vi igenom vad poängen
          betyder, hur den används vid antagning till högskola och universitet, och ungefär vad som
          krävs för olika utbildningar.
        </p>
      </header>

      <div className="mt-10 space-y-10">
        {/* Vad betyder poängen */}
        <section>
          <h2
            className="flex items-center gap-2 text-[20px] font-bold text-[#e8e4da] sm:text-[24px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <Calculator className="h-5 w-5 text-[#f2a65a]" />
            Vad betyder poängen?
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-white/65">
            Resultatet är ett normerat värde mellan 0,0 och 2,0 med en decimal. Medelresultatet
            brukar ligga kring 0,9–1,0. Poängen baseras på hur många rätt du har jämfört med alla
            andra som skrev samma prov – felaktiga svar ger inga minuspoäng, så det lönar sig alltid
            att gissa.
          </p>
          <Link
            to="/guider/normering"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            params={{} as any}
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[#f2a65a] hover:underline"
          >
            Så räknas normeringen ut
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        {/* Hur används HP */}
        <section>
          <h2
            className="flex items-center gap-2 text-[20px] font-bold text-[#e8e4da] sm:text-[24px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <GraduationCap className="h-5 w-5 text-[#f2a65a]" />
            Hur används HP vid antagning?
          </h2>
          <ul className="mt-3 space-y-2.5 text-[15px] leading-relaxed text-white/65">
            <li className="flex gap-2.5">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#6fb3b8]" />
              Sökande delas in i <strong className="text-white/80">urvalsgrupper</strong>:
              betygsgrupperna och högskoleprovsgruppen (HP). Du tävlar i den grupp där du har störst
              chans.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#6fb3b8]" />
              Minst <strong className="text-white/80">en tredjedel</strong> av platserna på de
              flesta program tillsätts via högskoleprovet.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#6fb3b8]" />
              Ditt resultat är giltigt i <strong className="text-white/80">åtta år</strong> – du kan
              skriva flera gånger och ditt bästa resultat används.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#6fb3b8]" />
              HP kan bara <strong className="text-white/80">hjälpa</strong> dig – ett svagt prov
              räknas aldrig emot dina betyg.
            </li>
          </ul>
        </section>

        {/* Vad krävs */}
        <section>
          <h2
            className="flex items-center gap-2 text-[20px] font-bold text-[#e8e4da] sm:text-[24px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <TrendingUp className="h-5 w-5 text-[#f2a65a]" />
            Vad krävs för olika utbildningar?
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-white/65">
            Antagningsgränserna varierar mellan program och mellan terminer, beroende på hur många
            som söker. Som grov fingervisning:
          </p>
          <ul className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm">
            {[
              { range: "0,9–1,3", who: "Många program antar inom det här spannet" },
              { range: "1,3–1,7", who: "Populära program, t.ex. civilingenjör och juridik" },
              { range: "1,7–2,0", who: "De mest sökta, t.ex. läkare och psykolog" },
            ].map((r) => (
              <li
                key={r.range}
                className="flex items-center gap-4 border-b border-white/8 px-5 py-3.5 last:border-b-0"
              >
                <span
                  className="w-20 shrink-0 text-[18px] font-bold tabular-nums text-[#f2a65a]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {r.range}
                </span>
                <span className="text-sm text-white/65">{r.who}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-white/40">
            Siffrorna är ungefärliga och ändras varje antagningsomgång. Exakta antagningsgränser
            hittar du i antagningsstatistiken på{" "}
            <a
              href="https://www.antagning.se/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/55 underline hover:text-white/75"
            >
              antagning.se
            </a>
            .
          </p>
        </section>
      </div>

      {/* CTA */}
      <section className="mt-12 rounded-2xl border border-[#f2a65a]/25 bg-[#f2a65a]/[0.06] p-6 sm:p-8">
        <h2
          className="text-[20px] font-bold text-[#e8e4da] sm:text-[24px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Höj din poäng – öva gratis
        </h2>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-white/60">
          Det säkraste sättet att klättra är att öva på riktiga frågor. Träna delprov, plugga ord
          och se din uppskattade HP-poäng växa.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Link
            to="/gamla-prov"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#f2a65a] px-5 py-2.5 text-sm font-semibold text-[#1a0d04] transition hover:brightness-110"
          >
            Öva på gamla prov
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/ova/$delprov"
            params={{ delprov: "ord" }}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-5 py-2.5 text-sm font-semibold text-[#e8e4da] transition hover:border-[#f2a65a]/50"
          >
            Öva per delprov
          </Link>
          <Link
            to="/hogskoleprovet-datum"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-5 py-2.5 text-sm font-semibold text-[#e8e4da] transition hover:border-[#f2a65a]/50"
          >
            Provdatum
          </Link>
        </div>
      </section>
    </div>
  );
}
