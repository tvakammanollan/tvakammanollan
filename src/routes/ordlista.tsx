import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen } from "lucide-react";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { fitTitle } from "@/lib/seo-text";
import { getOrdlistaOverview } from "@/lib/ordlista.functions";
import { ordLetterLabel } from "@/lib/ord-slug";
import { formatInt } from "@/lib/sv-format";

/* =====================================================================
   ORDLISTANS NAV

   Bokstavsregistren i stället för en lista med 8 761 länkar: en sida med
   åtta tusen länkar är varken läsbar eller krypbar, och Google slutar
   följa långt innan slutet. Två steg — bokstav, sedan ord — håller varje
   uppslag tre klick från startsidan.
   ===================================================================== */

export const Route = createFileRoute("/ordlista")({
  loader: async () => getOrdlistaOverview(),
  head: ({ loaderData }) => {
    const total = loaderData?.total ?? 0;
    return {
      meta: pageMeta({
        path: "/ordlista",
        title: fitTitle("Ordlista för högskoleprovet · alla ord med förklaring"),
        description:
          `Alla ${total ? formatInt(total) + " " : ""}ord som förekommit på ORD-delprovet, med betydelse, ` +
          `exempelmening, liknande ord och uppgiften ordet kom ur. Sök på bokstav och plugga gratis.`,
        ogTitle: "Ordlista för högskoleprovet",
        ogDescription:
          "Varje ord som dykt upp på ORD, med förklaring och den riktiga HP-uppgiften. Gratis.",
      }),
      links: pageLinks("/ordlista"),
      scripts: [
        breadcrumbScript([
          { name: "Hem", path: "/" },
          { name: "Ordlista", path: "/ordlista" },
        ]),
        jsonLdScript({
          "@context": "https://schema.org",
          "@type": "DefinedTermSet",
          "@id": "https://tvakommanollan.se/ordlista#set",
          name: "Ordlista för Högskoleprovet",
          description:
            "Ord från ORD-delprovet på högskoleprovet, med betydelse, exempel och den uppgift ordet kom ur.",
          url: "https://tvakommanollan.se/ordlista",
          inLanguage: "sv-SE",
          isPartOf: { "@id": "https://tvakommanollan.se/#website" },
        }),
      ],
    };
  },
  component: OrdlistaIndexPage,
});

function OrdlistaIndexPage() {
  const { total, letters } = Route.useLoaderData();

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
      <nav className="text-xs text-white/45" aria-label="Brödsmulor">
        <Link to="/" className="hover:text-white/70">
          Hem
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-white/70">Ordlista</span>
      </nav>

      <header className="mt-4">
        <h1
          className="text-[28px] font-bold leading-tight text-[var(--cream)] sm:text-[38px]"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
        >
          Ordlista för högskoleprovet
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/60">
          {formatInt(total)} ord som förekommit på ORD-delprovet. Varje ord har sin betydelse, en
          exempelmening, närliggande ord och uppgiften det faktiskt kom ur, med facit. Gratis och
          utan konto.
        </p>
        <div className="mt-5">
          <Link
            to="/ord"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-brand transition hover:brightness-110"
          >
            Träna orden i stället
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <section className="mt-10">
        <h2
          className="flex items-center gap-1.5 text-[20px] font-bold text-[var(--cream)] sm:text-[24px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <BookOpen className="h-5 w-5 text-[var(--amber)]" />
          Bläddra på bokstav
        </h2>
        <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {letters.map(({ letter, count }) => (
            <li key={letter}>
              <Link
                to="/ordlista/bokstav/$bokstav"
                params={{ bokstav: letter }}
                className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] px-2 py-3 backdrop-blur-sm transition hover:border-primary/50"
              >
                <span
                  className="text-[20px] font-bold text-[var(--cream)]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {ordLetterLabel(letter)}
                </span>
                <span className="mt-0.5 text-[11px] text-white/45">{formatInt(count)} ord</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 rounded-xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-sm">
        <h2
          className="text-[18px] font-bold text-[var(--cream)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Var kommer orden ifrån?
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-white/60">
          Orden är hämtade ur ORD-delprovet på tidigare högskoleprov, som UHR publicerar öppet.
          Betydelserna kommer från svenska ordböcker och är källhänvisade på varje sida. Vill du
          förstå hur delprovet är uppbyggt finns{" "}
          <Link to="/guider/ord" className="text-[var(--amber)] underline underline-offset-2">
            ORD-guiden
          </Link>
          , och riktiga uppgifter att öva på i{" "}
          <Link
            to="/ova/$delprov"
            params={{ delprov: "ord" }}
            className="text-[var(--amber)] underline underline-offset-2"
          >
            öva ORD
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
