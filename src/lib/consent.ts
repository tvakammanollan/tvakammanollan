/**
 * Samtycke för analys.
 *
 * ePrivacy (svenska lagen om elektronisk kommunikation) kräver samtycke INNAN
 * ett skript som sätter identifierare laddas — det räcker inte att beskriva
 * det i integritetspolicyn. Därför får `analytics.ts` aldrig importera
 * posthog-js statiskt: valet läses här först, och paketet hämtas dynamiskt
 * först efter ett ja.
 *
 * Modulen är avsiktligt fri från React och från posthog — den är ren logik och
 * testas i consent.test.ts.
 */

/**
 * Höj den här när vi utökar vad som samlas in. Gamla val slutar då gälla och
 * bannern visas igen — samtycke gäller bara det man faktiskt sa ja till.
 */
export const CONSENT_VERSION = 1;

export const CONSENT_STORAGE_KEY = "hpk-analytics-consent";

/** Skickas när valet ändras i samma flik (storage-eventet når bara andra flikar). */
export const CONSENT_CHANGED_EVENT = "hpk:consent-changed";

export type ConsentChoice = "granted" | "denied";

export interface ConsentRecord {
  choice: ConsentChoice;
  version: number;
  decidedAt: string;
}

function isChoice(value: unknown): value is ConsentChoice {
  return value === "granted" || value === "denied";
}

/**
 * Tolkar en lagrad post. Returnerar null för allt som inte är ett giltigt val
 * på *aktuell* version — trasig, manipulerad eller föråldrad lagring ska leda
 * till att vi frågar igen, aldrig till att vi antar ett ja.
 */
export function parseConsent(raw: string | null): ConsentRecord | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const { choice, version, decidedAt } = parsed as Record<string, unknown>;
    if (!isChoice(choice)) return null;
    if (version !== CONSENT_VERSION) return null;
    return {
      choice,
      version: CONSENT_VERSION,
      decidedAt: typeof decidedAt === "string" ? decidedAt : new Date(0).toISOString(),
    };
  } catch {
    return null;
  }
}

export function serializeConsent(record: ConsentRecord): string {
  return JSON.stringify(record);
}

export function makeConsentRecord(choice: ConsentChoice, now = new Date()): ConsentRecord {
  return { choice, version: CONSENT_VERSION, decidedAt: now.toISOString() };
}

/** localStorage kastar i Safari privat läge — samtycke får aldrig krascha sidan. */
function safeStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readConsent(): ConsentRecord | null {
  const store = safeStorage();
  if (!store) return null;
  try {
    return parseConsent(store.getItem(CONSENT_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function writeConsent(choice: ConsentChoice): ConsentRecord {
  const record = makeConsentRecord(choice);
  const store = safeStorage();
  try {
    store?.setItem(CONSENT_STORAGE_KEY, serializeConsent(record));
  } catch {
    /* utan lagring gäller valet bara den här sidvisningen — acceptabelt */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: record }));
  }
  return record;
}

/** Nollställer valet så att bannern visas igen (används från integritetspolicyn). */
export function clearConsent(): void {
  const store = safeStorage();
  try {
    store?.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    /* ignoreras — se writeConsent */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: null }));
  }
}

export function hasAnalyticsConsent(): boolean {
  return readConsent()?.choice === "granted";
}

/** Inget val gjort ännu → bannern ska visas. */
export function needsConsentDecision(): boolean {
  return readConsent() === null;
}
