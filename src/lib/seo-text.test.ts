import { describe, it, expect } from "vitest";
import {
  trimToWord,
  sentencesWithin,
  describeWithin,
  fitTitle,
  TITLE_MAX,
  DESCRIPTION_MAX,
} from "./seo-text";

describe("trimToWord", () => {
  it("lämnar text som redan ryms orörd, utan ellips", () => {
    expect(trimToWord("kort text", 40)).toBe("kort text");
  });

  it("kapar vid ordgräns, aldrig mitt i ett ord", () => {
    const out = trimToWord("Öva på riktiga DTK-uppgifter med facit", 22);
    expect(out.endsWith("…")).toBe(true);
    expect(out).not.toMatch(/uppg…$/);
    expect(out.length).toBeLessThanOrEqual(22);
  });

  it("räknar in ellipsen i budgeten", () => {
    for (const max of [10, 17, 25, 40]) {
      expect(
        trimToWord("ett ganska långt stycke text som måste kapas", max).length,
      ).toBeLessThanOrEqual(max);
    }
  });

  it("lämnar inte skiljetecken hängande före ellipsen", () => {
    expect(trimToWord("en mening, med komma här", 12)).not.toMatch(/[,\s]…$/);
  });
});

describe("sentencesWithin", () => {
  const text = "DTK mäter hur snabbt du läser av data. Det är tidspressat. Vana avgör allt.";

  it("lämnar text som ryms orörd", () => {
    expect(sentencesWithin(text, 200)).toBe(text);
  });

  it("tar hela meningar, inte halva", () => {
    const out = sentencesWithin(text, 60);
    expect(out).toBe("DTK mäter hur snabbt du läser av data. Det är tidspressat.");
    expect(out.length).toBeLessThanOrEqual(60);
  });

  it("faller tillbaka på ordgräns när inte ens första meningen ryms", () => {
    const out = sentencesWithin(text, 20);
    expect(out.length).toBeLessThanOrEqual(20);
    expect(out.endsWith("…")).toBe(true);
  });
});

describe("describeWithin", () => {
  // Regressionen: intro.slice(0, 150) gav "…riktiga DTK-uppg Gratis och utan
  // inloggning." på alla åtta övningssidorna.
  it("kapar aldrig mitt i ett ord före svansen", () => {
    const intro =
      "DTK mäter hur snabbt och rätt du läser av data ur diagram, tabeller och kartor. " +
      "Det är ett tidspressat delprov där vana avgör. Öva på riktiga DTK-uppgifter med facit.";
    const out = describeWithin(intro, "Gratis och utan inloggning.");
    expect(out.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
    expect(out.endsWith("Gratis och utan inloggning.")).toBe(true);
    expect(out).not.toMatch(/-uppg Gratis/);
  });

  it("offrar aldrig svansen", () => {
    const out = describeWithin("x".repeat(500), "Gratis och utan inloggning.");
    expect(out.endsWith("Gratis och utan inloggning.")).toBe(true);
  });
});

describe("fitTitle", () => {
  it("tar med allt som ryms", () => {
    const t = fitTitle("Höstprovet 2025 provpass 1 – XYZ, KVA, NOG, DTK", "med facit");
    expect(t).toBe("Höstprovet 2025 provpass 1 – XYZ, KVA, NOG, DTK med facit");
    expect(t.length).toBeLessThanOrEqual(TITLE_MAX);
  });

  // Varumärket är svansen som tål att förloras — Google skriver ofta dit
  // sajtnamnet ändå, härlett ur og:site_name.
  it("offrar den sist angivna svansen först", () => {
    const t = fitTitle("Vårprovet 2021 (13 mars) provpass 1 – ORD, LÄS, MEK, ELF", "med facit");
    expect(t.length).toBeLessThanOrEqual(TITLE_MAX);
    expect(t).toBe("Vårprovet 2021 (13 mars) provpass 1 – ORD, LÄS, MEK, ELF");
  });

  it("håller sig alltid inom budgeten när kärnan gör det", () => {
    const t = fitTitle("Kort kärna", "med facit", "· Tvåkommanollan");
    expect(t.length).toBeLessThanOrEqual(TITLE_MAX);
    expect(t).toContain("Tvåkommanollan");
  });
});
