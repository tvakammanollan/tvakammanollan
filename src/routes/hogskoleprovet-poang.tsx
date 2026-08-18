import { createFileRoute, Link } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { ArrowRight, Calculator, GraduationCap, Scale, TrendingUp } from "lucide-react";

/* =====================================================================
   SEO: "högskoleprovet poäng / antagning" — hög sökvolym ("vad krävs på
   högskoleprovet", "högskoleprovet antagning", "urvalsgrupp HP"). Statiskt SSR.

   Täcker även normeringen (råpoäng → betyg). Det låg tidigare på en egen sida,
   /guider/normering, men båda sidorna förklarade 0,0–2,0-skalan, giltighetstiden
   och urvalskvoterna — två sidor som konkurrerade om samma sökord. Den sidan
   301:as hit i src/server.ts.
   ===================================================================== */

export const Route = createFileRoute("/hogskoleprovet-poang")({
  head: () => ({
    meta: pageMeta({
      path: "/hogskoleprovet-poang",
      title: "Högskoleprovet poäng, normering & antagning – vad krävs? · HP Kampen",
      description:
        "Vad betyder högskoleprovets poäng (0,0–2,0), hur fungerar normeringen från råpoäng till betyg och hur används resultatet vid antagning? Urvalsgrupper, giltighetstid och ungefärliga antagningspoäng.",
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
        headline: "Högskoleprovet poäng, normering och antagning – så funkar det",
        description:
          "Vad högskoleprovets poäng betyder, hur normeringen från råpoäng till betyg 0,0–2,0 går till och hur resultatet används vid antagning till högskola och universitet.",
        inLanguage: "sv-SE",
        about: { "@type": "Thing", name: "Högskoleprovet antagning" },
        isPartOf: { "@id": "https://tvakommanollan.se/#website" },
        publisher: { "@id": "https://tvakommanollan.se/#org" },
        mainEntityOfPage: "https://tvakommanollan.se/hogskoleprovet-poang",
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
          className="text-[28px] font-bold leading-tight text-[var(--cream)] sm:text-[40px]"
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
            className="flex items-center gap-2 text-[20px] font-bold text-[var(--cream)] sm:text-[24px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <Calculator className="h-5 w-5 text-[#ae2f26]" />
            Vad betyder poängen?
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-white/65">
            Resultatet är ett normerat värde mellan 0,0 och 2,0 med en decimal. Medelresultatet
            brukar ligga kring 0,9–1,0. Poängen baseras på hur många rätt du har jämfört med alla
            andra som skrev samma prov – felaktiga svar ger inga minuspoäng, så det lönar sig alltid
            att gissa.
          </p>
        </section>

        {/* Normering — hur råpoängen blir ett betyg */}
        <section>
          <h2
            className="flex items-center gap-2 text-[20px] font-bold text-[var(--cream)] sm:text-[24px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <Scale className="h-5 w-5 text-[#ae2f26]" />
            Hur räknas poängen ut? (normering)
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-white/65">
            Högskoleprovet ger inte ett enkelt procentresultat. Du kan maximalt få{" "}
            <strong className="text-white/80">160 råpoäng</strong> – ett per uppgift. UHR räknar
            sedan ut hur råpoängen fördelar sig bland alla provdeltagare och fastställer
            normgränser, som justeras ungefär 2–5 råpoäng per tillfälle för att kompensera för att
            proven är olika svåra. Samma antal rätt kan därför ge olika betyg beroende på vilket
            prov du skrev.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-white/65">
            Historiska riktlinjer för vad som krävts, baserat på offentliggjorda normgränser:
          </p>
          <ul className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm">
            {[
              { betyg: "2,0", rapoang: "≈ 155–160 rätt av 160" },
              { betyg: "1,9", rapoang: "≈ 145–150 rätt av 160" },
              { betyg: "1,8", rapoang: "≈ 135–142 rätt av 160" },
              { betyg: "1,7", rapoang: "≈ 125–133 rätt av 160" },
              { betyg: "1,5", rapoang: "≈ 105–115 rätt av 160" },
              { betyg: "1,0", rapoang: "≈ 65–75 rätt av 160" },
            ].map((r) => (
              <li
                key={r.betyg}
                className="flex items-center gap-4 border-b border-white/8 px-5 py-3.5 last:border-b-0"
              >
                <span
                  className="w-20 shrink-0 text-[18px] font-bold tabular-nums text-[#ae2f26]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {r.betyg}
                </span>
                <span className="text-sm text-white/65">{r.rapoang}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-white/40">
            Ungefärliga historiska snitt. De faktiska normgränserna för varje provrunda publiceras
            av UHR efter provets genomförande.
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-white/65">
            Verbal och kvantitativ del väger lika tungt – 80 uppgifter var – och du får ett samlat
            betyg, inget separat delbetyg. Fördelningen syns däremot i ditt resultatintyg, och den
            säger vilken del som ger mest att förbättra.
          </p>
          <Link
            to="/hogskoleprovet-poangraknare"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#ae2f26] hover:underline"
          >
            Räkna ut din normerade poäng
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        {/* Hur används HP */}
        <section>
          <h2
            className="flex items-center gap-2 text-[20px] font-bold text-[var(--cream)] sm:text-[24px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <GraduationCap className="h-5 w-5 text-[#ae2f26]" />
            Hur används HP vid antagning?
          </h2>
          <ul className="mt-3 space-y-2.5 text-[15px] leading-relaxed text-white/65">
            <li className="flex gap-2.5">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7a5236]" />
              Sökande delas in i <strong className="text-white/80">urvalsgrupper</strong>:
              betygsgrupperna och högskoleprovsgruppen (HP). Du tävlar i den grupp där du har störst
              chans.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7a5236]" />
              Minst <strong className="text-white/80">en tredjedel</strong> av platserna på de
              flesta program tillsätts via högskoleprovet.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7a5236]" />
              Ditt resultat är giltigt i <strong className="text-white/80">åtta år</strong> – du kan
              skriva flera gånger och ditt bästa resultat används.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7a5236]" />
              HP kan bara <strong className="text-white/80">hjälpa</strong> dig – ett svagt prov
              räknas aldrig emot dina betyg.
            </li>
          </ul>
        </section>

        {/* Vad krävs */}
        <section>
          <h2
            className="flex items-center gap-2 text-[20px] font-bold text-[var(--cream)] sm:text-[24px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <TrendingUp className="h-5 w-5 text-[#ae2f26]" />
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
                  className="w-20 shrink-0 text-[18px] font-bold tabular-nums text-[#ae2f26]"
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
      <section className="mt-12 rounded-2xl border border-[#ae2f26]/25 bg-[#ae2f26]/[0.06] p-6 sm:p-8">
        <h2
          className="text-[20px] font-bold text-[var(--cream)] sm:text-[24px]"
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
            className="inline-flex items-center gap-1.5 rounded-full bg-[#ae2f26] px-5 py-2.5 text-sm font-semibold text-[#fff8f5] transition hover:brightness-110"
          >
            Öva på gamla prov
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/ova/$delprov"
            params={{ delprov: "ord" }}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-5 py-2.5 text-sm font-semibold text-[var(--cream)] transition hover:border-[#ae2f26]/50"
          >
            Öva per delprov
          </Link>
          <Link
            to="/hogskoleprovet-datum"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-5 py-2.5 text-sm font-semibold text-[var(--cream)] transition hover:border-[#ae2f26]/50"
          >
            Provdatum
          </Link>
        </div>
      </section>
    </div>
  );
}
