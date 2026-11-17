import { describe, expect, it } from "vitest";
import { allExams } from "./prov-data";
import { FREE_EXAM_COUNT, freeExams, isFreeExam } from "./prov-access";

const exams = allExams().map((e) => ({ term: e.term }));

describe("isFreeExam", () => {
  it("släpper de senaste proven och låser resten", () => {
    expect(FREE_EXAM_COUNT).toBe(10);
    expect(isFreeExam(exams[0].term, exams)).toBe(true);
    expect(isFreeExam(exams[9].term, exams)).toBe(true);
    expect(isFreeExam(exams[10].term, exams)).toBe(false);
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
