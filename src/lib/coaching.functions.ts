/**
 * Coachning — pris, kassa och bekräftelse.
 *
 * Flödet: knappen (startsidan eller landningssidan) → `startCoachingBooking`
 * skapar en rad i `coaching_requests` och ger tillbaka en Calendly-länk →
 * köparen väljer en tid i iframen → `completeCoachingBooking` läser tiden ur
 * Calendly, skriver den på raden och öppnar Stripe Checkout → tillbaka till
 * `/coachning/tack`, där `confirmCoachingCheckout` visar kvittot. Webhooken i
 * `src/server.ts` är den som egentligen bokför köpet; tacksidan är reserven.
 *
 * Utan Calendly konfigurerat hoppas bokningssteget över och `startCoachingCheckout`
 * går rakt till kassan, precis som före tidsbokningen. Samma princip som att
 * kortet visar kontaktvägen när Stripe saknas: en tjänst som inte svarar får
 * inte ta ner köpet, den får bara ta bort sitt eget steg.
 *
 * Ordningen tid-före-betalning är ett medvetet val med en känd baksida: en tid
 * kan bli bokad utan att köpet slutförs. Sedan 2026-08-19 städas den baksidan
 * automatiskt — `coaching-sweep.server.ts` avbokar tiden när betalfönstret
 * stängt, och `checkout.session.expired` släpper den direkt. Vyn
 * `coaching_obetalda_bokningar` listar det som ändå blir kvar.
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
import {
  buildCoachingCheckoutParams,
  checkoutExpiresAt,
  isCoachingSession,
  markCoachingPaid,
  sessionIsPaid,
} from "./coaching.server";
import {
  buildSchedulingUrl,
  calendlyConfigured,
  calendlyEventUrl,
  createSingleUseSchedulingLink,
  fetchCalendlyBooking,
  formatCalendlyAnswers,
} from "./calendly.server";

export interface CoachingOffer {
  /** false = Stripe är inte konfigurerat här; UI:t visar kontaktvägen i stället. */
  available: boolean;
  amount: number | null;
  currency: string;
  /** null = engångsköp, annars "month"/"year" osv. */
  interval: "day" | "week" | "month" | "year" | null;
  intervalCount: number;
  productName: string | null;
  /** true = köparen får välja en tid innan kassan öppnas. */
  schedulingEnabled: boolean;
}

const OFFER_UNAVAILABLE: CoachingOffer = {
  available: false,
  amount: null,
  currency: "SEK",
  interval: null,
  intervalCount: 1,
  productName: null,
  schedulingEnabled: false,
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
  return "https://tvakommanollan.se";
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
        schedulingEnabled: calendlyConfigured(),
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
        source: z.enum(["dashboard", "landing", "popup"]).default("dashboard"),
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
      throw new Error("Kunde inte öppna kassan just nu. Försök igen om en stund.");
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
      throw new Error("Kunde inte öppna kassan just nu. Försök igen om en stund.");
    }

    await supabaseAdmin
      .from("coaching_requests")
      .update({ stripe_session_id: session.id })
      .eq("id", row.id);

    return { url: session.url };
  });

/* ===================== Tidsbokning (Calendly) ===================== */

const BOOKING_ERROR = "Kunde inte öppna kassan just nu. Försök igen om en stund.";

export interface CoachingBookingStart {
  /** Länken iframen laddar. null = tidsbokning är inte påslagen här. */
  schedulingUrl: string | null;
  /** Raden köpet hör till. Skickas tillbaka in i `completeCoachingBooking`. */
  requestId: string | null;
}

/**
 * Öppnar bokningssteget.
 *
 * Raden skapas redan här, innan tiden är vald, eftersom dess id är det som
 * följer med som `utm_content` in i Calendly och kommer tillbaka på bokningen.
 * Det är den kopplingen som gör att en bokning kan knytas till rätt köp utan
 * att lita på något klienten säger. Priset för det är rader som blir kvar med
 * status 'booking' när någon ångrar sig i tidsväljaren; de är avsiktligt inte
 * med i `coaching_obetalda_bokningar`, som bara listar riktiga bokningar.
 */
