import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { fitTitle } from "@/lib/seo-text";
import { getOrdlistaLetter } from "@/lib/ordlista.functions";
import { ordLetterLabel } from "@/lib/ord-slug";
import { formatInt } from "@/lib/sv-format";

/* =====================================================================
   ETT BOKSTAVSREGISTER

   Adressen är /ordlista/bokstav/<b> och inte /ordlista/<b>: det senare
   hade krockat med uppslagssidan, och ett ord på en bokstav finns
   ("a-"). Den statiska mellanled gör de två oskiljbara för alltid, utan
   att någon behöver minnas varför.
   ===================================================================== */

export const Route = createFileRoute("/ordlista_/bokstav/$bokstav")({
  loader: async ({ params }) => {
    const page = await getOrdlistaLetter({ data: { letter: params.bokstav } });
    if (!page || page.count === 0) throw notFound();
    return page;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { letter, count, words } = loaderData;
    const label = ordLetterLabel(letter);
    const path = `/ordlista/bokstav/${letter}`;
    // Några ord i beskrivningen gör utdraget konkret i stället för att
    // upprepa rubriken — och de skiljer de trettio registersidorna åt.
    const sample = words
      .slice(0, 6)
      .map((w) => w.word)
      .join(", ");
    return {
      meta: pageMeta({
        path,
        title: fitTitle(`Ord på ${label} – ordlista för högskoleprovet`, "· Tvåkommanollan"),
        description:
          `${formatInt(count)} ord på ${label} från ORD-delprovet, med betydelse och den uppgift de kom ur. ` +
          `Bland dem: ${sample}.`,
        ogTitle: `HP-ord på ${label}`,
        ogDescription: `${formatInt(count)} ord på ${label} med förklaring. Gratis.`,
      }),
      links: pageLinks(path),
      scripts: [
        breadcrumbScript([
          { name: "Hem", path: "/" },
          { name: "Ordlista", path: "/ordlista" },
          { name: label, path },
        ]),
        jsonLdScript({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `Ord på ${label}`,
          url: `https://tvakommanollan.se${path}`,
          inLanguage: "sv-SE",
          isPartOf: { "@id": "https://tvakommanollan.se/ordlista#set" },
        }),
      ],
    };
  },
  component: OrdlistaLetterPage,
});

function OrdlistaLetterPage() {
  const { letter, words, count } = Route.useLoaderData();
  const label = ordLetterLabel(letter);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
      <nav className="text-xs text-white/45" aria-label="Brödsmulor">
        <Link to="/" className="hover:text-white/70">
          Hem
        </Link>
        <span className="px-1.5">/</span>
        <Link to="/ordlista" className="hover:text-white/70">
          Ordlista
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-white/70">{label}</span>
      </nav>

      <header className="mt-4">
        <h1
          className="text-[28px] font-bold leading-tight text-[var(--cream)] sm:text-[38px]"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
        >
          HP-ord på {label}
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/60">
          {formatInt(count)} ord som förekommit på ORD-delprovet. Klicka på ett ord för betydelse,
          exempelmening och uppgiften det kom ur.
        </p>
      </header>

      <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
        {words.map((w) => (
          <li key={w.slug}>
            <Link
              to="/ordlista/$ord"
              params={{ ord: w.slug }}
              className="block truncate py-0.5 text-[15px] text-white/70 transition hover:text-[var(--amber)]"
            >
              {w.word}
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-sm text-white/45">
        <Link to="/ordlista" className="text-[var(--amber)] underline underline-offset-2">
          Tillbaka till ordlistan
        </Link>{" "}
        · eller{" "}
        <Link to="/ord" className="text-[var(--amber)] underline underline-offset-2">
          träna orden med upprepning
        </Link>
        .
      </p>
    </div>
  );
}
