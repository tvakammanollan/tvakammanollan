/**
 * Rutan om preliminärt facit: en gång per prov och webbläsare, under veckorna
 * efter provdagen.
 *
 * Den minns VILKET facit den visat (`shownTerm`), inte bara att den visat
 * något, så nästa prov får en egen visning utan att någon nyckel behöver
 * bytas. Tidsfönstret (`promoUntil` i `preliminart-facit.ts`) gör att den
 * tystnar av sig själv när UHR:s officiella besked finns.
 *
 * Samma mönster som `ord-promo.ts`: ren logik plus tunn localStorage-koppling,
 * och trasig lagring läses som ett rent blad.
 */

export const FACIT_PROMO_STORAGE_KEY = "tkn-facit-promo";
export const FACIT_PROMO_VERSION = 1;
export const FACIT_PATH = "/hogskoleprovet-facit";

export interface FacitPromoState {
  version: number;
  shownTerm: string | null;
}

export const EMPTY_FACIT_PROMO_STATE: FacitPromoState = {
  version: FACIT_PROMO_VERSION,
  shownTerm: null,
};

export function parseFacitPromoState(raw: string | null): FacitPromoState {
  if (!raw) return EMPTY_FACIT_PROMO_STATE;
  try {
    const p: unknown = JSON.parse(raw);
    if (!p || typeof p !== "object") return EMPTY_FACIT_PROMO_STATE;
    const o = p as Record<string, unknown>;
    if (o.version !== FACIT_PROMO_VERSION) return EMPTY_FACIT_PROMO_STATE;
    return {
      version: FACIT_PROMO_VERSION,
      shownTerm: typeof o.shownTerm === "string" && o.shownTerm ? o.shownTerm : null,
    };
  } catch {
    return EMPTY_FACIT_PROMO_STATE;
  }
}

/**
 * Ska rutan upp? Bara före `until` (sista dagen inräknad, svensk tid räcker
 * på dygnsnivå) och bara om just det här facit inte redan visats.
 */
export function facitPromoDue(
  state: FacitPromoState,
  term: string,
  until: string,
  path: string,
  now: Date = new Date(),
): boolean {
  if (path === FACIT_PATH) return false;
  if (state.shownTerm === term) return false;
  const slut = Date.parse(`${until}T23:59:59+01:00`);
  if (!Number.isFinite(slut)) return false;
  return now.getTime() <= slut;
}

/* ── localStorage-sidan ─────────────────────────────────────────────── */

export function readFacitPromoState(): FacitPromoState {
  if (typeof window === "undefined") return EMPTY_FACIT_PROMO_STATE;
  try {
    return parseFacitPromoState(window.localStorage.getItem(FACIT_PROMO_STORAGE_KEY));
  } catch {
    return EMPTY_FACIT_PROMO_STATE;
  }
}

export function markFacitPromoShown(term: string): void {
  if (typeof window === "undefined") return;
  try {
    const state: FacitPromoState = { version: FACIT_PROMO_VERSION, shownTerm: term };
    window.localStorage.setItem(FACIT_PROMO_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* full eller avstängd lagring, strunt samma */
  }
}
