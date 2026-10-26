import { describe, expect, it } from "vitest";
import {
  FACIT,
  delprovFor,
  distansTillGrans,
  facitKnappSynlig,
  passAnswers,
  summaPerDel,
} from "./preliminart-facit";
import { historiskaKrav, termLabel } from "./normering";

describe("FACIT", () => {
  it("har fyra provpass, två av varje slag, med 40 giltiga bokstäver", () => {
    expect(FACIT.passes).toHaveLength(4);
    expect(FACIT.passes.filter((p) => p.kind === "verbal")).toHaveLength(2);
    for (const p of FACIT.passes) expect(passAnswers(p)).toHaveLength(40);
  });

  it("har E bara där delprovet har fem alternativ (ORD och NOG)", () => {
    for (const p of FACIT.passes) {
      passAnswers(p).forEach((l, i) => {
        if (l === "E") expect(["ORD", "NOG"]).toContain(delprovFor(p.kind, i + 1));
      });
    }
  });

  it("pinnar källans första och sista svar per pass", () => {
    const ends = FACIT.passes.map((p) => `${p.pass}:${p.answers[0]}${p.answers[39]}`);
    expect(ends).toEqual(["1:DD", "2:CC", "4:DD", "5:DB"]);
  });
});

describe("delprovFor", () => {
  it("följer provformatet", () => {
    expect(delprovFor("verbal", 10)).toBe("ORD");
    expect(delprovFor("verbal", 11)).toBe("LÄS");
    expect(delprovFor("verbal", 40)).toBe("ELF");
    expect(delprovFor("kvant", 12)).toBe("XYZ");
    expect(delprovFor("kvant", 28)).toBe("NOG");
    expect(delprovFor("kvant", 29)).toBe("DTK");
  });
});

describe("summaPerDel och distansTillGrans", () => {
  it("summerar bara en del där båda passen är ifyllda", () => {
    const s = summaPerDel(FACIT, { 1: 38, 4: 39, 2: 37, 5: null });
    expect(s).toEqual({ kvant: 77, verbal: null });
  });

  it("klampar orimliga värden till 0–40", () => {
    expect(summaPerDel(FACIT, { 1: 55, 4: -3, 2: 0, 5: 0 }).kvant).toBe(40);
  });

  it("räknar avståndet till gränsen", () => {
    expect(distansTillGrans(76, 76)).toBe(0);
    expect(distansTillGrans(73, 76)).toBe(-3);
    expect(distansTillGrans(73, null)).toBeNull();
  });
});

describe("historiskaKrav", () => {
  it("läser UHR:s tabeller, nyast först", () => {
    const k = historiskaKrav(3);
    expect(k).toHaveLength(3);
    expect(k[0]).toEqual({ term: "2026vt", label: "Våren 2026", verbal: 77, kvant: 76 });
    expect(k[1]).toMatchObject({ term: "2025ht", verbal: 76, kvant: 76 });
  });

  it("hoppar över prov där en del saknar tabell", () => {
    // 2019ht saknar den kvantitativa tabellen. Testet stod tidigare på
    // 2025vt, som fick sin kvant-tabell påfylld när tre tabeller lades in
    // för hand 2026-10-24. Påståendet blev då osant utan att något var fel
    // i koden, och testet har varit rött sedan dess.
    expect(historiskaKrav(30).some((k) => k.term === "2019ht")).toBe(false);

    // Invarianten är det som faktiskt ska gälla, oavsett vilken termin som
    // råkar sakna vad. Utan den går testet sönder igen den dag 2019ht får
    // sin tabell, och nästa person får gissa om det är koden eller datan.
    for (const krav of historiskaKrav(30)) {
      expect(typeof krav.verbal).toBe("number");
      expect(typeof krav.kvant).toBe("number");
    }
  });

  it("skiljer på vårens två prov", () => {
    expect(termLabel("2022vtb", "2022-05-07")).toBe("Våren 2022 (maj)");
    expect(termLabel("2025ht", "2025-10-19")).toBe("Hösten 2025");
  });
});

describe("facitKnappSynlig", () => {
  it("syns till och med sista dagen", () => {
    expect(facitKnappSynlig(FACIT, new Date("2026-10-20T12:00:00Z"))).toBe(true);
    expect(facitKnappSynlig(FACIT, new Date("2026-11-30T20:00:00Z"))).toBe(true);
    expect(facitKnappSynlig(FACIT, new Date("2026-12-01T00:00:00Z"))).toBe(false);
  });

  it("tystnar vid ett oläsbart datum", () => {
    expect(facitKnappSynlig({ ...FACIT, promoUntil: "snart" })).toBe(false);
  });
});
