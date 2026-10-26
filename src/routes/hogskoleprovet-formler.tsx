import { createFileRoute, Link } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { fitTitle } from "@/lib/seo-text";

/* =====================================================================
   FORMLER FÖR HÖGSKOLEPROVET. "formler högskoleprovet" och "hp
   formelsamling" söks av alla som pluggar XYZ och KVA. Formlerna står som
   vanlig text (π, ², √) och inte som KaTeX: KaTeX laddas lat och skulle ge
   rå TeX i den serverrenderade HTML:en, alltså det sökmotorn läser.

   Varje avsnitt pekar på en riktig uppgift i arkivet där formeln behövs.
   Byt bara exempel mot uppgifter som finns i src/data/prov och som faktiskt
   kräver formeln.
   ===================================================================== */

const PATH = "/hogskoleprovet-formler";

type Exempel = { term: string; pass: number; nr: number; label: string };
type Avsnitt = {
  id: string;
  rubrik: string;
  intro: string;
  formler: Array<{ namn: string; formel: string; not?: string }>;
  exempel: Exempel[];
};

const AVSNITT: Avsnitt[] = [
  {
    id: "brak-procent",
    rubrik: "Bråk och procent",
    intro: "Kommer i nästan varje kvantitativt provpass, ofta som en del av en större uppgift.",
    formler: [
      { namn: "Dela med ett bråk", formel: "a/b ÷ c/d = a/b · d/c" },
      { namn: "Andel", formel: "andel = delen / det hela" },
      { namn: "p procent av x", formel: "(p / 100) · x" },
      {
        namn: "Förändringsfaktor",
        formel: "nytt värde = gammalt värde · (1 + p/100)",
        not: "En ökning med 20 % är faktorn 1,2. En minskning med 20 % är 0,8.",
      },
    ],
    exempel: [
      { term: "2025vt", pass: 3, nr: 5, label: "Vårprovet 2025, provpass 3, uppgift 5" },
      { term: "2025ht", pass: 1, nr: 6, label: "Höstprovet 2025, provpass 1, uppgift 6" },
    ],
  },
  {
    id: "potenser",
    rubrik: "Potenser och rötter",
    intro:
      "Potenslagarna avgör många XYZ-uppgifter som ser krångliga ut men går på några sekunder.",
    formler: [
      { namn: "Multiplikation", formel: "aᵐ · aⁿ = aᵐ⁺ⁿ" },
      { namn: "Division", formel: "aᵐ / aⁿ = aᵐ⁻ⁿ" },
      { namn: "Potens av potens", formel: "(aᵐ)ⁿ = aᵐⁿ" },
      { namn: "Negativ exponent", formel: "a⁻ⁿ = 1 / aⁿ" },
      { namn: "Exponenten noll", formel: "a⁰ = 1 (a ≠ 0)" },
      { namn: "Rot som potens", formel: "√a = a^(1/2)" },
      { namn: "Rötter", formel: "√a · √b = √(ab)" },
    ],
    exempel: [
      { term: "2025ht", pass: 1, nr: 12, label: "Höstprovet 2025, provpass 1, uppgift 12" },
      { term: "2025vt", pass: 3, nr: 3, label: "Vårprovet 2025, provpass 3, uppgift 3" },
    ],
  },
  {
    id: "algebra",
    rubrik: "Algebra",
    intro:
      "Att känna igen reglerna åt båda hållen är det som sparar tid. Faktorisera lika ofta som du multiplicerar ut.",
    formler: [
      { namn: "Första kvadreringsregeln", formel: "(a + b)² = a² + 2ab + b²" },
      { namn: "Andra kvadreringsregeln", formel: "(a − b)² = a² − 2ab + b²" },
      { namn: "Konjugatregeln", formel: "(a + b)(a − b) = a² − b²" },
      {
        namn: "Andragradsekvation",
        formel: "x² + px + q = 0 ger x = −p/2 ± √((p/2)² − q)",
      },
    ],
    exempel: [{ term: "2025ht", pass: 1, nr: 3, label: "Höstprovet 2025, provpass 1, uppgift 3" }],
  },
  {
    id: "linjer",
    rubrik: "Räta linjer",
    intro: "Riktningskoefficienten och skärningen med axlarna är det som efterfrågas.",
    formler: [
      { namn: "Linjens ekvation", formel: "y = kx + m" },
      { namn: "Riktningskoefficient", formel: "k = (y₂ − y₁) / (x₂ − x₁)" },
      { namn: "Skärning med y-axeln", formel: "(0, m)" },
      { namn: "Skärning med x-axeln", formel: "(−m/k, 0)" },
      { namn: "Parallella linjer", formel: "samma k" },
    ],
    exempel: [
      { term: "2025ht", pass: 1, nr: 8, label: "Höstprovet 2025, provpass 1, uppgift 8" },
      { term: "2025vt", pass: 3, nr: 15, label: "Vårprovet 2025, provpass 3, uppgift 15" },
    ],
  },
  {
    id: "geometri",
    rubrik: "Area, omkrets och vinklar",
    intro:
      "Geometrin på provet kräver sällan mer än de här formlerna. Svårigheten ligger i att se vilken figur som döljer sig i uppgiften.",
    formler: [
      { namn: "Rektangel", formel: "A = b · h" },
      { namn: "Triangel", formel: "A = b · h / 2" },
      { namn: "Parallelltrapets", formel: "A = (a + b) · h / 2" },
      { namn: "Cirkelns area", formel: "A = πr²" },
      { namn: "Cirkelns omkrets", formel: "O = 2πr = πd" },
      {
        namn: "Pythagoras sats",
        formel: "a² + b² = c²",
        not: "c är hypotenusan, sidan mot den räta vinkeln.",
      },
      { namn: "Vinkelsumma i en triangel", formel: "180°" },
      { namn: "Vinkelsumma i en n-hörning", formel: "(n − 2) · 180°" },
    ],
    exempel: [],
  },
  {
    id: "volym",
    rubrik: "Volym",
    intro:
      "Kontrollera enheterna först. Volymuppgifter blandar ofta meter, decimeter och millimeter.",
    formler: [
      { namn: "Rätblock", formel: "V = l · b · h" },
      { namn: "Cylinder", formel: "V = πr²h" },
      { namn: "Kon och pyramid", formel: "V = basytans area · h / 3" },
      { namn: "Klot", formel: "V = 4πr³ / 3" },
      { namn: "Enheter", formel: "1 dm³ = 1 liter = 1 000 cm³" },
    ],
    exempel: [
      { term: "2026vt", pass: 3, nr: 11, label: "Vårprovet 2026, provpass 3, uppgift 11" },
      { term: "2025vt", pass: 3, nr: 2, label: "Vårprovet 2025, provpass 3, uppgift 2" },
    ],
  },
  {
    id: "sannolikhet",
    rubrik: "Sannolikhet och statistik",
    intro:
      "Läs alltid efter vad som redan är draget eller borttaget. Det är den vanligaste fällan.",
    formler: [
      { namn: "Sannolikhet", formel: "P = gynnsamma utfall / möjliga utfall" },
      { namn: "Både A och B (oberoende)", formel: "P(A och B) = P(A) · P(B)" },
      { namn: "Motsatt händelse", formel: "P(inte A) = 1 − P(A)" },
      { namn: "Medelvärde", formel: "summan av talen / antalet tal" },
      {
        namn: "Median",
        formel: "mittersta talet i storleksordning",
        not: "Med ett jämnt antal tal är medianen medelvärdet av de två mittersta.",
      },
    ],
    exempel: [
      { term: "2026vt", pass: 3, nr: 6, label: "Vårprovet 2026, provpass 3, uppgift 6" },
      { term: "2025ht", pass: 1, nr: 11, label: "Höstprovet 2025, provpass 1, uppgift 11" },
      { term: "2025vt", pass: 3, nr: 11, label: "Vårprovet 2025, provpass 3, uppgift 11" },
    ],
  },
  {
    id: "hastighet",
    rubrik: "Hastighet, sträcka och tid",
    intro: "Byt till samma enheter innan du räknar.",
    formler: [
      { namn: "Sträcka", formel: "s = v · t" },
      { namn: "Medelhastighet", formel: "v = total sträcka / total tid" },
      { namn: "Omvandling", formel: "1 m/s = 3,6 km/h" },
    ],
    exempel: [
      { term: "2025ht", pass: 1, nr: 7, label: "Höstprovet 2025, provpass 1, uppgift 7" },
      { term: "2025vt", pass: 3, nr: 20, label: "Vårprovet 2025, provpass 3, uppgift 20" },
    ],
  },
];

