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
  isUnpaidStatus,
  type OrdPlan,
  mekAccess,
  ordAccess,
  purchaseAccess,
  type OrdAccess,
} from "./ord-paywall";
import {
  countMekTrainingAnswers,
  hasOrdAccess,
  isOrdSession,
  markOrdPaid,
  readOrdPurchase,
  syncOrdSubscription,
  type StoredOrdPurchase,
} from "./ord-paywall.server";
import {
  cancelSubscriptionNow,
  createCheckoutSession,
  resolveOrdPrice,
  retrieveSubscription,
  retrieveCheckoutSession,
  stripeConfigured,
  stripePublishableKey,
  updateSubscription,
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
  /**
   * Gäst. Gäster kan köpa sedan 2026-11-25 (köpet knyts till gästens id), och
   * flaggan styr steget efter betalningen där gästen skapar sitt konto.
   */
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

    // Gäster får köpa sedan 2026-11-25. Köpet knyts till gästens id precis som
    // till ett kontos, och efter betalningen görs gästen om till ett riktigt
    // konto med samma id (eller loggar in, och köpet flyttas). Se
    // `guest-claim.ts`. `guest` i metadatan säger i Stripe att köparen inte
    // hade något konto när kassan öppnades.
    const isGuest = (claims as { is_anonymous?: boolean } | undefined)?.is_anonymous === true;
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
    const metadata: Record<string, string> = {
      product: ORD_PRODUCT_TAG,
      user_id: userId,
      plan: data.plan,
      access_months: String(ORD_PLANS[data.plan].months),
      ...(isGuest ? { guest: "1" } : {}),
    };
    // Läget följer priset i Stripe, inte planen: månadspriset är återkommande
    // sedan 2026-11, och ett byte av pris-id i `wrangler.jsonc` vänder då
    // beteendet utan kodändring. `payment_intent_data` avvisas av Stripe i
    // prenumerationsläge; där bär `subscription_data` metadatan i stället, så
    // att varje förnyelse går att knyta till rätt konto.
    const base = {
      mode: price.recurring ? "subscription" : "payment",
      line_items: [{ price: price.priceId, quantity: 1 }],
      locale: "sv",
      client_reference_id: userId,
      allow_promotion_codes: true,
      metadata,
      ...(price.recurring
        ? { subscription_data: { metadata } }
        : { payment_intent_data: { metadata } }),
    } satisfies Record<string, StripeParam>;

    // Den som köpt förut har en kund i Stripe. Återanvänds den gäller
    // kampanjkoder som bara får lösas in vid första köpet på riktigt: utan
    // det kan vem som helst säga upp, teckna igen och ta koden varje månad.
    // `customer_update` krävs av automatisk moms när `customer` skickas.
    // Går kunden inte att använda (raderad i Stripe) görs ett försök utan.
    const { row } = await readOrdPurchase(userId);
    if ((await endLapsedSubscription(row)) === "still_paid") {
      if (await hasOrdAccess(userId)) return { clientSecret: null, url: null, alreadyOwned: true };
      // Betald prenumeration som ändå inte ger tillgång: öppna ingen andra.
      console.error(`[ord-paywall] ${userId} har betald prenumeration men ingen tillgång`);
      throw new Error(CHECKOUT_ERROR);
    }
    const customer = row?.stripe_customer_id ?? null;
    const variants: Record<string, StripeParam>[] = customer
      ? [{ ...base, customer, customer_update: { address: "auto", name: "auto" } }, base]
      : [base];

    for (const params of variants) {
      if (stripePublishableKey() !== null) {
        try {
          const s = await createCheckoutSession({
            ...params,
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
      }
      try {
        const s = await createCheckoutSession({
          ...params,
          success_url: returnUrl,
          cancel_url: `${origin}${data.returnTo}`,
        });
        if (!s.url) throw new Error("session utan url");
        return { clientSecret: null, url: s.url, alreadyOwned: false };
      } catch (e) {
        console.error("[ord-paywall] Stripe vägrade skapa kassan:", e);
      }
    }
    throw new Error(CHECKOUT_ERROR);
  });

/**
 * Avslutar en gammal prenumeration som fortfarande lever i Stripe innan ett
 * nytt köp öppnas. Hit kommer bara den som saknar tillgång, alltså i
 * praktiken en `past_due` vars frist gått ut. Utan det här hade Stripe
 * fortsatt försöka dra den gamla fakturan efter det nya köpet, och raden
 * pekar då på den nya prenumerationen, så ingenting hade märkt dubbeldragningen.
 * Går det inte att avsluta öppnas ingen kassa: hellre ett "försök igen" än
 * två dragningar.
 */
async function endLapsedSubscription(
  row: StoredOrdPurchase | null,
): Promise<"ended" | "still_paid"> {
  const subscriptionId = row?.stripe_subscription_id;
  if (!subscriptionId) return "ended";
  if (row.subscription_status === "canceled" || row.subscription_status === "incomplete_expired") {
    return "ended";
  }
  try {
    const sub = await retrieveSubscription(subscriptionId);
    if (sub.status === "canceled" || sub.status === "incomplete_expired") return "ended";
    if (sub.status === "active" || sub.status === "trialing") {
      // Raden var inaktuell (en missad webhook), prenumerationen är betald.
      // Rätta raden i stället för att avsluta något köparen betalar för.
      await syncOrdSubscription(sub);
      return "still_paid";
    }
    const ended = await cancelSubscriptionNow(subscriptionId);
    await syncOrdSubscription(ended).catch(() => false);
    return "ended";
  } catch (e) {
    console.error("[ord-paywall] kunde inte avsluta gammal prenumeration före nytt köp:", e);
    throw new Error(CHECKOUT_ERROR);
  }
}

export interface OrdCheckoutConfirmation {
  owned: boolean;
  kind: "subscription" | "one_time" | null;
  /** E-postadressen från kassan, bara när sessionen hör till den som frågar. */
  email: string | null;
}

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
  .handler(async ({ data, context }): Promise<OrdCheckoutConfirmation> => {
    const { userId } = context;
    assertRateLimit(`ord-confirm:${userId}`, limits.ordCheckout);
    const session = await retrieveCheckoutSession(data.sessionId);
    if (!isOrdSession(session) || !sessionIsPaid(session) || session.metadata?.user_id !== userId) {
      return { owned: await hasOrdAccess(userId), kind: null, email: null };
    }
    try {
      await markOrdPaid(session);
    } catch (e) {
      // Betalningen är gjord oavsett; webhooken försöker igen.
      console.error("[ord-paywall] bokföring vid återvändande misslyckades:", e);
    }
    return {
      owned: true,
      kind: session.mode === "subscription" ? "subscription" : "one_time",
      // Adressen köparen skrev i Stripes kassa. Lämnas bara ut till den som
      // köpet hör till (villkoret ovan), och fyller i fältet när en gäst
      // skapar sitt konto efter köpet.
      email: session.customer_details?.email ?? null,
    };
  });

/* ===================== Ditt köp och uppsägningen ===================== */

export interface OrdPurchaseStatus {
  kind: "one_time" | "subscription";
  active: boolean;
  /** ISO-datum, null = gäller utan tidsgräns. */
  expiresAt: string | null;
  renews: boolean;
  cancelAtPeriodEnd: boolean;
  status: string | null;
  /** Månadspriset i ören, för raden "149 kr per månad". Null om Stripe inte svarar. */
  monthlyAmount: number | null;
}

async function toStatus(row: StoredOrdPurchase): Promise<OrdPurchaseStatus> {
  const a = purchaseAccess(row);
  let monthlyAmount: number | null = null;
  if (a.kind === "subscription" && stripeConfigured()) {
    monthlyAmount = await resolveOrdPrice("1m")
      .then((p) => (p.recurring ? p.amount : null))
      .catch(() => null);
  }
  return {
    kind: a.kind,
    active: a.active,
    expiresAt: a.expiresAt ? a.expiresAt.toISOString() : null,
    renews: a.renews,
    cancelAtPeriodEnd: a.cancelAtPeriodEnd,
    status: a.status,
    monthlyAmount,
  };
}

/**
 * Användarens köp, för kortet "Ditt köp". Null när det inte finns något köp,
 * och också när raden inte gick att läsa: kortet ska då hellre saknas än
 * visa fel datum.
 */
export const getOrdPurchaseStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<OrdPurchaseStatus | null> => {
    const { userId } = context;
    assertRateLimit(`ord-status:${userId}`, limits.ordStatus);
    const { row } = await readOrdPurchase(userId);
    return row ? toStatus(row) : null;
  });

const CANCEL_ERROR =
  "Det gick inte att ändra prenumerationen just nu. Försök igen om en stund, eller mejla info@tvakommanollan.se.";

/**
 * Säger upp eller ångrar uppsägningen. Uppsägningen gäller vid periodens
 * slut: den som betalat för månaden har kvar tillgången till dess, och inga
 * fler dragningar görs. Raden läses på den inloggade användarens id, så
 * ingen kan säga upp någon annans prenumeration.
 */
async function setCancelAtPeriodEnd(userId: string, cancel: boolean): Promise<OrdPurchaseStatus> {
  const { row, failed } = await readOrdPurchase(userId);
  if (failed) throw new Error(CANCEL_ERROR);
  const subscriptionId = row?.stripe_subscription_id;
  if (!row || !subscriptionId) {
    throw new Error("Ditt köp är ingen prenumeration, så det finns inget att säga upp.");
  }
  if (!cancel && purchaseAccess(row).active === false) {
    throw new Error("Prenumerationen har redan gått ut. Köp igen i kassan för att fortsätta.");
  }
  let sub;
  try {
    // En obetald prenumeration avslutas direkt: det finns ingen betald månad
    // att låta gälla ut, och med `cancel_at_period_end` hade Stripe fortsatt
    // försöka dra den öppna fakturan. Avslutad slutar Stripe försöka.
    const unpaid = cancel && isUnpaidStatus(row.subscription_status);
    sub = unpaid
      ? await cancelSubscriptionNow(subscriptionId)
      : await updateSubscription(subscriptionId, { cancel_at_period_end: cancel });
  } catch (e) {
    console.error("[ord-paywall] Stripe vägrade ändra prenumerationen:", e);
    throw new Error(CANCEL_ERROR);
  }
  if (sub.metadata?.user_id && sub.metadata.user_id !== userId) {
    // Ska inte kunna hända: id:t kommer ur användarens egen rad. Loggas om
    // raderna någon gång blandats ihop.
    console.error(`[ord-paywall] prenumeration ${sub.id} hör inte till ${userId}`);
  }
  try {
    await syncOrdSubscription(sub);
  } catch (e) {
    // Stripe har redan ändrat; webhooken skriver raden strax.
    console.error("[ord-paywall] kunde inte skriva uppsägningen till raden:", e);
  }
  const fresh = await readOrdPurchase(userId);
  return toStatus(fresh.row ?? row);
}

export const cancelOrdSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<OrdPurchaseStatus> => {
    const { userId } = context;
    assertRateLimit(`ord-cancel:${userId}`, limits.ordCancel);
    return setCancelAtPeriodEnd(userId, true);
  });

export const resumeOrdSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<OrdPurchaseStatus> => {
    const { userId } = context;
    assertRateLimit(`ord-cancel:${userId}`, limits.ordCancel);
    return setCancelAtPeriodEnd(userId, false);
  });