export const startCoachingBooking = createServerFn({ method: "POST" })
  .middleware([optionalSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        source: z.enum(["dashboard", "landing", "popup"]).default("dashboard"),
        email: z.string().email().max(200).optional(),
        /** Förifyller namnfältet i Calendly. Verifieras aldrig som identitet. */
        name: z.string().trim().min(1).max(100).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }): Promise<CoachingBookingStart> => {
    const { userId } = context;
    assertRateLimit(
      userId ? `coaching-booking:${userId}` : ipKey("coaching-booking"),
      limits.coachingBooking,
    );

    const eventUrl = calendlyEventUrl();
    // Inte konfigurerat är ett giltigt svar, inte ett fel: modalen faller då
    // tillbaka på att gå direkt till kassan.
    if (!eventUrl || !calendlyConfigured()) return { schedulingUrl: null, requestId: null };

    const { data: row, error } = await supabaseAdmin
      .from("coaching_requests")
      .insert({
        user_id: userId,
        email: data.email ?? null,
        name: data.name ?? null,
        status: "booking",
        source: data.source,
      })
      .select("id")
      .single();

    if (error || !row) {
      console.error("[coaching] kunde inte skapa förfrågan för bokning:", error?.message);
      throw new Error(BOOKING_ERROR);
    }

    // Engångslänk när Calendly ger oss en, annars den publika. Skälet är att
    // den publika slugen annars ligger i iframens `src` på varje sidvisning och
    // går att spara undan och boka på när som helst, utan att passera kassan.
    // Att falla tillbaka är rätt: en Calendly-hicka ska ta bort skyddet, inte
    // köpet — och städaren river ändå det som bokas utan betalning.
    const singleUse = await createSingleUseSchedulingLink();

    return {
      schedulingUrl: buildSchedulingUrl({
        eventUrl: singleUse ?? eventUrl,
        embedDomain: new URL(siteOrigin()).host,
        requestId: row.id,
        name: data.name,
        email: data.email,
      }),
      requestId: row.id,
    };
  });

/**
 * Tar emot den valda tiden och öppnar kassan.
 *
 * Webbläsaren får bara URI:er av Calendly när bokningen är gjord — själva tiden
 * måste hämtas server-side. Att göra det här, i stället för att lita på en tid
 * som klienten skickar, är också det som gör att `scheduled_at` inte går att
 * sätta till vad som helst.
 */
