/**
 * Övningspaywallen: de första 40 orden och de första 40 MEK-uppgifterna är
 * gratis, resten kostar ett köp som gäller i 6 månader (köp gjorda före
 * `TIME_LIMITED_FROM` gäller för alltid). Samma köp ("Hela Ordlistan + MEK")
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

/** Så många månader ett köp gäller. Ändras den här ändras texten på alla ytor. */
export const ACCESS_MONTHS = 6;

/**
 * Köp gjorda före den här tidpunkten gäller för alltid. Kassan lovade "det är
 * ditt för alltid" fram till dess, och det löftet står kvar för dem som
 * betalade på det. Flytta den inte bakåt.
 */
export const TIME_LIMITED_FROM = Date.parse("2026-10-21T00:00:00Z");

/**
 * När ett köp slutar gälla, eller null om det gäller för alltid. Ett oläsbart
 * `paid_at` läses som för alltid: hellre en gratis förlängning än att en
 * betalande blir utelåst för att ett datum inte gick att tolka.
 */
export function accessExpiresAt(paidAt: string): Date | null {
  const paid = Date.parse(paidAt);
  if (!Number.isFinite(paid) || paid < TIME_LIMITED_FROM) return null;
  const end = new Date(paid);
  end.setUTCMonth(end.getUTCMonth() + ACCESS_MONTHS);
  return end;
}

export function purchaseIsActive(paidAt: string, now: number = Date.now()): boolean {
  const end = accessExpiresAt(paidAt);
  return end === null || now < end.getTime();
}

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
