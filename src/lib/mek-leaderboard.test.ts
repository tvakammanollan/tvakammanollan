import { describe, expect, it } from "vitest";
import { sumPracticeAnswers } from "./mek-leaderboard";

describe("sumPracticeAnswers", () => {
  it("summerar per användare och sorterar på rätta", () => {
    const res = sumPracticeAnswers([
      { user_id: "a", is_correct: true },
      { user_id: "b", is_correct: true },
      { user_id: "b", is_correct: true },
      { user_id: "a", is_correct: false },
      { user_id: "b", is_correct: false },
    ]);
    expect(res).toEqual([
      { user_id: "b", correct_count: 2, total_count: 3 },
      { user_id: "a", correct_count: 1, total_count: 2 },
    ]);
  });

  it("lika rätta: flest besvarade först, sedan id", () => {
    const res = sumPracticeAnswers([
      { user_id: "c", is_correct: true },
      { user_id: "b", is_correct: true },
      { user_id: "a", is_correct: true },
      { user_id: "a", is_correct: false },
    ]);
    expect(res.map((r) => r.user_id)).toEqual(["a", "b", "c"]);
  });

  it("tom indata ger tom lista", () => {
    expect(sumPracticeAnswers([])).toEqual([]);
  });
});
