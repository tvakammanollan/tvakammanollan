/**
 * Coachningsköp — server-side delen som både webhooken (`/api/stripe/webhook`)
 * och tacksidan använder.
 *
 * Två vägar leder hit med samma händelse: Stripes webhook, och köparen som
 * landar på `/coachning/tack?session_id=…`. Webhooken är sanningen (den kommer
 * även om webbläsaren stängs i betalögonblicket), tacksidan är reserven som
 * gör att kvittot syns direkt även om webhooken är sen eller inte hunnit
 * konfigureras. Därför måste markeringen vara idempotent — `newlyPaid` säger
 * vem som faktiskt vände raden, så händelsen bara räknas en gång.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { customFieldValue, type StripeCheckoutSession, type StripeParam } from "./stripe.server";

/**
 * Märker sessionen som vår.
 *
 * Kontot har en webhook-endpoint som lyssnar på i stort sett alla händelser, och
 * `checkout.session.completed` fyras för varje köp i hela kontot — även sådant
 * som inte har med sajten att göra. Utan en märkning skulle ett främmande köp
 * hamna som en betald coachningsrad, eftersom hanteraren annars skapar raden
 * när den inte hittar någon.
 */
export const COACHING_PRODUCT_TAG = "coaching";

/** Nycklarna på Checkout-sidans egna frågor. Samma namn skrivs och läses. */
export const COACHING_FIELD_FOCUS = "fokus";
export const COACHING_FIELD_TIMING = "tid";

export interface MarkPaidResult {
  /** true bara för den som faktiskt vände raden från obetald till betald. */
  newlyPaid: boolean;
  requestId: string | null;
}

/**
 * Hör sessionen till coachningen?
 *
 * `coaching_request_id` accepteras också, så att ett köp som hann påbörjas före
 * märkningen infördes fortfarande bokförs.
 */
export function isCoachingSession(session: StripeCheckoutSession): boolean {
  return (
    session.metadata?.product === COACHING_PRODUCT_TAG ||
    Boolean(session.metadata?.coaching_request_id)
  );
}

/** Ett Checkout-köp är betalt både vid direktbetalning och vid gratis kupong. */
export function sessionIsPaid(session: StripeCheckoutSession): boolean {
  return session.payment_status === "paid" || session.payment_status === "no_payment_required";
}

export interface CheckoutParamsInput {
  priceId: string;
  /** true = abonnemang. Styr både `mode` och vilka fält Stripe accepterar. */
  recurring: boolean;
  requestId: string;
  userId: string | null;
  source: string;
  email?: string;
  /** Absolut origin, utan avslutande snedstreck. */
  origin: string;
  /**
   * Starttid (ISO, UTC) som redan bokats i Calendly, om tidsbokningen är
   * påslagen. Är den satt ställs inte tidsfrågan i kassan — köparen har redan
   * valt, och en andra fråga om samma sak ser ut som att bokningen inte gick
   * igenom.
   */
  scheduledAt?: string | null;
  /** true om köparen redan svarat på en fråga i Calendly — då hoppas fokusfrågan över. */
  focusAnswered?: boolean;
  /**
   * Unix-sekunder när kassan ska sluta gälla. Sätts bara när en tid redan är
   * bokad — se `CHECKOUT_TTL_MIN`.
   */
  expiresAt?: number;
}

/**
 * Hur länge kassan lever när en tid redan är bokad.
 *
 * OANVÄND SEDAN 2026-08-19, men medvetet kvar. Ordningen är nu betala först,
 * boka sedan, så det finns ingen tid att gå ut på när kassan öppnas. Skulle
 * ordningen någonsin vändas tillbaka är den här — och testet som pinnar att
 * den är kortare än städarens `UNPAID_GRACE_MS` — det som hindrar att en
 * övergiven kassa betalas ett dygn senare, efter att tiden redan släppts, så
 * att köparen står med en betald rad och ingenting i kalendern. Stripe kräver
 * minst 30 minuter.
 */
export const CHECKOUT_TTL_MIN = 35;

/** Unix-sekunder när en kassa öppnad `now` ska gå ut. */
export function checkoutExpiresAt(now: Date): number {
  return Math.floor(now.getTime() / 1000) + CHECKOUT_TTL_MIN * 60;
}

