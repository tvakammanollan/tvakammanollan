import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  EMPTY_PROMPT_STATE,
  MATCHES_PER_PROMPT,
  MAX_PROMPTS,
  PAGEVIEWS_PER_PROMPT,
  PROMPT_COOLDOWN_MS,
  PROMPT_VERSION,
  countMatch,
  countPageview,
  isPromptablePath,
  markPromptShown,
  parsePromptState,
  promptTrigger,
  readPromptState,
  serializePromptState,
  stopPrompts,
  type PromptState,
} from "./coaching-prompt";

const NU = new Date("2026-08-18T12:00:00.000Z");

/** Räknar upp `n` steg av samma sort från tomt läge. */
function efter(n: number, steg: (s: PromptState) => PromptState): PromptState {
  let state = EMPTY_PROMPT_STATE;
  for (let i = 0; i < n; i++) state = steg(state);
  return state;
}

describe("promptTrigger", () => {
  it("håller tyst under tröskeln", () => {
    expect(promptTrigger(efter(PAGEVIEWS_PER_PROMPT - 1, countPageview), NU)).toBeNull();
    expect(promptTrigger(efter(MATCHES_PER_PROMPT - 1, countMatch), NU)).toBeNull();
  });

  it("löser ut på sjunde sidvisningen", () => {
    expect(promptTrigger(efter(PAGEVIEWS_PER_PROMPT, countPageview), NU)).toBe("pageviews");
  });

  it("löser ut på varannan match", () => {
    expect(promptTrigger(efter(MATCHES_PER_PROMPT, countMatch), NU)).toBe("matches");
  });

  it("låter matchen väga tyngst när båda löst ut", () => {
    let state = efter(PAGEVIEWS_PER_PROMPT, countPageview);
    for (let i = 0; i < MATCHES_PER_PROMPT; i++) state = countMatch(state);
    expect(promptTrigger(state, NU)).toBe("matches");
  });

  it("tystnar efter ett köp, hur mycket som än räknas", () => {
    const köpt = stopPrompts(efter(PAGEVIEWS_PER_PROMPT * 3, countPageview));
    expect(promptTrigger(countPageview(köpt), NU)).toBeNull();
  });
});

describe("markPromptShown", () => {
  it("nollar räknarna så att nudgen inte kommer tillbaka direkt", () => {
    const visad = markPromptShown(efter(PAGEVIEWS_PER_PROMPT, countPageview), NU);
    expect(visad.pageviews).toBe(0);
    expect(visad.matches).toBe(0);
    expect(visad.shown).toBe(1);
    expect(visad.shownAt).toBe(NU.toISOString());
  });

  it("visar bara MAX_PROMPTS gånger — engångs i nuläget", () => {
    let state = EMPTY_PROMPT_STATE;
    for (let i = 0; i < MAX_PROMPTS; i++) {
      state = markPromptShown(
        state,
        new Date(NU.getTime() - PROMPT_COOLDOWN_MS * (MAX_PROMPTS - i)),
      );
    }
    for (let i = 0; i < PAGEVIEWS_PER_PROMPT; i++) state = countPageview(state);
    // Långt efter vilotiden, och långt över tröskeln — ändå tyst.
    expect(promptTrigger(state, new Date(NU.getTime() + PROMPT_COOLDOWN_MS * 10))).toBeNull();
  });

  it("respekterar vilotiden mellan visningar", () => {
    // Gäller först när MAX_PROMPTS höjts; testet pinnar regeln redan nu.
    const visad = { ...markPromptShown(EMPTY_PROMPT_STATE, NU), shown: 0 };
    const tröskad = { ...visad, pageviews: PAGEVIEWS_PER_PROMPT };
    expect(promptTrigger(tröskad, new Date(NU.getTime() + PROMPT_COOLDOWN_MS - 1000))).toBeNull();
    expect(promptTrigger(tröskad, new Date(NU.getTime() + PROMPT_COOLDOWN_MS + 1000))).toBe(
      "pageviews",
    );
  });

  it("behandlar en obrukbar tidsstämpel som 'visad nyss'", () => {
    const trasig: PromptState = {
      ...EMPTY_PROMPT_STATE,
      shownAt: "inte ett datum",
      pageviews: PAGEVIEWS_PER_PROMPT,
    };
    expect(promptTrigger(trasig, NU)).toBeNull();
  });
});

