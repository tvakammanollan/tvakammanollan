import { describe, expect, it } from "vitest";
import { eloTier, initials } from "./elo";
import { calcNewElo, kFactor } from "./match.server";

describe("kFactor (gränser)", () => {
  it("<1500 → 96, 1500–1800 → 60, >1800 → 30", () => {
    expect(kFactor(1499)).toBe(96);
    expect(kFactor(1500)).toBe(60);
    expect(kFactor(1800)).toBe(60);
    expect(kFactor(1801)).toBe(30);
  });
});

describe("calcNewElo", () => {
  it("lika motstånd: vinst +48, förlust −48, oavgjort ±0 (K=96)", () => {
    expect(calcNewElo(1000, 1000, 1)).toBe(1048);
    expect(calcNewElo(1000, 1000, 0)).toBe(952);
    expect(calcNewElo(1000, 1000, 0.5)).toBe(1000);
  });

  it("golvet 600 kan inte underskridas", () => {
    expect(calcNewElo(600, 2000, 0)).toBe(600);
  });

  it("vinst mot mycket starkare ger mer än mot lika", () => {
    const vsEqual = calcNewElo(1000, 1000, 1) - 1000;
    const vsStronger = calcNewElo(1000, 1400, 1) - 1000;
    expect(vsStronger).toBeGreaterThan(vsEqual);
  });
});

describe("eloTier", () => {
  it("gränser: 1199 brons, 1200 silver, 1500 guld", () => {
    expect(eloTier(1199)).toBe("bronze");
    expect(eloTier(1200)).toBe("silver");
    expect(eloTier(1500)).toBe("gold");
  });
});

describe("initials", () => {
  it("tar två alfanumeriska tecken, versaler, ?? som fallback", () => {
    expect(initials("niklas")).toBe("NI");
    expect(initials("!!")).toBe("??");
  });
});
