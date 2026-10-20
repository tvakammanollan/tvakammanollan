import { describe, expect, it } from "vitest";
import {
  displayedVoteCounts,
  EMPTY_TALLY,
  FAVOURED_WEIGHT,
  voteStatus,
  voteWeight,
  weightedShuffle,
  wilsonInterval,
  type VoteTally,
} from "./question-votes";

const t = (over: Partial<VoteTally>): VoteTally => ({ ...EMPTY_TALLY, ...over });

describe("wilsonInterval", () => {
  it("är hela intervallet utan röster", () => {
    expect(wilsonInterval(0, 0)).toEqual([0, 1]);
  });

  it("smalnar av med fler röster", () => {
    const [lo1, hi1] = wilsonInterval(1, 2);
    const [lo2, hi2] = wilsonInterval(50, 100);
    expect(hi2 - lo2).toBeLessThan(hi1 - lo1);
  });
});

describe("voteStatus", () => {
  it("rör ingenting utan röster", () => {
    expect(voteStatus(EMPTY_TALLY)).toBe("neutral");
  });

  // En ensam nedröst, eller tre, får aldrig ta bort en fråga.
  it("begraver inte på några få röster, hur negativa de än är", () => {
    expect(voteStatus(t({ down: 1 }))).toBe("neutral");
    expect(voteStatus(t({ down: 7 }))).toBe("neutral");
  });

  it("begraver när många med säkerhet ogillar frågan", () => {
    expect(voteStatus(t({ down: 8 }))).toBe("buried");
    expect(voteStatus(t({ up: 3, down: 17 }))).toBe("buried");
  });

  it("begraver inte en omstridd fråga", () => {
    expect(voteStatus(t({ up: 10, down: 10 }))).toBe("neutral");
  });

  // Gästkonton går att skapa i obegränsat antal: åtta gästkonton räcker inte.
  it("väger gästernas röster hälften", () => {
    expect(voteStatus(t({ guestDown: 8 }))).toBe("neutral");
    expect(voteStatus(t({ guestDown: 16 }))).toBe("buried");
  });

  it("lyfter en fråga många med säkerhet gillar", () => {
    expect(voteStatus(t({ up: 4 }))).toBe("neutral");
    expect(voteStatus(t({ up: 10 }))).toBe("favoured");
    expect(voteStatus(t({ up: 6, down: 4 }))).toBe("neutral");
  });
});

describe("voteWeight", () => {
  it("ger 0, 1 eller lyftvikten", () => {
    expect(voteWeight(undefined)).toBe(1);
    expect(voteWeight(t({ down: 12 }))).toBe(0);
    expect(voteWeight(t({ up: 12 }))).toBe(FAVOURED_WEIGHT);
  });

  it("följer nettorösterna kontinuerligt, med tak", () => {
    expect(voteWeight(t({ up: 2 }))).toBeCloseTo(2);
    expect(voteWeight(t({ up: 4 }))).toBeCloseTo(4);
    expect(voteWeight(t({ up: 5, down: 1 }))).toBeCloseTo(4);
    expect(voteWeight(t({ down: 2 }))).toBeCloseTo(0.5);
    expect(voteWeight(t({ up: 40 }))).toBe(16);
    // Gäster väger hälften: fyra gästtummar är som två vanliga.
    expect(voteWeight(t({ guestUp: 4 }))).toBeCloseTo(2);
  });

  it("gör att en gillad fråga oftast kommer före en ny", () => {
    let först = 0;
    for (let i = 0; i < 4000; i++) {
      const order = weightedShuffle(["gillad", "ny"], (x) =>
        voteWeight(x === "gillad" ? t({ up: 6 }) : undefined),
      );
      if (order[0] === "gillad") först++;
    }
    // Vikt 8 mot 1 ger 8/9 ≈ 0,89.
    expect(först / 4000).toBeGreaterThan(0.85);
    expect(först / 4000).toBeLessThan(0.93);
  });
});

describe("weightedShuffle", () => {
  it("tar bort vikt 0 och behåller resten", () => {
    const ut = weightedShuffle(["a", "b", "c"], (x) => (x === "b" ? 0 : 1));
    expect(ut.sort()).toEqual(["a", "c"]);
  });

  it("lägger tyngre element först oftare, men inte alltid", () => {
    let seed = 7;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    let tungFörst = 0;
    for (let i = 0; i < 2000; i++) {
      const [först] = weightedShuffle(["lätt", "tung"], (x) => (x === "tung" ? 2.5 : 1), rand);
      if (först === "tung") tungFörst++;
    }
    // P(tung först) = 2.5 / 3.5 ≈ 0.71
    expect(tungFörst / 2000).toBeGreaterThan(0.65);
    expect(tungFörst / 2000).toBeLessThan(0.77);
  });
});

describe("displayedVoteCounts", () => {
  it("räknar in en ny röst", () => {
    expect(displayedVoteCounts({ up: 4, down: 1 }, 0, 1)).toEqual({ up: 5, down: 1 });
  });
  it("flyttar en bytt röst från upp till ned", () => {
    expect(displayedVoteCounts({ up: 4, down: 1 }, 1, -1)).toEqual({ up: 3, down: 2 });
  });
  it("tar bort en återtagen röst", () => {
    expect(displayedVoteCounts({ up: 4, down: 1 }, -1, 0)).toEqual({ up: 4, down: 0 });
  });
  it("går aldrig under noll", () => {
    expect(displayedVoteCounts({ up: 0, down: 0 }, 1, 0)).toEqual({ up: 0, down: 0 });
  });
});