describe("parsePromptState", () => {
  it("läser tillbaka det som skrevs", () => {
    const state = markPromptShown(efter(3, countPageview), NU);
    expect(parsePromptState(serializePromptState(state))).toEqual(state);
  });

  it("behandlar tom och trasig lagring som ett rent blad", () => {
    expect(parsePromptState(null)).toEqual(EMPTY_PROMPT_STATE);
    expect(parsePromptState("inte json")).toEqual(EMPTY_PROMPT_STATE);
    expect(parsePromptState('"nej"')).toEqual(EMPTY_PROMPT_STATE);
  });

  it("kastar räkningen när versionen är gammal", () => {
    const gammal = JSON.stringify({ version: PROMPT_VERSION - 1, pageviews: 99, shown: 4 });
    expect(parsePromptState(gammal)).toEqual(EMPTY_PROMPT_STATE);
  });

  it("vägrar negativa och påhittade tal", () => {
    const fejk = JSON.stringify({
      version: PROMPT_VERSION,
      pageviews: -5,
      matches: "två",
      shown: Number.NaN,
    });
    expect(parsePromptState(fejk)).toEqual(EMPTY_PROMPT_STATE);
  });
});

describe("isPromptablePath", () => {
  it("släpper fram bläddring och resultatsidan", () => {
    for (const path of [
      "/",
      "/leaderboard",
      "/guider",
      "/guider/ord",
      "/forum",
      "/stats",
      "/result/abc-123",
      "/gamla-prov",
      "/gamla-prov/2024ht",
      "/ova/xyz",
    ]) {
      expect(isPromptablePath(path), path).toBe(true);
    }
  });

  it("håller sig borta från pågående pass och tratt-sidor", () => {
    for (const path of [
      "/match/abc-123",
      "/matchmaking",
      "/join/ABCD",
      "/train",
      "/ord",
      "/login",
      "/signup",
      "/onboarding",
      "/coachning/tack",
      "/admin",
      "/gamla-prov/2024ht/3",
    ]) {
      expect(isPromptablePath(path), path).toBe(false);
    }
  });
});

/**
 * Samma namnbyte som för samtycket: nyckeln flyttade från `hpk-` till `tkn-`.
 * Det som absolut inte får tappas är `stopped` — den som köpt studieupplägget
 * ska aldrig få nudgen igen.
 */
describe("flytten från den gamla nyckeln", () => {
  const LEGACY_KEY = "hpk-coaching-prompt";
  const NEW_KEY = "tkn-coaching-prompt";

  function fakeStorage(): Storage {
    const map = new Map<string, string>();
    return {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => void map.set(k, v),
      removeItem: (k: string) => void map.delete(k),
      clear: () => map.clear(),
      key: (i: number) => [...map.keys()][i] ?? null,
      get length() {
        return map.size;
      },
    } as Storage;
  }

  let store: Storage;

  beforeEach(() => {
    store = fakeStorage();
    (globalThis as { window?: unknown }).window = { localStorage: store };
  });

  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  it("tar med sig 'stopped' så att en köpare slipper nudgen igen", () => {
    store.setItem(LEGACY_KEY, serializePromptState(stopPrompts(EMPTY_PROMPT_STATE)));

    expect(readPromptState().stopped).toBe(true);
    expect(parsePromptState(store.getItem(NEW_KEY)).stopped).toBe(true);
    expect(store.getItem(LEGACY_KEY)).toBeNull();
  });

  it("tar med sig räknarna och antalet visningar", () => {
    const gammalt = markPromptShown(efter(3, countPageview), NU);
    store.setItem(LEGACY_KEY, serializePromptState({ ...gammalt, pageviews: 3 }));

    const flyttat = readPromptState();
    expect(flyttat.pageviews).toBe(3);
    expect(flyttat.shown).toBe(1);
    expect(flyttat.shownAt).toBe(NU.toISOString());
  });

  it("låter den nya nyckeln vinna när båda finns", () => {
    store.setItem(LEGACY_KEY, serializePromptState(stopPrompts(EMPTY_PROMPT_STATE)));
    store.setItem(NEW_KEY, serializePromptState(EMPTY_PROMPT_STATE));

    expect(readPromptState().stopped).toBe(false);
    expect(store.getItem(LEGACY_KEY)).not.toBeNull();
  });

  it("ger tomt läge när ingen av nycklarna finns", () => {
    expect(readPromptState()).toEqual(EMPTY_PROMPT_STATE);
  });
});
