import { describe, expect, it } from "vitest";
import { previousDate, stockholmDate, streakStep } from "./streak-dates";

describe("stockholmDate", () => {
  it("ger svensk kalenderdag, inte UTC-dagen", () => {
    // 00:30 svensk sommartid natten till 2026-08-19 = 22:30 UTC den 18:e.
    // Med UTC-räkning skrevs passet som den 18:e och dagens spel räknades
    // sedan som "redan räknat idag".
    expect(stockholmDate(new Date("2026-08-18T22:30:00Z"))).toBe("2026-08-19");
    // Vintertid: UTC+1.
    expect(stockholmDate(new Date("2026-01-14T23:30:00Z"))).toBe("2026-01-15");
    // Mitt på dagen är de alltid överens.
    expect(stockholmDate(new Date("2026-08-19T10:00:00Z"))).toBe("2026-08-19");
  });
});

describe("previousDate", () => {
  it("backar ett dygn, även över månads- och årsskifte", () => {
    expect(previousDate("2026-08-19")).toBe("2026-08-18");
    expect(previousDate("2026-08-01")).toBe("2026-07-31");
    expect(previousDate("2026-01-01")).toBe("2025-12-31");
    expect(previousDate("2028-03-01")).toBe("2028-02-29"); // skottår
  });

  it("påverkas inte av sommartidsskiftet", () => {
    // Sista söndagen i mars 2026 = 29:e. Ett dygn har 23 timmar den natten.
    expect(previousDate("2026-03-29")).toBe("2026-03-28");
    expect(previousDate("2026-03-30")).toBe("2026-03-29");
  });
});

describe("streakStep", () => {
  it("spelat idag: räknas inte en gång till", () => {
    expect(streakStep("2026-08-19", 4, "2026-08-19")).toEqual({ kind: "already-counted" });
  });

  it("spelat igår: streaken växer", () => {
    expect(streakStep("2026-08-18", 4, "2026-08-19")).toEqual({ kind: "continued", streak: 5 });
  });

  it("två dagar i rad från noll", () => {
    const dag1 = streakStep(null, 0, "2026-08-18");
    expect(dag1).toEqual({ kind: "restarted", broken: false });
    const dag2 = streakStep("2026-08-18", 1, "2026-08-19");
    expect(dag2).toEqual({ kind: "continued", streak: 2 });
  });

  it("uppehåll: streaken börjar om och räknas som bruten", () => {
    expect(streakStep("2026-08-16", 9, "2026-08-19")).toEqual({ kind: "restarted", broken: true });
  });

  it("aldrig spelat: börjar om utan att något brutits", () => {
    expect(streakStep(null, 0, "2026-08-19")).toEqual({ kind: "restarted", broken: false });
  });

  it("datum i framtiden räknas inte som 'igår'", () => {
    expect(streakStep("2026-08-25", 3, "2026-08-19")).toEqual({ kind: "restarted", broken: true });
  });
});
