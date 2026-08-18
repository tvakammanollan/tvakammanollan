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
    metadata: {
      product: COACHING_PRODUCT_TAG,
      coaching_request_id: input.requestId,
      user_id: input.userId ?? "",
      source: input.source,
    },
    // Formuläret som låg i modalen är borta — de två frågor coachen faktiskt
    // behöver ställs i kassan i stället, båda frivilliga så att de inte kan
    // stoppa ett köp.
    custom_fields: [
      {
        key: COACHING_FIELD_FOCUS,
        type: "text",
        optional: true,
        label: { type: "custom", custom: "Vad vill du fokusera på?" },
        text: { maximum_length: 200 },
      },
      {
        key: COACHING_FIELD_TIMING,
        type: "text",
        optional: true,
        label: { type: "custom", custom: "När passar det att höras?" },
        text: { maximum_length: 100 },
      },
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
