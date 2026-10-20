import { describe, expect, it } from "vitest";
import {
  ACCESS_MONTHS,
  FREE_MEK_LIMIT,
  TIME_LIMITED_FROM,
  accessExpiresAt,
  purchaseIsActive,
  FREE_ORD_LIMIT,
  cappedBatchSize,
  mekAccess,
  ordAccess,
} from "./ord-paywall";

describe("mekAccess", () => {
  it("släpper igenom de första 40 MEK-uppgifterna och låser sedan", () => {
    expect(FREE_MEK_LIMIT).toBe(40);
    expect(mekAccess(39, false)).toMatchObject({ locked: false, freeRemaining: 1 });
    expect(mekAccess(40, false)).toMatchObject({ locked: true, freeRemaining: 0 });
  });

  it("ordlisteköpet låser upp MEK", () => {
    expect(mekAccess(300, true)).toMatchObject({ locked: false, freeRemaining: null });
  });

  it("kapar en MEK-batch vid gratisgränsen", () => {
    expect(cappedBatchSize(20, mekAccess(32, false))).toBe(8);
  });
});

describe("ordAccess", () => {
  it("släpper igenom de första 40 orden", () => {
    expect(ordAccess(0, false)).toMatchObject({ locked: false, freeRemaining: FREE_ORD_LIMIT });
    expect(ordAccess(39, false)).toMatchObject({ locked: false, freeRemaining: 1 });
  });

  it("låser vid det fyrtionde svaret", () => {
    expect(ordAccess(40, false)).toMatchObject({ locked: true, freeRemaining: 0 });
    expect(ordAccess(500, false).locked).toBe(true);
  });

  it("låser aldrig upp den som köpt", () => {
    expect(ordAccess(500, true)).toMatchObject({ locked: false, freeRemaining: null });
  });

  it("läser ett trasigt antal som noll, inte som obegränsat", () => {
    expect(ordAccess(Number.NaN, false).freeRemaining).toBe(FREE_ORD_LIMIT);
    expect(ordAccess(-5, false).freeRemaining).toBe(FREE_ORD_LIMIT);
  });
});

describe("cappedBatchSize", () => {
  it("kapar en batch vid gratisgränsen", () => {
    expect(cappedBatchSize(20, ordAccess(35, false))).toBe(5);
    expect(cappedBatchSize(20, ordAccess(40, false))).toBe(0);
  });

  it("rör inte batchen för den som köpt", () => {
    expect(cappedBatchSize(20, ordAccess(900, true))).toBe(20);
  });
});

describe("köpets giltighet", () => {
  it("gäller i sex månader", () => {
    expect(ACCESS_MONTHS).toBe(6);
    expect(accessExpiresAt("2026-11-15T10:00:00Z")?.toISOString()).toBe("2027-05-15T10:00:00.000Z");
  });

  it("släpper vid utgången, inte före", () => {
    const paid = "2026-11-15T10:00:00Z";
    expect(purchaseIsActive(paid, Date.parse("2027-05-15T09:59:59Z"))).toBe(true);
    expect(purchaseIsActive(paid, Date.parse("2027-05-15T10:00:00Z"))).toBe(false);
  });

  it("köp från tiden då kassan lovade 'för alltid' går aldrig ut", () => {
    expect(new Date(TIME_LIMITED_FROM).toISOString()).toBe("2026-10-21T00:00:00.000Z");
    expect(accessExpiresAt("2026-10-15T13:13:01Z")).toBeNull();
    expect(purchaseIsActive("2026-10-15T13:13:01Z", Date.parse("2030-01-01"))).toBe(true);
  });

  it("ett oläsbart datum låser inte ute någon", () => {
    expect(purchaseIsActive("inte ett datum", Date.parse("2030-01-01"))).toBe(true);
  });
});
