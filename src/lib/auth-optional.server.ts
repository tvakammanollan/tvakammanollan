/**
 * Valfri auth för serverfunktioner.
 *
 * `requireSupabaseAuth` kastar 401 utan giltig token, vilket är rätt för allt
 * användarspecifikt. Men vissa endpoints ska svara på båda sätten: kassan för
 * coachning öppnas både från inloggad startsida och från landningssidan, där
 * besökaren per definition inte har konto.
 *
 * Identiteten läses ur tokenen, aldrig ur ett klientskickat user_id — annars
 * blir "vem är jag" ett fält vem som helst kan fylla i.
 */
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const optionalSupabaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    let userId: string | null = null;
    let isAnonymous = false;

    try {
      const authHeader = getRequest()?.headers?.get("authorization");
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_PUBLISHABLE_KEY;

      if (token && url && key) {
        const supabase = createClient<Database>(url, key, {
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        });
        const { data } = await supabase.auth.getClaims(token);
        const claims = data?.claims as { sub?: string; is_anonymous?: boolean } | undefined;
        if (claims?.sub) {
          userId = claims.sub;
          isAnonymous = claims.is_anonymous === true;
        }
      }
    } catch {
      // Att vara utloggad är inget fel här — det är hela poängen.
    }

    return next({ context: { userId, isAnonymous } });
  },
);