/**
 * Bygger parametrarna till Checkout-sessionen.
 *
 * Ligger separat från serverfunktionen därför att det här är enda stället där
 * ett stavfel varken syns i typkontrollen eller i ett felmeddelande — Stripe
 * struntar i okända fält, och en tappad `metadata`-nyckel märks först när
 * webhooken inte hittar tillbaka till köpet. Testet i coaching.server.test.ts
 * pinnar formen.
 */
export function buildCoachingCheckoutParams(input: CheckoutParamsInput) {
  return {
    mode: input.recurring ? "subscription" : "payment",
    line_items: [{ price: input.priceId, quantity: 1 }],
    success_url: `${input.origin}/coachning/tack?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${input.origin}/?coachning=avbruten`,
    locale: "sv",
    client_reference_id: input.requestId,
    allow_promotion_codes: true,
    phone_number_collection: { enabled: true },
    customer_email: input.email,
    // Bara när tiden redan är bokad: då är kassan knuten till en plats i
    // kalendern som städaren släpper, och de två fönstren måste hänga ihop.
    ...(input.expiresAt ? { expires_at: input.expiresAt } : {}),
    metadata: {
      product: COACHING_PRODUCT_TAG,
      coaching_request_id: input.requestId,
      user_id: input.userId ?? "",
      source: input.source,
      // Syns i Stripe-dashboarden bredvid betalningen, så att en fråga om ett
      // köp går att besvara utan att slå upp raden i databasen.
      ...(input.scheduledAt ? { scheduled_at: input.scheduledAt } : {}),
    },
    // Formuläret som låg i modalen är borta — frågorna coachen faktiskt behöver
    // ställs i kassan i stället, alltid frivilliga så att de inte kan stoppa ett
    // köp. Varje fråga som redan besvarats tidigare i flödet utelämnas: samma
    // fråga två gånger läser som att första svaret inte togs emot.
    custom_fields: [
      ...(input.focusAnswered
        ? []
        : [
            {
              key: COACHING_FIELD_FOCUS,
              type: "text",
              optional: true,
              label: { type: "custom", custom: "Vad vill du fokusera på?" },
              text: { maximum_length: 200 },
            },
          ]),
      ...(input.scheduledAt
        ? []
        : [
            {
              key: COACHING_FIELD_TIMING,
              type: "text",
              optional: true,
              label: { type: "custom", custom: "När passar det att höras?" },
              text: { maximum_length: 100 },
            },
          ]),
    ],
    // Bara vid engångsköp — Stripe avvisar fältet i subscription-läge.
    ...(input.recurring
      ? {}
      : { payment_intent_data: { metadata: { coaching_request_id: input.requestId } } }),
  } satisfies Record<string, StripeParam>;
}

/**
 * Skriver in betalningen på coachningsraden.
 *
 * Raden skapades när kassan öppnades, så normalfallet är en uppdatering. Att
 * den saknas är inte otänkbart (databasen kan ha varit nere i just den
 * sekunden) och då är en betalning som inte syns någonstans det värsta
 * utfallet — därför skapas raden hellre i efterhand än tappas.
 */
export async function markCoachingPaid(session: StripeCheckoutSession): Promise<MarkPaidResult> {
  // Sista spärren mot att ett främmande köp blir en coachningsrad. Ligger här
  // och inte bara i anropen, eftersom det är det här stället som skriver.
  if (!isCoachingSession(session)) return { newlyPaid: false, requestId: null };

  const requestId = session.metadata?.coaching_request_id ?? session.client_reference_id ?? null;

  const details = session.customer_details;
  const patch = {
    status: "paid",
    paid_at: new Date().toISOString(),
    stripe_session_id: session.id,
    stripe_payment_intent:
      typeof session.payment_intent === "string" ? session.payment_intent : null,
    amount_total: session.amount_total,
    currency: session.currency,
    // Skriv aldrig över något som redan står i raden med tomt.
    ...(details?.email ? { email: details.email } : {}),
    ...(details?.name ? { name: details.name } : {}),
    ...(details?.phone ? { phone: details.phone } : {}),
    ...(customFieldValue(session, COACHING_FIELD_FOCUS)
      ? { goal: customFieldValue(session, COACHING_FIELD_FOCUS) }
      : {}),
    ...(customFieldValue(session, COACHING_FIELD_TIMING)
      ? { preferred_time: customFieldValue(session, COACHING_FIELD_TIMING) }
      : {}),
  };

  const lookup = supabaseAdmin.from("coaching_requests").select("id,paid_at").limit(1);
  const { data: existing, error: lookupError } = requestId
    ? await lookup.eq("id", requestId)
    : await lookup.eq("stripe_session_id", session.id);

  if (lookupError) {
    console.error("[coaching] kunde inte slå upp raden:", lookupError.message);
    throw new Error("Kunde inte bekräfta betalningen.");
  }

  const row = existing?.[0];
  if (row) {
    if (row.paid_at) return { newlyPaid: false, requestId: row.id };
    const { error } = await supabaseAdmin
      .from("coaching_requests")
      .update(patch)
      .eq("id", row.id)
      .is("paid_at", null);
    if (error) {
      console.error("[coaching] kunde inte markera som betald:", error.message);
      throw new Error("Kunde inte bekräfta betalningen.");
    }
    return { newlyPaid: true, requestId: row.id };
  }

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("coaching_requests")
    .insert({
      ...patch,
      user_id: session.metadata?.user_id || null,
      source: session.metadata?.source || null,
    })
    .select("id")
    .single();

  if (insertError) {
    // Unikt index på stripe_session_id: en parallell bekräftelse hann före.
    if (insertError.code === "23505") return { newlyPaid: false, requestId: null };
    console.error("[coaching] kunde inte skapa betald rad:", insertError.message);
    throw new Error("Kunde inte bekräfta betalningen.");
  }
  return { newlyPaid: true, requestId: inserted.id };
}

