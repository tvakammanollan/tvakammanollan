import { describe, expect, it } from "vitest";
import { allExams } from "./prov-data";
import { FREE_EXAM_COUNT, freeExams, isFreeExam } from "./prov-access";

const exams = [{ term: "2026ht" }, { term: "2026vt" }, { term: "2025ht" }, { term: "2012vt" }];

describe("isFreeExam", () => {
  it("släpper de två senaste proven och låser resten", () => {
    expect(FREE_EXAM_COUNT).toBe(2);
    expect(isFreeExam("2026ht", exams)).toBe(true);
    expect(isFreeExam("2026vt", exams)).toBe(true);
    expect(isFreeExam("2025ht", exams)).toBe(false);
    expect(isFreeExam("2012vt", exams)).toBe(false);
  });

  it("låser en term som inte finns i listan", () => {
    expect(isFreeExam("1999ht", exams)).toBe(false);
  });

  it("provlistan är sorterad nyast först, annars blir fel prov gratis", () => {
    const dates = allExams().map((e) => e.date);
    expect([...dates].sort().reverse()).toEqual(dates);
    expect(freeExams(allExams())).toHaveLength(FREE_EXAM_COUNT);
  });
});
