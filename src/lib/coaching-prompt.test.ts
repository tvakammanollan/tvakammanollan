import { describe, expect, it } from "vitest";
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
