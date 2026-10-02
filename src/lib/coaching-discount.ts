/**
 * Lojalitetsrabatten — 20 % på studieupplägget, till den som kommer tillbaka.
 *
 * Kommer upp EN gång, vid den tredje sessionen på sajten. Skälet att den
 * räknas i sessioner och inte i sidvisningar som nudgen bredvid: en sidvisning
 * säger att någon klickar runt, en återkomst säger att någon valt att komma
 * tillbaka. Rabatten är en belöning för det andra, och tre besök är den
 * billigaste signalen vi har på att någon menar allvar.
 *
 * Ren logik med en tunn localStorage-koppling, av samma två skäl som
 * `coaching-prompt.ts`: rabatten ska gälla besökare utan konto lika mycket som
 * inloggade, och "hur många gånger har du varit här" hör inte hemma i vår
 * databas.
 *
 * Koden är INTE en hemlighet. Den ligger som en aktiv promotion code i Stripe
 * utan utgång och utan tak på antal inlösen, och `allow_promotion_codes` är
 * påslaget i kassan för alla. Räkningen här styr alltså vem som får se
 * erbjudandet, inte vem som kan lösa in det. Ska rabatten någon gång
 * begränsas på riktigt görs det i Stripe (utgångsdatum eller max_redemptions),
 * inte här.
 */

export const DISCOUNT_STORAGE_KEY = "tkn-coaching-rabatt";

/** Höj när tröskeln eller erbjudandet ändras — gammal räkning nollställs då. */
export const DISCOUNT_VERSION = 1;

/**
 * Rabattkoden, exakt som den heter i Stripe (`promo_1U5hjP…` → kupong
 * `7325Xhy6`, 20 % forever). Versalerna är inte kosmetik: Stripe matchar
 * koden skiftlägeskänsligt, så en gemen variant avvisas i kassan.
 */
export const DISCOUNT_CODE = "TVAKOMMANOLLAN";

/** Måste stämma med kupongens `percent_off` i Stripe. Bara till visningen. */
export const DISCOUNT_PERCENT = 20;

/** Vilken session rabatten visas på. Tre = andra återkomsten. */
export const SESSIONS_BEFORE_DISCOUNT = 3;

/**
 * Hur länge en session lever utan aktivitet.
 *
 * Trettio minuter är samma fönster som PostHog och Google Analytics använder,
 * vilket är hela poängen: siffran i den här räkningen ska betyda samma sak som
 * "session" gör i mätningen, annars går de två inte att jämföra när någon
 * frågar varför rabatten visats färre gånger än väntat.
 */
export const SESSION_GAP_MS = 30 * 60 * 1000;

export interface DiscountState {
  version: number;
  /** Antal sessioner på sajten, inklusive den pågående. */
  sessions: number;
  /** ISO-tid för senaste aktiviteten. Driver sessionsgränsen. */
  lastSeen: string | null;
  /** Sant när rutan visats. Koden är då upplåst och syns i kassan. */
  shown: boolean;
  /** Sant efter ett köp: rabatten har gjort sitt. */
  stopped: boolean;
}

export const EMPTY_DISCOUNT_STATE: DiscountState = {
  version: DISCOUNT_VERSION,
  sessions: 0,
  lastSeen: null,
  shown: false,
  stopped: false,
};

function nonNegativeInt(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

/**
 * Tolkar lagrad räkning. Skräp, manipulation och en gammal version ger tomt
 * läge i stället för fel — värsta utfallet är då att räkningen börjar om,
 * alltså att rabatten dröjer, aldrig att sidan går sönder.
 */
export function parseDiscountState(raw: string | null): DiscountState {
  if (!raw) return EMPTY_DISCOUNT_STATE;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return EMPTY_DISCOUNT_STATE;
    const { version, sessions, lastSeen, shown, stopped } = parsed as Record<string, unknown>;
    if (version !== DISCOUNT_VERSION) return EMPTY_DISCOUNT_STATE;
    return {
      version: DISCOUNT_VERSION,
      sessions: nonNegativeInt(sessions),
      lastSeen: typeof lastSeen === "string" && lastSeen ? lastSeen : null,
      shown: shown === true,
      stopped: stopped === true,
    };
  } catch {
    return EMPTY_DISCOUNT_STATE;
  }
}

