import { describe, expect, it } from "vitest";
import {
  FACIT,
  besvaradeFragor,
  delprovFor,
  distansTillGrans,
  passAnswers,
  summaPerDel,
} from "./preliminart-facit";
import {
  EMPTY_FACIT_PROMO_STATE as E,
  FACIT_PATH,
  facitPromoDue,
  parseFacitPromoState,
} from "./facit-promo";

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

describe("besvaradeFragor", () => {
  it("döljer obesvarade frågor", () => {
    expect(besvaradeFragor(FACIT).every((q) => q.svar.trim())).toBe(true);
  });
});

describe("facitPromoDue", () => {
  const term = "2026ht";
  const until = "2026-11-30";
  const inne = new Date("2026-10-19T12:00:00Z");

  it("visas en gång per prov", () => {
    expect(facitPromoDue(E, term, until, "/", inne)).toBe(true);
    expect(facitPromoDue({ ...E, shownTerm: term }, term, until, "/", inne)).toBe(false);
    expect(facitPromoDue({ ...E, shownTerm: "2026vt" }, term, until, "/", inne)).toBe(true);
  });

  it("visas aldrig på facitsidan själv", () => {
    expect(facitPromoDue(E, term, until, FACIT_PATH, inne)).toBe(false);
  });

  it("tystnar efter sista dagen", () => {
    expect(facitPromoDue(E, term, until, "/", new Date("2026-11-30T20:00:00Z"))).toBe(true);
    expect(facitPromoDue(E, term, until, "/", new Date("2026-12-01T00:00:00Z"))).toBe(false);
  });

  it("läser trasig lagring som ett rent blad", () => {
    expect(parseFacitPromoState("{inte json")).toEqual(E);
    expect(parseFacitPromoState(JSON.stringify({ version: 99, shownTerm: term }))).toEqual(E);
  });
});
