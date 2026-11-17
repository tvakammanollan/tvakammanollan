/**
 * Gästkonto → riktigt konto, serverdelen.
 *
 * Själva bytet görs i webbläsaren med gästens egen session
 * (`supabase.auth.updateUser`, se `guest-upgrade.ts`), så att användar-id:t
 * och därmed ELO, matcher, ordframsteg och utmärkelser följer med. Det enda
 * som inte följer med av sig självt är `public.users.email`: triggern
 * `handle_new_user` kopierar adressen när raden skapas, och för en gäst är
 * den då tom. Utan den här funktionen går verifieringsmejlet, utskicken och
 * allt annat som läser profilens adress till ingen.
 *
 * Adressen läses ur `auth.users` med service role, aldrig ur klienten: den
 * som anropar kan bara skriva den adress kontot faktiskt har.
 */
import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { limits } from "./rate-limit";
import { assertRateLimit } from "./rate-limit.server";

export const syncProfileEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ synced: boolean }> => {
    const { userId } = context;
    assertRateLimit(`guest-upgrade:${userId}`, limits.guestUpgrade);

    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (error || !data.user) {
      console.error("[guest-upgrade] kunde inte läsa kontot:", error?.message);
      throw new Error("Kunde inte läsa kontot. Försök igen om en stund.");
    }
    const authUser = data.user;
    // Fortfarande gäst, eller adressen väntar på bekräftelse: inget att skriva.
    if (authUser.is_anonymous || !authUser.email) return { synced: false };

    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ email: authUser.email })
      .eq("id", userId);
    if (updateError) {
      console.error("[guest-upgrade] kunde inte skriva e-posten:", updateError.message);
      throw new Error("Kunde inte spara e-postadressen. Försök igen om en stund.");
    }
    return { synced: true };
  });
