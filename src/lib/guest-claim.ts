/**
 * Köp som gäst, och flytten av ett gästköp till ett riktigt konto
 * (2026-11-25).
 *
 * Kassan säljer till gäster: köpet knyts till gästens id, och efter
 * betalningen görs gästen om till ett riktigt konto med SAMMA id
 * (`upgradeGuest` i `guest-upgrade.ts`), så att köpet följer med utan att
 * något flyttas. Den här modulen gäller det andra fallet: gästen loggar in på
 * ett konto som redan finns, eller med Google, och får då ett ANNAT id. Utan
 * en flytt hade köpet legat kvar på ett gästkonto som ingen längre kan logga
 * in på.
 *
 * Flytten bevisas med gästens egen åtkomsttoken. Den sparas här precis
 * innan gästsessionen byts ut (inloggning, Google, en ny registrering) och
 * skickas till `claimGuestPurchase` när det nya kontot är inloggat. Tokenen
 * ligger redan i localStorage under supabase-js egen nyckel, så kopian
 * exponerar ingenting nytt, och den raderas när flytten är gjord.
 *
 * Allt här är rent och testat; servern och webbläsaren använder samma regler.
 */
import { purchaseAccess, type OrdPurchaseRow } from "./ord-paywall";

export const GUEST_CLAIM_KEY = "tkn:gast-overtag";

/**
 * En överlämning är sekunder: tiden mellan att gästen trycker "Logga in" och
 * att det nya kontot är inloggat, eller en tur till Google och tillbaka.
 * Åtkomsttokenen gäller själv en timme, så längre än så kan den ändå inte
 * bevisa något.
 */
export const GUEST_CLAIM_MAX_AGE_MS = 60 * 60 * 1000;

/** En JWT är några hundra tecken; något mycket längre är inte en token. */
const MAX_TOKEN_LENGTH = 4096;

export function parseGuestClaim(raw: string | null, now: number): string | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as { token?: unknown; at?: unknown };
    if (typeof v.token !== "string" || v.token.length < 20 || v.token.length > MAX_TOKEN_LENGTH) {
      return null;
    }
    if (typeof v.at !== "number" || !Number.isFinite(v.at)) return null;
    if (now - v.at > GUEST_CLAIM_MAX_AGE_MS || v.at > now + 60_000) return null;
    return v.token;
  } catch {
    return null;
  }
}

export function storeGuestClaim(token: string, now: number = Date.now()): void {
  try {
    localStorage.setItem(GUEST_CLAIM_KEY, JSON.stringify({ token, at: now }));
  } catch {
    /* utan lagring går köpet att flytta för hand, se CLAUDE.md */
  }
}

export function readGuestClaim(): string | null {
  try {
    return parseGuestClaim(localStorage.getItem(GUEST_CLAIM_KEY), Date.now());
  } catch {
    return null;
  }
}

export function clearGuestClaim(): void {
  try {
    localStorage.removeItem(GUEST_CLAIM_KEY);
  } catch {
    /* ignoreras */
  }
}

/** Prenumerationer som Stripe har slutat dra pengar för. */
const ENDED_SUBSCRIPTION = new Set(["canceled", "incomplete_expired"]);

/**
 * Är gästens köp värt att flytta? Ett köp som gäller, men också en
 * prenumeration som fortfarande lever i Stripe fast tillgången pausats (en
 * misslyckad dragning): ligger den kvar på gästkontot fortsätter Stripe
 * försöka dra pengar för något som ingen kan säga upp.
 */
function worthMoving(row: OrdPurchaseRow, now: number): boolean {
  if (purchaseAccess(row, now).active) return true;
  return !!row.stripe_subscription_id && !ENDED_SUBSCRIPTION.has(row.subscription_status ?? "");
}

export type GuestClaimDecision =
  /** Samma konto: gästen gjordes om till ett riktigt konto, inget att flytta. */
  | "same"
  /** Gästen har inget köp som är värt att flytta. */
  | "nothing"
  /**
   * Kontot har redan ett köp som gäller. Gästköpet skrivs INTE över det, och
   * det skriver inte över gästköpet: två betalda köp är en dubbeldragning som
   * ska redas ut för hand, inte tyst slås ihop till ett.
   */
  | "conflict"
  | "move";

export function decideGuestClaim(input: {
  guestId: string;
  userId: string;
  guestRow: OrdPurchaseRow | null;
  userRow: OrdPurchaseRow | null;
  now?: number;
}): GuestClaimDecision {
  const now = input.now ?? Date.now();
  if (input.guestId === input.userId) return "same";
  if (!input.guestRow || !worthMoving(input.guestRow, now)) return "nothing";
  if (input.userRow && purchaseAccess(input.userRow, now).active) return "conflict";
  return "move";
}

/**
 * Skickas när ett köp kommit till eller flyttats mellan konton, så att det
 * som visar Premium (`usePremium`, `useGuestPremium`) läser om i stället för
 * att stå kvar med svaret från innan.
 */
export const PREMIUM_CHANGED_EVENT = "tkn:premium-changed";

export function announcePremiumChanged(): void {
  try {
    window.dispatchEvent(new Event(PREMIUM_CHANGED_EVENT));
  } catch {
    /* utan window finns inget att uppdatera */
  }
}
