import { createFileRoute, Link } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { PageHero } from "@/components/layout/PageHero";

export const Route = createFileRoute("/guider/")({
  component: GuiderPage,
  head: () => ({
    meta: pageMeta({
      path: "/guider",
      title: "Guider till högskoleprovet: alla 8 delprov",
      description:
        "Guider till högskoleprovets 8 delprov: ORD, MEK, LÄS, ELF, XYZ, KVA, NOG och DTK. Dessutom normering, tidsplanering och en studieplan.",
      ogTitle: "Tvåkommanollan | Guider till högskoleprovet",
      ogDescription: "Guider till alla 8 delprov, plus normering, tidsplanering och en studieplan.",
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
        name: "Tvåkommanollans guider till högskoleprovet",
        description:
          "10 fristående guider för högskoleprovet: alla 8 delprov (ORD, MEK, LÄS, ELF, XYZ, KVA, NOG, DTK) plus tidsplanering och en studieplan, samt en genomgång av normering och antagningspoäng. Gratis.",
        url: "https://tvakommanollan.se/guider",
        provider: {
          "@type": "Organization",
          name: "Tvåkommanollan",
          url: "https://tvakommanollan.se",
          "@id": "https://tvakommanollan.se/#org",
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
        name: "Tvåkommanollans guider",
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        numberOfItems: 12,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "ORD: Ordkunskap",
            url: "https://tvakommanollan.se/guider/ord",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "MEK: Meningskomplettering",
            url: "https://tvakommanollan.se/guider/mek",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: "LÄS: Svensk läsförståelse",
            url: "https://tvakommanollan.se/guider/las",
          },
          {
            "@type": "ListItem",
            position: 4,
            name: "ELF: Engelsk läsförståelse",
            url: "https://tvakommanollan.se/guider/elf",
          },
          {
            "@type": "ListItem",
            position: 5,
            name: "XYZ: Matematisk problemlösning",
            url: "https://tvakommanollan.se/guider/xyz",
          },
          {
            "@type": "ListItem",
            position: 6,
            name: "KVA: Kvantitativa jämförelser",
            url: "https://tvakommanollan.se/guider/kva",
          },
          {
            "@type": "ListItem",
            position: 7,
            name: "NOG: Kvantitativa resonemang",
            url: "https://tvakommanollan.se/guider/nog",
          },
          {
            "@type": "ListItem",
            position: 8,
            name: "DTK: Diagram, tabeller, kartor",
            url: "https://tvakommanollan.se/guider/dtk",
          },
          {
            "@type": "ListItem",
            position: 9,
            name: "Tidspress på HP",
            url: "https://tvakommanollan.se/guider/tidspress",
          },
          {
            "@type": "ListItem",
            position: 10,
            name: "Få bra HP-resultat",
            url: "https://tvakommanollan.se/guider/bra-resultat",
          },
          {
            "@type": "ListItem",
            position: 11,
            // copy-ok
            name: "Komplett guide inför högskoleprovet",
            url: "https://tvakommanollan.se/guider/fran-noll-till-2-0",
          },
        ],
      }),
    ],
  }),
});

