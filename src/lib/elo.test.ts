import { describe, expect, it } from "vitest";
import { displayElo, initials } from "./elo";
import { applyEloFloor, calcNewElo, kFactor } from "./match.server";
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
  it("lika motstånd: vinst +48, förlust −48, halvpoäng ±0 (K=96)", () => {
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

describe("applyEloFloor — snabb inlämning ger ingen vinst, men kostar alltid", () => {
  it("en förlust dras i sin helhet även när matchen gick orimligt fort", () => {
    // Buggen: golvet hoppade över HELA ELO-uträkningen, så en förlorad
    // snabbmatch var gratis — och matchen fick varken vinnare eller
    // ELO-historik. Se `processMatchResultServer`.
    const förlust = calcNewElo(1000, 1000, 0); // 952
    expect(applyEloFloor(1000, förlust, true)).toBe(952);
    expect(applyEloFloor(1000, förlust, false)).toBe(952);
  });

  it("en vinst klampas till ±0 när matchen gick orimligt fort", () => {
    const vinst = calcNewElo(1000, 1000, 1); // 1048
    expect(applyEloFloor(1000, vinst, true)).toBe(1000);
    expect(applyEloFloor(1000, vinst, false)).toBe(1048);
  });

  it("klampen kan aldrig höja någons ELO", () => {
    for (const gammal of [600, 1000, 1500, 2000])
      for (const ny of [600, 900, 1000, 1100, 2200])
        expect(applyEloFloor(gammal, ny, true)).toBeLessThanOrEqual(gammal);
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

describe("displayElo (talet i navbaren)", () => {
  it("bara verbal spelad: visar verbal, inte den orörda 1000:an i matte", () => {
    expect(
      displayElo({ elo_verbal: 963, elo_math: 1000, matches_verbal: 1, matches_math: 0 }),
    ).toEqual({ elo: 963, track: "verbal" });
  });

  it("bara matte spelad: visar matte", () => {
    expect(
      displayElo({ elo_verbal: 1000, elo_math: 954, matches_verbal: 0, matches_math: 1 }),
    ).toEqual({ elo: 954, track: "math" });
  });

  it("båda spelade: högsta vinner och grenen följer med", () => {
    expect(
      displayElo({ elo_verbal: 1236, elo_math: 1449, matches_verbal: 27, matches_math: 48 }),
    ).toEqual({ elo: 1449, track: "math" });
  });

  it("oavgjort ger ±0 — räkningen, inte ELO:t, avgör att grenen är spelad", () => {
    expect(
      displayElo({ elo_verbal: 1000, elo_math: 952, matches_verbal: 1, matches_math: 1 }),
    ).toEqual({ elo: 1000, track: "verbal" });
  });

  it("lika i båda: ingen etikett, för grenen säger inget", () => {
    expect(
      displayElo({ elo_verbal: 1000, elo_math: 1000, matches_verbal: 0, matches_math: 0 }),
    ).toEqual({ elo: 1000, track: null });
  });

  it("utan räkning faller den tillbaka på högsta av de två", () => {
    expect(displayElo({ elo_verbal: 963, elo_math: 1000 })).toEqual({ elo: 1000, track: "math" });
  });
});
