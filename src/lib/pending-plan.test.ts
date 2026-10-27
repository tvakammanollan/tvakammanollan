import { describe, expect, it } from "vitest";
import { MAX_AGE_MS, parsePendingPlan } from "./pending-plan";

describe("parsePendingPlan", () => {
  const now = Date.parse("2026-10-27T12:00:00Z");

  it("läser ett färskt val", () => {
    expect(parsePendingPlan(JSON.stringify({ plan: "6m", at: now - 1000 }), now)).toBe("6m");
    expect(parsePendingPlan(JSON.stringify({ plan: "1m", at: now }), now)).toBe("1m");
  });

  it("släpper ett gammalt val", () => {
    expect(
      parsePendingPlan(JSON.stringify({ plan: "6m", at: now - MAX_AGE_MS - 1 }), now),
    ).toBeNull();
  });

  it("tål skräp", () => {
    expect(parsePendingPlan(null, now)).toBeNull();
    expect(parsePendingPlan("inte json", now)).toBeNull();
    expect(parsePendingPlan(JSON.stringify({ plan: "12m", at: now }), now)).toBeNull();
    expect(parsePendingPlan(JSON.stringify({ plan: "6m" }), now)).toBeNull();
    expect(parsePendingPlan(JSON.stringify({ plan: "6m", at: now + 3_600_000 }), now)).toBeNull();
  });
});
