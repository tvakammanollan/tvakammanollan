import { describe, expect, it } from "vitest";
import { latestResult, secondsLeft, suggestNextPass } from "./prov-next";
import type { PassResult } from "./prov-results";
import type { ExamSummary } from "@/types/gamla-prov";

const EXAM: ExamSummary = {
  term: "2020ht",
  date: "2020-10-25",
  label: "Höstprovet 2020",
  questions: 160,
  passes: [
    { pass: 1, kind: "verbal", minutes: 55, questions: 40, delprov: [], missing: [] },
    { pass: 2, kind: "kvant", minutes: 55, questions: 40, delprov: [], missing: [] },
    { pass: 4, kind: "kvant", minutes: 55, questions: 40, delprov: [], missing: [] },
    { pass: 5, kind: "verbal", minutes: 55, questions: 40, delprov: [], missing: [] },
  ],
};

const r = (kind: "verbal" | "kvant", at: number): PassResult => ({
  score: 30,
  total: 40,
  kind,
  mode: "prov",
  at,
});

describe("latestResult", () => {
  it("tar det senast inlämnade passet, oavsett provtillfälle", () => {
    const latest = latestResult({ "2020ht:1": r("verbal", 100), "2019vt:4": r("kvant", 200) });
    expect(latest).toMatchObject({ term: "2019vt", pass: 4 });
  });

  it("ger null utan resultat", () => {
    expect(latestResult({})).toBeNull();
  });
});

describe("suggestNextPass", () => {
  it("föreslår det andra passet i samma del först", () => {
    expect(suggestNextPass(EXAM, { "2020ht:1": r("verbal", 1) }, "verbal")).toEqual({
      pass: 5,
      kind: "verbal",
      completesPart: true,
    });
  });

  it("går vidare till den andra delen när delen är hel", () => {
    const res = { "2020ht:1": r("verbal", 1), "2020ht:5": r("verbal", 2) };
    expect(suggestNextPass(EXAM, res, "verbal")).toEqual({
      pass: 2,
      kind: "kvant",
      completesPart: false,
    });
  });

  it("föreslår inget när hela provet är skrivet", () => {
    const res = {
      "2020ht:1": r("verbal", 1),
      "2020ht:2": r("kvant", 2),
      "2020ht:4": r("kvant", 3),
      "2020ht:5": r("verbal", 4),
    };
    expect(suggestNextPass(EXAM, res, "kvant")).toBeNull();
  });
});

describe("secondsLeft", () => {
  it("är null i övningsläge", () => {
    expect(secondsLeft(null, null, 0)).toBeNull();
  });

  it("räknar mot pausens början när passet är pausat", () => {
    expect(secondsLeft(100_000, 40_000, 90_000)).toBe(60);
  });

  it("går aldrig under noll", () => {
    expect(secondsLeft(1_000, null, 5_000)).toBe(0);
  });
});
