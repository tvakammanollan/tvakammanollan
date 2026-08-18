/**
 * Trådarnas sitemap.
 *
 * public/sitemap.xml är handskriven och kan inte bära trådar — de tillkommer
 * hela tiden. Den här filen bygger XML:en ur databasen i stället, och
 * /forum-sitemap.xml serverar den.
 *
 * Server-only: importerar supabaseAdmin och får aldrig nå en klientbundle.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { threadPath } from "./forum";

const ORIGIN = "https://hpkampen.se";

/** PostgREST returnerar max ~1000 rader per anrop — därför sidvis hämtning. */
const PAGE_SIZE = 1000;
/** Sitemap-formatet tillåter 50 000 URL:er per fil. Vi håller oss en bit under. */
const MAX_URLS = 20000;

type Row = {
  id: number;
  slug: string;
  category_id: number;
  last_post_at: string;
};

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** ISO-tidsstämpel → YYYY-MM-DD, formatet <lastmod> vill ha. */
function lastmod(iso: string): string {
  return iso.slice(0, 10);
}

export async function buildForumSitemap(): Promise<string> {
  const { data: cats, error: catError } = await supabaseAdmin
    .from("forum_categories")
    .select("id,slug")
    .eq("admin_only", false);
  if (catError) {
    console.error("[forum] sitemap/categories:", catError.message);
    return emptySitemap();
  }
  const slugById = new Map((cats ?? []).map((c) => [c.id, c.slug]));

  const rows: Row[] = [];
  for (let page = 0; page * PAGE_SIZE < MAX_URLS; page++) {
    const from = page * PAGE_SIZE;
    const { data, error } = await supabaseAdmin
      .from("forum_threads")
      .select("id,slug,category_id,last_post_at")
      .eq("status", "visible")
      // En obesvarad tråd är tunt innehåll. Den kommer med så snart någon
      // svarat — vi håller den bara utanför tills dess, i stället för att
      // noindexa den (den ska få rankas när den väl har ett svar).
      .gt("reply_count", 0)
      .order("last_post_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) {
      console.error("[forum] sitemap/threads:", error.message);
      break;
    }
    const batch = (data ?? []) as Row[];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
  }

  const urls = rows
    .filter((t) => slugById.has(t.category_id))
    .map((t) => {
      const loc = `${ORIGIN}${threadPath(slugById.get(t.category_id)!, t.id, t.slug)}`;
      return [
        "  <url>",
        `    <loc>${xmlEscape(loc)}</loc>`,
        `    <lastmod>${lastmod(t.last_post_at)}</lastmod>`,
        "    <changefreq>weekly</changefreq>",
        "    <priority>0.6</priority>",
        "  </url>",
      ].join("\n");
    });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}

function emptySitemap(): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    "</urlset>",
    "",
  ].join("\n");
}
