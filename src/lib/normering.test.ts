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

  // Skalan är 0,05 — inte 0,1. Poängräknaren visade länge resultatet med en
  // decimal, vilket tog bort varannat steg: 145 rätt (1,90) och 150 rätt
  // (1,95) blev båda "1,9". Testet pinnar att halvstegen finns i datan, så
  // att nästa formatering inte kan slarva bort dem obemärkt.
  it("ligger på 0,05-steg och når hela skalan, halvsteg inräknade", () => {
    const varden = new Set<number>();
    for (let raw = 0; raw <= HP_TOTAL_QUESTIONS; raw++) {
      const v = normeringFromRaw(raw);
      expect(Math.round(v * 100) % 5).toBe(0);
      varden.add(Math.round(v * 100));
    }
    // Alla 41 värdena mellan 0,00 och 2,00 ska gå att få.
    for (let hundradelar = 0; hundradelar <= 200; hundradelar += 5) {
      expect(varden.has(hundradelar)).toBe(true);
    }
    expect(normeringFromRaw(150)).toBe(1.95);
    expect(normeringFromRaw(145)).toBe(1.9);
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
