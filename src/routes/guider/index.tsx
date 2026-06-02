import { createFileRoute, Link } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { PageHero } from "@/components/layout/PageHero";

export const Route = createFileRoute("/guider/")({
  component: GuiderPage,
  head: () => ({
    meta: pageMeta({
      path: "/guider",
      title: "Guider till Högskoleprovet · alla 8 delprov · HP Kampen",
      description:
        "Kompletta guider till alla 8 delprov på Högskoleprovet: ORD, MEK, LÄS, ELF, XYZ, KVA, NOG, DTK. Plus normering, tidspress och toppresultat.",
      ogTitle: "Guider till Högskoleprovet · HP Kampen",
      ogDescription:
        "Kompletta guider till alla 8 delprov på HP. Strategi, tidspress och normering förklaras.",
    }),
    links: pageLinks("/guider"),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Guider", path: "/guider" },
      ]),
      // Course schema — eligible för Course rich result och Google Discover
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "Course",
        name: "HP Kampens guidekurs · alla 8 delprov + strategi",
        description:
          "12 fristående guider för Högskoleprovet: alla 8 delprov (ORD, MEK, LÄS, ELF, XYZ, KVA, NOG, DTK) plus normering, tidspress, läsförståelsetips och en komplett studieplan. Helt gratis.",
        url: "https://hpkampen.se/guider",
        provider: {
          "@type": "Organization",
          name: "HP Kampen",
          url: "https://hpkampen.se",
          "@id": "https://hpkampen.se/#org",
        },
        inLanguage: "sv-SE",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "SEK", category: "Free" },
        educationalLevel: "Gymnasieelev och högskolesökande",
        audience: {
          "@type": "EducationalAudience",
          educationalRole: "student",
          audienceType: "Sökande till svenska universitet och högskolor",
        },
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          courseWorkload: "PT3H",
        },
        about: [
          "Högskoleprovet",
          "HP",
          "ORD",
          "MEK",
          "LÄS",
          "ELF",
          "XYZ",
          "KVA",
          "NOG",
          "DTK",
          "Normering",
          "Tidspress",
        ],
      }),
      // ItemList schema — hjälper Google förstå att detta är en samling av guider
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "HP Kampens guider",
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        numberOfItems: 12,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "ORD · Ordkunskap",
            url: "https://hpkampen.se/guider/ord",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "MEK · Meningskomplettering",
            url: "https://hpkampen.se/guider/mek",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: "LÄS · Svensk läsförståelse",
            url: "https://hpkampen.se/guider/las",
          },
          {
            "@type": "ListItem",
            position: 4,
            name: "ELF · Engelsk läsförståelse",
            url: "https://hpkampen.se/guider/elf",
          },
          {
            "@type": "ListItem",
            position: 5,
            name: "XYZ · Matematisk problemlösning",
            url: "https://hpkampen.se/guider/xyz",
          },
          {
            "@type": "ListItem",
            position: 6,
            name: "KVA · Kvantitativa jämförelser",
            url: "https://hpkampen.se/guider/kva",
          },
          {
            "@type": "ListItem",
            position: 7,
            name: "NOG · Kvantitativa resonemang",
            url: "https://hpkampen.se/guider/nog",
          },
          {
            "@type": "ListItem",
            position: 8,
            name: "DTK · Diagram, tabeller, kartor",
            url: "https://hpkampen.se/guider/dtk",
          },
          {
            "@type": "ListItem",
            position: 9,
            name: "Normering på HP",
            url: "https://hpkampen.se/guider/normering",
          },
          {
            "@type": "ListItem",
            position: 10,
            name: "Tips för läsförståelse",
            url: "https://hpkampen.se/guider/tips-lasforstaelse",
          },
          {
            "@type": "ListItem",
            position: 11,
            name: "Tidspress på HP",
            url: "https://hpkampen.se/guider/tidspress",
          },
          {
            "@type": "ListItem",
            position: 12,
            name: "Få bra HP-resultat",
            url: "https://hpkampen.se/guider/bra-resultat",
          },
        ],
      }),
    ],
  }),
});

