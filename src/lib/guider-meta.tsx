import { Link } from "@tanstack/react-router";

/**
 * Shared metadata for all guider pages.
 * Used to render the "RelatedGuides" footer on each guide page
 * and to look up paths/labels in a single place.
 */

export interface GuideMeta {
  path: string;
  label: string;
  short: string;
  description: string;
  /**
   * Publicerad och senast ändrad, ISO-datum. Går in i Article-datan och i
   * `article:published_time`/`modified_time`. Publiceringsdatumet är dagen
   * route-filen kom in i git; `modified` flyttas fram för hand när texten
   * ändras i sak, inte vid varje omformatering.
   */
  published: string;
  modified: string;
}

export const GUIDES: GuideMeta[] = [
  {
    path: "/guider/fran-noll-till-2-0",
    label: "Komplett guide inför högskoleprovet", // copy-ok
    short: "Hela vägen",
    description: "Så skulle Niklas plugga från noll till 2,0: grunder, prioriteringar och provdagen.",
    published: "2026-11-13",
    modified: "2026-11-13",
  },
  {
    path: "/guider/ord",
    label: "ORD: Ordkunskap",
    short: "ORD",
    description: "Hur uppgifterna ser ut och hur du bygger ordförråd.",
    published: "2026-05-18",
    modified: "2026-10-26",
  },
  {
    path: "/guider/mek",
    label: "MEK: Meningskomplettering",
    short: "MEK",
    description: "Sambandsord, vanliga fällor och hur du läser uppgiften.",
    published: "2026-05-18",
    modified: "2026-10-26",
  },
  {
    path: "/guider/las",
    label: "LÄS: Svensk läsförståelse",
    short: "LÄS",
    description: "Frågetyper, texttyper och tid per text.",
    published: "2026-05-18",
    modified: "2026-10-26",
  },
  {
    path: "/guider/elf",
    label: "ELF: Engelsk läsförståelse",
    short: "ELF",
    description: "Ordförråd, ord som ändrar frågan och skillnaden mot LÄS.",
    published: "2026-05-18",
    modified: "2026-10-26",
  },
  {
    path: "/guider/xyz",
    label: "XYZ: Matematisk problemlösning",
    short: "XYZ",
    description: "Algebra, geometri, sannolikhet och uppskattning.",
    published: "2026-05-18",
    modified: "2026-10-26",
  },
  {
    path: "/guider/kva",
    label: "KVA: Kvantitativa jämförelser",
    short: "KVA",
    description: "Jämför uttryck och avgör när 'kan ej avgöras' gäller.",
    published: "2026-05-18",
    modified: "2026-10-26",
  },
  {
    path: "/guider/nog",
    label: "NOG: Kvantitativa resonemang",
    short: "NOG",
    description: "Avgör om informationen räcker: arbetsordning och vanliga fällor.",
    published: "2026-05-18",
    modified: "2026-10-26",
  },
  {
    path: "/guider/dtk",
    label: "DTK: Diagram, tabeller och kartor",
    short: "DTK",
    description: "Vad du ska titta på i ett diagram, och vanliga misstag med skalor.",
    published: "2026-05-18",
    modified: "2026-10-26",
  },
  {
    path: "/guider/tidspress",
    label: "Tidspress på HP",
    short: "Tidspress",
    description: "Tid per delprov och när du ska gå vidare.",
    published: "2026-05-18",
    modified: "2026-10-26",
  },
  {
    path: "/guider/bra-resultat",
    label: "Hur får man bra HP-resultat?",
    short: "Bra resultat",
    description: "Studieplan och prioriteringar inför provet.",
    published: "2026-05-18",
    modified: "2026-10-26",
  },
];

/**
 * Delningsmeta för en guide: `og:type=article` plus publicerings- och
 * ändringsdatum ur GUIDES. Sprids in i `pageMeta({...})`.
 */
export function guideArticleMeta(path: string) {
  const g = guideByPath(path);
  return {
    ogType: "article" as const,
    datePublished: g?.published,
    dateModified: g?.modified,
  };
}

export function guideByPath(path: string): GuideMeta | undefined {
  return GUIDES.find((g) => g.path === path);
}

/**
 * Render a "Related guides" section.
 * Excludes the current page and shows up to 4 related guides.
 *
 * If `relatedPaths` is provided, those guides are shown.
 * Otherwise the first 4 guides (skipping current) are shown.
 */
