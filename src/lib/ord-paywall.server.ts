/**
 * Databasdelen av ordpaywallen: vem har köpt, och bokföringen av ett köp.
 *
 * Som `coaching.server.ts` nås bokföringen från två håll med samma händelse,
 * webhooken (sanningen) och köparens återvändande till /ord (reserven om
 * webhooken är sen), och måste därför vara idempotent.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";
import {
  type StripeCheckoutSession,
  type StripeSubscription,
  retrieveSubscription,
  stripeIdOf,
  subscriptionCancelsAtPeriodEnd,
  subscriptionPeriod,
} from "./stripe.server";
import {
  ORD_PLANS,
  ORD_PRODUCT_TAG,
  accessMonths,
  purchaseAccess,
  type OrdPurchaseRow,
} from "./ord-paywall";

export function isOrdSession(session: StripeCheckoutSession): boolean {
  return session.metadata?.product === ORD_PRODUCT_TAG;
}

/**
 * Köpets längd ur sessionen, satt av `startOrdCheckout`. En session utan
 * (öppnad innan planerna fanns) var ett sexmånadersköp.
 */
export function sessionAccessMonths(session: StripeCheckoutSession): number {
  return accessMonths(session.metadata?.access_months);
}

/**
 * PostgREST svarar så här när en kolumn inte finns, alltså innan migrationen
 * `20261026120000_ordlistan_kop_langd.sql` körts.
 */
function isMissingColumn(error: { code?: string } | null): boolean {
  return error?.code === "PGRST204" || error?.code === "42703";
}

/** Raden som den ligger i tabellen, med de fält vi läser. */
export type StoredOrdPurchase = OrdPurchaseRow & {
  user_id: string;
  stripe_session_id: string;
  stripe_customer_id?: string | null;
};

/**
 * Användarens köprad. `failed` skiljer "inget köp" från "kunde inte läsa":
 * det första låser, det andra släpper igenom (se `hasOrdAccess`).
 *
 * `*` och inte en kolumnlista: kolumnerna har kommit till i omgångar
 * (`access_months`, sedan prenumerationsfälten), och en lista som nämner en
 * kolumn som inte finns än faller helt. Det felet läses som "lås upp", alltså
 * hade alla fått allt gratis.
 */
export async function readOrdPurchase(
  userId: string,
): Promise<{ row: StoredOrdPurchase | null; failed: boolean }> {
  const { data, error } = await supabaseAdmin
    .from("ord_purchases")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.error("[ord-paywall] kunde inte läsa köp:", error.message);
    return { row: null, failed: true };
  }
  return { row: (data as StoredOrdPurchase | null) ?? null, failed: false };
}

export async function hasOrdAccess(userId: string): Promise<boolean> {
  const { row, failed } = await readOrdPurchase(userId);
  // Hellre låsa upp än låsa ute någon som betalat: ett databasfel ska aldrig
  // se ut som ett uteblivet köp. Det kostar i värsta fall några gratisord.
  if (failed) return true;
  if (row === null) return false;
  return purchaseAccess(row).active;
}

/**
 * Antalet besvarade MEK-uppgifter i träningsläget (inte i matcher: duellerna
 * är gratis). Svar räknas, inte rätta, se `ord-paywall.ts`. En överhoppad
 * uppgift (`selected_answer` null) räknas inte: den visar inget facit, och
 * gränsen ska betyda "40 besvarade". Vid fel: 0, alltså hellre några
 * gratisuppgifter för mycket än en spärr som slår till av misstag.
 */
