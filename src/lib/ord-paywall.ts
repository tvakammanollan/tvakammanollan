/**
 * Övningspaywallen: de första 40 orden och de första 40 MEK-uppgifterna är
 * gratis, resten kostar ett engångsköp. Samma köp ("Hela Ordlistan + MEK")
 * låser upp båda, så den som köpte ordlistan innan MEK låstes fick MEK på
 * köpet.
 *
 * Ren logik, ingen databas. Räkningen är antalet SVAR (ORD:
 * `ord_practice_stats.total_count`, MEK: träningssvar i `match_answers`), inte
 * antalet rätta: ett fel svar är också en uppgift man fått se, och räknades
 * bara rätta kunde en felad uppgift köras om i oändlighet utan att kvoten
 * rörde sig. Överhoppade MEK-uppgifter räknas inte; de visar inget facit.
 */

/** Så många ord är gratis. Ändras den här ändras allt som visar siffran. */
export const FREE_ORD_LIMIT = 40;

/** Så många MEK-uppgifter i träningsläget är gratis. */
export const FREE_MEK_LIMIT = 40;

/**
 * Taggen på Stripe-sessionen. Heter `ord_access` även sedan köpet också
 * låser upp MEK: byts den känner webhooken inte igen sessioner som redan är
 * öppna, och `ord_purchases` är fortfarande tabellen köpen bokförs i.
 */
export const ORD_PRODUCT_TAG = "ord_access";

export type PaywallSubject = "ord" | "mek";

/** Sidorna kassan får skicka tillbaka köparen till. */
export const PAYWALL_RETURN_PATHS = ["/ord", "/mek-ovning", "/train"] as const;
export type PaywallReturnPath = (typeof PAYWALL_RETURN_PATHS)[number];

export interface OrdAccess {
  owned: boolean;
  answered: number;
  /** Gratisuppgifter kvar. Oändligt för den som köpt, därför `null`. */
  freeRemaining: number | null;
  /** true när nästa batch skulle bli tom och köpet är vägen vidare. */
  locked: boolean;
}

export function practiceAccess(answered: number, owned: boolean, limit: number): OrdAccess {
  const safe = Number.isFinite(answered) && answered > 0 ? Math.floor(answered) : 0;
  if (owned) return { owned: true, answered: safe, freeRemaining: null, locked: false };
  const remaining = Math.max(0, limit - safe);
  return { owned: false, answered: safe, freeRemaining: remaining, locked: remaining === 0 };
}

export function ordAccess(answered: number, owned: boolean): OrdAccess {
  return practiceAccess(answered, owned, FREE_ORD_LIMIT);
}

export function mekAccess(answered: number, owned: boolean): OrdAccess {
  return practiceAccess(answered, owned, FREE_MEK_LIMIT);
}

/** Hur många uppgifter en batch får innehålla givet åtkomsten. 0 = låst. */
export function cappedBatchSize(requested: number, access: OrdAccess): number {
  if (access.freeRemaining === null) return requested;
  return Math.min(requested, access.freeRemaining);
}
