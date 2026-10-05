import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { limits } from "./rate-limit";
import { assertRateLimit } from "./rate-limit.server";
import { ORD_PRODUCT_TAG, ordAccess, type OrdAccess } from "./ord-paywall";
import { hasOrdAccess, isOrdSession, markOrdPaid } from "./ord-paywall.server";
import {
  createCheckoutSession,
  resolveOrdPrice,
  retrieveCheckoutSession,
  stripeConfigured,
  stripePublishableKey,
  type StripeParam,
} from "./stripe.server";
import { EMBEDDED_UI_MODE, sessionIsPaid } from "./coaching.server";

const CHECKOUT_ERROR = "Kunde inte öppna kassan just nu. Försök igen om en stund.";

function siteOrigin(): string {
  try {
    const url = getRequest()?.url;
    if (url) {
      const origin = new URL(url).origin;
      if (origin.startsWith("http")) return origin;
    }
  } catch {
    /* faller igenom */
  }
  return "https://tvakommanollan.se";
}

export interface OrdAccessInfo extends OrdAccess {
  /** Pris i ören, null om Stripe inte går att nå eller inte är konfigurerat. */
  amount: number | null;
  currency: string;
  publishableKey: string | null;
  /** Gästkonton kan inte köpa: köpet hade försvunnit med kontot. */
  isAnonymous: boolean;
}

/** Var står användaren: antal svar, köpt eller inte, och vad köpet kostar. */
export const getOrdAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<OrdAccessInfo> => {
    const { userId, claims } = context;
    const [owned, stats] = await Promise.all([
      hasOrdAccess(userId),
      supabaseAdmin
        .from("ord_practice_stats")
        .select("total_count")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);
    const access = ordAccess(stats.data?.total_count ?? 0, owned);

    let amount: number | null = null;
    let currency = "SEK";
    // Priset behövs bara när kassan kan bli aktuell; den som köpt slipper anropet.
    if (!owned && stripeConfigured()) {
      try {
        const price = await resolveOrdPrice();
        amount = price.amount;
        currency = price.currency.toUpperCase();
      } catch (e) {
        console.error("[ord-paywall] kunde inte läsa priset:", e instanceof Error ? e.message : e);
      }
    }
    return {
      ...access,
      amount,
      currency,
      publishableKey: stripePublishableKey(),
      isAnonymous: (claims as { is_anonymous?: boolean } | undefined)?.is_anonymous === true,
    };
  });

export interface OrdCheckoutHandle {
  clientSecret: string | null;
  url: string | null;
  alreadyOwned: boolean;
}

/**
 * Öppnar kassan för Hela Ordlistan.
 *
 * Köpet knyts till användaren via `metadata.user_id`, satt här i servern ur
 * den verifierade tokenen och aldrig ur klienten. Webhooken läser det värdet
 * för att veta vems konto som ska låsas upp.
 */
export const startOrdCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<OrdCheckoutHandle> => {
    const { userId, claims } = context;
    assertRateLimit(`ord-checkout:${userId}`, limits.ordCheckout);

    if ((claims as { is_anonymous?: boolean } | undefined)?.is_anonymous === true) {
      throw new Error("Skapa ett konto först, så följer köpet med dig.");
    }
    if (await hasOrdAccess(userId)) {
      return { clientSecret: null, url: null, alreadyOwned: true };
    }
    if (!stripeConfigured()) throw new Error(CHECKOUT_ERROR);

    const price = await resolveOrdPrice().catch((e) => {
      console.error("[ord-paywall] pris saknas:", e);
      throw new Error(CHECKOUT_ERROR);
    });
    const origin = siteOrigin();
    const returnUrl = `${origin}/ord?kop=klart&session_id={CHECKOUT_SESSION_ID}`;
    const base = {
      mode: "payment",
      line_items: [{ price: price.priceId, quantity: 1 }],
      locale: "sv",
      client_reference_id: userId,
      allow_promotion_codes: true,
      metadata: { product: ORD_PRODUCT_TAG, user_id: userId },
      payment_intent_data: { metadata: { product: ORD_PRODUCT_TAG, user_id: userId } },
    } satisfies Record<string, StripeParam>;

    let embedded = stripePublishableKey() !== null;
    if (embedded) {
      try {
        const s = await createCheckoutSession({
          ...base,
          ui_mode: EMBEDDED_UI_MODE,
          return_url: returnUrl,
        });
        if (s.client_secret)
          return { clientSecret: s.client_secret, url: null, alreadyOwned: false };
      } catch (e) {
        // Samma reträtt som coachningen: ett ui_mode-namnbyte får kosta
        // bekvämlighet, inte försäljning.
        console.error("[ord-paywall] inbäddad kassa gick inte att skapa, faller tillbaka:", e);
      }
      embedded = false;
    }
    try {
      const s = await createCheckoutSession({
        ...base,
        success_url: returnUrl,
        cancel_url: `${origin}/ord`,
      });
      if (!s.url) throw new Error("session utan url");
      return { clientSecret: null, url: s.url, alreadyOwned: false };
    } catch (e) {
      console.error("[ord-paywall] Stripe vägrade skapa kassan:", e);
      throw new Error(CHECKOUT_ERROR);
    }
  });

/**
 * Bekräftar köpet när köparen kommer tillbaka till /ord. Reserv för webhooken:
 * sessionen måste vara betald, vara ordlistans och höra till just den här
 * användaren, annars sker ingenting.
 */
export const confirmOrdCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ sessionId: z.string().min(10).max(200) }).parse(input),
  )
  .handler(async ({ data, context }): Promise<{ owned: boolean }> => {
    const { userId } = context;
    assertRateLimit(`ord-confirm:${userId}`, limits.ordCheckout);
    const session = await retrieveCheckoutSession(data.sessionId);
    if (!isOrdSession(session) || !sessionIsPaid(session) || session.metadata?.user_id !== userId) {
      return { owned: await hasOrdAccess(userId) };
    }
    try {
      await markOrdPaid(session);
    } catch (e) {
      // Betalningen är gjord oavsett; webhooken försöker igen.
      console.error("[ord-paywall] bokföring vid återvändande misslyckades:", e);
    }
    return { owned: true };
  });