/* ── Bekräftelsemejl ─────────────────────────────────────────────── */

/**
 * Skickar köpbekräftelsen — högst en gång per köp.
 *
 * Två vägar bokför samma köp (webhooken, som är sanningen, och tacksidan, som
 * är reserv när webhooken är sen). Utan en spärr hade båda skickat var sitt
 * mejl. Spärren är en villkorad UPDATE: den som lyckas sätta
 * `confirmation_email_sent_at` medan den fortfarande är NULL är den som får
 * skicka. Det är samma mönster som `paid_at`.
 *
 * Tidsstämpeln sätts FÖRE utskicket med flit. Ett dubbelmejl är värre än ett
 * uteblivet: det andra ser ut som en andra debitering. Går utskicket fel loggas
 * det och kan skickas för hand.
 *
 * Kastar aldrig — ett mejl som inte går fram får inte göra att webhooken
 * svarar 500 och Stripe försöker bokföra köpet om och om igen.
 */
export async function sendCoachingConfirmation(requestId: string, origin: string): Promise<void> {
  try {
    const { data: row } = await supabaseAdmin
      .from("coaching_requests")
      .select("id,email,amount_total,currency,scheduled_at,stripe_session_id")
      .eq("id", requestId)
      .maybeSingle();

    if (!row?.email) {
      console.warn(`[coaching] rad ${requestId} saknar mejladress — ingen bekräftelse skickad`);
      return;
    }

    const { data: claimed, error } = await supabaseAdmin
      .from("coaching_requests")
      .update({ confirmation_email_sent_at: new Date().toISOString() })
      .eq("id", requestId)
      .is("confirmation_email_sent_at", null)
      .select("id");
    if (error) {
      console.error("[coaching] kunde inte reservera bekräftelsemejlet:", error.message);
      return;
    }
    // Någon annan väg hann före. Rätt utfall: mejlet är redan skickat.
    if (!claimed || claimed.length === 0) return;

    const { sendEmail } = await import("./email.server");
    const { coachingConfirmationTemplate } = await import("./email-templates");
    const { formatMoney, formatDateLong, formatTime } = await import("./sv-format");

    const mail = coachingConfirmationTemplate({
      amountLabel:
        row.amount_total !== null ? formatMoney(row.amount_total, row.currency ?? "SEK") : null,
      scheduledLabel: row.scheduled_at
        ? `${formatDateLong(row.scheduled_at)} kl. ${formatTime(row.scheduled_at)}`
        : null,
      receiptUrl: row.stripe_session_id
        ? `${origin}/coachning/tack?session_id=${encodeURIComponent(row.stripe_session_id)}`
        : `${origin}/coachning/tack`,
    });

    const res = await sendEmail({
      to: row.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      tag: "coachning-bekraftelse",
    });
    if (!res.ok) {
      console.error(`[coaching] bekräftelsemejlet för ${requestId} gick inte fram (${res.reason})`);
    }
  } catch (e) {
    console.error("[coaching] bekräftelsemejlet kraschade:", e);
  }
}
