import { describe, expect, it } from "vitest";
import {
  CONSENT_VERSION,
  makeConsentRecord,
  parseConsent,
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
