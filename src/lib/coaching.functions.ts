/**
 * Coachning — pris, kassa, bekräftelse och tidsbokning.
 *
 * Flödet (ändrat 2026-08-19): knappen (startsidan, landningssidan eller
 * nudgen) → `startCoachingCheckout` skapar en rad i `coaching_requests` och
 * skickar köparen till Stripe Checkout → tillbaka till `/coachning/tack`, där
 * `confirmCoachingCheckout` bekräftar mot Stripe → **först då** visas Calendlys
 * tidsväljare, via `startPaidCoachingBooking`, och `completeCoachingBooking`
 * skriver den valda tiden på den redan betalda raden.
 *
 * ORDNINGEN ÄR HELA POÄNGEN. Tidigare valdes tiden före betalningen, med
 * motiveringen att den som har en tid i kalendern slutför köpet oftare. Priset
 * för det var att en bokning kunde bli stående obetald — Calendly binder tiden
 * i samma sekund den bokas, medan Checkout går att stänga — och att den publika
 * bokningslänken låg i sidkällan och gick att använda helt utan att passera
 * kassan. Nu kan ingen tid tas i anspråk utan ett betalt köp bakom sig.
 *
 * Webhooken i `src/server.ts` är den som egentligen bokför köpet och skickar
 * bekräftelsemejlet; tacksidan är reserven när webhooken är sen. Båda går
 * genom `markCoachingPaid()`, som är idempotent.
 *
 * Utan Calendly konfigurerat hoppas bokningssteget över och tacksidan säger
 * "vi hör av oss" i stället. Samma princip som att kortet visar kontaktvägen
 * när Stripe saknas: en tjänst som inte svarar får ta bort sitt eget steg, inte
 * köpet.
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
  isCoachingSession,
  markCoachingPaid,
  sendCoachingConfirmation,
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

/* ============ Tidsbokning (Calendly) — EFTER betalningen ============ */

const BOOKING_ERROR = "Kunde inte öppna tidsvalet just nu. Försök igen om en stund.";

export interface CoachingBookingStart {
  /** Länken iframen laddar. null = ingen tid att välja (se `reason`). */
  schedulingUrl: string | null;
  /** Raden köpet hör till. Skickas tillbaka in i `completeCoachingBooking`. */
  requestId: string | null;
  /** Redan bokad tid (ISO), om köparen laddar om tacksidan efter att ha valt. */
  scheduledAt: string | null;
  /**
   * Varför ingen väljare visas:
   *   "av"       — Calendly är inte konfigurerat här; vi hör av oss manuellt.
   *   "obetald"  — sessionen är inte betald. Ska inte kunna hända från vår
   *                egen tacksida, men endpointen är öppen och måste svara.
   */
  reason: "ok" | "av" | "obetald";
}

/**
 * Öppnar tidsvalet för ett **betalt** köp.
 *
 * Betalningen kontrolleras mot Stripe här och inte mot vår egen rad: raden kan
 * vara osynkad om webhooken är sen, och Stripe har alltid sanningen. Samma
 * anrop bokför också köpet (`markCoachingPaid` är idempotent), så tacksidan
 * fungerar även om webhooken aldrig kommer fram.
 *
 * Session-id:t kommer ur köparens egen URL och är en oåtkomlig slumpsträng —
 * det är bäraren, precis som för `confirmCoachingCheckout`.
 */
export const startPaidCoachingBooking = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ sessionId: z.string().min(10).max(200) }).parse(input),
  )
  .handler(async ({ data }): Promise<CoachingBookingStart> => {
    assertRateLimit(ipKey("coaching-booking"), limits.coachingBooking);

    const session = await retrieveCheckoutSession(data.sessionId);
    if (!isCoachingSession(session) || !sessionIsPaid(session)) {
      return { schedulingUrl: null, requestId: null, scheduledAt: null, reason: "obetald" };
    }

    // Bokför om det inte redan gjorts. Ger oss samtidigt rad-id:t.
    let requestId: string | null = null;
    try {
      requestId = (await markCoachingPaid(session)).requestId;
    } catch (e) {
      console.error("[coaching] kunde inte bokföra köpet vid tidsvalet:", e);
    }
    requestId =
      requestId ?? session.metadata?.coaching_request_id ?? session.client_reference_id ?? null;
    if (!requestId) {
      console.error("[coaching] betald session utan rad-id:", session.id);
      throw new Error(BOOKING_ERROR);
    }

    const { data: row } = await supabaseAdmin
      .from("coaching_requests")
      .select("id,scheduled_at,email,name,paid_at")
      .eq("id", requestId)
      .maybeSingle();

    // Redan vald tid — visa den i stället för en ny väljare. Utan det här
    // skulle en omladdning av tacksidan bjuda in till en andra bokning.
    if (row?.scheduled_at) {
      return {
        schedulingUrl: null,
        requestId: row.id,
        scheduledAt: row.scheduled_at,
        reason: "ok",
      };
    }

    const eventUrl = calendlyEventUrl();
    if (!eventUrl || !calendlyConfigured()) {
      return { schedulingUrl: null, requestId, scheduledAt: null, reason: "av" };
    }

    // Engångslänk när Calendly ger oss en, annars den publika. Skälet är att
    // den publika sluggen annars ligger i sidkällan och går att spara undan
    // och boka på när som helst, utan att passera kassan. Att falla tillbaka
    // är rätt: en Calendly-hicka ska inte ta ifrån en betalande köpare sin tid
    // — och städaren river ändå det som bokas utan betalning.
    const singleUse = await createSingleUseSchedulingLink();

    return {
      schedulingUrl: buildSchedulingUrl({
        eventUrl: singleUse ?? eventUrl,
        embedDomain: new URL(siteOrigin()).host,
        requestId,
        name: row?.name ?? session.customer_details?.name ?? undefined,
        email: row?.email ?? session.customer_details?.email ?? undefined,
      }),
      requestId,
      scheduledAt: null,
      reason: "ok",
    };
  });

