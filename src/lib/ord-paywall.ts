/**
 * Ordpaywallen: de första 40 orden är gratis, resten kostar ett engångsköp.
 *
 * Ren logik, ingen databas. Räkningen är antalet SVAR (`ord_practice_stats.
 * total_count`), inte antalet rätta: ett fel svar är också ett ord man fått
 * se, och räknades bara rätta kunde ett felat ord köra om i oändlighet utan
 * att kvoten rörde sig.
 */

/** Så många ord är gratis. Ändras den här ändras allt som visar siffran. */
export const FREE_ORD_LIMIT = 40;

/** Taggen på Stripe-sessionen. Samma namn skrivs och läses, som `coaching`. */
export const ORD_PRODUCT_TAG = "ord_access";

export interface OrdAccess {
  owned: boolean;
  answered: number;
  /** Gratisord kvar. Oändligt för den som köpt, därför `null`. */
  freeRemaining: number | null;
  /** true när nästa batch skulle bli tom och köpet är vägen vidare. */
  locked: boolean;
}

export function ordAccess(answered: number, owned: boolean): OrdAccess {
  const safe = Number.isFinite(answered) && answered > 0 ? Math.floor(answered) : 0;
  if (owned) return { owned: true, answered: safe, freeRemaining: null, locked: false };
  const remaining = Math.max(0, FREE_ORD_LIMIT - safe);
  return { owned: false, answered: safe, freeRemaining: remaining, locked: remaining === 0 };
}

/** Hur många ord en batch får innehålla givet åtkomsten. 0 = låst. */
export function cappedBatchSize(requested: number, access: OrdAccess): number {
  if (access.freeRemaining === null) return requested;
  return Math.min(requested, access.freeRemaining);
}
