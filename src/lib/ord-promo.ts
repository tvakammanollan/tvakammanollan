/**
 * Påminnelserna om Hela Ordlistan: en ruta som kommer tillbaka med jämna
 * mellanrum till den som inte köpt.
 *
 * Frekvensen är med flit högre än coachningsnudgens (en gång per webbläsare):
 * det här är sajtens huvudprodukt och rutan är en genväg till /ord, inte ett
 * köp. Två spärrar hindrar den från att bli en annons:
 *
 *  - en vilotid mellan visningarna (`COOLDOWN_MS`), som växer när någon
 *    avfärdat rutan `BACKOFF_AFTER` gånger utan att klicka
 *  - ett antal sidvisningar mellan visningarna, så att två rutor aldrig kommer
 *    på raken i samma klickrunda
 *
 * Ren logik med tunn localStorage-koppling, av samma skäl som
 * `coaching-prompt.ts`: gäller besökare utan konto, och trasig lagring läses
 * som ett rent blad (värsta utfallet är en ruta för mycket, aldrig en som
 * tystnar för alltid).
 */

export const ORD_PROMO_STORAGE_KEY = "tkn-ord-promo";
export const ORD_PROMO_VERSION = 1;

/** Sidvisningar innan första visningen, och mellan varje visning därefter. */
export const PAGEVIEWS_BEFORE_FIRST = 3;
export const PAGEVIEWS_BETWEEN = 4;

/** Vila mellan visningar. */
export const COOLDOWN_MS = 2 * 60 * 60 * 1000;
/** Efter så här många visningar utan klick blir vilan lång. */
export const BACKOFF_AFTER = 4;
export const BACKOFF_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export interface OrdPromoState {
  version: number;
  /** Sidvisningar sedan senaste visningen (eller sedan start). */
  pageviews: number;
  shownCount: number;
  lastShownAt: string | null;
  /** Klickat eller köpt: då är det ingen anledning att fortsätta på samma sätt. */
  clicked: boolean;
  /** Köpt. Slutgiltigt. */
  stopped: boolean;
}

export const EMPTY_ORD_PROMO_STATE: OrdPromoState = {
  version: ORD_PROMO_VERSION,
  pageviews: 0,
  shownCount: 0,
  lastShownAt: null,
  clicked: false,
  stopped: false,
};

function nonNegativeInt(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;
}

export function parseOrdPromoState(raw: string | null): OrdPromoState {
  if (!raw) return EMPTY_ORD_PROMO_STATE;
  try {
    const p: unknown = JSON.parse(raw);
    if (!p || typeof p !== "object") return EMPTY_ORD_PROMO_STATE;
    const o = p as Record<string, unknown>;
    if (o.version !== ORD_PROMO_VERSION) return EMPTY_ORD_PROMO_STATE;
    return {
      version: ORD_PROMO_VERSION,
      pageviews: nonNegativeInt(o.pageviews),
      shownCount: nonNegativeInt(o.shownCount),
      lastShownAt: typeof o.lastShownAt === "string" && o.lastShownAt ? o.lastShownAt : null,
      clicked: o.clicked === true,
      stopped: o.stopped === true,
    };
  } catch {
    return EMPTY_ORD_PROMO_STATE;
  }
}

export function cooldownFor(state: OrdPromoState): number {
  return state.shownCount >= BACKOFF_AFTER && !state.clicked ? BACKOFF_COOLDOWN_MS : COOLDOWN_MS;
}

/** Ska rutan upp nu? Ett oläsbart eller framtida `lastShownAt` räknas som "nyss". */
export function ordPromoDue(state: OrdPromoState, now: Date = new Date()): boolean {
  if (state.stopped) return false;
  const needed = state.shownCount === 0 ? PAGEVIEWS_BEFORE_FIRST : PAGEVIEWS_BETWEEN;
  if (state.pageviews < needed) return false;
  if (state.lastShownAt === null) return true;
  const last = Date.parse(state.lastShownAt);
  if (!Number.isFinite(last)) return false;
  const elapsed = now.getTime() - last;
  return elapsed >= cooldownFor(state);
}

/** Rutan hör hemma på sidor där ord inte redan är i fokus. */
export function isOrdPromoPath(path: string): boolean {
  return path !== "/ord" && !path.startsWith("/ord/");
}

export function recordPromoPageview(state: OrdPromoState): OrdPromoState {
  return { ...state, pageviews: state.pageviews + 1 };
}

export function recordPromoShown(state: OrdPromoState, now: Date = new Date()): OrdPromoState {
  return {
    ...state,
    pageviews: 0,
    shownCount: state.shownCount + 1,
    lastShownAt: now.toISOString(),
  };
}

/* ── localStorage-sidan ─────────────────────────────────────────────── */

export function readOrdPromoState(): OrdPromoState {
  if (typeof window === "undefined") return EMPTY_ORD_PROMO_STATE;
  try {
    return parseOrdPromoState(window.localStorage.getItem(ORD_PROMO_STORAGE_KEY));
  } catch {
    return EMPTY_ORD_PROMO_STATE;
  }
}

function write(state: OrdPromoState): OrdPromoState {
  if (typeof window === "undefined") return state;
  try {
    window.localStorage.setItem(ORD_PROMO_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* full eller avstängd lagring, strunt samma */
  }
  return state;
}

export const countOrdPromoPageview = () => write(recordPromoPageview(readOrdPromoState()));
export const markOrdPromoShown = () => write(recordPromoShown(readOrdPromoState()));
export const markOrdPromoClicked = () => write({ ...readOrdPromoState(), clicked: true });
export const stopOrdPromo = () => write({ ...readOrdPromoState(), stopped: true });
