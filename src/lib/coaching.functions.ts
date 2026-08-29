/**
 * Coachning — pris, tidsbokning, kassa och bekräftelse.
 *
 * Flödet (2026-08-29): knappen (startsidan, landningssidan eller nudgen) →
 * `startCoachingBooking` skapar en rad i `coaching_requests` och ger tillbaka
 * en Calendly-länk → köparen väljer en tid i iframen → `completeCoachingBooking`
 * läser tiden ur Calendly, skriver den på raden och öppnar kassan → betalningen
 * sker i en Stripe-iframe i samma modal → `/coachning/tack` kvitterar.
 *
 * ORDNINGEN ÄR VALD MEDVETET, OCH DEN HAR ÄNDRATS TVÅ GÅNGER. Tid-före-kassa
 * var det ursprungliga läget (den som redan har en tid i kalendern slutför
 * köpet oftare), men kostade att en tid kunde bli stående obetald: Calendly
 * binder tiden i samma sekund den bokas, medan en kassa som ligger på en annan
 * domän går att stänga. 2026-08-19 vändes ordningen därför till betala-först.
 * Nu är den vänd tillbaka, med tre skillnader mot den gamla versionen:
 *
 *   1. Kassan är INBÄDDAD (`ui_mode: "embedded"`) när `STRIPE_PUBLISHABLE_KEY`
 *      finns. Köparen lämnar aldrig sidan, så steget "tid vald → betald" är ett
 *      klick i samma modal i stället för ett domänbyte.
 *   2. Kassan går ut efter `CHECKOUT_TTL_MIN`, och städaren
 *      (`coaching-sweep.server.ts`) avbokar tiden när fönstret stängt.
 *      `checkout.session.expired` släpper den direkt.
 *   3. Bokningslänken är engångsgenererad per försök, så den publika
 *      Calendly-sluggen ligger inte i sidkällan.
 *
 * Baksidan finns kvar och ska tas på allvar: den som bokar och stänger modalen
 * har en tid gratis tills städaren river den. `COACHING_SWEEP` måste vara "on"
 * i drift — utan den är det här flödet en gratisbokningsautomat.
 *
 * `attachPaidCoachingBooking` är reservvägen på tacksidan: har ett köp av något
 * skäl blivit betalt utan tid (Calendly nere, kassan öppnad direkt) får köparen
 * välja där i stället. Den kräver en betald session och kan därför inte
 * användas för att komma runt ordningen.
 *
 * Webhooken i `src/server.ts` bokför köpet och skickar bekräftelsemejlet;
 * tacksidan är reserven när webhooken är sen. Båda går genom
 * `markCoachingPaid()`, som är idempotent.
 *
 * Utan Calendly konfigurerat hoppas bokningssteget över och kassan öppnas
 * direkt. Samma princip som att kortet visar kontaktvägen när Stripe saknas:
 * en tjänst som inte svarar får ta bort sitt eget steg, inte köpet.
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
  stripePublishableKey,
  type StripeCheckoutSession,
} from "./stripe.server";
import {
  buildCoachingCheckoutParams,
  checkoutExpiresAt,
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
  /**
   * Stripes publicerbara nyckel, eller null när den inte är satt i miljön.
   *
   * Den skickas hit i stället för att bakas in i klientbundeln, eftersom en
   * `VITE_`-variabel bara går att sätta vid bygget: ett Stripe-konto som byts
   * hade då krävt en ny build i stället för en ny deploy. Är den null renderas
   * kassan inte i sidan utan webbläsaren skickas till Stripe som förut.
   */
  publishableKey: string | null;
}

const OFFER_UNAVAILABLE: CoachingOffer = {
  available: false,
  amount: null,
  currency: "SEK",
  interval: null,
  intervalCount: 1,
  productName: null,
  schedulingEnabled: false,
  publishableKey: null,
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
        publishableKey: stripePublishableKey(),
      };
    } catch (e) {
      console.error("[coaching] kunde inte läsa priset:", e instanceof Error ? e.message : e);
      return OFFER_UNAVAILABLE;
    }
  },
);

/**
 * Kassan så som klienten behöver se den.
 *
 * Exakt ett av de två fälten är satt: `clientSecret` när kassan renderas inne
 * i sidan, `url` när webbläsaren ska skickas till Stripe. Att båda finns i
 * samma typ är avsiktligt — anropsstället ska inte behöva veta vilket läge som
 * är påslaget, bara rendera det som kom tillbaka.
 */
