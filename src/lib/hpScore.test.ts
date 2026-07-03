import { describe, expect, it } from "vitest";
import { combinedHpScore, estimateHpScore, hpScoreLabel } from "./hpScore";

describe("estimateHpScore", () => {
  it("mappar ELO till poängband", () => {
    expect(estimateHpScore(600).score).toBe("0.6");
    expect(estimateHpScore(1000).score).toBe("1.0");
    expect(estimateHpScore(1199).score).toBe("1.2");
    expect(estimateHpScore(1650).score).toBe("2.0");
  });
});

describe("combinedHpScore", () => {
  it("är medelvärdet av verbal och matte", () => {
    expect(combinedHpScore(1000, 1000)).toBe("1.0");
    expect(combinedHpScore(1650, 899)).toBe("1.4"); // (2.0 + 0.8) / 2 — 899 = övre kanten av 0.8-bandet
  });
});

describe("hpScoreLabel", () => {
  it("etiketter per gräns", () => {
    expect(hpScoreLabel(0.5)).toBe("Under godkänt");
    expect(hpScoreLabel(0.9)).toBe("Godkänt");
    expect(hpScoreLabel(1.3)).toBe("Bra resultat");
    expect(hpScoreLabel(1.5)).toBe("Mycket bra");
    expect(hpScoreLabel(1.7)).toBe("Utmärkt");
    expect(hpScoreLabel(1.9)).toBe("Toppresultat");
  });
});
