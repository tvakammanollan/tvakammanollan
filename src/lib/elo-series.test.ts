import { describe, expect, it } from "vitest";
import { buildEloSeries, type EloHistoryRow, eloTickUnit, eloSeriesSpan } from "./elo-series";

function rad(
  match_type: string,
  elo_after: number,
  elo_change: number,
  created_at: string,
): EloHistoryRow {
  return { match_type, elo_after, elo_change, created_at };
}

describe("buildEloSeries", () => {
  it("håller båda linjerna kontinuerliga över den andras matcher", () => {
    // Buggen: en verbal match gav en punkt där bara `verbal` var satt, så
    // mattelinjen fick ett hål och drogs rakt över det.
    const s = buildEloSeries([
      rad("verbal", 1040, 40, "2026-08-01T10:00:00Z"),
      rad("math", 960, -40, "2026-08-02T10:00:00Z"),
      rad("verbal", 1080, 40, "2026-08-03T10:00:00Z"),
    ]);
    expect(s.points.map((p) => [p.verbal, p.math])).toEqual([
      [1040, null], // matte har inte spelats än — inget värde att bära fram
      [1040, 960],
      [1080, 960],
    ]);
  });

  it("sorterar i tidsordning oavsett hur raderna kommer in", () => {
    const s = buildEloSeries([
      rad("verbal", 1080, 40, "2026-08-03T10:00:00Z"),
      rad("verbal", 1040, 40, "2026-08-01T10:00:00Z"),
    ]);
    expect(s.points.map((p) => p.verbal)).toEqual([1040, 1080]);
  });

  it("räknar punkter per del så att 'för lite data' kan sägas per linje", () => {
    const s = buildEloSeries([
      rad("verbal", 1040, 40, "2026-08-01T10:00:00Z"),
      rad("verbal", 1080, 40, "2026-08-02T10:00:00Z"),
      rad("math", 960, -40, "2026-08-03T10:00:00Z"),
    ]);
    expect(s.counts).toEqual({ verbal: 2, math: 1 });
  });

  it("span börjar på värdet FÖRE första matchen", () => {
    // Annars blir "sedan start" alltid noll för den som bara spelat en match.
    const s = buildEloSeries([rad("verbal", 1040, 40, "2026-08-01T10:00:00Z")]);
    expect(s.span.verbal).toEqual({ first: 1000, last: 1040 });
    expect(s.span.math).toBeNull();
  });

  it("två matcher i samma sekund blir en punkt", () => {
    const s = buildEloSeries([
      rad("verbal", 1040, 40, "2026-08-01T10:00:00Z"),
      rad("math", 960, -40, "2026-08-01T10:00:00Z"),
    ]);
    expect(s.points).toHaveLength(1);
    expect(s.points[0]).toMatchObject({ verbal: 1040, math: 960 });
  });

  it("kastar rader som inte går att rita", () => {
    const s = buildEloSeries([
      rad("verbal", 1040, 40, "2026-08-01T10:00:00Z"),
      rad("skräp", 1, 1, "2026-08-02T10:00:00Z"),
      rad("math", Number.NaN, 0, "2026-08-03T10:00:00Z"),
      rad("math", 980, -20, "inte-ett-datum"),
    ]);
    expect(s.points).toHaveLength(1);
    expect(s.counts).toEqual({ verbal: 1, math: 0 });
  });

  it("tom historik ger tom serie i stället för att krascha", () => {
    const s = buildEloSeries([]);
    expect(s.points).toEqual([]);
    expect(s.counts).toEqual({ verbal: 0, math: 0 });
    expect(s.span).toEqual({ verbal: null, math: null });
  });
});

describe("eloTickUnit — axelns upplösning följer spannet", () => {
  const DYGN = 24 * 60 * 60 * 1000;

  it("tre matcher samma kväll ger klockslag, inte fyra likadana datum", () => {
    // Buggen: etiketterna var alltid ett datum, så en kväll gav
    // "21 aug. 21 aug. 21 aug. 21 aug." och axeln sa ingenting.
    expect(eloTickUnit(3 * 60 * 60 * 1000)).toBe("time");
    expect(eloTickUnit(0)).toBe("time");
  });

  it("några dagar till några månader ger datum", () => {
    expect(eloTickUnit(3 * DYGN)).toBe("date");
    expect(eloTickUnit(90 * DYGN)).toBe("date");
  });

  it("mer än ett år ger månad och år", () => {
    expect(eloTickUnit(400 * DYGN)).toBe("month");
  });

  it("gränserna ligger där de ska", () => {
    expect(eloTickUnit(1.5 * DYGN)).toBe("time");
    expect(eloTickUnit(1.5 * DYGN + 1)).toBe("date");
    expect(eloTickUnit(330 * DYGN)).toBe("date");
    expect(eloTickUnit(330 * DYGN + 1)).toBe("month");
  });

  it("ett orimligt spann läses som datum, inte som en krasch", () => {
    expect(eloTickUnit(NaN)).toBe("date");
    expect(eloTickUnit(-1)).toBe("date");
  });
});

describe("eloSeriesSpan", () => {
  const p = (ts: number) => ({ ts });

  it("ger avståndet mellan första och sista punkten", () => {
    expect(eloSeriesSpan([p(1000), p(5000), p(3000)])).toBe(4000);
  });

  it("en enda punkt eller ingen har inget spann", () => {
    expect(eloSeriesSpan([p(1000)])).toBe(0);
    expect(eloSeriesSpan([])).toBe(0);
  });
});