export function serializeDiscountState(state: DiscountState): string {
  return JSON.stringify(state);
}

/**
 * Bokför aktivitet och räknar upp sessionen när fönstret runnit ut.
 *
 * Anropas vid VARJE sidvisning, inte bara vid sidladdning. Utan det skulle en
 * besökare som läser en guide i fyrtio minuter och sedan klickar vidare bokföras
 * som två sessioner, och tre sessioner vore då något man kan nå på ett enda
 * besök — vilket är precis inte vad rabatten ska belöna.
 *
 * Ett oläsbart eller saknat `lastSeen` räknas som en ny session. Motsatsen hade
 * gjort att en trasig post tystar rabatten för alltid, och en tyst funktion är
 * svårare att upptäcka än en frikostig. En tidsstämpel i framtiden (klockan har
 * gått bakåt) räknas däremot som PÅGÅENDE session, så att en skev klocka inte
 * räknar upp sig fram till rabatten.
 */
export function touchSession(state: DiscountState, now: Date = new Date()): DiscountState {
  const senast = state.lastSeen ? Date.parse(state.lastSeen) : NaN;
  const nySession = !Number.isFinite(senast) || now.getTime() - senast > SESSION_GAP_MS;
  return {
    ...state,
    sessions: nySession ? state.sessions + 1 : state.sessions,
    lastSeen: now.toISOString(),
  };
}

/** Ska rabatten upp just nu? */
export function discountDue(state: DiscountState): boolean {
  if (state.stopped || state.shown) return false;
  return state.sessions >= SESSIONS_BEFORE_DISCOUNT;
}

/**
 * Koden är besökarens att använda.
 *
 * Skild från `discountDue` med flit: rutan visas en gång, men koden ska sedan
 * gå att hitta igen. Den som stänger rutan och köper en vecka senare ska inte
 * behöva minnas en sträng, och kassan visar den därför så länge det här är
 * sant. Efter köpet är den inte längre relevant.
 */
export function discountUnlocked(state: DiscountState): boolean {
  return state.shown && !state.stopped;
}

/** Bokförs vid visning, inte vid stängning — samma regel som nudgen. */
export function markDiscountShown(state: DiscountState): DiscountState {
  return { ...state, shown: true };
}

/** Efter ett köp. Ett "inte nu" räknas medvetet INTE som ett nej för alltid. */
export function stopDiscount(state: DiscountState): DiscountState {
  return { ...state, stopped: true };
}

/**
 * Priset med rabatten pådragen, i minorenheter.
 *
 * Räknas ur beloppet Stripe svarade med, aldrig ur en siffra i koden — samma
 * regel som gäller ordinarie pris (se `resolveCoachingPrice`). `Math.round`
 * speglar hur Stripe självt räknar procentavdrag, så talet här och talet i
 * kassan är samma tal.
 */
export function discountedAmount(amount: number | null): number | null {
  if (amount === null || !Number.isFinite(amount)) return null;
  return amount - Math.round((amount * DISCOUNT_PERCENT) / 100);
}

/* ── localStorage-sidan ─────────────────────────────────────────────────
   Allt nedan är no-op under SSR och i en webbläsare som vägrar lagring
   (Safari i privat läge kastar på setItem). Rabatten är inte viktigare än
   att sidan renderas. */

export function readDiscountState(): DiscountState {
  if (typeof window === "undefined") return EMPTY_DISCOUNT_STATE;
  try {
    return parseDiscountState(window.localStorage.getItem(DISCOUNT_STORAGE_KEY));
  } catch {
    return EMPTY_DISCOUNT_STATE;
  }
}

function writeDiscountState(state: DiscountState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DISCOUNT_STORAGE_KEY, serializeDiscountState(state));
  } catch {
    /* full eller avstängd lagring — strunt samma */
  }
}

/** Anropas vid varje sidvisning. Returnerar läget efter bokföringen. */
export function recordSessionActivity(): DiscountState {
  const state = touchSession(readDiscountState());
  writeDiscountState(state);
  return state;
}

export function recordDiscountShown(): void {
  writeDiscountState(markDiscountShown(readDiscountState()));
}

/** Köpet är gjort — rabatten har gjort sitt. */
export function stopCoachingDiscount(): void {
  writeDiscountState(stopDiscount(readDiscountState()));
}
