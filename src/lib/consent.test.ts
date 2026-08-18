import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  clearConsent,
  hasAnalyticsConsent,
  makeConsentRecord,
  needsConsentDecision,
  parseConsent,
  readConsent,
  serializeConsent,
  type ConsentRecord,
} from "./consent";

describe("parseConsent", () => {
  it("läser tillbaka det som skrevs", () => {
    const record = makeConsentRecord("granted", new Date("2026-08-15T10:00:00.000Z"));
    expect(parseConsent(serializeConsent(record))).toEqual<ConsentRecord>({
      choice: "granted",
      version: CONSENT_VERSION,
      decidedAt: "2026-08-15T10:00:00.000Z",
    });
  });

  it("behandlar saknad lagring som 'inget val gjort'", () => {
    expect(parseConsent(null)).toBeNull();
    expect(parseConsent("")).toBeNull();
  });

  it("vägrar tolka skräp som ett ja", () => {
    expect(parseConsent("inte json")).toBeNull();
    expect(parseConsent("null")).toBeNull();
    expect(parseConsent('"granted"')).toBeNull();
    expect(parseConsent(JSON.stringify({ version: CONSENT_VERSION }))).toBeNull();
    expect(parseConsent(JSON.stringify({ choice: "kanske", version: CONSENT_VERSION }))).toBeNull();
  });

  it("ogiltigförklarar samtycke från en äldre version", () => {
    const stale = JSON.stringify({
      choice: "granted",
      version: CONSENT_VERSION - 1,
      decidedAt: new Date().toISOString(),
    });
    expect(parseConsent(stale)).toBeNull();
  });

  it("överlever en post utan tidsstämpel", () => {
    const raw = JSON.stringify({ choice: "denied", version: CONSENT_VERSION });
    expect(parseConsent(raw)?.choice).toBe("denied");
  });
});

/**
 * Namnbytet till Tvåkommanollan flyttade nyckeln från `hpk-` till `tkn-`.
 * Utan överflyttning hade varje besökare som redan svarat räknats som
 * obeslutsam och fått bannern igen — samtycket fanns, det låg bara kvar under
 * det gamla namnet.
 */
describe("flytten från den gamla nyckeln", () => {
  const LEGACY_KEY = "hpk-analytics-consent";

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
    // clearConsent/writeConsent skickar CONSENT_CHANGED_EVENT — attrappen
    // behöver därför en dispatchEvent, annars kastar den.
    (globalThis as { window?: unknown }).window = {
      localStorage: store,
      dispatchEvent: () => true,
    };
  });

  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  it("tar över ett giltigt val och skriver om det till den nya nyckeln", () => {
    store.setItem(LEGACY_KEY, serializeConsent(makeConsentRecord("granted")));

    expect(readConsent()?.choice).toBe("granted");
    expect(parseConsent(store.getItem(CONSENT_STORAGE_KEY))?.choice).toBe("granted");
    expect(store.getItem(LEGACY_KEY)).toBeNull();
  });

  it("flyttar ett nej lika noga som ett ja", () => {
    store.setItem(LEGACY_KEY, serializeConsent(makeConsentRecord("denied")));

    expect(readConsent()?.choice).toBe("denied");
    expect(hasAnalyticsConsent()).toBe(false);
    expect(needsConsentDecision()).toBe(false);
  });

  it("låter den nya nyckeln vinna när båda finns", () => {
    store.setItem(LEGACY_KEY, serializeConsent(makeConsentRecord("granted")));
    store.setItem(CONSENT_STORAGE_KEY, serializeConsent(makeConsentRecord("denied")));

    expect(readConsent()?.choice).toBe("denied");
  });

  it("flyttar inte över ett val från en äldre samtyckesversion", () => {
    store.setItem(
      LEGACY_KEY,
      JSON.stringify({
        choice: "granted",
        version: CONSENT_VERSION - 1,
        decidedAt: new Date().toISOString(),
      }),
    );

    expect(readConsent()).toBeNull();
    expect(needsConsentDecision()).toBe(true);
    expect(store.getItem(LEGACY_KEY)).toBeNull();
  });

  it("städar bort båda nycklarna när valet nollställs", () => {
    store.setItem(LEGACY_KEY, serializeConsent(makeConsentRecord("granted")));
    store.setItem(CONSENT_STORAGE_KEY, serializeConsent(makeConsentRecord("granted")));

    clearConsent();

    expect(store.getItem(LEGACY_KEY)).toBeNull();
    expect(store.getItem(CONSENT_STORAGE_KEY)).toBeNull();
  });
});
