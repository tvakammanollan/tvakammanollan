/**
 * Nudgen om studieupplägget — räkningen bakom när den får komma upp.
 *
 * Ren logik med en tunn localStorage-koppling, av två skäl: nudgen ska gälla
 * besökare utan konto lika mycket som inloggade, och "hur många sidor har du
 * tittat på" hör inte hemma i vår databas.
 *
 * Trösklarna: var sjunde sidvisning ELLER varannan avslutad match, det som
 * inträffar först. Matchen väger tyngre än sidvisningen när båda löst ut —
 * den som just spelat klart har en tydligare anledning att se erbjudandet än
 * den som klickat runt.
 *
 * `MAX_PROMPTS` håller den till EN visning tills vidare. Allt under är redan
 * byggt återkommande — räknarna nollställs vid visning och vilotiden finns —
 * så påslaget är en siffra, inte en ombyggnad.
 */

export const PROMPT_STORAGE_KEY = "tkn-coaching-prompt";

/**
 * Nyckeln hette `hpk-coaching-prompt` fram till namnbytet till
 * Tvåkommanollan. Den flyttas över vid första läsningen — annars tappas
 * `stopped`, och den som redan köpt studieupplägget hade fått nudgen igen.
 */
const LEGACY_PROMPT_STORAGE_KEY = "hpk-coaching-prompt";

/** Höj när trösklarna eller innehållet ändras — gamla räknare nollställs då. */
export const PROMPT_VERSION = 1;

export const PAGEVIEWS_PER_PROMPT = 7;
export const MATCHES_PER_PROMPT = 2;

/** 1 = engångs. Sätt till t.ex. 3 eller Infinity för återkommande. */
export const MAX_PROMPTS = 1;

/** Vilotid mellan två visningar. Har ingen effekt förrän MAX_PROMPTS > 1. */
export const PROMPT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

/** Vad som tröskade fram visningen. Följer med in i mätningen. */
export type PromptTrigger = "pageviews" | "matches";

export interface PromptState {
  version: number;
  /** Sidvisningar sedan senaste visningen. */
  pageviews: number;
  /** Avslutade matcher sedan senaste visningen. */
  matches: number;
  /** Antal visningar totalt — det är den som MAX_PROMPTS bromsar. */
  shown: number;
  /** ISO-tid för senaste visningen. null = aldrig visad. */
  shownAt: string | null;
  /** Sant efter ett köp: då ska nudgen aldrig komma tillbaka. */
  stopped: boolean;
}

export const EMPTY_PROMPT_STATE: PromptState = {
  version: PROMPT_VERSION,
  pageviews: 0,
  matches: 0,
  shown: 0,
  shownAt: null,
  stopped: false,
};

function nonNegativeInt(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

/**
 * Tolkar lagrad räkning. Skräp, manipulation och en gammal version ger tomt
 * läge i stället för fel — det värsta som kan hända då är att nudgen visas en
 * gång för mycket, aldrig att den räknar sig fram till att aldrig visas.
 */
export function parsePromptState(raw: string | null): PromptState {
  if (!raw) return EMPTY_PROMPT_STATE;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return EMPTY_PROMPT_STATE;
    const { version, pageviews, matches, shown, shownAt, stopped } = parsed as Record<
      string,
      unknown
    >;
    if (version !== PROMPT_VERSION) return EMPTY_PROMPT_STATE;
    return {
      version: PROMPT_VERSION,
      pageviews: nonNegativeInt(pageviews),
      matches: nonNegativeInt(matches),
      shown: nonNegativeInt(shown),
      shownAt: typeof shownAt === "string" && shownAt ? shownAt : null,
      stopped: stopped === true,
    };
  } catch {
    return EMPTY_PROMPT_STATE;
  }
}

export function serializePromptState(state: PromptState): string {
  return JSON.stringify(state);
}

export function countPageview(state: PromptState): PromptState {
  return { ...state, pageviews: state.pageviews + 1 };
}

export function countMatch(state: PromptState): PromptState {
  return { ...state, matches: state.matches + 1 };
}