export async function countMekTrainingAnswers(userId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("match_answers")
    .select("id, questions!inner(category)", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_training", true)
    .not("selected_answer", "is", null)
    .eq("questions.category", "MEK");
  if (error) {
    console.error("[ord-paywall] kunde inte räkna MEK-svar:", error.message);
    return 0;
  }
  return count ?? 0;
}

type PurchaseInsert = Database["public"]["Tables"]["ord_purchases"]["Insert"];
type PurchaseUpdate = Database["public"]["Tables"]["ord_purchases"]["Update"];

/** Kolumnerna som kom i efterhand, i den ordning migrationerna lade till dem. */
const LATER_COLUMNS = [
  "access_months",
  "stripe_customer_id",
  "stripe_subscription_id",
  "subscription_status",
  "current_period_end",
  "cancel_at_period_end",
] as const;

/** Raden utan kolumner som kanske inte finns än. */
function withoutLaterColumns<T extends PurchaseUpdate>(row: T): T {
  const copy = { ...row };
  for (const c of LATER_COLUMNS) delete copy[c];
  return copy;
}

/**
 * Skriver in köpet. Returnerar true bara för den som faktiskt skapade raden.
 * Köpet knyts till `metadata.user_id`, som vi själva satte när kassan öppnades.
 *
 * `user_id` är primärnyckel, så den som köper igen efter att köpet gått ut
 * krockar med sin gamla rad. Då skrivs raden över med det nya köpet och ny
 * `paid_at`; annars hade andra köpet dragit pengar utan att låsa upp något.
 * Det är säkert att skriva över hela raden: `startOrdCheckout` öppnar ingen
 * kassa åt den som har ett köp som gäller, så raden som skrivs över har
 * redan gått ut.
 *
 * Ett engångsköp nollställer prenumerationsfälten, så att en gammal, avslutad
 * prenumeration inte styr åtkomsten efter ett sexmånadersköp. Ett
 * prenumerationsköp hämtar prenumerationen ur Stripe och skriver in perioden
 * direkt; misslyckas det står raden kvar med `paid_at` plus en månad som
 * reserv, och nästa webhook rättar.
 *
 * Samma session 2 gånger (webhook + återvändande) rör ingenting.
 */
export async function markOrdPaid(session: StripeCheckoutSession): Promise<boolean> {
  if (!isOrdSession(session)) return false;
  const userId = session.metadata?.user_id;
  if (!userId) {
    console.error(`[ord-paywall] session ${session.id} saknar user_id i metadata`);
    throw new Error("Kunde inte bekräfta betalningen.");
  }
  const subscriptionId = session.mode === "subscription" ? stripeIdOf(session.subscription) : null;
  const row: PurchaseInsert = {
    user_id: userId,
    stripe_session_id: session.id,
    stripe_payment_intent:
      typeof session.payment_intent === "string" ? session.payment_intent : null,
    amount_total: session.amount_total,
    currency: session.currency,
    access_months: subscriptionId ? ORD_PLANS["1m"].months : sessionAccessMonths(session),
    stripe_customer_id: stripeIdOf(session.customer),
    stripe_subscription_id: subscriptionId,
    subscription_status: null,
    current_period_end: null,
    cancel_at_period_end: false,
  };

  const created = await writeNewPurchase(row, session.id);
  if (created && subscriptionId) {
    try {
      await syncOrdSubscription(await retrieveSubscription(subscriptionId));
    } catch (e) {
      console.error("[ord-paywall] kunde inte hämta prenumerationen efter köpet:", e);
    }
  }
  return created;
}

async function writeNewPurchase(row: PurchaseInsert, sessionId: string): Promise<boolean> {
  const userId = row.user_id;
  let { error } = await supabaseAdmin.from("ord_purchases").insert(row);
  if (isMissingColumn(error)) {
    // Utan de nya kolumnerna läses köpet som sex månader, eller för en
    // prenumeration som paid_at plus en månad. Det är fel åt köparens håll
    // för ett enmånadsköp, men köpet bokförs, vilket är det som inte får falla.
    console.error("[ord-paywall] kolumner saknas i ord_purchases, kör migrationerna");
    ({ error } = await supabaseAdmin.from("ord_purchases").insert(withoutLaterColumns(row)));
  }
  if (!error) return true;
  if (error.code !== "23505") {
    console.error("[ord-paywall] kunde inte skapa köp:", error.message);
    throw new Error("Kunde inte bekräfta betalningen.");
  }

  // Krock: antingen samma session igen (redan bokfört) eller ett nytt köp.
  const { data: existing, error: readError } = await supabaseAdmin
    .from("ord_purchases")
    .select("stripe_session_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (readError) {
    console.error("[ord-paywall] kunde inte läsa befintligt köp:", readError.message);
    throw new Error("Kunde inte bekräfta betalningen.");
  }
  if (!existing || existing.stripe_session_id === sessionId) return false;

  const renew = (values: PurchaseUpdate) =>
    supabaseAdmin
      .from("ord_purchases")
      .update({ ...values, paid_at: new Date().toISOString() })
      .eq("user_id", userId)
      .neq("stripe_session_id", sessionId);
  let { error: updateError } = await renew(row);
  if (isMissingColumn(updateError)) {
    ({ error: updateError } = await renew(withoutLaterColumns(row)));
  }
  if (updateError) {
    // Unikt session-id: den andra vägen hann före. Rätt utfall.
    if (updateError.code === "23505") return false;
    console.error("[ord-paywall] kunde inte förnya köp:", updateError.message);
    throw new Error("Kunde inte bekräfta betalningen.");
  }
  return true;
}

/** Hör prenumerationen till ordlistan? Metadata sätts av `startOrdCheckout`. */
export function isOrdSubscription(sub: StripeSubscription): boolean {
  return sub.metadata?.product === ORD_PRODUCT_TAG;
}

/**
 * Skriver prenumerationens läge i Stripe till köpraden: status, periodslut
 * och uppsägning, och `paid_at` till periodens start medan den löper, så att
 * reservregeln (`paid_at` plus en månad) håller om periodslutet saknas.
 *
 * Anroparen hämtar alltid prenumerationen färsk ur Stripe i stället för att
 * lita på objektet i webhooken. Det gör synken idempotent och oberoende av
 * ordningen händelserna kommer i: en sen `customer.subscription.updated` kan
 * aldrig skriva ett äldre läge.
 *
 * Raden hittas på prenumerations-id, annars på användaren i metadatan, men
 * då bara om raden inte redan bär ett ANNAT prenumerations-id. Utan det
 * villkoret hade en gammal prenumerations sena händelse kunnat skriva över
 * ett nytt köp.
 *
 * Returnerar false när ingen rad hittades. Det händer när den första
 * fakturan kommer före `checkout.session.completed`; köpet skapar då raden
 * och synkar själv.
 */
export async function syncOrdSubscription(sub: StripeSubscription): Promise<boolean> {
  if (!isOrdSubscription(sub)) return false;
  const userId = sub.metadata?.user_id;
  const { start, end } = subscriptionPeriod(sub);
  const running = sub.status === "active" || sub.status === "trialing";
  const values: PurchaseUpdate = {
    stripe_subscription_id: sub.id,
    stripe_customer_id: stripeIdOf(sub.customer),
    subscription_status: sub.status,
    current_period_end: end === null ? null : new Date(end).toISOString(),
    cancel_at_period_end: subscriptionCancelsAtPeriodEnd(sub),
    access_months: ORD_PLANS["1m"].months,
  };
  if (running && start !== null) values.paid_at = new Date(start).toISOString();

  const write = async (v: PurchaseUpdate) => {
    const bySub = await supabaseAdmin
      .from("ord_purchases")
      .update(v)
      .eq("stripe_subscription_id", sub.id)
      .select("user_id");
    if (bySub.error || (bySub.data?.length ?? 0) > 0 || !userId) return bySub;
    return supabaseAdmin
      .from("ord_purchases")
      .update(v)
      .eq("user_id", userId)
      .is("stripe_subscription_id", null)
      .select("user_id");
  };

  const res = await write(values);
  if (isMissingColumn(res.error)) {
    // Före migrationen finns varken id eller periodslut att skriva, och
    // raden går inte att hitta på prenumerationen. Flytta åtminstone fram
    // `paid_at` på användarens rad, så att förnyelsen syns i reservregeln.
    console.error("[ord-paywall] prenumerationskolumner saknas, kör migrationen");
    if (!userId || !values.paid_at) return false;
    const legacy = await supabaseAdmin
      .from("ord_purchases")
      .update({ paid_at: values.paid_at })
      .eq("user_id", userId)
      .select("user_id");
    if (legacy.error) throw new Error(legacy.error.message);
    return (legacy.data?.length ?? 0) > 0;
  }
  if (res.error) {
    console.error("[ord-paywall] kunde inte synka prenumerationen:", res.error.message);
    throw new Error("Kunde inte synka prenumerationen.");
  }
  if ((res.data?.length ?? 0) === 0) {
    console.warn(`[ord-paywall] ingen köprad för prenumeration ${sub.id}`);
    return false;
  }
  return true;
}