export const completeCoachingBooking = createServerFn({ method: "POST" })
  .middleware([optionalSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        requestId: z.string().uuid(),
        /** Invitee-URI:n ur Calendlys `event_scheduled`. Formvalideras i calendly.server. */
        inviteeUri: z.string().url().max(300),
        source: z.enum(["dashboard", "landing", "popup"]).default("dashboard"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<{ url: string }> => {
    const { userId } = context;
    assertRateLimit(
      userId ? `coaching-checkout:${userId}` : ipKey("coaching-checkout"),
      limits.coachingCheckout,
    );

    const { data: row, error: rowError } = await supabaseAdmin
      .from("coaching_requests")
      .select("id,user_id,paid_at,email,name")
      .eq("id", data.requestId)
      .maybeSingle();

    if (rowError) {
      console.error("[coaching] kunde inte slå upp bokningsraden:", rowError.message);
      throw new Error(BOOKING_ERROR);
    }
    if (!row) throw new Error(BOOKING_ERROR);
    // supabaseAdmin kringgår RLS, så det här är enda ägarkontrollen. Den slår
    // bara när båda sidor är kända: raden kan ha skapats utloggad och köpet
    // slutföras efter inloggning, vilket är ett giltigt fall.
    if (row.user_id && userId && row.user_id !== userId) {
      console.error(`[coaching] rad ${row.id} tillhör en annan användare än ${userId}`);
      throw new Error(BOOKING_ERROR);
    }
    if (row.paid_at) throw new Error("Det här köpet är redan betalt.");

    const booking = await fetchCalendlyBooking(data.inviteeUri);
    // Bokningen ska vara den vi själva skickade köparen till. Saknas märkningen
    // helt (Calendly kan sluta skicka tracking) släpps den igenom med en logg —
    // en felkopplad bokning är illa, men att blockera alla köp är värre.
    if (booking.utmContent && booking.utmContent !== data.requestId) {
      console.error(
        `[coaching] bokning ${booking.inviteeUri} bär utm_content ${booking.utmContent}, väntade ${data.requestId}`,
      );
      throw new Error(BOOKING_ERROR);
    }
    if (!booking.utmContent) {
      console.warn(`[coaching] bokning ${booking.inviteeUri} saknar utm_content`);
    }
    // En avbokad tid är ingen tid. Utan kontrollen kan någon återanvända en
    // gammal, avbokad bokning för att ta sig till kassan med ett `scheduled_at`
    // som inte finns i kalendern.
    if (booking.status !== "active") {
      console.error(`[coaching] bokning ${booking.inviteeUri} har status ${booking.status}`);
      throw new Error(BOOKING_ERROR);
    }

    const goal = formatCalendlyAnswers(booking.answers);

    const { error: updateError } = await supabaseAdmin
      .from("coaching_requests")
      .update({
        status: "checkout",
        scheduled_at: booking.startTime,
        calendly_event_uri: booking.eventUri,
        calendly_invitee_uri: booking.inviteeUri,
        calendly_cancel_url: booking.cancelUrl,
        calendly_reschedule_url: booking.rescheduleUrl,
        // Skriv aldrig över något som redan står i raden med tomt.
        ...(booking.email ? { email: booking.email } : {}),
        ...(booking.name ? { name: booking.name } : {}),
        ...(goal ? { goal } : {}),
      })
      .eq("id", row.id);

    if (updateError) {
      // 23505 = invitee-URI:n är redan knuten till en annan rad. Bokningen
      // finns, men den hör till ett annat köp — alltså inte det här.
      console.error("[coaching] kunde inte skriva bokningen:", updateError.message);
      throw new Error(BOOKING_ERROR);
    }

    const price = await resolveCoachingPrice();
    const session = await createCheckoutSession(
      buildCoachingCheckoutParams({
        priceId: price.priceId,
        recurring: price.recurring,
        requestId: row.id,
        userId,
        source: data.source,
        email: booking.email ?? row.email ?? undefined,
        origin: siteOrigin(),
        scheduledAt: booking.startTime,
        focusAnswered: booking.answers.length > 0,
        // Tiden är tagen i kalendern och städaren släpper den efter fristen —
        // då får kassan inte gå att betala efteråt. Se CHECKOUT_TTL_MIN.
        expiresAt: checkoutExpiresAt(new Date()),
      }),
    );

    if (!session.url) {
      console.error("[coaching] Stripe gav ingen kassa-URL för session", session.id);
      throw new Error(BOOKING_ERROR);
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
  /** Bokad starttid (ISO, UTC) om köpet gick via tidsvalet, annars null. */
  scheduledAt: string | null;
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
    // Ett giltigt men främmande session-id ska inte kunna kvitteras som ett
    // coachningsköp — svaret blir detsamma som för en obetald session.
    if (!isCoachingSession(session) || !sessionIsPaid(session)) {
      return {
        paid: false,
        amount: null,
        currency: null,
        email: null,
        scheduledAt: null,
        firstConfirmation: false,
      };
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
      // Läses ur sessionens metadata i stället för ur raden: kvittot ska kunna
      // visa tiden även om databasen inte svarar just nu.
      scheduledAt: session.metadata?.scheduled_at ?? null,
      firstConfirmation,
    };
  });
