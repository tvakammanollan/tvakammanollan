import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS, computeAchievements, type AchievementStats } from "./achievements";

const ZERO: AchievementStats = {
  games_played: 0,
  wins: 0,
  perfect_matches: 0,
  longest_streak: 0,
  peak_elo: 0,
  friends: 0,
  words_done: 0,
};

describe("computeAchievements", () => {
  it("noll-stats → allt låst, progress 0", () => {
    const res = computeAchievements(ZERO);
    expect(res).toHaveLength(ACHIEVEMENTS.length);
    expect(res.every((a) => !a.unlocked)).toBe(true);
    expect(res.every((a) => a.progress === 0)).toBe(true);
  });

  it("första matchen låser upp first_match", () => {
    const res = computeAchievements({ ...ZERO, games_played: 1 });
    expect(res.find((a) => a.id === "first_match")?.unlocked).toBe(true);
    expect(res.find((a) => a.id === "ten_matches")?.unlocked).toBe(false);
  });

  it("ord-trappan: 100 ord låser words_100, ger 20% på words_500", () => {
    const res = computeAchievements({ ...ZERO, words_done: 100 });
    expect(res.find((a) => a.id === "words_100")?.unlocked).toBe(true);
    const w500 = res.find((a) => a.id === "words_500");
    expect(w500?.unlocked).toBe(false);
    expect(w500?.progress).toBe(20);
  });

  it("peak_elo 1600 låser alla tre ELO-nivåerna", () => {
    const res = computeAchievements({ ...ZERO, peak_elo: 1600 });
    for (const id of ["elo_1200", "elo_1400", "elo_1600"]) {
      expect(res.find((a) => a.id === id)?.unlocked).toBe(true);
    }
  });

  it("progress klampas till max 100", () => {
    const res = computeAchievements({ ...ZERO, wins: 9999 });
    expect(res.find((a) => a.id === "first_win")?.progress).toBe(100);
  });
});