export function RelatedGuides({
  currentPath,
  relatedPaths,
}: {
  currentPath: string;
  relatedPaths?: string[];
}) {
  const candidates = relatedPaths
    ? (relatedPaths.map((p) => GUIDES.find((g) => g.path === p)).filter(Boolean) as GuideMeta[])
    : GUIDES.filter((g) => g.path !== currentPath).slice(0, 4);

  if (candidates.length === 0) return null;

  // Om guiden hör till ett delprov: länka till motsvarande öva-sida (hub→spoke).
  const ovaSlug = currentPath.match(/^\/guider\/(ord|mek|las|elf|xyz|kva|nog|dtk)$/)?.[1];

  return (
    <section
      className="mt-16 border-t pt-10"
      style={{ borderColor: "var(--line)" }}
      aria-labelledby="related-guides"
    >
      {ovaSlug && (
        <Link
          to="/ova/$delprov"
          params={{ delprov: ovaSlug }}
          className="group mb-8 flex items-center justify-between gap-3 rounded-2xl border border-primary/25 bg-primary/[0.06] p-4 transition-colors hover:border-primary/50 hover:bg-primary/[0.1]"
        >
          <span className="text-sm font-semibold" style={{ color: "var(--cream)" }}>
            Öva på {ovaSlug.toUpperCase()}-uppgifter med facit
          </span>
          <span
            className="shrink-0 text-sm font-semibold transition-transform group-hover:translate-x-0.5"
            style={{ color: "var(--amber)" }}
          >
            Öva {ovaSlug.toUpperCase()}
          </span>
        </Link>
      )}
      <h2
        id="related-guides"
        className="text-xs font-semibold "
        style={{ color: "#10242f" }}
      >
        Fler guider
      </h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {candidates.map((g) => (
          <Link
            key={g.path}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            to={g.path as any}
            className="group block rounded-2xl border p-4 transition-all hover:border-primary/50"
            style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
          >
            <div className="text-sm font-semibold" style={{ color: "var(--cream)" }}>
              {g.label}
            </div>
            <div className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
              {g.description}
            </div>
          </Link>
        ))}
      </div>
      <p className="mt-6 text-xs" style={{ color: "var(--text-tertiary)" }}>
        <Link to="/guider" className="underline" style={{ color: "var(--amber)" }}>
          Se alla guider
        </Link>
      </p>
    </section>
  );
}

/**
 * Build the standard Article JSON-LD for a guide page.
 * Saves repetition across all guider routes.
 *
 * @param datePublished Optional ISO date (YYYY-MM-DD) — defaults to current GUIDER_PUBLISH_DATE.
 * @param dateModified Optional ISO date (YYYY-MM-DD) — defaults to current GUIDER_MODIFIED_DATE.
 */
export const GUIDER_PUBLISH_DATE = "2026-05-18";
export const GUIDER_MODIFIED_DATE = "2026-05-18";

export function guideArticleJsonLd({
  headline,
  description,
  url,
  datePublished = GUIDER_PUBLISH_DATE,
  dateModified = GUIDER_MODIFIED_DATE,
  keywords,
  articleSection = "Högskoleprovet",
}: {
  headline: string;
  description: string;
  url: string;
  datePublished?: string;
  dateModified?: string;
  /** Comma-separated keywords or array — improves topical relevance signals */
  keywords?: string | string[];
  articleSection?: string;
}) {
  const keywordValue = Array.isArray(keywords) ? keywords.join(", ") : keywords;
  // Datumen hämtas ur GUIDES när anroparen inte skickat egna: tio guider
  // stod utan datePublished/dateModified, och en Article utan datum får
  // varken datum i träfflistan eller någon färskhetssignal.
  const guide = guideByPath(url.replace(/^https?:\/\/[^/]+/, ""));
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    url,
    datePublished: datePublished ?? guide?.published,
    dateModified: dateModified ?? guide?.modified,
    articleSection,
    ...(keywordValue ? { keywords: keywordValue } : {}),
    author: {
      "@type": "Person",
      name: "Niklas",
      url: "https://tvakommanollan.se/om",
    },
    publisher: {
      "@type": "Organization",
      name: "Tvåkommanollan",
      url: "https://tvakommanollan.se",
      // PNG, inte SVG: Googles logotypriktlinjer vill ha ett rasterformat.
      logo: {
        "@type": "ImageObject",
        url: "https://tvakommanollan.se/icon-192.png",
        width: 192,
        height: 192,
      },
    },
    image: "https://tvakommanollan.se/og-image-5.png",
    inLanguage: "sv-SE",
    isAccessibleForFree: true,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };
}

/* ── Vanliga frågor per delprovsguide (2026-10-24) ─────────────────── */

export type GuideFaqItem = { q: string; a: string };

/**
 * Samma text går till den synliga listan och till FAQPage-datan, ordagrant:
 * Google kräver att FAQ-innehållet syns på sidan. Lägg därför aldrig till en
 * fråga bara i JSON-LD.
 */
export function guideFaqJsonLd(items: GuideFaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

export function GuideFaq({ items }: { items: GuideFaqItem[] }) {
  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold" style={{ color: "var(--cream)" }}>
        Vanliga frågor
      </h2>
      <dl className="mt-4 space-y-5">
        {items.map(({ q, a }) => (
          <div key={q}>
            <dt className="font-semibold" style={{ color: "var(--cream)" }}>
              {q}
            </dt>
            <dd className="mt-1">{a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
