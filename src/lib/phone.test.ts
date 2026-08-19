import { describe, it, expect } from "vitest";
import { normalizePhone, formatPhone } from "./phone";

describe("normalizePhone", () => {
  it("normaliserar alla vanliga skrivsätt till samma E.164", () => {
    const same = [
      "0701234567",
      "070-123 45 67",
      "070 123 45 67",
      "+46701234567",
      "+46 70 123 45 67",
      "0046701234567",
      "(070) 123-4567",
      "  0701234567  ",
    ];
    for (const raw of same) {
      const r = normalizePhone(raw);
      expect(r.ok, `${raw} skulle godtas`).toBe(true);
      expect(r.e164, raw).toBe("+46701234567");
    }
  });

  it("godtar alla tilldelade mobilserier", () => {
    for (const p of ["70", "72", "73", "76", "79"]) {
      expect(normalizePhone(`0${p}1234567`).ok, p).toBe(true);
    }
  });

  it("avvisar serier som inte är mobilnummer", () => {
    // 08 = Stockholm, 71/74/75/77/78 är inte tilldelade mobilserier.
    for (const n of ["0812345678", "0711234567", "0741234567", "0781234567"]) {
      expect(normalizePhone(n).ok, n).toBe(false);
    }
  });

  it("skiljer för få från för många siffror", () => {
    expect(normalizePhone("070123456").error).toMatch(/för få/);
    expect(normalizePhone("07012345678").error).toMatch(/för många/);
  });

  it("avvisar tomt, skräp och utländska nummer", () => {
    expect(normalizePhone("").ok).toBe(false);
    expect(normalizePhone("   ").ok).toBe(false);
    expect(normalizePhone("ring mig!").ok).toBe(false);
    expect(normalizePhone("+4712345678").error).toMatch(/svenska/);
  });

  it("tillåter plus bara först", () => {
    expect(normalizePhone("070+1234567").error).toMatch(/först/);
  });

  it("ger alltid ett felmeddelande när det inte gick", () => {
    for (const raw of ["", "abc", "0812345678", "070123456", "+4712345678"]) {
      const r = normalizePhone(raw);
      expect(r.ok).toBe(false);
      expect(r.error, raw).toBeTruthy();
      expect(r.e164, raw).toBeUndefined();
    }
  });
});

describe("formatPhone", () => {
  it("skriver ut E.164 som svenskar läser nummer", () => {
    expect(formatPhone("+46701234567")).toBe("070-123 45 67");
  });

  it("lämnar okända format orörda i stället för att förvanska dem", () => {
    expect(formatPhone("+4712345678")).toBe("+4712345678");
    expect(formatPhone("")).toBe("");
  });

  it("är omvändningen av normalizePhone", () => {
    const r = normalizePhone("073-987 65 43");
    expect(r.ok).toBe(true);
    expect(normalizePhone(formatPhone(r.e164!)).e164).toBe(r.e164);
  });
});
