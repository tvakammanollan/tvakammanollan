import { describe, expect, it } from "vitest";
import { HP_TOTAL_QUESTIONS, normeringFromRaw } from "./normering";

describe("normeringFromRaw", () => {
  it("kända ankarvärden ur tabellen", () => {
    expect(normeringFromRaw(0)).toBe(0.0);
    expect(normeringFromRaw(80)).toBe(0.95);
    expect(normeringFromRaw(120)).toBe(1.5);
    expect(normeringFromRaw(155)).toBe(2.0);
    expect(normeringFromRaw(160)).toBe(2.0);
  });

  it("interpolerar mellan ankare (52 rätt → 0,40)", () => {
    // 50→0.35, 55→0.45; t=(52-50)/5=0.4 → 0.39 → avrundat till 0,05-steg = 0.40
    expect(normeringFromRaw(52)).toBe(0.4);
  });

  it("klampar utanför intervallet", () => {
    expect(normeringFromRaw(-5)).toBe(0.0);
    expect(normeringFromRaw(999)).toBe(2.0);
  });

  it("är monotont icke-avtagande över hela skalan", () => {
    let prev = -1;
    for (let raw = 0; raw <= HP_TOTAL_QUESTIONS; raw++) {
      const v = normeringFromRaw(raw);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
});
