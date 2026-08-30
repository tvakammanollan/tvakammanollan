import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { describeWithin, fitTitle, trimToWord } from "@/lib/seo-text";
import { getOrdlistaEntry } from "@/lib/ordlista.functions";
import { ordLetterLabel } from "@/lib/ord-slug";
import { formatInt } from "@/lib/sv-format";

/* =====================================================================
   ORDLISTAN — ETT UPPSLAG PER SIDA

   Beståndet på 8 761 ORD-uppslag var sajtens största textmängd och gick
   bara att nå genom att öva. Sökningarna det svarar på ("vad betyder
   viskös", "deskriptiv synonym") är precis de frågor någon som pluggar
   ORD ställer, och de fanns ingenstans på sajten.

   Sidan är byggd runt två saker vi äger, i den ordningen:

   1. Förklaringen, med källan utskriven. Den är hämtad ur en ordbok och
      ska aldrig se ut som vår egen text — därav källraden och att
      exempelmeningarna sätts i kursiv som citat.
   2. Uppgiften ordet faktiskt kom ur, med sina fem alternativ och facit.
      Det är offentligt UHR-material och finns inte samlat någon
      annanstans; det är det som gör sidan värd att indexera i stället
      för att vara ännu en ordboksavskrift.

   Sidorna länkar till varandra på två sätt — ordbokens JFR-ord och
   grannarna i bokstavsordning — så att hela listan går att krypa igenom
   utan att någon sida ligger mer än ett par klick från navet.
   ===================================================================== */

export const Route = createFileRoute("/ordlista_/$ord")({
  loader: async ({ params }) => {
    const entry = await getOrdlistaEntry({ data: { slug: params.ord } });
    if (!entry) throw notFound();
    return entry;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { word, slug, sense, wordClass, related, question } = loaderData;
    const path = `/ordlista/${encodeURIComponent(slug)}`;
    const synonyms = related.map((r) => r.word).slice(0, 4);
    // Betydelsen och synonymerna som två meningar, så att describeWithin kan
    // släppa den andra hel i stället för att kapa den första mitt i. Att
    // kapa betydelsen på egen hand räckte inte: ordklassen, uppslagsordet
    // och synonymerna kommer ovanpå, och summan sprack (filibuster 192
    // tecken, censur 183) fastän varje del för sig såg lagom ut.
    // Facit ur ORD-uppgiften först: det är en synonym till ordet, hämtad ur
    // UHR:s öppna material, och alltså vårt eget svar på "vad betyder X".
    const body =
      `${word}${wordClass ? ` (${wordClass})` : ""}: ` +
      `${question?.correctText ? `${question.correctText}. ` : ""}${sense}` +
      `${synonyms.length ? ` Liknande ord: ${synonyms.join(", ")}.` : ""}`;

    return {
      meta: pageMeta({
        path,
        title: fitTitle(`Vad betyder ${word}?`, "· Ordlista"),
        description: describeWithin(body, "Se uppgiften ordet kom ur på högskoleprovet."),
        ogTitle: `Vad betyder ${word}?`,
        ogDescription:
          trimToWord(question?.correctText ?? sense, 140) ||
          `${word}: förklaring, exempel och HP-uppgiften ordet kom ur.`,
      }),
      links: pageLinks(path),
      scripts: [
        breadcrumbScript([
          { name: "Hem", path: "/" },
          { name: "Ordlista", path: "/ordlista" },
          { name: word, path },
        ]),
        // DefinedTerm i en DefinedTermSet är schema.org:s egen form för
        // precis det här: ett uppslag i en ordlista. Den säger också vilken
        // samling uppslaget hör till, vilket knyter ihop alla 8 761 sidorna.
        jsonLdScript({
          "@context": "https://schema.org",
          "@type": "DefinedTerm",
          "@id": `https://tvakommanollan.se${path}#term`,
          name: word,
          description: sense,
          url: `https://tvakommanollan.se${path}`,
          inLanguage: "sv-SE",
          termCode: slug,
          inDefinedTermSet: {
            "@type": "DefinedTermSet",
            "@id": "https://tvakommanollan.se/ordlista#set",
            name: "Ordlista för Högskoleprovet",
            url: "https://tvakommanollan.se/ordlista",
          },
        }),
      ],
    };
  },
  component: OrdlistaEntryPage,
});

