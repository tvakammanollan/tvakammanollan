/**
 * Stripe över REST — ingen SDK.
 *
 * Cloudflare Workers kör inte Node, och `stripe`-paketet måste konfigureras om
 * (egen fetch-klient + SubtleCrypto-provider) för att alls fungera här. Vi
 * behöver tre anrop och en HMAC, så det görs direkt mot API:et i stället. Då
 * slipper vi dessutom en dependency — och därmed lockfile-dansen som CI:n
 * (bun) är känslig för.
 *
 * API-versionen pinnas medvetet INTE. En felstavad version ger fel på varje
 * anrop, och fälten vi läser (`session.url`, `payment_status`,
 * `customer_details`, `price.unit_amount`) har sett likadana ut i åratal.
 * Kontots standardversion gäller.
 *
 * Nycklarna: `STRIPE_SECRET_KEY` och `STRIPE_WEBHOOK_SECRET` är hemligheter och
 * ska ligga som krypterade Cloudflare-Secrets (lokalt i `.env.local`), aldrig i
 * `wrangler.jsonc` eller `.env` — båda är committade.
 */

const STRIPE_API = "https://api.stripe.com/v1";

/** Publikt felmeddelande. Detaljerna loggas server-side och stannar där. */
const GENERIC_ERROR = "Betalningen kunde inte startas just nu — försök igen om en stund.";

export type StripeParam =
  | string
  | number
  | boolean
  | null
  | undefined
  | StripeParam[]
  | { [key: string]: StripeParam };

/**
 * Stripes formulärkodning: nästlade värden blir `a[b][0][c]=v`.
 * `null`/`undefined` utelämnas helt — Stripe tolkar en tom sträng som
 * "sätt fältet till tomt", vilket inte är samma sak som "skicka inte fältet".
 */
export function encodeStripeForm(params: Record<string, StripeParam>): string {
  const parts: string[] = [];
  const walk = (key: string, value: StripeParam): void => {
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach((v, i) => walk(`${key}[${i}]`, v));
      return;
    }
    if (typeof value === "object") {
      for (const [k, v] of Object.entries(value)) walk(`${key}[${k}]`, v);
      return;
    }
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  };
  for (const [k, v] of Object.entries(params)) walk(k, v);
  return parts.join("&");
}

export function stripeSecretKey(): string | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  return key ? key : null;
}

/** Är betalning påslagen i den här miljön? */
export function stripeConfigured(): boolean {
  return stripeSecretKey() !== null;
}

async function stripeRequest<T>(
  method: "GET" | "POST",
  path: string,
  params?: Record<string, StripeParam>,
): Promise<T> {
  const key = stripeSecretKey();
  if (!key) {
    console.error("[stripe] STRIPE_SECRET_KEY saknas — betalningar är avstängda");
    throw new Error(GENERIC_ERROR);
  }

  const encoded = params ? encodeStripeForm(params) : "";
  const url =
    method === "GET" && encoded ? `${STRIPE_API}${path}?${encoded}` : `${STRIPE_API}${path}`;
  const headers: Record<string, string> = { Authorization: `Bearer ${key}` };
  if (method === "POST") headers["Content-Type"] = "application/x-www-form-urlencoded";

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: method === "POST" ? encoded : undefined,
      signal: AbortSignal.timeout(15_000),
    });
  } catch (e) {
    console.error(`[stripe] ${method} ${path} nådde aldrig fram:`, e);
    throw new Error(GENERIC_ERROR);
  }

  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = undefined;
  }

  if (!res.ok) {
    const detail =
      (json as { error?: { message?: string; code?: string } } | undefined)?.error?.message ??
      text.slice(0, 300);
    console.error(`[stripe] ${method} ${path} → ${res.status}: ${detail}`);
    throw new Error(GENERIC_ERROR);
  }
  return json as T;
}

/* ===================== Typer (bara fälten vi läser) ===================== */

export interface StripePrice {
  id: string;
  active: boolean;
  currency: string;
  unit_amount: number | null;
  type: "one_time" | "recurring";
  recurring: { interval: "day" | "week" | "month" | "year"; interval_count: number } | null;
  product: string | StripeProduct;
}

export interface StripeProduct {
  id: string;
  name: string;
  active: boolean;
  description: string | null;
  default_price: string | StripePrice | null;
}

export interface StripeCustomField {
  key: string;
  text?: { value: string | null } | null;
  numeric?: { value: string | null } | null;
  dropdown?: { value: string | null } | null;
}

export interface StripeCheckoutSession {
  id: string;
  url: string | null;
  status: "open" | "complete" | "expired";
  payment_status: "paid" | "unpaid" | "no_payment_required";
  amount_total: number | null;
  currency: string | null;
  client_reference_id: string | null;
  payment_intent: string | null;
  metadata: Record<string, string> | null;
  custom_fields?: StripeCustomField[] | null;
  customer_details: {
    email: string | null;
    name: string | null;
    phone: string | null;
  } | null;
}

/* ===================== Pris ===================== */

export interface CoachingPrice {
  priceId: string;
  productName: string;
  /** Belopp i minsta enhet (ören). */
  amount: number;
  currency: string;
  /** null = engångsköp. */
  interval: "day" | "week" | "month" | "year" | null;
  intervalCount: number;
  recurring: boolean;
}

/**
 * Priset ändras i dashboarden, inte i koden — men ett API-anrop per sidvisning
 * vore slöseri. Cachen lever per isolat och är kortlivad, så en prisändring
 * slår igenom inom några minuter utan deploy.
 */
