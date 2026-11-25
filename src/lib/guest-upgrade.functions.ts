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
 *
 * `claimGuestPurchase` längst ned är det andra fallet: gästen blev inte om
 * till ett konto utan loggade in på ett annat, och ett Premium-köp gjort som
 * gäst flyttas dit (se `guest-claim.ts`).
 */
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { limits } from "./rate-limit";
import { assertRateLimit } from "./rate-limit.server";
import { decideGuestClaim } from "./guest-claim";
import { moveOrdPurchase, readOrdPurchase } from "./ord-paywall.server";
import { updateSubscription } from "./stripe.server";

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

/* ===================== Flytt av ett gästköp ===================== */

export type GuestClaimResult =
  /** Köpet ligger nu på det inloggade kontot. */
  | "moved"
  /** Inget att flytta: gästen hade inget köp, eller köpet är redan flyttat. */
  | "nothing"
  /** Kontot hade redan ett köp som gäller. Gästköpet ligger kvar orört. */
  | "conflict"
  /** Tokenen gick inte att verifiera eller hör inte till ett gästkonto. */
  | "invalid"
  /** Anroparen är själv fortfarande gäst; försök igen när kontot är inloggat. */
  | "not_ready";

const CLAIM_ERROR = "Kunde inte flytta köpet just nu. Försök igen om en stund.";

/**
 * Gästkontots id ur dess åtkomsttoken, eller null. Tokenen verifieras som
 * `requireSupabaseAuth` verifierar sina (signatur och utgång), och kontot
 * måste dessutom VARA ett gästkonto just nu enligt `auth.users`. Det sista
 * gör att bara gästkonton kan tömmas på ett köp: en token från ett riktigt
 * konto flyttar ingenting, även om den är giltig.
 */
async function verifiedGuestId(token: string): Promise<string | null> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  try {
    const client = createClient<Database>(url, key, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.auth.getClaims(token);
    const sub = data?.claims?.sub;
    if (error || typeof sub !== "string" || !sub) return null;
    const { data: found, error: lookupError } = await supabaseAdmin.auth.admin.getUserById(sub);
    if (lookupError || found.user?.is_anonymous !== true) return null;
    return sub;
  } catch {
    return null;
  }
}

/**
 * Flyttar ett Premium-köp från gästkontot som just lämnades till det konto
 * som nu är inloggat. Anropas av `GuestPurchaseClaimer` (efter inloggning,
 * Google eller en ny registrering) och av steget efter ett köp som gäst.
 *
 * Bevisen är två: det nya kontots token i Authorization (vem som tar emot)
 * och gästens token i bodyn (vem som lämnar ifrån sig). Den som bara har en
 * av dem kan inte flytta något. Ett köp som gäller skriver aldrig över ett
 * annat som gäller, se `decideGuestClaim`.
 *
 * Prenumerationens metadata i Stripe pekas om till kontot efteråt. Det är
 * inte nödvändigt för förnyelserna, som hittar raden på prenumerationens id,
 * men utan det pekar `user_id` i Stripe på ett gästkonto som ingen kan logga
 * in på, och det är det första man läser när ett köp ska redas ut.
 */
export const claimGuestPurchase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ guestToken: z.string().min(20).max(4096) }).parse(input),
  )
  .handler(async ({ data, context }): Promise<{ result: GuestClaimResult }> => {
    const { userId, claims } = context;
    assertRateLimit(`guest-claim:${userId}`, limits.guestClaim);
    if ((claims as { is_anonymous?: boolean } | undefined)?.is_anonymous === true) {
      return { result: "not_ready" };
    }

    const guestId = await verifiedGuestId(data.guestToken);
    if (!guestId) return { result: "invalid" };
    if (guestId === userId) return { result: "nothing" };

    const [guest, user] = await Promise.all([readOrdPurchase(guestId), readOrdPurchase(userId)]);
    if (guest.failed || user.failed) throw new Error(CLAIM_ERROR);

    const decision = decideGuestClaim({
      guestId,
      userId,
      guestRow: guest.row,
      userRow: user.row,
    });
    if (decision === "conflict") {
      // Två betalda köp på samma person. Loggas för att kunna redas ut för
      // hand: gästköpet ligger kvar på gästkontot och går att återbetala.
      console.error(
        `[guest-claim] ${userId} har redan Premium; gästköpet ${guest.row?.stripe_session_id} på ${guestId} flyttades inte`,
      );
      return { result: "conflict" };
    }
    if (decision !== "move" || !guest.row) return { result: "nothing" };

    const moved = await moveOrdPurchase(guestId, userId, user.row?.stripe_session_id ?? null);
    if (!moved) {
      const after = await readOrdPurchase(guestId);
      if (after.row) {
        console.error(`[guest-claim] ${userId} fick ett eget köp under flytten från ${guestId}`);
        return { result: "conflict" };
      }
      return { result: "nothing" };
    }

    console.log(
      `[guest-claim] köpet ${guest.row.stripe_session_id} flyttat från gästen ${guestId} till ${userId}`,
    );
    const subscriptionId = guest.row.stripe_subscription_id;
    if (subscriptionId) {
      await updateSubscription(subscriptionId, {
        metadata: { user_id: userId, guest_user_id: guestId },
      }).catch((e) => {
        console.error("[guest-claim] kunde inte peka om prenumerationen i Stripe:", e);
      });
    }
    return { result: "moved" };
  });
