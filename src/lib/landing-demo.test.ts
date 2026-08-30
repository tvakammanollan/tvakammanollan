import { describe, it, expect } from "vitest";
import {
  dugligaDemofragor,
  valjDemofragor,
  MAX_ORDLANGD,
  MAX_ALTERNATIVLANGD,
  type RaOrdrad,
} from "./landing-demo";

const femAlt = (t = "kort") => [
  { id: "A", text: t },
  { id: "B", text: t },
  { id: "C", text: t },
  { id: "D", text: t },
  { id: "E", text: t },
];

const rad = (over: Partial<RaOrdrad> = {}): RaOrdrad => ({
  question_text: "vederhäftig",
  options: femAlt(),
  correct_answer: "B",
  ...over,
});

describe("dugligaDemofragor", () => {
  it("släpper igenom en normal ORD-uppgift", () => {
    const ut = dugligaDemofragor([rad()]);
    expect(ut).toHaveLength(1);
    expect(ut[0]).toEqual({ ord: "vederhäftig", alternativ: femAlt(), ratt: "B" });
  });

  // Beståndet har uppslag som "karne-", "herb-" och "mort-". De är riktiga
  // uppgifter men förklarar ingenting för någon som ser sajten först gången.
  it("sållar bort affix i båda ändar", () => {
    expect(dugligaDemofragor([rad({ question_text: "mort-" })])).toHaveLength(0);
    expect(dugligaDemofragor([rad({ question_text: "-ism" })])).toHaveLength(0);
  });

  it("kräver exakt fem alternativ", () => {
    expect(dugligaDemofragor([rad({ options: femAlt().slice(0, 4) })])).toHaveLength(0);
    expect(
      dugligaDemofragor([rad({ options: [...femAlt(), { id: "F", text: "x" }] })]),
    ).toHaveLength(0);
  });

  it("sållar bort ord och alternativ som inte får plats", () => {
    expect(dugligaDemofragor([rad({ question_text: "x".repeat(MAX_ORDLANGD + 1) })])).toHaveLength(
      0,
    );
    expect(dugligaDemofragor([rad({ question_text: "x".repeat(MAX_ORDLANGD) })])).toHaveLength(1);
    expect(
      dugligaDemofragor([rad({ options: femAlt("y".repeat(MAX_ALTERNATIVLANGD + 1)) })]),
    ).toHaveLength(0);
  });

  it("överlever trasig data utan att kasta", () => {
    expect(dugligaDemofragor([rad({ options: null })])).toHaveLength(0);
    expect(dugligaDemofragor([rad({ options: "inte en array" })])).toHaveLength(0);
    expect(dugligaDemofragor([rad({ options: [{ id: "A" }] })])).toHaveLength(0);
    expect(dugligaDemofragor([rad({ question_text: "" })])).toHaveLength(0);
    expect(dugligaDemofragor([])).toEqual([]);
  });
});

describe("valjDemofragor", () => {
  const bestand = (n: number) =>
    dugligaDemofragor(Array.from({ length: n }, (_, i) => rad({ question_text: `ord${i}` })));

  it("är deterministisk för samma frö", () => {
    const b = bestand(300);
    expect(valjDemofragor(b, 42)).toEqual(valjDemofragor(b, 42));
  });

  it("ger olika urval för olika frön", () => {
    const b = bestand(300);
    expect(valjDemofragor(b, 1)).not.toEqual(valjDemofragor(b, 2));
  });

  // Regressionen: `(frö * 7 + i * 53) % n` gav fyra identiska frågor när
  // n var exakt 53, eftersom i * 53 % 53 är noll för varje i.
  it("ger aldrig dubbletter, inte heller vid n = 53", () => {
    for (const n of [4, 7, 53, 106, 300]) {
      const ut = valjDemofragor(bestand(n), 3);
      expect(new Set(ut.map((f) => f.ord)).size).toBe(ut.length);
    }
  });

  it("tar aldrig fler än vad som finns", () => {
    expect(valjDemofragor(bestand(2), 0)).toHaveLength(2);
    expect(valjDemofragor(bestand(9), 0)).toHaveLength(4);
    expect(valjDemofragor([], 0)).toEqual([]);
  });

  it("klarar negativa frön", () => {
    expect(() => valjDemofragor(bestand(10), -7)).not.toThrow();
    expect(valjDemofragor(bestand(10), -7)).toHaveLength(4);
  });
});
