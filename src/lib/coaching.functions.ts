/**
 * Coachning — pris, kassa och bekräftelse.
 *
 * Flödet: knappen (startsidan eller landningssidan) → `startCoachingCheckout`
 * skapar en rad i `coaching_requests` och en Stripe Checkout-session → webb-
 * läsaren skickas till Stripes hostade kassa → tillbaka till `/coachning/tack`,
 * där `confirmCoachingCheckout` visar kvittot. Webhooken i `src/server.ts` är
 * den som egentligen bokför köpet; tacksidan är bara reserven.
 *
 * Priset ligger aldrig i koden. Det läses ur Stripe, så en ändring i
 * dashboarden syns i appen utan deploy — och kan aldrig råka visa fel belopp
 * mot vad kassan sedan drar.
 */
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { optionalSupabaseAuth } from "./auth-optional.server";
import { limits } from "./rate-limit";
import { assertRateLimit, ipKey } from "./rate-limit.server";
import {
  createCheckoutSession,
  resolveCoachingPrice,
  retrieveCheckoutSession,
  stripeConfigured,
} from "./stripe.server";
import { buildCoachingCheckoutParams, markCoachingPaid, sessionIsPaid } from "./coaching.server";

export interface CoachingOffer {
  /** false = Stripe är inte konfigurerat här; UI:t visar kontaktvägen i stället. */
  available: boolean;
  amount: number | null;
  currency: string;
  /** null = engångsköp, annars "month"/"year" osv. */
  interval: "day" | "week" | "month" | "year" | null;
  intervalCount: number;
  productName: string | null;
}

const OFFER_UNAVAILABLE: CoachingOffer = {
  available: false,
  amount: null,
  currency: "SEK",
  interval: null,
  intervalCount: 1,
  productName: null,
};

/** Absolut URL till sajten, hämtad ur begäran så att lokal utveckling funkar. */
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
  return "https://hpkampen.se";
}

/**
 * Priset bakom coachningsknappen.
 *
 * Kastar aldrig: saknas nyckeln eller är Stripe nere ska kortet fortfarande
 * gå att rendera — det är bara knappen som byter till "hör av dig". Ett kastat
 * fel här hade tagit ner hela startsidan för alla.
 */
export const fetchCoachingOffer = createServerFn({ method: "GET" }).handler(
  async (): Promise<CoachingOffer> => {
    assertRateLimit(ipKey("coaching-offer"), limits.coachingOffer);
    if (!stripeConfigured()) return OFFER_UNAVAILABLE;
    try {
      const price = await resolveCoachingPrice();
      return {
        available: true,
        amount: price.amount,
        currency: price.currency.toUpperCase(),
        interval: price.interval,
        intervalCount: price.intervalCount,
        productName: price.productName,
      };
    } catch (e) {
      console.error("[coaching] kunde inte läsa priset:", e instanceof Error ? e.message : e);
      return OFFER_UNAVAILABLE;
    }
  },
);

export const startCoachingCheckout = createServerFn({ method: "POST" })
  .middleware([optionalSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        /** Vilken yta köpet startade från — enda fria fältet, och det är uppräkneligt. */
        source: z.enum(["dashboard", "landing"]).default("dashboard"),
        /** Förifyller mejlfältet i kassan. Verifieras aldrig som identitet. */
        email: z.string().email().max(200).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }): Promise<{ url: string }> => {
    const { userId } = context;
    assertRateLimit(
      userId ? `coaching-checkout:${userId}` : ipKey("coaching-checkout"),
      limits.coachingCheckout,
    );

    const price = await resolveCoachingPrice();
    const origin = siteOrigin();

    // Raden först: finns den innan kassan öppnas kan webhooken alltid hitta
    // tillbaka till rätt köp, även om svaret nedan aldrig når webbläsaren.
    const { data: row, error } = await supabaseAdmin
      .from("coaching_requests")
      .insert({
        user_id: userId,
        email: data.email ?? null,
        status: "checkout",
        source: data.source,
      })
      .select("id")
      .single();

    if (error || !row) {
      console.error("[coaching] kunde inte skapa förfrågan:", error?.message);
      throw new Error("Kunde inte öppna kassan just nu — försök igen om en stund.");
    }

    const session = await createCheckoutSession(
      buildCoachingCheckoutParams({
        priceId: price.priceId,
        recurring: price.recurring,
        requestId: row.id,
        userId,
        source: data.source,
        email: data.email,
        origin,
      }),
    );

    if (!session.url) {
      console.error("[coaching] Stripe gav ingen kassa-URL för session", session.id);
      throw new Error("Kunde inte öppna kassan just nu — försök igen om en stund.");
    }

    await supabaseAdmin
      .from("coaching_requests")
      .update({ stripe_session_id: session.id })
      .eq("id", row.id);

    return { url: session.url };
  });

export interface CoachingReceipt {
  paid: boolean;
  amount: number | null;
  currency: string | null;
  email: string | null;
  /** true bara första gången — tacksidan mäter köpet en gång, inte per omladdning. */
  firstConfirmation: boolean;
}

/**
 * Bekräftar köpet på tacksidan.
 *
 * Session-id:t kommer ur köparens egen URL och är en oåtkomlig slumpsträng, så
 * det duger som bärare här. Ingenting känsligt returneras utöver köparens egen
 * mejladress och belopp.
 */
export const confirmCoachingCheckout = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ sessionId: z.string().min(10).max(200) }).parse(input),
  )
  .handler(async ({ data }): Promise<CoachingReceipt> => {
    assertRateLimit(ipKey("coaching-confirm"), limits.publicRead);

    const session = await retrieveCheckoutSession(data.sessionId);
    if (!sessionIsPaid(session)) {
      return { paid: false, amount: null, currency: null, email: null, firstConfirmation: false };
    }

    let firstConfirmation = false;
    try {
      firstConfirmation = (await markCoachingPaid(session)).newlyPaid;
    } catch (e) {
      // Betalningen är gjord oavsett vad vår databas tycker — visa kvittot.
      // Webhooken försöker igen, och Stripe har alltid sanningen.
      console.error("[coaching] bokföring från tacksidan misslyckades:", e);
    }

    return {
      paid: true,
      amount: session.amount_total,
      currency: session.currency?.toUpperCase() ?? null,
      email: session.customer_details?.email ?? null,
      firstConfirmation,
    };
  });
