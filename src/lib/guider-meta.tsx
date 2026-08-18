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
}

export const GUIDES: GuideMeta[] = [
  {
    path: "/guider/ord",
    label: "ORD · Ordkunskap",
    short: "ORD",
    description: "Synonymer, antonymer och ordförrådsbygge inför HP.",
  },
  {
    path: "/guider/mek",
    label: "MEK · Meningskomplettering",
    short: "MEK",
    description: "Luckteknik, logikord och så undviker du fällor.",
  },
  {
    path: "/guider/las",
    label: "LÄS · Svensk läsförståelse",
    short: "LÄS",
    description: "Frågetyper, lässtrategi och tidsdisposition per text.",
  },
  {
    path: "/guider/elf",
    label: "ELF · Engelsk läsförståelse",
    short: "ELF",
    description: "Akademisk engelska, except/NOT-fällor och strategi.",
  },
  {
    path: "/guider/xyz",
    label: "XYZ · Matematisk problemlösning",
    short: "XYZ",
    description: "Algebra, geometri, sannolikhet och uppskattning.",
  },
  {
    path: "/guider/kva",
    label: "KVA · Kvantitativa jämförelser",
    short: "KVA",
    description: "Jämför uttryck och avgör när 'kan ej avgöras' gäller.",
  },
  {
    path: "/guider/nog",
    label: "NOG · Kvantitativa resonemang",
    short: "NOG",
    description: "Avgör om informationen räcker — strategi och fällor.",
  },
  {
    path: "/guider/dtk",
    label: "DTK · Diagram, tabeller och kartor",
    short: "DTK",
    description: "Läs grafer snabbt och undvik skala-fällan.",
  },
  {
    path: "/guider/tidspress",
    label: "Tidspress på HP",
    short: "Tidspress",
    description: "Tidsdisposition per delprov och hoppa-strategin.",
  },
  {
    path: "/guider/bra-resultat",
    label: "Hur får man bra HP-resultat?",
    short: "Bra resultat",
    description: "Komplett strategi för att maximera ditt HP-betyg.",
  },
];

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
          className="group mb-8 flex items-center justify-between gap-3 rounded-2xl border border-[#ae2f26]/25 bg-[#ae2f26]/[0.06] p-4 transition-colors hover:border-[#ae2f26]/50 hover:bg-[#ae2f26]/[0.1]"
        >
          <span className="text-sm font-semibold" style={{ color: "var(--cream)" }}>
            Redo att öva? Kör riktiga {ovaSlug.toUpperCase()}-frågor med facit →
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
        className="text-xs font-semibold uppercase tracking-[0.25em]"
        style={{ color: "#7a5236" }}
      >
        Fler guider
      </h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {candidates.map((g) => (
          <Link
            key={g.path}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            to={g.path as any}
            className="group block rounded-2xl border p-4 transition-all hover:border-[#ae2f26]/50 hover:shadow-[0_0_16px_rgba(174,47,38,0.12)]"
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
          Se alla guider →
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
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    url,
    datePublished,
    dateModified,
    articleSection,
    ...(keywordValue ? { keywords: keywordValue } : {}),
    author: {
      "@type": "Person",
      name: "Niklas",
      url: "https://hpkampen.se/om",
    },
    publisher: {
      "@type": "Organization",
      name: "HP Kampen",
      url: "https://hpkampen.se",
      logo: {
        "@type": "ImageObject",
        url: "https://hpkampen.se/favicon.svg",
      },
    },
    image: "https://hpkampen.se/og-image-2.png",
    inLanguage: "sv-SE",
    isAccessibleForFree: true,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };
}
