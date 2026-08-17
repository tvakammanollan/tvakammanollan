import { describe, it, expect } from "vitest";
import {
  checkMatchQuota,
  isImplausiblyFast,
  MATCH_QUOTA,
  MIN_SECONDS_PER_QUESTION,
} from "./match-abuse";

describe("checkMatchQuota", () => {
  it("släpper igenom normalt spelande", () => {
    expect(checkMatchQuota(0, 0).ok).toBe(true);
    expect(checkMatchQuota(11, 30).ok).toBe(true);
  });

  it("stoppar vid timkvoten", () => {
    const v = checkMatchQuota(MATCH_QUOTA.perHour, 40);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.message).toContain("senaste timmen");
  });

  it("stoppar vid dygnskvoten", () => {
    const v = checkMatchQuota(0, MATCH_QUOTA.perDay);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.message).toContain("senaste dygnet");
  });

  it("låter dygnskvoten gå före timkvoten i meddelandet", () => {
    const v = checkMatchQuota(MATCH_QUOTA.perHour, MATCH_QUOTA.perDay);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.message).toContain("dygnet");
  });

  it("gränsen är inklusiv — kvoten är ett tak, inte ett mål", () => {
    expect(checkMatchQuota(MATCH_QUOTA.perHour - 1, 0).ok).toBe(true);
    expect(checkMatchQuota(MATCH_QUOTA.perHour, 0).ok).toBe(false);
  });

  it("kvoterna räcker för en riktig session men inte för odling", () => {
    // 12 matcher/h är taket för någon som faktiskt spelar 5-minutersmatcher.
    expect(MATCH_QUOTA.perHour).toBeGreaterThan(12);
    // Odlaren låg på 300 matcher/dygn.
    expect(MATCH_QUOTA.perDay).toBeLessThan(300);
  });
});

describe("isImplausiblyFast", () => {
  it("underkänner en åttafrågorsmatch avklarad på en handfull sekunder", () => {
    expect(isImplausiblyFast(3, 8)).toBe(true);
    expect(isImplausiblyFast(15, 8)).toBe(true);
  });

  it("godkänner en match som tagit rimlig tid", () => {
    expect(isImplausiblyFast(16, 8)).toBe(false);
    expect(isImplausiblyFast(240, 8)).toBe(false);
  });

  it("golvet skalar med antalet frågor", () => {
    expect(isImplausiblyFast(9, 5)).toBe(true);
    expect(isImplausiblyFast(10, 5)).toBe(false);
    expect(MIN_SECONDS_PER_QUESTION * 5).toBe(10);
  });

  it("privata rum står och väntar, så lång tid är alltid godkänd", () => {
    expect(isImplausiblyFast(3600, 8)).toBe(false);
  });

  it("behandlar trasiga tider som fusk hellre än att släppa igenom", () => {
    expect(isImplausiblyFast(NaN, 8)).toBe(true);
    expect(isImplausiblyFast(-5, 8)).toBe(true);
  });

  it("utan kända frågor finns inget golv att mäta mot", () => {
    expect(isImplausiblyFast(1, 0)).toBe(false);
  });
});
