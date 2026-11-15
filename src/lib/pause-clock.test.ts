import { describe, expect, it } from "vitest";
import { clockNow, pauseShift } from "./pause-clock";

describe("pauseShift", () => {
  it("ger pausens längd", () => {
    expect(pauseShift(1_000, 61_000)).toBe(60_000);
  });

  it("ger 0 utan paus", () => {
    expect(pauseShift(null, 5_000)).toBe(0);
    expect(pauseShift(undefined, 5_000)).toBe(0);
  });

  it("ger 0 för trasiga och framtida värden", () => {
    expect(pauseShift(Number.NaN, 5_000)).toBe(0);
    expect(pauseShift(0, 5_000)).toBe(0);
    expect(pauseShift(-1, 5_000)).toBe(0);
    expect(pauseShift(9_000, 5_000)).toBe(0);
    expect(pauseShift("123" as unknown as number, 5_000)).toBe(0);
  });
});

describe("clockNow", () => {
  it("står still på pausens början", () => {
    expect(clockNow(1_000, 61_000)).toBe(1_000);
    expect(clockNow(1_000, 999_000)).toBe(1_000);
  });

  it("är nu när passet inte är pausat", () => {
    expect(clockNow(null, 61_000)).toBe(61_000);
  });

  it("kvarvarande tid är densamma före och efter en paus", () => {
    const endsAt = 100_000;
    const pausedAt = 40_000;
    const resumedAt = 70_000;
    const before = endsAt - clockNow(pausedAt, resumedAt);
    const after = endsAt + pauseShift(pausedAt, resumedAt) - clockNow(null, resumedAt);
    expect(after).toBe(before);
  });
});
