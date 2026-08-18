import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { RelatedGuides, guideArticleJsonLd } from "@/lib/guider-meta";

export const Route = createFileRoute("/guider/mek")({
  component: MekGuidePage,
  head: () => ({
    meta: pageMeta({
      path: "/guider/mek",
      title: "MEK-guide: meningskomplettering på HP · Tvåkommanollan",
      description:
        "Bemästra MEK-delprovet med rätt lässtrategi, luckteknik och tidsdisposition. Riktiga tips från Tvåkommanollan med 10 000+ HP-frågor.",
      ogTitle: "MEK-guiden · Tvåkommanollan",
      ogDescription:
        "Meningskomplettering på HP: strategi, logikord och hur du undviker distraktorer.",
    }),
    links: pageLinks("/guider/mek"),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Guider", path: "/guider" },
        { name: "MEK · Meningskomplettering", path: "/guider/mek" },
      ]),
      jsonLdScript(
        guideArticleJsonLd({
          headline: "MEK-guide: meningskomplettering på Högskoleprovet",
          description:
            "Bemästra MEK-delprovet med rätt lässtrategi, luckteknik och tidsdisposition.",
          url: "https://tvakommanollan.se/guider/mek",
        }),
      ),
    ],
  }),
});

function MekGuidePage() {
  return (
    <article
      className="mx-auto max-w-3xl px-4 py-12 text-[15px] leading-[1.75]"
      style={{ color: "var(--text-secondary)" }}
    >
      <header className="mb-10">
        <p
          className="text-xs font-semibold uppercase tracking-[0.25em]"
          style={{ color: "var(--teal)" }}
        >
          Verbalt delprov
        </p>
        <h1
          className="mt-2 text-3xl font-bold sm:text-4xl"
          style={{ color: "var(--cream)", fontFamily: "var(--font-display)" }}
        >
          MEK · Meningskomplettering
        </h1>
      </header>

      <section className="space-y-6">
        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Vad är MEK?
        </h2>
        <p>
          I MEK-delprovet presenteras du med en mening som har en eller två luckor markerade med
          streck. Din uppgift är att välja de ord eller fraser från alternativen som passar bäst i
          meningens sammanhang. Delprovet testar din förmåga att förstå textens logiska flöde,
          ordets grammatiska roll och hela meningens semantiska helhet. En mening kan ha flera ord
          som grammatiskt fungerar, men bara ett som passar logiken och tonen.
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Strategi: läs meningen först
        </h2>
        <p>
          Det effektivaste sättet att angripa MEK är att täcka över alternativen och läsa meningen
          med luckan. Gissa mentalt vilket ord eller vilken typ av ord som hör hemma där. Formulera
          en hypotes baserat på meningens logik innan du tittar på alternativen. Sedan matchar du
          din hypotes mot listan. Det förhindrar att distraktorer förvirrar dig och gör urvalet
          snabbare.
        </p>
        <p>
          Vid tvåluckade meningar: fyll i den lucka du är säkrast på först. Det begränsar
          möjligheterna för den andra luckan och gör valet enklare.
        </p>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Logikord att känna igen
        </h2>
        <p>
          Många MEK-uppgifter kretsar kring konnektiver, alltså ord som signalerar relationen mellan
          meningars delar. Att känna igen dem reflexmässigt sparar sekunder:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--cream)" }}>Adversativa (kontrast):</strong> dock,
            däremot, men, trots att, icke desto mindre, likväl
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Kausala (orsak/följd):</strong> eftersom,
            därför, följaktligen, till följd av, härav
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Additiva (tillägg):</strong> dessutom, likaså,
            vidare, därtill, inte minst
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Koncessiva (medgivande):</strong> visserligen,
            förvisso, om än, även om
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Temporala (tid):</strong> sedan, tidigare,
            hädanefter, numera, alltsedan
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold" style={{ color: "var(--cream)" }}>
          Hur undviker man fällor?
        </h2>
        <p>
          HP-konstruktörerna är skickliga på att skapa distraktorer som låter bra isolerat men
          bryter mot meningens helhet. Vanliga fällor:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong style={{ color: "var(--cream)" }}>Felaktig konnektiv:</strong> ett alternativ
            har rätt innehållsord men fel logisk relation. En adversativ mening med "dessutom" låter
            fel även om ordet i sig är vanligt.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Liknande form, fel valör:</strong> ord som
            "försiggå" och "förekomma" liknar varandra men har olika stilnivå och passar i olika
            sammanhang.
          </li>
          <li>
            <strong style={{ color: "var(--cream)" }}>Felaktig ton:</strong> en formell akademisk
            mening kräver ett formellt alternativ. Väljer du ett alltför vardagligt ord bryter det
            meningens register.
          </li>
        </ul>
        <p>
          Testa alltid det valda alternativet sist: läs hela meningen högt i huvudet med ditt svar
          infogt. Låter det konstigt? Välj om.
        </p>

        <p className="mt-8">
          <Link
            to="/train"
            className="inline-flex items-center gap-1.5 underline"
            style={{ color: "var(--amber)" }}
          >
            Träna MEK gratis
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </p>
      </section>

      <RelatedGuides
        currentPath="/guider/mek"
        relatedPaths={["/guider/ord", "/guider/las", "/guider/elf", "/guider/tidspress"]}
      />
    </article>
  );
}
