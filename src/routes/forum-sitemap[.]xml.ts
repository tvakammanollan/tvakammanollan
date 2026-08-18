import { createFileRoute } from "@tanstack/react-router";
import { buildForumSitemap } from "@/lib/forum-sitemap.server";

/**
 * /forum-sitemap.xml — trådarna. De statiska forumsidorna ligger kvar i
 * public/sitemap.xml; robots.txt pekar ut båda filerna.
 *
 * Cachas vid kanten i en timme: sitemapen läses av robotar, inte av
 * människor, och en timmes eftersläpning på en nyskapad tråd spelar ingen roll.
 */
export const Route = createFileRoute("/forum-sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const xml = await buildForumSitemap();
          return new Response(xml, {
            headers: {
              "Content-Type": "application/xml; charset=utf-8",
              "Cache-Control": "public, max-age=300, s-maxage=3600",
            },
          });
        } catch (e) {
          console.error("[forum] sitemap:", e);
          // Hellre en tom men giltig sitemap än en 500:a — en trasig
          // sitemap får Google att sluta läsa den.
          return new Response(
            '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>\n',
            { headers: { "Content-Type": "application/xml; charset=utf-8" } },
          );
        }
      },
    },
  },
});
