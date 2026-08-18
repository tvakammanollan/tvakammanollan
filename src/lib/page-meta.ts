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
 *       title: "Träna HP · alla 8 delprov utan tidspress · HP Kampen",
 *       description: "...",
 *       ogTitle: "Träna HP utan tidspress · HP Kampen",
 *       ogDescription: "...",
 *     }),
 *     links: pageLinks("/train"),
 *   })
 */

const ORIGIN = "https://tvakommanollan.se";

export interface PageMetaInput {
  path: string; // e.g. "/train"
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  /**
   * Optional per-page OG/Twitter image override. Defaults to /og-image-3.png
   * set in __root.tsx. Pass a relative path like "/og-faq.png" or an
   * absolute URL. Always include width/height for proper rich preview
   * rendering on Slack, Twitter, LinkedIn, Discord.
   */
  ogImage?: string;
  ogImageAlt?: string;
  noindex?: boolean;
}

export function pageMeta(input: PageMetaInput) {
  const url = ORIGIN + input.path;
  const ogTitle = input.ogTitle ?? input.title;
  const ogDescription = input.ogDescription ?? input.description;
  const meta: Array<Record<string, string>> = [
    { title: input.title },
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
