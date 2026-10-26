import { describe, expect, it } from "vitest";
import {
  rankProvTotals,
  sumProvAttempts,
  type ProvAttemptRow,
  type ProvTotals,
} from "./prov-leaderboard";

function pass(
  user_id: string,
  term: string,
  score: number,
  mode: "prov" | "ova" = "prov",
): ProvAttemptRow {
  return { user_id, term, score, total: 40, mode };
}

function totals(user_id: string, passes: number, correct: number): ProvTotals {
  return { user_id, passes, exams: 1, timed: 0, correct, questions: passes * 40 };
}

describe("sumProvAttempts", () => {
  it("summerar pass, uppgifter och provtillfällen per spelare", () => {
    const rows = [
      pass("a", "2024ht", 30),
      pass("a", "2024ht", 28),
      pass("a", "2023vt", 25, "ova"),
      pass("b", "2024ht", 10),
    ];
    const out = sumProvAttempts(rows);
    const a = out.find((t) => t.user_id === "a")!;
    expect(a).toMatchObject({ passes: 3, exams: 2, timed: 2, correct: 83, questions: 120 });
    expect(out.find((t) => t.user_id === "b")).toMatchObject({ passes: 1, exams: 1, timed: 1 });
  });

  it("kastar rader som inte håller i stället för att smitta summan", () => {
    const rows: ProvAttemptRow[] = [
      pass("a", "2024ht", 30),
      { user_id: "a", term: "2024ht", score: Number.NaN, total: 40, mode: "prov" },
      { user_id: "a", term: "2024ht", score: 5, total: 0, mode: "prov" },
    ];
    expect(sumProvAttempts(rows)[0]).toMatchObject({ passes: 1, correct: 30, questions: 40 });
  });

  it("klampar rätt till antalet uppgifter", () => {
    const rows = [{ user_id: "a", term: "2024ht", score: 99, total: 40, mode: "prov" as const }];
    expect(sumProvAttempts(rows)[0].correct).toBe(40);
  });
});

describe("rankProvTotals", () => {
  it("rankar på antal skrivna pass, inte på träffsäkerhet", () => {
    // Siffrorna är hämtade ur skarpa data 2026-10-26: den som skrivit 116 pass
    // ska stå över den som skrivit ett enda och fick 29 av 40 rätt. Listan
    // mäter hur mycket någon nött, och det är ett medvetet val.
    const ranked = rankProvTotals([
      totals("ett-bra-pass", 1, 29),
      totals("mest-skrivna", 116, 3530),
      totals("arton-pass", 18, 456),
    ]);
    expect(ranked.map((r) => r.user_id)).toEqual(["mest-skrivna", "arton-pass", "ett-bra-pass"]);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it("skiljer lika många pass på antal rätta, sedan på id", () => {
    const ranked = rankProvTotals([totals("b", 5, 100), totals("a", 5, 100), totals("c", 5, 150)]);
    expect(ranked.map((r) => r.user_id)).toEqual(["c", "a", "b"]);
  });

  it("räknar ut rå träffsäkerhet i hela procent", () => {
    expect(rankProvTotals([totals("a", 1, 29)])[0].accuracy).toBe(73);
    expect(rankProvTotals([{ ...totals("a", 0, 0), questions: 0 }])[0].accuracy).toBe(0);
  });
});