function GuiderPage() {
  return (
    <div className="min-h-screen">
      <PageHero
        eyebrow="Lärresurser"
        title="Bemästra"
        cycleWords={["Ord.", "Läsning.", "Matte.", "Tidspress."]}
        subtitle="Djupgående guider till alla 8 delprov plus normering, tidspress och en komplett studieplan."
        align="center"
        variant="content"
      />
      <article
        className="mx-auto max-w-3xl px-4 pb-24 text-[15px] leading-[1.75] sm:px-6"
        style={{ color: "var(--text-secondary)" }}
      >
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold" style={{ color: "var(--cream)" }}>
            Verbala delprov
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              to="/guider/ord"
              className="group block rounded-2xl border p-5 transition-all hover:border-indigo-500/50 hover:shadow-[0_0_16px_rgba(99,102,241,0.12)]"
              style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
            >
              <div className="text-base font-semibold" style={{ color: "var(--cream)" }}>
                ORD · Ordkunskap
              </div>
              <div className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Synonymer och antonymer. Bygg ordförråd och lär dig taktiken för att plocka säkra
                poäng.
              </div>
            </Link>

            <Link
              to="/guider/mek"
              className="group block rounded-2xl border p-5 transition-all hover:border-indigo-500/50 hover:shadow-[0_0_16px_rgba(99,102,241,0.12)]"
              style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
            >
              <div className="text-base font-semibold" style={{ color: "var(--cream)" }}>
                MEK · Meningskomplettering
              </div>
              <div className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Fyll i rätt ord i meningsluckor. Logikord, distraktorer och lässtrategin som sparar
                tid.
              </div>
            </Link>

            <Link
              to="/guider/las"
              className="group block rounded-2xl border p-5 transition-all hover:border-indigo-500/50 hover:shadow-[0_0_16px_rgba(99,102,241,0.12)]"
              style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
            >
              <div className="text-base font-semibold" style={{ color: "var(--cream)" }}>
                LÄS · Svensk läsförståelse
              </div>
              <div className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Fyra svenska texter per pass. Rätt lästeknik och frågeanalys avgör hur snabbt du
                hittar svaren.
              </div>
            </Link>

            <Link
              to="/guider/elf"
              className="group block rounded-2xl border p-5 transition-all hover:border-indigo-500/50 hover:shadow-[0_0_16px_rgba(99,102,241,0.12)]"
              style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
            >
              <div className="text-base font-semibold" style={{ color: "var(--cream)" }}>
                ELF · Engelsk läsförståelse
              </div>
              <div className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Akademiska engelska texter. Ordstrategier och skillnaden mot LÄS-delprovet.
              </div>
            </Link>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold" style={{ color: "var(--cream)" }}>
            Kvantitativa delprov
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              to="/guider/xyz"
              className="group block rounded-2xl border p-5 transition-all hover:border-indigo-500/50 hover:shadow-[0_0_16px_rgba(99,102,241,0.12)]"
              style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
            >
              <div className="text-base font-semibold" style={{ color: "var(--cream)" }}>
                XYZ · Matematisk problemlösning
              </div>
              <div className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Algebra, geometri, sannolikhet och kombinatorik. Lär dig uppskatta och eliminera
                snabbt.
              </div>
            </Link>

            <Link
              to="/guider/kva"
              className="group block rounded-2xl border p-5 transition-all hover:border-indigo-500/50 hover:shadow-[0_0_16px_rgba(99,102,241,0.12)]"
              style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
            >
              <div className="text-base font-semibold" style={{ color: "var(--cream)" }}>
                KVA · Kvantitativa jämförelser
              </div>
              <div className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Jämför kolumn A och B. Snabbteknik och när du ska välja "kan ej avgöras".
              </div>
            </Link>

            <Link
              to="/guider/nog"
              className="group block rounded-2xl border p-5 transition-all hover:border-indigo-500/50 hover:shadow-[0_0_16px_rgba(99,102,241,0.12)]"
              style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
            >
              <div className="text-base font-semibold" style={{ color: "var(--cream)" }}>
                NOG · Kvantitativa resonemang
              </div>
              <div className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Räcker informationen för att lösa uppgiften? Arbetsordning och vanliga fällor.
              </div>
            </Link>

            <Link
              to="/guider/dtk"
              className="group block rounded-2xl border p-5 transition-all hover:border-indigo-500/50 hover:shadow-[0_0_16px_rgba(99,102,241,0.12)]"
              style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
            >
              <div className="text-base font-semibold" style={{ color: "var(--cream)" }}>
                DTK · Diagram, tabeller och kartor
              </div>
              <div className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Läs av diagram och tabeller korrekt. Vanliga misstag med skalor och enheter.
              </div>
            </Link>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold" style={{ color: "var(--cream)" }}>
            Strategi och normering
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              to="/guider/normering"
              className="group block rounded-2xl border p-5 transition-all hover:border-indigo-500/50 hover:shadow-[0_0_16px_rgba(99,102,241,0.12)]"
              style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
            >
              <div className="text-base font-semibold" style={{ color: "var(--cream)" }}>
                Normering och HP-betyg
              </div>
              <div className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Hur råpoäng omvandlas till betyg 0.0–2.0. Historiska gränser för 1.5, 1.7 och 2.0.
              </div>
            </Link>

            <Link
              to="/guider/tips-lasforstaelse"
              className="group block rounded-2xl border p-5 transition-all hover:border-indigo-500/50 hover:shadow-[0_0_16px_rgba(99,102,241,0.12)]"
              style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
            >
              <div className="text-base font-semibold" style={{ color: "var(--cream)" }}>
                7 tips för läsförståelse
              </div>
              <div className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Konkreta knep för LÄS och ELF: läs frågan först, elimineringsmetoden och aktiv
                läsning.
              </div>
            </Link>

            <Link
              to="/guider/tidspress"
              className="group block rounded-2xl border p-5 transition-all hover:border-indigo-500/50 hover:shadow-[0_0_16px_rgba(99,102,241,0.12)]"
              style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
            >
              <div className="text-base font-semibold" style={{ color: "var(--cream)" }}>
                Tidspress och tidsdisposition
              </div>
              <div className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Hur du fördelar tid per delprov, hoppa-strategin och varför du aldrig ska lämna
                blankt.
              </div>
            </Link>

            <Link
              to="/guider/bra-resultat"
              className="group block rounded-2xl border p-5 transition-all hover:border-indigo-500/50 hover:shadow-[0_0_16px_rgba(99,102,241,0.12)]"
              style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
            >
              <div className="text-base font-semibold" style={{ color: "var(--cream)" }}>
                Hur får man bra resultat?
              </div>
              <div className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Komplett studieplan 6–8 veckor: kartläggning, fokusträning och mentala tips
                provdagen.
              </div>
            </Link>
          </div>
        </section>
      </article>
    </div>
  );
}