/**
 * Skriver den valda tiden på ett betalt köp.
 *
 * Kräver att raden faktiskt är betald — det är den kontrollen som gör att
 * ordningen inte går att kringgå genom att anropa endpointen direkt.
 *
 * Tiden hämtas server-side ur Calendlys API och aldrig ur klientens
 * postMessage: nyttolasten där innehåller bara URI:er, och `fetchCalendlyBooking`
 * låser formen på URI:n innan den används i ett anrop med vårt Bearer-token
 * (utan det är den en SSRF som läcker tokenet, tyst).
 */
export const completeCoachingBooking = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        requestId: z.string().uuid(),
        /** Invitee-URI:n ur Calendlys `event_scheduled`. Formvalideras i calendly.server. */
        inviteeUri: z.string().url().max(300),
        /** Kvittot. Bevisar att anroparen sitter på den betalda sessionen. */
        sessionId: z.string().min(10).max(200),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<{ scheduledAt: string | null }> => {
    assertRateLimit(ipKey("coaching-booking"), limits.coachingBooking);

    const session = await retrieveCheckoutSession(data.sessionId);
    if (!isCoachingSession(session) || !sessionIsPaid(session)) {
      throw new Error("Vi hittar ingen slutförd betalning för den här bokningen.");
    }
    const sessionRequestId =
      session.metadata?.coaching_request_id ?? session.client_reference_id ?? null;
    if (sessionRequestId && sessionRequestId !== data.requestId) {
      console.error(
        `[coaching] session ${session.id} hör till rad ${sessionRequestId}, inte ${data.requestId}`,
      );
      throw new Error(BOOKING_ERROR);
    }

    const { data: row, error: rowError } = await supabaseAdmin
      .from("coaching_requests")
      .select("id,paid_at,scheduled_at,email,name")
      .eq("id", data.requestId)
      .maybeSingle();

    if (rowError) {
      console.error("[coaching] kunde inte slå upp bokningsraden:", rowError.message);
      throw new Error(BOOKING_ERROR);
    }
    if (!row) throw new Error(BOOKING_ERROR);
    if (!row.paid_at) {
      // Ska inte kunna hända — sessionen är betald och markCoachingPaid körs
      // före. Men om den ändå inte är det ska ingen tid skrivas.
      console.error(`[coaching] rad ${row.id} saknar paid_at trots betald session ${session.id}`);
      throw new Error(BOOKING_ERROR);
    }
    if (row.scheduled_at) return { scheduledAt: row.scheduled_at };

    const booking = await fetchCalendlyBooking(data.inviteeUri);
    // Bokningen ska vara den vi själva skickade köparen till. Saknas märkningen
    // helt (Calendly kan sluta skicka tracking) släpps den igenom med en logg —
    // en felkopplad bokning är illa, men att blockera en betald köpare är värre.
    if (booking.utmContent && booking.utmContent !== data.requestId) {
      console.error(
        `[coaching] bokning ${booking.inviteeUri} bär utm_content ${booking.utmContent}, väntade ${data.requestId}`,
      );
      throw new Error(BOOKING_ERROR);
    }
    if (!booking.utmContent) {
      console.warn(`[coaching] bokning ${booking.inviteeUri} saknar utm_content`);
    }
    // En avbokad tid är ingen tid.
    if (booking.status !== "active") {
      console.error(`[coaching] bokning ${booking.inviteeUri} har status ${booking.status}`);
      throw new Error(BOOKING_ERROR);
    }

    const goal = formatCalendlyAnswers(booking.answers);

    const { error: updateError } = await supabaseAdmin
      .from("coaching_requests")
      .update({
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

    return { scheduledAt: booking.startTime };
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
      const marked = await markCoachingPaid(session);
      firstConfirmation = marked.newlyPaid;
      // Reserv för webhooken. Spärren i sendCoachingConfirmation gör att bara
      // en av de två vägarna faktiskt skickar.
      if (marked.requestId) await sendCoachingConfirmation(marked.requestId, siteOrigin());
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