export interface CoachingCheckoutHandle {
  clientSecret: string | null;
  url: string | null;
  sessionId: string;
  /**
   * Tiden som redan bokats, när köpet gick via tidsvalet. Följer med hit så
   * att kassan kan skriva ut vad som faktiskt är reserverat — utan den raden
   * ser betalsteget likadant ut vare sig en tid är tagen eller inte.
   */
  scheduledAt: string | null;
}

const CHECKOUT_ERROR = "Kunde inte öppna kassan just nu. Försök igen om en stund.";

/**
 * Skapar Checkout-sessionen och knyter den till raden.
 *
 * Ligger samlad här därför att båda vägarna in i kassan (med och utan bokad
 * tid) måste skriva `stripe_session_id` på raden: utan den kan städaren inte
 * koppla ihop en utgången kassa med tiden den höll, och `checkout.session.expired`
 * har inget att släppa.
 */
async function openCheckout(input: {
  requestId: string;
  userId: string | null;
  source: string;
  email?: string;
  scheduledAt?: string | null;
  focusAnswered?: boolean;
  /** Sätt när en tid är bokad — kassan måste då gå ut före städarens frist. */
  expiring: boolean;
}): Promise<CoachingCheckoutHandle> {
  const price = await resolveCoachingPrice();
  const params = (uiMode: "hosted" | "embedded") =>
    buildCoachingCheckoutParams({
      priceId: price.priceId,
      recurring: price.recurring,
      requestId: input.requestId,
      userId: input.userId,
      source: input.source,
      email: input.email,
      origin: siteOrigin(),
      scheduledAt: input.scheduledAt ?? null,
      focusAnswered: input.focusAnswered,
      uiMode,
      // Tiden är tagen i kalendern och städaren släpper den efter fristen —
      // då får kassan inte gå att betala efteråt. Se CHECKOUT_TTL_MIN.
      ...(input.expiring ? { expiresAt: checkoutExpiresAt(new Date()) } : {}),
    });

  let embedded = stripePublishableKey() !== null;
  let session: StripeCheckoutSession | null = null;

  if (embedded) {
    try {
      session = await createCheckoutSession(params("embedded"));
    } catch (e) {
      // `ui_mode` bytte namn mellan API-versioner (se EMBEDDED_UI_MODE) och vi
      // pinnar ingen version. Ett kontobyte eller en versionsrullning ska inte
      // kunna stoppa ett köp — då blir det den hostade kassan i stället, som
      // fungerade i månader före det här.
      console.error("[coaching] inbäddad kassa gick inte att skapa, faller tillbaka:", e);
      embedded = false;
    }
  }
  if (!session) {
    try {
      session = await createCheckoutSession(params("hosted"));
    } catch (e) {
      console.error("[coaching] Stripe vägrade skapa kassan:", e);
      throw new Error(CHECKOUT_ERROR);
    }
  }

  const clientSecret = embedded ? (session.client_secret ?? null) : null;
  const url = embedded ? null : session.url;
  if (!clientSecret && !url) {
    // Inbäddat läge utan client_secret betyder att `ui_mode` inte togs emot —
    // en tyst konfigurationsmiss som annars visar sig som en tom modal.
    console.error(
      `[coaching] session ${session.id} kom tillbaka utan ${embedded ? "client_secret" : "url"}`,
    );
    throw new Error(CHECKOUT_ERROR);
  }

  const { error } = await supabaseAdmin
    .from("coaching_requests")
    .update({ stripe_session_id: session.id })
    .eq("id", input.requestId);
  // Loggas men stoppar inte köpet: betalningen hittar tillbaka via metadatan
  // ändå. Det som går förlorat är städarens koppling, inte pengarna.
  if (error) {
    console.error("[coaching] kunde inte skriva session-id på raden:", error.message);
  }

  return { clientSecret, url, sessionId: session.id, scheduledAt: input.scheduledAt ?? null };
}

/**
 * Kassan utan föregående tidsval.
 *
 * Används när Calendly inte är påslaget här. Med tidsbokning igång går köpet
 * i stället genom `startCoachingBooking` → `completeCoachingBooking`.
 */
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
  .handler(async ({ data, context }): Promise<CoachingCheckoutHandle> => {
    const { userId } = context;
    assertRateLimit(
      userId ? `coaching-checkout:${userId}` : ipKey("coaching-checkout"),
      limits.coachingCheckout,
    );

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
      throw new Error(CHECKOUT_ERROR);
    }

    return openCheckout({
      requestId: row.id,
      userId,
      source: data.source,
      email: data.email,
      // Ingen tid är bokad, alltså finns inget i kalendern som måste släppas.
      expiring: false,
    });
  });

/* ============ Tidsbokning (Calendly) — FÖRE betalningen ============ */

const BOOKING_ERROR = "Kunde inte öppna tidsvalet just nu. Försök igen om en stund.";