function GuiderPage() {
  return (
    <div className="min-h-screen">
      <PageHero title="Guider till högskoleprovet" align="center" variant="content" />
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
              className="group block rounded-2xl border p-5 transition-all hover:border-primary/50"
              style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
            >
              <div className="text-base font-semibold" style={{ color: "var(--cream)" }}>
                ORD: Ordkunskap
              </div>
              <div className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Välj ordet med samma betydelse. Hur uppgifterna ser ut och hur du bygger ordförråd.
              </div>
            </Link>

            <Link
              to="/guider/mek"
              className="group block rounded-2xl border p-5 transition-all hover:border-primary/50"
              style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
            >
              <div className="text-base font-semibold" style={{ color: "var(--cream)" }}>
                MEK: Meningskomplettering
              </div>
              <div className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Fyll i orden som saknas. Sambandsord, vanliga fällor och hur du läser uppgiften.
              </div>
            </Link>

            <Link
              to="/guider/las"
              className="group block rounded-2xl border p-5 transition-all hover:border-primary/50"
              style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
            >
              <div className="text-base font-semibold" style={{ color: "var(--cream)" }}>
                LÄS: Svensk läsförståelse
              </div>
              <div className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Svenska texter med frågor. Läs frågorna först och känn igen frågetyperna.
              </div>
            </Link>

            <Link
              to="/guider/elf"
              className="group block rounded-2xl border p-5 transition-all hover:border-primary/50"
              style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
            >
              <div className="text-base font-semibold" style={{ color: "var(--cream)" }}>
                ELF: Engelsk läsförståelse
              </div>
              <div className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Engelska texter med frågor. Ordförråd och skillnaden mot LÄS.
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
              className="group block rounded-2xl border p-5 transition-all hover:border-primary/50"
              style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
            >
              <div className="text-base font-semibold" style={{ color: "var(--cream)" }}>
                XYZ: Matematisk problemlösning
              </div>
              <div className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Algebra, geometri, sannolikhet och kombinatorik. Uppskatta, pröva tal och räkna
                bakåt.
              </div>
            </Link>

            <Link
              to="/guider/kva"
              className="group block rounded-2xl border p-5 transition-all hover:border-primary/50"
              style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
            >
              <div className="text-base font-semibold" style={{ color: "var(--cream)" }}>
                KVA: Kvantitativa jämförelser
              </div>
              <div className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Jämför kvantitet I och II. Förenkla i stället för att räkna, och välj "kan ej
                avgöras" vid rätt tillfälle.
              </div>
            </Link>

            <Link
              to="/guider/nog"
              className="group block rounded-2xl border p-5 transition-all hover:border-primary/50"
              style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
            >
              <div className="text-base font-semibold" style={{ color: "var(--cream)" }}>
                NOG: Kvantitativa resonemang
              </div>
              <div className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Räcker informationen för att lösa uppgiften? Arbetsordning och vanliga fällor.
              </div>
            </Link>

            <Link
              to="/guider/dtk"
              className="group block rounded-2xl border p-5 transition-all hover:border-primary/50"
              style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
            >
              <div className="text-base font-semibold" style={{ color: "var(--cream)" }}>
                DTK: Diagram, tabeller och kartor
              </div>
              <div className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Läs av diagram, tabeller och kartor. Vanliga misstag med skalor och enheter.
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
              to="/hogskoleprovet-poang"
              className="group block rounded-2xl border p-5 transition-all hover:border-primary/50"
              style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
            >
              <div className="text-base font-semibold" style={{ color: "var(--cream)" }}>
                Normering, poäng och antagning
              </div>
              <div className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Hur antal rätt blir en poäng mellan 0,00 och 2,00, hur gränserna har sett ut och vad
                olika utbildningar kräver.
              </div>
            </Link>

            <Link
              to="/guider/tidspress"
              className="group block rounded-2xl border p-5 transition-all hover:border-primary/50"
              style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
            >
              <div className="text-base font-semibold" style={{ color: "var(--cream)" }}>
                Tid per delprov
              </div>
              <div className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Hur du fördelar tiden per delprov och när du ska gissa och gå vidare.
              </div>
            </Link>

            <Link
              to="/guider/bra-resultat"
              className="group block rounded-2xl border p-5 transition-all hover:border-primary/50"
              style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
            >
              <div className="text-base font-semibold" style={{ color: "var(--cream)" }}>
                Hur får man bra resultat?
              </div>
              <div className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Studieplan på 6–8 veckor: kartläggning, daglig övning och gamla prov på tid.
              </div>
            </Link>

            <Link
              to="/guider/fran-noll-till-2-0"
              className="group block rounded-2xl border p-5 transition-all hover:border-primary/50"
              style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
            >
              <div className="text-base font-semibold" style={{ color: "var(--cream)" }}>
                {/* copy-ok */}
                Komplett guide inför högskoleprovet
              </div>
              <div className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Så skulle Niklas plugga från noll till 2,0: grunder, prioriteringar per delprov och
                fokus på provdagen.
              </div>
            </Link>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-xl font-semibold" style={{ color: "var(--cream)" }}>
            Öva
          </h2>
          <p className="mb-4 text-sm" style={{ color: "var(--text-secondary)" }}>
            Öva per delprov på uppgifter ur gamla prov.
          </p>
          <div className="mb-4 flex flex-wrap gap-2">
            {["ord", "mek", "las", "elf", "xyz", "kva", "nog", "dtk"].map((s) => (
              <Link
                key={s}
                to="/ova/$delprov"
                params={{ delprov: s }}
                className="rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors hover:border-primary/50 hover:text-primary"
                style={{ borderColor: "var(--line)", color: "var(--cream)" }}
              >
                Öva {s.toUpperCase()}
              </Link>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              to="/gamla-prov"
              className="group block rounded-2xl border p-5 transition-all hover:border-primary/50"
              style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
            >
              <div className="text-base font-semibold" style={{ color: "var(--cream)" }}>
                Gamla prov med facit
              </div>
              <div className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Skriv hela prov 2012–2026 med rättning och uppskattad normering.
              </div>
            </Link>
            <Link
              to="/hogskoleprovet-datum"
              className="group block rounded-2xl border p-5 transition-all hover:border-primary/50"
              style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
            >
              <div className="text-base font-semibold" style={{ color: "var(--cream)" }}>
                Provdatum &amp; anmälan
              </div>
              <div className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Kommande HP-datum, nedräkning och när anmälan öppnar.
              </div>
            </Link>
            <Link
              to="/hogskoleprovet-poang"
              className="group block rounded-2xl border p-5 transition-all hover:border-primary/50"
              style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
            >
              <div className="text-base font-semibold" style={{ color: "var(--cream)" }}>
                Poäng &amp; antagning
              </div>
              <div className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Vad poängen betyder och hur HP används vid antagning till högskolan.
              </div>
            </Link>
            <Link
              to="/ord"
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              params={{} as any}
              className="group block rounded-2xl border p-5 transition-all hover:border-primary/50"
              style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
            >
              <div className="text-base font-semibold" style={{ color: "var(--cream)" }}>
                Träna ord (10 000+ ord)
              </div>
              <div className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Ordträning med förklaring till varje ord. Ord du missar kommer tillbaka.
              </div>
            </Link>
          </div>
        </section>
      </article>
    </div>
  );
}
