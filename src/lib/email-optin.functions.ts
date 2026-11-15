/**
 * Samtycke till utskick.
 *
 * Reklam via e-post kräver att mottagaren sagt ja i förväg, så flaggan
 * `users.email_opt_in` är false tills användaren själv kryssat i rutan
 * (onboarding, /stats eller /avregistrera). Tre funktioner:
 *
 *  - `fetchEmailOptIn` / `setEmailOptIn`: den inloggades eget val.
 *  - `unsubscribeEmail`: avregistrering utan inloggning, för länken i mejlen.
 *    Utskicken görs med alla mottagare i hemlig kopia, så länken kan inte
 *    bära en personlig nyckel. Sidan tar därför emot adressen i ett fält.
 *    Svaret är detsamma vare sig adressen finns eller inte: annars går
 *    endpointen att använda för att ta reda på vilka som har konto.
 *
 * Saknas kolumnen (migrationen `20261115120000_utskick_samtycke.sql` inte
 * körd) läses valet som nej och skrivningen kastar ett allmänt fel.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { limits } from "./rate-limit";
import { assertRateLimit, ipKey } from "./rate-limit.server";

export interface EmailOptInStatus {
  /** false för gäster: utan adress finns inget att samtycka till. */
  hasEmail: boolean;
  optIn: boolean;
}

export const fetchEmailOptIn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EmailOptInStatus> => {
    assertRateLimit(`email-optin-read:${context.userId}`, limits.ordStatus);
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("email, email_opt_in")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) {
      console.error("[utskick] kunde inte läsa samtycket:", error.message);
      return { hasEmail: false, optIn: false };
    }
    const row = data as { email: string | null; email_opt_in: boolean | null } | null;
    return { hasEmail: Boolean(row?.email), optIn: row?.email_opt_in === true };
  });

export const setEmailOptIn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ optIn: z.boolean() }).parse(input))
  .handler(async ({ context, data }): Promise<{ optIn: boolean }> => {
    const { userId } = context;
    assertRateLimit(`email-optin:${userId}`, limits.emailOptIn);

    // Villkoret på adressen gör att ett gästkonto aldrig kan stå som ja.
    const { data: rows, error } = await supabaseAdmin
      .from("users")
      .update({ email_opt_in: data.optIn, email_opt_in_at: new Date().toISOString() })
      .eq("id", userId)
      .not("email", "is", null)
      .select("id");
    if (error || !rows?.length) {
      if (error) console.error("[utskick] kunde inte spara samtycket:", error.message);
      throw new Error("Kunde inte spara valet just nu. Försök igen om en stund.");
    }
    return { optIn: data.optIn };
  });

export const unsubscribeEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ email: z.string().trim().toLowerCase().email().max(255) }).parse(input),
  )
  .handler(async ({ data }): Promise<{ ok: true }> => {
    assertRateLimit(ipKey("email-unsubscribe"), limits.emailUnsubscribe);

    // `.eq`, inte `.ilike`: `_` är jokertecken i LIKE och vanligt i adresser.
    // Supabase lagrar adresser i gemener, så jämförelsen träffar ändå.
    const { error } = await supabaseAdmin
      .from("users")
      .update({ email_opt_in: false, email_opt_in_at: new Date().toISOString() })
      .eq("email", data.email)
      .eq("email_opt_in", true);
    if (error) console.error("[utskick] avregistrering misslyckades:", error.message);
    return { ok: true };
  });
