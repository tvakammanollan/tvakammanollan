import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CONSENT_STORAGE_KEY, CONSENT_VERSION } from "./consent";

/**
 * Köandet i analytics.ts.
 *
 * Bakgrunden: `captureAnalytics` var `client?.capture(...)`, och `client` finns
 * inte förrän den dynamiska import()en av posthog-js gått i mål. Allt som
 * avfyrades dessförinnan — sidvisningen, en händelse i en useEffect vid
 * montering — försvann utan felmeddelande. Testerna nedan pinnar både att
 * sådana händelser numera kommer fram OCH att grinden mot samtycke sitter kvar:
 * utan ja får ingenting ens sparas undan.
 */

const capture = vi.fn();
const init = vi.fn();

vi.mock("posthog-js", () => ({
  default: {
    init,
    capture,
    register: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
    setPersonProperties: vi.fn(),
    opt_out_capturing: vi.fn(),
    startSessionRecording: vi.fn(),
    stopSessionRecording: vi.fn(),
    has_opted_out_capturing: () => false,
  },
}));

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

function setConsent(choice: "granted" | "denied") {
  (globalThis as { window?: { localStorage: Storage } }).window?.localStorage.setItem(
    CONSENT_STORAGE_KEY,
    JSON.stringify({ choice, version: CONSENT_VERSION, decidedAt: new Date().toISOString() }),
  );
}

/** Modulen har toppnivåstate (kön, klienten) — varje test behöver en färsk. */
async function freshAnalytics() {
  vi.resetModules();
  return import("./analytics");
}

beforeEach(() => {
  capture.mockClear();
  init.mockClear();
  vi.stubEnv("VITE_PUBLIC_POSTHOG_KEY", "phc_test");
  (globalThis as Record<string, unknown>).window = { localStorage: fakeStorage() };
});

afterEach(() => {
  vi.unstubAllEnvs();
  delete (globalThis as Record<string, unknown>).window;
});

describe("captureAnalytics innan PostHog laddat", () => {
  it("skickar köade händelser när klienten är på plats", async () => {
    const a = await freshAnalytics();
    setConsent("granted");

    a.captureAnalytics("forum_search", { hits: 3 });
    a.captureAnalytics("match_submitted", { answered: 10 });
    expect(capture).not.toHaveBeenCalled(); // inget att skicka till ännu

    await a.startAnalytics();

    expect(capture).toHaveBeenCalledTimes(2);
    expect(capture).toHaveBeenNthCalledWith(1, "forum_search", { hits: 3 });
    expect(capture).toHaveBeenNthCalledWith(2, "match_submitted", { answered: 10 });
  });

  it("tömmer kön en gång — inte om och om igen", async () => {
    const a = await freshAnalytics();
    setConsent("granted");
    a.captureAnalytics("forum_search", { hits: 1 });

    await a.startAnalytics();
    await a.startAnalytics();

    expect(capture).toHaveBeenCalledTimes(1);
  });

  it("skickar direkt när klienten redan finns", async () => {
    const a = await freshAnalytics();
    setConsent("granted");
    await a.startAnalytics();

    a.captureAnalytics("match_submitted", { answered: 4 });

    expect(capture).toHaveBeenCalledWith("match_submitted", { answered: 4 });
  });
});

describe("samtyckesgrinden", () => {
  it("köar ingenting utan ett ja", async () => {
    const a = await freshAnalytics();
    setConsent("denied");

    a.captureAnalytics("forum_search", { hits: 3 });
    await a.startAnalytics();

    expect(capture).not.toHaveBeenCalled();
  });

  it("köar ingenting när inget val gjorts ännu", async () => {
    const a = await freshAnalytics();

    a.captureAnalytics("forum_search", { hits: 3 });
    await a.startAnalytics();

    expect(capture).not.toHaveBeenCalled();
  });

  it("slänger kön när samtycket tas tillbaka", async () => {
    const a = await freshAnalytics();
    setConsent("granted");
    a.captureAnalytics("forum_search", { hits: 3 });

    a.stopAnalytics();
    await a.startAnalytics();

    expect(capture).not.toHaveBeenCalled();
  });

  it("gör ingenting alls utan konfigurerad nyckel", async () => {
    vi.stubEnv("VITE_PUBLIC_POSTHOG_KEY", "");
    const a = await freshAnalytics();
    setConsent("granted");

    a.captureAnalytics("forum_search", { hits: 3 });
    expect(await a.startAnalytics()).toBeNull();
    expect(capture).not.toHaveBeenCalled();
    expect(init).not.toHaveBeenCalled();
  });
});

describe("kön har ett tak", () => {
  it("växer inte obegränsat när skriptet aldrig laddas", async () => {
    const a = await freshAnalytics();
    setConsent("granted");

    for (let i = 0; i < 500; i++) a.captureAnalytics("spam", { i });
    await a.startAnalytics();

    expect(capture).toHaveBeenCalledTimes(50);
  });
});