export interface CoachingBookingOpen {
  /** Länken iframen laddar. null = tidsbokning är inte påslagen här. */
  schedulingUrl: string | null;
  /** Raden köpet hör till. Skickas tillbaka in i `completeCoachingBooking`. */
  requestId: string | null;
}

/**
 * Öppnar tidsvalet, innan något är betalt.
 *
 * Raden skapas redan här, före tidsvalet, eftersom dess id är det som följer
 * med som `utm_content` in i Calendly och kommer tillbaka på bokningen. Det är
 * den kopplingen som gör att en bokning kan knytas till rätt köp utan att lita
 * på något klienten säger. Priset för det är rader som blir kvar med status
 * 'booking' när någon ångrar sig i väljaren; de är avsiktligt inte med i
 * `coaching_obetalda_bokningar`, som bara listar riktiga bokningar.
 *
 * Att inte vara konfigurerat är ett giltigt svar och inte ett fel: modalen
 * faller då tillbaka på att gå direkt till kassan.
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
  .handler(async ({ data, context }): Promise<CoachingBookingOpen> => {
    const { userId } = context;
    assertRateLimit(
      userId ? `coaching-booking:${userId}` : ipKey("coaching-booking"),
      limits.coachingBooking,
    );

    const eventUrl = calendlyEventUrl();
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
 *
 * Kassan som öppnas här går ut efter `CHECKOUT_TTL_MIN`, som är kortare än
 * städarens frist. Utan det kunde en övergiven kassa betalas efter att tiden
 * redan släppts, och köparen stå med en betald rad utan tid i kalendern.
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
  .handler(async ({ data, context }): Promise<CoachingCheckoutHandle> => {
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
      throw new Error(CHECKOUT_ERROR);
    }
    if (!row) throw new Error(CHECKOUT_ERROR);
    // supabaseAdmin kringgår RLS, så det här är enda ägarkontrollen. Den slår
    // bara när båda sidor är kända: raden kan ha skapats utloggad och köpet
    // slutföras efter inloggning, vilket är ett giltigt fall.
    if (row.user_id && userId && row.user_id !== userId) {
      console.error(`[coaching] rad ${row.id} tillhör en annan användare än ${userId}`);
      throw new Error(CHECKOUT_ERROR);
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
      throw new Error(CHECKOUT_ERROR);
    }
    if (!booking.utmContent) {
      console.warn(`[coaching] bokning ${booking.inviteeUri} saknar utm_content`);
    }
    // En avbokad tid är ingen tid. Utan kontrollen kan någon återanvända en
    // gammal, avbokad bokning för att ta sig till kassan med ett `scheduled_at`
    // som inte finns i kalendern.
    if (booking.status !== "active") {
      console.error(`[coaching] bokning ${booking.inviteeUri} har status ${booking.status}`);
      throw new Error(CHECKOUT_ERROR);
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
      throw new Error(CHECKOUT_ERROR);
    }

    return openCheckout({
      requestId: row.id,
      userId,
      source: data.source,
      email: booking.email ?? row.email ?? undefined,
      scheduledAt: booking.startTime,
      focusAnswered: booking.answers.length > 0,
      expiring: true,
    });
  });

/* ====== Tidsbokning EFTER betalningen — reserv på tacksidan ====== */

/*
 * Normalvägen är tidsvalet ovan, före kassan. Det här är reserven för de köp
 * som ändå blir betalda utan tid: Calendly kan ha varit nere när modalen
 * öppnades, och då gick köpet rakt till kassan. Den kräver en betald session
 * och kan därför inte användas för att komma runt ordningen — den lagar bara
 * utfallet där en betalande köpare annars inte har någon tid alls.
 */

export interface CoachingBookingStart {
  /** Länken iframen laddar. null = ingen tid att välja (se `reason`). */
  schedulingUrl: string | null;
  /** Raden köpet hör till. Skickas tillbaka in i `attachPaidCoachingBooking`. */
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
 * Skriver den valda tiden på ett REDAN BETALT köp (reservvägen på tacksidan).
 *
 * Kräver att raden faktiskt är betald. Normalvägen skriver tiden i
 * `completeCoachingBooking`, före betalningen.
 *
 * Tiden hämtas server-side ur Calendlys API och aldrig ur klientens
 * postMessage: nyttolasten där innehåller bara URI:er, och `fetchCalendlyBooking`
 * låser formen på URI:n innan den används i ett anrop med vårt Bearer-token
 * (utan det är den en SSRF som läcker tokenet, tyst).
 */
export const attachPaidCoachingBooking = createServerFn({ method: "POST" })
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
