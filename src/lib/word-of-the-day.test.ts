import { describe, expect, it } from "vitest";
import { wordOfTheDayIndex } from "./word-practice.functions";

/**
 * Bara indexvalet testas här — själva uppslaget kräver databasen. Det är
 * indexet som bär hela kravet: samma ord för alla under ett dygn, byte vid
 * svensk midnatt, och inga täta upprepningar.
 */
describe("wordOfTheDayIndex", () => {
  const ANTAL = 8761; // ungefär beståndet av ORD-ord med förklaring

  it("är samma hela dygnet", () => {
    const morgon = wordOfTheDayIndex(ANTAL, new Date("2026-08-20T05:00:00Z"));
    const kvall = wordOfTheDayIndex(ANTAL, new Date("2026-08-20T20:00:00Z"));
    expect(kvall).toBe(morgon);
  });

  it("byter vid midnatt svensk tid, inte vid midnatt UTC", () => {
    // Sommartid = UTC+2. 21:59 UTC är fortfarande den 20:e i Sverige,
    // 22:01 UTC är den 21:a.
    const fore = wordOfTheDayIndex(ANTAL, new Date("2026-08-20T21:59:00Z"));
    const efter = wordOfTheDayIndex(ANTAL, new Date("2026-08-20T22:01:00Z"));
    expect(efter).not.toBe(fore);
    // Och mitt i UTC-natten, som är samma svenska dygn, står det stilla.
    const mittINatten = wordOfTheDayIndex(ANTAL, new Date("2026-08-20T23:30:00Z"));
    expect(mittINatten).toBe(efter);
  });

  it("ger olika ord dag efter dag", () => {
    const sedda = new Set<number>();
    for (let d = 0; d < 60; d++) {
      const at = new Date(Date.UTC(2026, 7, 20, 10, 0, 0) + d * 86_400_000);
      sedda.add(wordOfTheDayIndex(ANTAL, at));
    }
    expect(sedda.size).toBe(60);
  });

  it("går igenom hela listan innan något ord kommer tillbaka", () => {
    // Steget (7919) är primtal, så cykeln är hela listan så länge antalet
    // inte är en multipel av det. Det är skillnaden mot en hash, som ger
    // dubbletter långt innan listan är slut.
    const litet = 101;
    const sedda = new Set<number>();
    for (let d = 0; d < litet; d++) {
      const at = new Date(Date.UTC(2026, 0, 1, 12, 0, 0) + d * 86_400_000);
      sedda.add(wordOfTheDayIndex(litet, at));
    }
    expect(sedda.size).toBe(litet);
  });

  it("håller sig inom listan och klarar ett tomt bestånd", () => {
    for (let d = 0; d < 400; d++) {
      const at = new Date(Date.UTC(2020, 0, 1) + d * 86_400_000);
      const i = wordOfTheDayIndex(ANTAL, at);
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(ANTAL);
    }
    expect(wordOfTheDayIndex(0)).toBe(0);
  });
});
