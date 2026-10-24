import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { limits } from "./rate-limit";
import { assertRateLimit, ipKey } from "./rate-limit.server";
import { provThreadNr } from "./forum";

/** Var en uppgifts tråd bor: parametrarna till /forum/$kategori/$trad. */
export type ProvThreadLink = { kategori: string; trad: string };

/**
 * Forumtrådarna som går igenom uppgifter i ett visst provpass, som
 * uppgiftsnummer → tråd. Gamla prov länkar till dem från facitlistan och från
 * uppgiftskortet efter rättningen, och trådarna länkar tillbaka till passet:
 * länkar åt båda hållen är det som binder ihop de två delarna av sajten för
 * en sökmotor.
 *
 * Kastar aldrig. Ett provpass ska gå att skriva även när forumet inte svarar,
 * så ett fel blir en tom lista och en rad i loggen.
 */
export const fetchProvThreads = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        term: z.string().regex(/^\d{4}(vt|ht)[ab]?$/),
        pass: z.number().int().min(1).max(9),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<Record<number, ProvThreadLink>> => {
    assertRateLimit(ipKey("prov-threads"), limits.publicRead);
    const [threads, cats] = await Promise.all([
      supabaseAdmin
        .from("forum_threads")
        .select("id, slug, category_id")
        .eq("prov_term", data.term)
        .eq("status", "visible"),
      supabaseAdmin.from("forum_categories").select("id, slug").eq("admin_only", false),
    ]);
    if (threads.error || cats.error) {
      console.error("[forum-prov]", threads.error?.message ?? cats.error?.message);
      return {};
    }
    const catSlug = new Map((cats.data ?? []).map((c) => [c.id, c.slug]));
    const out: Record<number, ProvThreadLink> = {};
    for (const t of threads.data ?? []) {
      const nr = provThreadNr(t.slug, data.pass);
      const kategori = catSlug.get(t.category_id);
      if (nr === null || !kategori) continue;
      out[nr] = { kategori, trad: `${t.id}-${t.slug}` };
    }
    return out;
  });
