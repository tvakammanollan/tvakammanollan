import { describe, it, expect } from "vitest";
import { parseQuestionText, questionText } from "./question-text";

describe("parseQuestionText", () => {
  it("skiljer ut markören och lämnar texten ren", () => {
    const r = parseQuestionText("[utgången] Kvantitet I: 21 % av 2482");
    expect(r.withdrawn).toBe(true);
    expect(r.text).toBe("Kvantitet I: 21 % av 2482");
  });

  it("rör inte en vanlig uppgift", () => {
    const r = parseQuestionText("Kvantitet I: 0,05 + 0,05");
    expect(r.withdrawn).toBe(false);
    expect(r.text).toBe("Kvantitet I: 0,05 + 0,05");
  });

  it("tål tomt och saknat värde", () => {
    expect(parseQuestionText(null)).toEqual({ text: "", withdrawn: false });
    expect(parseQuestionText(undefined)).toEqual({ text: "", withdrawn: false });
    expect(parseQuestionText("")).toEqual({ text: "", withdrawn: false });
  });

  it("tar bara markören i början — en hakparentes i uppgiften står kvar", () => {
    const r = parseQuestionText("Mängden [utgången] betecknas A");
    expect(r.withdrawn).toBe(false);
    expect(r.text).toBe("Mängden [utgången] betecknas A");
  });

  it("tar bort markören en gång, inte upprepat", () => {
    const r = parseQuestionText("[utgången] [utgången] x = 2");
    expect(r.withdrawn).toBe(true);
    expect(r.text).toBe("[utgången] x = 2");
  });

  it("questionText ger bara texten", () => {
    expect(questionText("[utgången] x = 2")).toBe("x = 2");
  });
});