export const Route = createFileRoute("/hogskoleprovet-formler")({
  head: () => ({
    meta: pageMeta({
      path: PATH,
      title: fitTitle("Formler för högskoleprovet", "XYZ och KVA"),
      description:
        "Formlerna som behövs på högskoleprovets kvantitativa del: bråk, potenser, kvadreringsreglerna, räta linjer, area, volym, sannolikhet och hastighet. Med riktiga provuppgifter.",
      ogTitle: "Alla formler du behöver till högskoleprovet",
    }),
    links: pageLinks(PATH),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Formler", path: PATH },
      ]),
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "LearningResource",
        name: "Formler för högskoleprovet",
        url: `https://tvakommanollan.se${PATH}`,
        inLanguage: "sv-SE",
        isAccessibleForFree: true,
        learningResourceType: "Formelsamling",
        educationalLevel: "Högskoleförberedande",
        about: AVSNITT.map((a) => ({ "@type": "Thing", name: a.rubrik })),
        isPartOf: { "@id": "https://tvakommanollan.se/#website" },
      }),
    ],
  }),
  component: FormlerPage,
});

function FormlerPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
      <nav className="text-xs text-white/45" aria-label="Brödsmulor">
        <Link to="/" className="hover:text-white/70">
          Hem
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-white/70">Formler</span>
      </nav>

      <header className="mt-4">
        <h1
          className="text-[28px] font-bold leading-tight text-[var(--cream)] sm:text-[40px]"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
        >
          Formler för högskoleprovet
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-white/60">
          Det här är formlerna som återkommer i delproven XYZ och KVA, och ibland i NOG. Varje
          avsnitt har länkar till riktiga uppgifter ur tidigare prov där formeln behövs, så att du
          kan pröva direkt.
        </p>
        <ul className="mt-5 flex flex-wrap gap-2">
          {AVSNITT.map((a) => (
            <li key={a.id}>
              <a
                href={`#${a.id}`}
                className="inline-block rounded-full border border-white/12 px-3.5 py-1.5 text-sm text-white/70 transition hover:border-primary/50 hover:text-[var(--cream)]"
              >
                {a.rubrik}
              </a>
            </li>
          ))}
        </ul>
      </header>

      {AVSNITT.map((a) => (
        <section key={a.id} id={a.id} className="mt-12 scroll-mt-24">
          <h2
            className="flex items-center gap-2 text-[20px] font-bold text-[var(--cream)] sm:text-[24px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {a.rubrik}
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-white/60">{a.intro}</p>
          <dl className="mt-4 divide-y divide-white/8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm">
            {a.formler.map((f) => (
              <div key={f.namn} className="grid gap-1 px-5 py-3 sm:grid-cols-[minmax(0,14rem)_1fr]">
                <dt className="text-[14px] text-white/60">{f.namn}</dt>
                <dd>
                  <span className="text-[16px] font-semibold tabular-nums text-[var(--cream)]">
                    {f.formel}
                  </span>
                  {f.not && <p className="mt-1 text-[13px] text-white/55">{f.not}</p>}
                </dd>
              </div>
            ))}
          </dl>
          {a.exempel.length > 0 && (
            <p className="mt-3 text-[14px] text-white/55">
              Öva:{" "}
              {a.exempel.map((e, i) => (
                <span key={`${e.term}-${e.pass}-${e.nr}`}>
                  {i > 0 && ", "}
                  <Link
                    to="/gamla-prov/$term/$pass"
                    params={{ term: e.term, pass: String(e.pass) }}
                    className="underline decoration-white/20 underline-offset-2 hover:decoration-primary"
                  >
                    {e.label}
                  </Link>
                </span>
              ))}
            </p>
          )}
        </section>
      ))}

      <section className="mt-14 rounded-2xl border border-primary/25 bg-primary/[0.06] p-6 sm:p-8">
        <h2
          className="text-[20px] font-bold text-[var(--cream)] sm:text-[24px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Formler räcker inte, tempo gör det
        </h2>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-white/60">
          Ett kvantitativt provpass är 40 uppgifter på 55 minuter, alltså knappt en och en halv
          minut per uppgift. Träna formlerna i riktiga uppgifter tills de sitter utan att du behöver
          tänka.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Link
            to="/train"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-brand transition hover:brightness-110"
          >
            Träna kvantitativt
          </Link>
          <Link
            to="/guider/xyz"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-white/12 px-5 py-2.5 text-sm font-semibold text-[var(--cream)] transition hover:border-primary/50"
          >
            XYZ-guiden
          </Link>
          <Link
            to="/guider/kva"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-white/12 px-5 py-2.5 text-sm font-semibold text-[var(--cream)] transition hover:border-primary/50"
          >
            KVA-guiden
          </Link>
        </div>
      </section>
    </div>
  );
}
