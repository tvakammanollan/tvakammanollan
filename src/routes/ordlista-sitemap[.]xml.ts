import { createFileRoute } from "@tanstack/react-router";
import { buildOrdlistaSitemap } from "@/lib/ordlista.server";

/**
 * /ordlista-sitemap.xml — de 8 761 uppslagen plus bokstavsregistren.
 *
 * Egen fil av samma skäl som forumets: public/sitemap.xml är handskriven och
 * kan inte bära nio tusen adresser som ändras när beståndet gör det.
 * robots.txt pekar ut alla tre.
 *
 * Cachas en timme vid kanten — läses av robotar, inte av människor.
 */
export const Route = createFileRoute("/ordlista-sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const xml = await buildOrdlistaSitemap();
          return new Response(xml, {
            headers: {
              "Content-Type": "application/xml; charset=utf-8",
              "Cache-Control": "public, max-age=300, s-maxage=3600",
            },
          });
        } catch (e) {
          console.error("[ordlista] sitemap:", e);
          // Hellre tom men giltig än 500: en trasig sitemap får Google att
          // sluta läsa den, och då tappas hela ordlistan.
          return new Response(
            '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>\n',
            { headers: { "Content-Type": "application/xml; charset=utf-8" } },
          );
        }
      },
    },
  },
});
