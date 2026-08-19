import { describe, expect, it } from "vitest";
import {
  HP_TOTAL_QUESTIONS,
  normeringFromParts,
  normeringFromRatio,
  normeringFromRaw,
} from "./normering";

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

describe("normeringFromRatio", () => {
  it("räknar upp en andel till 160-skalan", () => {
    expect(normeringFromRatio(1)).toBe(2.0);
    expect(normeringFromRatio(0.75)).toBe(normeringFromRaw(120));
    expect(normeringFromRatio(0)).toBe(0);
  });

  it("ger samma poäng oavsett hur många uppgifter andelen räknats på", () => {
    // Ett provpass (36 av 40) och en hel provdel (72 av 80) är samma andel.
    expect(normeringFromRatio(36 / 40)).toBe(normeringFromRatio(72 / 80));
  });

  it("klarar en nolldivision utan att svara NaN", () => {
    expect(normeringFromRatio(0 / 0)).toBe(0);
  });
});

describe("normeringFromParts", () => {
  // Provets poäng är snittet av delarnas, inte en tredje uppslagning.
  it("1,90 verbalt och 2,00 kvantitativt blir 1,95", () => {
    expect(normeringFromParts(1.9, 2.0)).toBe(1.95);
  });

  it("avrundar till närmaste 0,05", () => {
    expect(normeringFromParts(1.0, 1.05)).toBe(1.05);
    expect(normeringFromParts(0.7, 1.35)).toBe(1.05);
    expect(normeringFromParts(2.0, 2.0)).toBe(2.0);
    expect(normeringFromParts(0, 0)).toBe(0);
  });

  // Snittet av två uppslagningar är inte samma sak som en uppslagning av
  // summan, eftersom tabellen inte är rät. Det är snittet som gäller.
  it("skiljer sig medvetet från att slå upp den sammanlagda råpoängen", () => {
    const verbal = normeringFromRatio(20 / 80);
    const kvant = normeringFromRatio(80 / 80);
    expect(normeringFromParts(verbal, kvant)).toBe(1.1);
    expect(normeringFromRaw(100)).toBe(1.25);
  });
});