const PRICE_TTL_MS = 10 * 60 * 1000;
let priceCache: { at: number; value: CoachingPrice } | null = null;

/** Default-namnet matchar produkten i Stripe. Kan bytas via env. */
const DEFAULT_PRODUCT_NAME = "Studieupplägg";

function toCoachingPrice(price: StripePrice, fallbackName: string): CoachingPrice {
  if (price.unit_amount === null) {
    // Ett pris utan belopp (t.ex. "customer chooses") går inte att visa.
    console.error(`[stripe] priset ${price.id} saknar unit_amount`);
    throw new Error(GENERIC_ERROR);
  }
  const product = typeof price.product === "object" ? price.product : null;
  return {
    priceId: price.id,
    productName: product?.name ?? fallbackName,
    amount: price.unit_amount,
    currency: price.currency,
    interval: price.recurring?.interval ?? null,
    intervalCount: price.recurring?.interval_count ?? 1,
    recurring: price.recurring !== null && price.recurring !== undefined,
  };
}

/**
 * Hittar priset på coachningsprodukten.
 *
 * I första hand `STRIPE_COACHING_PRICE_ID` (exakt, tål namnbyten). Saknas den
 * letas produkten upp på namn och dess `default_price` används — det gör att
 * integrationen fungerar så fort den hemliga nyckeln finns, utan ett extra
 * konfigurationssteg.
 */
export async function resolveCoachingPrice(): Promise<CoachingPrice> {
  const now = Date.now();
  if (priceCache && now - priceCache.at < PRICE_TTL_MS) return priceCache.value;

  const wanted = (process.env.STRIPE_COACHING_PRODUCT_NAME || DEFAULT_PRODUCT_NAME).trim();
  const priceId = process.env.STRIPE_COACHING_PRICE_ID?.trim();

  let resolved: CoachingPrice;
  if (priceId) {
    const price = await stripeRequest<StripePrice>("GET", `/prices/${priceId}`, {
      expand: ["product"],
    });
    resolved = toCoachingPrice(price, wanted);
  } else {
    const list = await stripeRequest<{ data: StripeProduct[] }>("GET", "/products", {
      active: true,
      limit: 100,
      expand: ["data.default_price"],
    });
    const norm = (s: string) => s.trim().toLowerCase();
    const product = list.data.find((p) => norm(p.name) === norm(wanted));
    if (!product) {
      console.error(
        `[stripe] hittade ingen aktiv produkt som heter "${wanted}". Sätt STRIPE_COACHING_PRICE_ID.`,
      );
      throw new Error(GENERIC_ERROR);
    }
    const dp = product.default_price;
    if (!dp || typeof dp === "string") {
      console.error(`[stripe] produkten "${wanted}" saknar utökat default_price`);
      throw new Error(GENERIC_ERROR);
    }
    resolved = toCoachingPrice(dp, product.name);
  }

  priceCache = { at: now, value: resolved };
  return resolved;
}

/** Bara för tester — tvingar nästa anrop att gå till Stripe igen. */
export function clearCoachingPriceCache(): void {
  priceCache = null;
}

/* ===================== Checkout ===================== */

export async function createCheckoutSession(
  params: Record<string, StripeParam>,
): Promise<StripeCheckoutSession> {
  return stripeRequest<StripeCheckoutSession>("POST", "/checkout/sessions", params);
}

export async function retrieveCheckoutSession(id: string): Promise<StripeCheckoutSession> {
  return stripeRequest<StripeCheckoutSession>("GET", `/checkout/sessions/${id}`);
}

/* ===================== Webhook-signatur ===================== */

export interface StripeEvent {
  id: string;
  type: string;
  created: number;
  data: { object: unknown };
}

function hexToBytes(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0 || !/^[0-9a-f]*$/i.test(hex)) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

/** Jämförelse utan tidsläckage — längden får skilja, innehållet får inte tajma. */
function timingSafeEqualHex(a: string, b: string): boolean {
  const x = hexToBytes(a);
  const y = hexToBytes(b);
  if (!x || !y || x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verifierar `Stripe-Signature` enligt Stripes schema:
 * `HMAC-SHA256(secret, "<t>.<rå body>")`, jämfört mot varje `v1=`.
 *
 * Utan tidsstämpelkontrollen räcker det att spela upp en gammal, giltigt
 * signerad händelse igen för att markera ett köp som betalt. Toleransen är
 * densamma som Stripes egen (5 min).
 */
export async function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
  toleranceSeconds = 300,
  nowMs: number = Date.now(),
): Promise<boolean> {
  if (!signatureHeader || !secret) return false;

  let timestamp: string | null = null;
  const candidates: string[] = [];
  for (const part of signatureHeader.split(",")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k === "t") timestamp = v;
    else if (k === "v1") candidates.push(v);
  }
  if (!timestamp || candidates.length === 0) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  if (Math.abs(nowMs / 1000 - ts) > toleranceSeconds) return false;

  const expected = await hmacSha256Hex(secret, `${timestamp}.${rawBody}`);
  return candidates.some((c) => timingSafeEqualHex(expected, c));
}

/** Läser `custom_fields`-värdet för en nyckel, oavsett fälttyp. */
export function customFieldValue(session: StripeCheckoutSession, key: string): string | null {
  const field = session.custom_fields?.find((f) => f.key === key);
  if (!field) return null;
  const value = field.text?.value ?? field.dropdown?.value ?? field.numeric?.value ?? null;
  return value && value.trim() ? value.trim() : null;
}