/** Vad som ska visas just nu, eller null för "inte än". */
export function promptTrigger(state: PromptState, now: Date = new Date()): PromptTrigger | null {
  if (state.stopped) return null;
  if (state.shown >= MAX_PROMPTS) return null;
  if (state.shownAt) {
    const sedan = now.getTime() - Date.parse(state.shownAt);
    // NaN (obrukbar tidsstämpel) faller igenom det här villkoret och räknas
    // alltså som "visad nyss". Hellre en utebliven nudge än en som spammar.
    if (!(sedan >= PROMPT_COOLDOWN_MS)) return null;
  }
  if (state.matches >= MATCHES_PER_PROMPT) return "matches";
  if (state.pageviews >= PAGEVIEWS_PER_PROMPT) return "pageviews";
  return null;
}

/**
 * Nollställer räknarna och bokför visningen. Räknarna måste nollas här och
 * inte vid stängning: stänger användaren fönstret mitt i skulle nudgen annars
 * ligga kvar tröskad och komma tillbaka vid nästa navigering.
 */
export function markPromptShown(state: PromptState, now: Date = new Date()): PromptState {
  return {
    ...state,
    pageviews: 0,
    matches: 0,
    shown: state.shown + 1,
    shownAt: now.toISOString(),
  };
}

/** Efter ett köp. Ett "inte nu" räknas medvetet INTE som ett nej för alltid. */
export function stopPrompts(state: PromptState): PromptState {
  return { ...state, stopped: true, pageviews: 0, matches: 0 };
}

/**
 * Sidor där nudgen aldrig får dyka upp.
 *
 * Två sorter: sådant som pågår (en match, ett provpass) och sådant som redan
 * är en tratt (inloggning, kassan). `/train` och `/ord` ligger med fast de
 * har en startvy först — själva passet byter aldrig URL, så det går inte att
 * skilja "har inte börjat" från "mitt i" härifrån.
 */
const BLOCKED_PREFIXES = [
  "/match",
  "/matchmaking",
  "/join",
  "/train",
  "/ord",
  "/login",
  "/signup",
  "/onboarding",
  "/coachning",
  "/admin",
];

/** `/gamla-prov` och `/gamla-prov/2024ht` är bläddring — tredje nivån är provet. */
const PROV_PASS = /^\/gamla-prov\/[^/]+\/[^/]+/;

export function isPromptablePath(path: string): boolean {
  if (BLOCKED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) return false;
  return !PROV_PASS.test(path);
}

/* ── localStorage-sidan ─────────────────────────────────────────────────
   Allt nedan är no-op under SSR och i en webbläsare som vägrar lagring
   (Safari i privat läge kastar på setItem). Nudgen är inte viktigare än
   att sidan renderas. */

export function readPromptState(): PromptState {
  if (typeof window === "undefined") return EMPTY_PROMPT_STATE;
  try {
    const raw = window.localStorage.getItem(PROMPT_STORAGE_KEY);
    if (raw !== null) return parsePromptState(raw);
    const legacy = window.localStorage.getItem(LEGACY_PROMPT_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_PROMPT_STORAGE_KEY);
    if (legacy === null) return EMPTY_PROMPT_STATE;
    const state = parsePromptState(legacy);
    window.localStorage.setItem(PROMPT_STORAGE_KEY, serializePromptState(state));
    return state;
  } catch {
    return EMPTY_PROMPT_STATE;
  }
}

function writePromptState(state: PromptState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROMPT_STORAGE_KEY, serializePromptState(state));
  } catch {
    /* full eller avstängd lagring — strunt samma */
  }
}

export function recordPageview(): void {
  writePromptState(countPageview(readPromptState()));
}

/** Anropas när ett matchresultat visats, inte när matchen startats. */
export function recordMatchFinished(): void {
  writePromptState(countMatch(readPromptState()));
}

export function recordPromptShown(): void {
  writePromptState(markPromptShown(readPromptState()));
}

/** Köpet är gjort — sluta fråga. */
export function stopCoachingPrompts(): void {
  writePromptState(stopPrompts(readPromptState()));
}
