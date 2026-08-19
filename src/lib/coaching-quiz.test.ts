import { describe, it, expect } from "vitest";
import { QUIZ_STEPS, QUIZ_VALUES, quizComplete, quizOutcome } from "./coaching-quiz";

describe("QUIZ_STEPS", () => {
  it("har två frågor med unika svarsvärden", () => {
    expect(QUIZ_STEPS).toHaveLength(2);
    for (const step of QUIZ_STEPS) {
      const values = step.options.map((o) => o.value);
      expect(new Set(values).size, step.id).toBe(values.length);
      expect(step.options.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("QUIZ_VALUES speglar stegen — schemat på servern får inte glida isär", () => {
    expect(QUIZ_VALUES.forsok).toEqual(QUIZ_STEPS[0].options.map((o) => o.value));
    expect(QUIZ_VALUES.hinder).toEqual(QUIZ_STEPS[1].options.map((o) => o.value));
  });
});

describe("quizComplete", () => {
  it("kräver båda frågorna", () => {
    expect(quizComplete({})).toBe(false);
    expect(quizComplete({ forsok: "flera" })).toBe(false);
    expect(quizComplete({ hinder: "plan" })).toBe(false);
    expect(quizComplete({ forsok: "flera", hinder: "plan" })).toBe(true);
  });

  it("avvisar värden som inte finns bland alternativen", () => {
    expect(quizComplete({ forsok: "påhittat", hinder: "plan" })).toBe(false);
    expect(quizComplete({ forsok: "flera", hinder: "" })).toBe(false);
  });
});

describe("quizOutcome", () => {
  it("kvalificerar varje kombination — ingen väg är en återvändsgränd", () => {
    for (const forsok of QUIZ_VALUES.forsok) {
      for (const hinder of QUIZ_VALUES.hinder) {
        const out = quizOutcome({ forsok, hinder });
        expect(out.headline.length, `${forsok}/${hinder}`).toBeGreaterThan(0);
        expect(out.lines.length, `${forsok}/${hinder}`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("speglar svaren i texten i stället för att säga samma sak varje gång", () => {
    const a = quizOutcome({ forsok: "flera", hinder: "kvant" });
    const b = quizOutcome({ forsok: "aldrig", hinder: "verbal" });
    expect(a.lines.join(" ")).not.toBe(b.lines.join(" "));
    expect(a.headline).not.toBe(b.headline);
  });

  it("kastar inte på ofullständiga eller påhittade svar", () => {
    expect(() => quizOutcome({})).not.toThrow();
    expect(quizOutcome({}).lines.length).toBeGreaterThan(0);
    expect(() => quizOutcome({ forsok: "finns-inte" })).not.toThrow();
  });

  it("lovar aldrig ett resultat på provet", () => {
    // Copyn är säljande men får inte garantera en poäng — det är ett löfte
    // ingen kan hålla, och det är den sortens mening som slinker in vid en
    // omskrivning.
    const förbjudet = /garanter|lovar|säkert \d|du kommer få \d/i;
    for (const forsok of QUIZ_VALUES.forsok) {
      for (const hinder of QUIZ_VALUES.hinder) {
        const out = quizOutcome({ forsok, hinder });
        const text = `${out.headline} ${out.lines.join(" ")}`;
        expect(förbjudet.test(text), text).toBe(false);
      }
    }
  });
});
