/**
 * Helper for building per-page <head> meta arrays consistent with the
 * site-wide defaults in __root.tsx. Ensures every page gets unique
 * canonical, og:url, og:title, og:description, twitter:title and
 * twitter:description (overriding the root defaults), plus an optional
 * meta description.
 *
 * Usage in route file:
 *   head: () => ({
 *     meta: pageMeta({
 *       path: "/train",
 *       title: "Träna HP · alla 8 delprov utan tidspress",
 *       description: "...",
 *       ogDescription: "...",
 *     }),
 *     links: pageLinks("/train"),
 *   })
 *
 * `title` is bara SIDANS del — se `pageTitle()` för varför.
 */

const ORIGIN = "https://tvakommanollan.se";

/**
 * Namnet, i den form en människa läser den — se namnavsnittet i CLAUDE.md.
 * Bor här och ingen annanstans: två filer som skriver ut varumärket var sin
 * väg är precis hur `<title>` blev brand-först på startsidan och brand-sist
 * på de andra fyrtio, samtidigt som en tidigare version använde tankstreck
 * ("Tvåkommanollan – Elorankade dueller") på ett par sidor. Se `pageTitle()`.
 */
export const SITE_NAME = "Tvåkommanollan";

/**
 * Titelmallen: `Tvåkommanollan | <sidans egen titel>`.
 *
 * Vertikalstreck, inte tankstreck eller kolon — CLAUDE.md:s regel om
 * tankstreck i text som en människa läser gäller `<title>` precis som allt
 * annat, och `·` (mittpunkt) hade krockat med sitens egen separator inuti
 * sidtitlar ("Guider · alla 8 delprov"). Varumärket FÖRST: sökmotorers
 * träfflistor kapar titeln från höger, så det som riskerar att försvinna ska
 * vara den del som redan står i domänen och webbplatsnamnet, inte sidans
 * egen beskrivning.
 *
 * `page` ska vara UNDER 43 tecken — "Tvåkommanollan | " är 17, och hela
 * titeln bör hålla sig under 60 för att inte kapas i en träfflista.
 */
export function pageTitle(page: string): string {
  return `${SITE_NAME} | ${page}`;
}

export interface PageMetaInput {
  path: string; // e.g. "/train"
  /** BARA sidans egen del — `Tvåkommanollan | ` läggs på av `pageMeta`. */
  title: string;
  description: string;
  /**
   * Delningsrubrik (og:title/twitter:title). Fritt formulerad med flit —
   * en delning säljer på attraktionskraft, inte på samma mall som
   * sökträfflistan. Utelämnad ärver den formaterade `title` ovan.
   */
  ogTitle?: string;
  ogDescription?: string;
  /**
   * Optional per-page OG/Twitter image override. Defaults to /og-image-4.png
   * set in __root.tsx. Pass a relative path like "/og-faq.png" or an
   * absolute URL.
   *
   * **Skicka alltid `ogImageWidth`/`ogImageHeight` med.** Roten sätter
   * `og:image:width`/`height` till 1200x630 för delningsbilden, och en
   * sidbild med andra mått ärvde dem tyst: Slack, LinkedIn och Discord
   * litar på måtten och ritade rutan i fel proportion.
   */
  ogImage?: string;
  ogImageAlt?: string;
  ogImageWidth?: number;
  ogImageHeight?: number;
  noindex?: boolean;
}

export function pageMeta(input: PageMetaInput) {
  const url = ORIGIN + input.path;
  const fullTitle = pageTitle(input.title);
  // `ogTitle` ärver den FORMATERADE titeln, inte den råa — annars saknar en
  // delning som inte satt en egen rubrik varumärket helt.
  const ogTitle = input.ogTitle ?? fullTitle;
  const ogDescription = input.ogDescription ?? input.description;
  const meta: Array<Record<string, string>> = [
    { title: fullTitle },
    { name: "description", content: input.description },
    { property: "og:title", content: ogTitle },
    { property: "og:description", content: ogDescription },
    { property: "og:url", content: url },
    { name: "twitter:title", content: ogTitle },
    { name: "twitter:description", content: ogDescription },
  ];
  if (input.ogImage) {
    // Normalisera till absolut URL eftersom OG kräver det
    const imageUrl = input.ogImage.startsWith("http") ? input.ogImage : ORIGIN + input.ogImage;
    meta.push({ property: "og:image", content: imageUrl });
    meta.push({ name: "twitter:image", content: imageUrl });
    if (input.ogImageWidth && input.ogImageHeight) {
      meta.push({ property: "og:image:width", content: String(input.ogImageWidth) });
      meta.push({ property: "og:image:height", content: String(input.ogImageHeight) });
    }
    if (input.ogImageAlt) {
      meta.push({ property: "og:image:alt", content: input.ogImageAlt });
    }
  }
  if (input.noindex) {
    meta.push({ name: "robots", content: "noindex, follow" });
  }
  return meta;
}

export function pageLinks(path: string) {
  return [{ rel: "canonical", href: ORIGIN + path }];
}

/**
 * Build a BreadcrumbList JSON-LD script entry for the route's `scripts` array.
 * Pass the trail from root to current page, e.g.
 *   breadcrumbScript([
 *     { name: "Hem", path: "/" },
 *     { name: "Träna HP", path: "/train" },
 *   ])
 */
export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function breadcrumbScript(items: BreadcrumbItem[]) {
  return {
    type: "application/ld+json",
    children: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: it.name,
        item: ORIGIN + it.path,
      })),
    }),
  };
}

/**
 * Build an arbitrary JSON-LD script entry. Pass any schema.org object.
 */
export function jsonLdScript(data: Record<string, unknown>) {
  return {
    type: "application/ld+json",
    children: JSON.stringify(data),
  };
}