function OrdlistaEntryPage() {
  const entry = Route.useLoaderData();
  const {
    word,
    sense,
    related,
    wordClass,
    sourceLabel,
    sourceUrl,
    question,
    prev,
    next,
    letter,
    total,
  } = entry;

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
        <Link
          to="/ordlista/bokstav/$bokstav"
          params={{ bokstav: letter }}
          className="hover:text-white/70"
        >
          {ordLetterLabel(letter)}
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-white/70">{word}</span>
      </nav>

      <header className="mt-4">
        <h1
          className="text-[32px] font-bold leading-tight text-[var(--cream)] sm:text-[44px]"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
        >
          {word}
        </h1>
        {wordClass && <p className="mt-1 text-sm italic text-white/45">{wordClass}</p>}
      </header>

      {/* Vad ordet betyder. Facit ur ORD-uppgiften står först — det är en
          synonym till ordet, ur UHR:s öppna provmaterial, alltså vårt eget
          svar på frågan. Ordbokens rad står under, kort och källhänvisad:
          hela artikeln hör hemma hos den som äger den, och länken går dit. */}
      <section className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-sm">
        <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
          <BookOpen className="h-3.5 w-3.5" />
          Vad betyder {word}?
        </h2>

        {question?.correctText && (
          <p className="mt-2.5 text-[17px] leading-[1.6] text-[var(--cream)]">
            På högskoleprovet var rätt svar{" "}
            <strong className="font-semibold">{question.correctText}</strong>.
          </p>
        )}

        {sense && (
          <p className="mt-3 text-[15px] leading-[1.7] text-white/70">&rdquo;{sense}&rdquo;</p>
        )}

        <p className="mt-4 text-[11px] uppercase tracking-wide text-white/45">
          {sourceUrl ? (
            <a
              href={sourceUrl}
              rel="noopener nofollow"
              target="_blank"
              className="underline underline-offset-2 transition hover:text-white/70"
            >
              {sourceLabel}
            </a>
          ) : (
            sourceLabel
          )}
        </p>
      </section>

      {related.length > 0 && (
        <section className="mt-6">
          <h2
            className="text-[18px] font-bold text-[var(--cream)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Liknande ord
          </h2>
          <ul className="mt-2.5 flex flex-wrap gap-2">
            {related.map((r) =>
              r.slug ? (
                <li key={r.word}>
                  <Link
                    to="/ordlista/$ord"
                    params={{ ord: r.slug }}
                    className="inline-block rounded-full border border-white/12 px-3 py-1 text-sm text-[var(--cream)] transition hover:border-primary/50"
                  >
                    {r.word}
                  </Link>
                </li>
              ) : (
                <li
                  key={r.word}
                  className="inline-block rounded-full border border-transparent px-3 py-1 text-sm text-white/55"
                >
                  {r.word}
                </li>
              ),
            )}
          </ul>
        </section>
      )}

      {/* Uppgiften ordet kom ur. Sajtens eget innehåll, och skälet till att
          sidan är mer än en ordboksavskrift. Facit står färgat på brickan,
          aldrig på svarstexten — den som läser vill kunna läsa ordet. */}
      {question && (
        <section className="mt-8">
          <h2
            className="text-[20px] font-bold text-[var(--cream)] sm:text-[22px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {word} på högskoleprovet
          </h2>
          <p className="mt-1 text-sm text-white/45">
            Så här såg ORD-uppgiften ut. Rätt svar är markerat, och alternativ som har en egen sida
            i ordlistan går att klicka vidare på.
          </p>
          <ul className="mt-3 grid gap-1.5">
            {question.options.map((o) => {
              const isCorrect = o.id === question.correctAnswer;
              return (
                <li
                  key={o.id}
                  className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 text-[15px] ${
                    isCorrect
                      ? "border-[var(--success-line)] bg-[var(--success-soft)] text-[var(--cream)]"
                      : "border-white/10 text-white/65"
                  }`}
                >
                  <span
                    className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-bold ${
                      isCorrect
                        ? "bg-[var(--success)] text-[var(--success-ink)]"
                        : "bg-white/[0.06] text-white/55"
                    }`}
                  >
                    {o.id}
                  </span>
                  {o.slug ? (
                    <Link
                      to="/ordlista/$ord"
                      params={{ ord: o.slug }}
                      className="underline decoration-white/20 underline-offset-2 transition hover:decoration-[var(--amber)]"
                    >
                      {o.text}
                    </Link>
                  ) : (
                    <span>{o.text}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="mt-8 rounded-xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-sm">
        <h2
          className="flex items-center gap-1.5 text-[18px] font-bold text-[var(--cream)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <Sparkles className="h-4 w-4 text-[var(--amber)]" />
          Plugga orden i stället för att slå upp dem
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-white/60">
          {word} är ett av {formatInt(total)} ord ur tidigare högskoleprov. I ordträningen kommer de
          tillbaka med växande mellanrum tills de sitter. Gratis, utan konto.
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <Link
            to="/ord"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-brand transition hover:brightness-110"
          >
            Träna ORD gratis
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/guider/ord"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-5 py-2.5 text-sm font-semibold text-[var(--cream)] transition hover:border-primary/50"
          >
            ORD-guide & strategi
          </Link>
        </div>
      </section>

      {/* Grannarna i bokstavsordning. Kedjan gör att en robot kan gå från
          vilket uppslag som helst till nästa utan att via navet. */}
      <nav
        className="mt-8 flex items-stretch justify-between gap-3 border-t border-white/10 pt-5 text-sm"
        aria-label="Föregående och nästa ord"
      >
        {prev ? (
          <Link
            to="/ordlista/$ord"
            params={{ ord: prev.slug }}
            className="group flex max-w-[48%] items-center gap-2 text-white/60 transition hover:text-[var(--cream)]"
            rel="prev"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="truncate">{prev.word}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            to="/ordlista/$ord"
            params={{ ord: next.slug }}
            className="group flex max-w-[48%] items-center gap-2 text-right text-white/60 transition hover:text-[var(--cream)]"
            rel="next"
          >
            <span className="truncate">{next.word}</span>
            <ArrowRight className="h-4 w-4 shrink-0" />
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
