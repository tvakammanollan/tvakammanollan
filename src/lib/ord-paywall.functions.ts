import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { limits } from "./rate-limit";
import { assertRateLimit } from "./rate-limit.server";
import {
  ORD_PLANS,
  ORD_PLAN_IDS,
  ORD_PRODUCT_TAG,
  PAYWALL_RETURN_PATHS,
  type OrdPlan,
  mekAccess,
  ordAccess,
  type OrdAccess,
} from "./ord-paywall";
import {
  countMekTrainingAnswers,
  hasOrdAccess,
  isOrdSession,
  markOrdPaid,
} from "./ord-paywall.server";
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

export interface OrdPlanPrice {
  plan: OrdPlan;
  months: number;
  /** Pris i ören, inklusive moms. */
  amount: number;
}

export interface OrdAccessInfo extends OrdAccess {
  /** De köp som går att göra just nu, kortast först. Tom om Stripe inte svarar. */
  plans: OrdPlanPrice[];
  /** Lägsta priset i ören, null om inget pris gick att läsa. */
  amount: number | null;
  currency: string;
  publishableKey: string | null;
  /** Gästkonton kan inte köpa: köpet hade försvunnit med kontot. */
  isAnonymous: boolean;
}

/**
 * Priserna och kassans nyckel till en åtkomst. Den som köpt slipper
 * Stripe-anropen. Ett pris som inte går att läsa faller bort ur listan, så
 * att den andra planen fortfarande går att köpa.
 */
async function withPrice(access: OrdAccess, claims: unknown): Promise<OrdAccessInfo> {
  const plans: OrdPlanPrice[] = [];
  let currency = "SEK";
  if (!access.owned && stripeConfigured()) {
    const results = await Promise.allSettled(ORD_PLAN_IDS.map((p) => resolveOrdPrice(p)));
    results.forEach((r, i) => {
      const plan = ORD_PLAN_IDS[i];
      if (r.status === "rejected") {
        const e = r.reason;
        console.error(
          `[ord-paywall] kunde inte läsa priset (${plan}):`,
          e instanceof Error ? e.message : e,
        );
        return;
      }
      plans.push({ plan, months: ORD_PLANS[plan].months, amount: r.value.amount });
      currency = r.value.currency.toUpperCase();
    });
  }
  plans.sort((a, b) => a.months - b.months);
  return {
    ...access,
    plans,
    amount: plans.length > 0 ? Math.min(...plans.map((p) => p.amount)) : null,
    currency,
    publishableKey: stripePublishableKey(),
    isAnonymous: (claims as { is_anonymous?: boolean } | undefined)?.is_anonymous === true,
  };
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
    return withPrice(ordAccess(stats.data?.total_count ?? 0, owned), claims);
  });

/** Samma sak för MEK-träningen. Köpet är detsamma, räkningen är MEK-svar. */
export const getMekAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<OrdAccessInfo> => {
    const { userId, claims } = context;
    const [owned, answered] = await Promise.all([
      hasOrdAccess(userId),
      countMekTrainingAnswers(userId),
    ]);
    return withPrice(mekAccess(answered, owned), claims);
  });

export interface OrdCheckoutHandle {
  clientSecret: string | null;
  url: string | null;
  alreadyOwned: boolean;
}

/**
 * Öppnar kassan för Hela Ordlistan + MEK, en månad eller sex. `returnTo` är
 * sidan köpet gjordes från; där bekräftas det när köparen kommer tillbaka.
 *
 * Planen följer med i metadata (`plan`, `access_months`) och det är därifrån
 * bokföringen läser längden, inte ur beloppet: en rabattkod gör beloppet
 * oanvändbart som besked om vad som köptes.
 *
 * Köpet knyts till användaren via `metadata.user_id`, satt här i servern ur
 * den verifierade tokenen och aldrig ur klienten. Webhooken läser det värdet
 * för att veta vems konto som ska låsas upp.
 */
export const startOrdCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        returnTo: z.enum(PAYWALL_RETURN_PATHS).optional().default("/ord"),
        // Utan plan: sex månader, det enda köpet som fanns innan planerna.
        // En flik som laddats före utrullningen skickar ingen.
        plan: z.enum(["1m", "6m"]).optional().default("6m"),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }): Promise<OrdCheckoutHandle> => {
    const { userId, claims } = context;
    assertRateLimit(`ord-checkout:${userId}`, limits.ordCheckout);

    if ((claims as { is_anonymous?: boolean } | undefined)?.is_anonymous === true) {
      throw new Error("Skapa ett konto först, så följer köpet med dig.");
    }
    if (await hasOrdAccess(userId)) {
      return { clientSecret: null, url: null, alreadyOwned: true };
    }
    if (!stripeConfigured()) throw new Error(CHECKOUT_ERROR);

    const price = await resolveOrdPrice(data.plan).catch((e) => {
      console.error("[ord-paywall] pris saknas:", e);
      throw new Error(CHECKOUT_ERROR);
    });
    const origin = siteOrigin();
    const returnUrl = `${origin}${data.returnTo}?kop=klart&session_id={CHECKOUT_SESSION_ID}`;
    const metadata = {
      product: ORD_PRODUCT_TAG,
      user_id: userId,
      plan: data.plan,
      access_months: String(ORD_PLANS[data.plan].months),
    };
    const base = {
      mode: "payment",
      line_items: [{ price: price.priceId, quantity: 1 }],
      locale: "sv",
      client_reference_id: userId,
      allow_promotion_codes: true,
      metadata,
      payment_intent_data: { metadata },
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
        cancel_url: `${origin}${data.returnTo}`,
      });
      if (!s.url) throw new Error("session utan url");
      return { clientSecret: null, url: s.url, alreadyOwned: false };
    } catch (e) {
      console.error("[ord-paywall] Stripe vägrade skapa kassan:", e);
      throw new Error(CHECKOUT_ERROR);
    }
  });

/**
 * Bekräftar köpet när köparen kommer tillbaka till /ord eller MEK-övningen. Reserv för webhooken:
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
