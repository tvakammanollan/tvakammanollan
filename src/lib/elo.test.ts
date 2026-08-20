import { describe, expect, it } from "vitest";
import { initials } from "./elo";
import { calcNewElo, kFactor } from "./match.server";
import { getRankForElo } from "@/types";

describe("kFactor (gränser)", () => {
  it("<1500 → 96, 1500–1800 → 60, >1800 → 30", () => {
    expect(kFactor(1499)).toBe(96);
    expect(kFactor(1500)).toBe(60);
    expect(kFactor(1800)).toBe(60);
    expect(kFactor(1801)).toBe(30);
  });
});

describe("calcNewElo", () => {
  it("lika motstånd: vinst +48, förlust −48, oavgjort ±0 (K=96)", () => {
    expect(calcNewElo(1000, 1000, 1)).toBe(1048);
    expect(calcNewElo(1000, 1000, 0)).toBe(952);
    expect(calcNewElo(1000, 1000, 0.5)).toBe(1000);
  });

  it("golvet 600 kan inte underskridas", () => {
    expect(calcNewElo(600, 2000, 0)).toBe(600);
  });

  it("vinst mot mycket starkare ger mer än mot lika", () => {
    const vsEqual = calcNewElo(1000, 1000, 1) - 1000;
    const vsStronger = calcNewElo(1000, 1400, 1) - 1000;
    expect(vsStronger).toBeGreaterThan(vsEqual);
  });
});

describe("getRankForElo (enda rang-skalan)", () => {
  it("gränser: 999 brons, 1000 silver, 1200 guld, 1400 platina, 1600 diamant", () => {
    expect(getRankForElo(999).tier).toBe("brons");
    expect(getRankForElo(1000).tier).toBe("silver");
    expect(getRankForElo(1200).tier).toBe("guld");
    expect(getRankForElo(1400).tier).toBe("platina");
    expect(getRankForElo(1600).tier).toBe("diamant");
  });

  it("startvärdet 1000 ger samma rang överallt (navbar och dashboard)", () => {
    expect(getRankForElo(1000).shortName).toBe("Silver");
  });

  it("täcker hela spannet utan hål — varje ELO från golvet får en rang", () => {
    for (let elo = 600; elo <= 2400; elo += 1) {
      expect(getRankForElo(elo)).toBeDefined();
    }
  });
});

describe("initials", () => {
  it("tar två alfanumeriska tecken, versaler, ?? som fallback", () => {
    expect(initials("niklas")).toBe("NI");
    expect(initials("!!")).toBe("??");
  });

  it("behåller å, ä och ö i stället för att stryka dem", () => {
    // Med [^a-zA-Z0-9] föll bokstaven bort och "Åke" blev "KE".
    expect(initials("Åke")).toBe("ÅK");
    expect(initials("Öberg")).toBe("ÖB");
    expect(initials("äppelmos")).toBe("ÄP");
  });

  it("hoppar över mellanslag och skiljetecken", () => {
    expect(initials("Gäst kantarell")).toBe("GÄ");
    expect(initials("lina_p")).toBe("LI");
  });
});
