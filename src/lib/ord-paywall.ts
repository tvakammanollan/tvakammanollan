/**
 * Övningspaywallen: de första 40 orden och de första 40 MEK-uppgifterna är
 * gratis, resten kostar ett köp som gäller en eller sex månader (`ORD_PLANS`;
 * köp gjorda före `TIME_LIMITED_FROM` gäller för alltid). Samma köp ("Hela Ordlistan + MEK")
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

/**
 * De två köpen. Varje plan är en egen produkt i Stripe med ett eget pris
 * (`STRIPE_ORD_PRICE_ID_1M` / `_6M` i `wrangler.jsonc`), och längden följer
 * med köpet i sessionens metadata och i `ord_purchases.access_months`.
 * Priserna i Stripe är satta inklusive moms, så beloppet på knappen är det
 * köparen betalar.
 */
export const ORD_PLANS = {
  "1m": { months: 1 },
  "6m": { months: 6 },
} as const;
export type OrdPlan = keyof typeof ORD_PLANS;
export const ORD_PLAN_IDS = Object.keys(ORD_PLANS) as OrdPlan[];

export function isOrdPlan(value: unknown): value is OrdPlan {
  return (ORD_PLAN_IDS as unknown[]).includes(value);
}

/**
 * Längden på köp som inte bär någon egen: allt som såldes innan planerna
 * fanns var sex månader, och en rad utan `access_months` ska läsas så.
 */
export const LEGACY_ACCESS_MONTHS = 6;

/** Läser en lagrad längd. Allt som inte är en känd plans längd blir sex månader. */
export function accessMonths(value: unknown): number {
  const n = typeof value === "string" ? Number(value) : value;
  return ORD_PLAN_IDS.some((p) => ORD_PLANS[p].months === n) ? (n as number) : LEGACY_ACCESS_MONTHS;
}

/** "en månad" / "6 månader", för löptext. */
export function planDuration(plan: OrdPlan): string {
  return plan === "1m" ? "en månad" : "6 månader";
}

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
export function accessExpiresAt(
  paidAt: string,
  months: number = LEGACY_ACCESS_MONTHS,
): Date | null {
  const paid = Date.parse(paidAt);
  if (!Number.isFinite(paid) || paid < TIME_LIMITED_FROM) return null;
  const end = new Date(paid);
  end.setUTCMonth(end.getUTCMonth() + accessMonths(months));
  return end;
}

export function purchaseIsActive(
  paidAt: string,
  now: number = Date.now(),
  months: number = LEGACY_ACCESS_MONTHS,
): boolean {
  const end = accessExpiresAt(paidAt, months);
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
