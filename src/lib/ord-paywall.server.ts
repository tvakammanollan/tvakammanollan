/**
 * Databasdelen av ordpaywallen: vem har köpt, och bokföringen av ett köp.
 *
 * Som `coaching.server.ts` nås bokföringen från två håll med samma händelse,
 * webhooken (sanningen) och köparens återvändande till /ord (reserven om
 * webhooken är sen), och måste därför vara idempotent.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { type StripeCheckoutSession } from "./stripe.server";
import { ORD_PRODUCT_TAG } from "./ord-paywall";

export function isOrdSession(session: StripeCheckoutSession): boolean {
  return session.metadata?.product === ORD_PRODUCT_TAG;
}

export async function hasOrdAccess(userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("ord_purchases")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    // Hellre låsa upp än låsa ute någon som betalat: ett databasfel ska aldrig
    // se ut som ett uteblivet köp. Det kostar i värsta fall några gratisord.
    console.error("[ord-paywall] kunde inte läsa köp:", error.message);
    return true;
  }
  return data !== null;
}

/**
 * Antalet MEK-svar i träningsläget (inte i matcher: duellerna är gratis).
 * Svar räknas, inte rätta, se `ord-paywall.ts`. Vid fel: 0, alltså hellre
 * några gratisuppgifter för mycket än en spärr som slår till av misstag.
 */
export async function countMekTrainingAnswers(userId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("match_answers")
    .select("id, questions!inner(category)", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_training", true)
    .eq("questions.category", "MEK");
  if (error) {
    console.error("[ord-paywall] kunde inte räkna MEK-svar:", error.message);
    return 0;
  }
  return count ?? 0;
}

/**
 * Skriver in köpet. Returnerar true bara för den som faktiskt skapade raden.
 * Köpet knyts till `metadata.user_id`, som vi själva satte när kassan öppnades.
 */
export async function markOrdPaid(session: StripeCheckoutSession): Promise<boolean> {
  if (!isOrdSession(session)) return false;
  const userId = session.metadata?.user_id;
  if (!userId) {
    console.error(`[ord-paywall] session ${session.id} saknar user_id i metadata`);
    throw new Error("Kunde inte bekräfta betalningen.");
  }
  const { error } = await supabaseAdmin.from("ord_purchases").insert({
    user_id: userId,
    stripe_session_id: session.id,
    stripe_payment_intent:
      typeof session.payment_intent === "string" ? session.payment_intent : null,
    amount_total: session.amount_total,
    currency: session.currency,
  });
  if (error) {
    // Redan bokfört (primärnyckel eller unikt session-id): rätt utfall.
    if (error.code === "23505") return false;
    console.error("[ord-paywall] kunde inte skapa köp:", error.message);
    throw new Error("Kunde inte bekräfta betalningen.");
  }
  return true;
}
