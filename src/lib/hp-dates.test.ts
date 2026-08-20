import { describe, expect, it } from "vitest";
import {
  HP_DATES,
  HP_DAY_START,
  getNextHpDate,
  hpDateLong,
  hpDateTime,
  stockholmOffset,
} from "./hp-dates";

describe("stockholmOffset", () => {
  it("sommartid börjar sista söndagen i mars", () => {
    // 2026: sista söndagen i mars är den 29:e.
    expect(stockholmOffset("2026-03-28")).toBe("+01:00");
    expect(stockholmOffset("2026-03-29")).toBe("+02:00");
  });

  it("sommartid slutar sista söndagen i oktober", () => {
    // 2026: sista söndagen i oktober är den 25:e.
    expect(stockholmOffset("2026-10-24")).toBe("+02:00");
    expect(stockholmOffset("2026-10-25")).toBe("+01:00");
  });

  it("höstprovet 2025 låg efter bytet — det hårdkodade +02:00 var alltså fel", () => {
    expect(stockholmOffset("2025-10-26")).toBe("+01:00");
  });

  it("provdatumen i listan får rätt offset", () => {
    expect(hpDateTime("2026-10-18", "08:00")).toBe("2026-10-18T08:00:00+02:00");
    expect(hpDateTime("2027-04-10", "17:00")).toBe("2027-04-10T17:00:00+02:00");
  });
});

describe("hpDateLong", () => {
  it("skriver ut veckodag, datum och år på svenska", () => {
    expect(hpDateLong("2026-10-18")).toBe("söndag 18 oktober 2026");
    expect(hpDateLong("2027-04-10")).toBe("lördag 10 april 2027");
  });
});

describe("HP_DATES", () => {
  it("höstprovet ligger på en söndag och vårprovet på en lördag", () => {
    for (const d of HP_DATES) {
      const weekday = new Date(`${d.date}T12:00:00Z`).getUTCDay();
      expect(weekday).toBe(d.session === "höst" ? 0 : 6);
    }
  });

  it("är sorterad i kronologisk ordning", () => {
    const dates = HP_DATES.map((d) => d.date);
    expect([...dates].sort()).toEqual(dates);
  });

  it("anmälan öppnar före den stänger, och stänger före provdagen", () => {
    for (const d of HP_DATES) {
      if (!d.registrationOpens || !d.registrationCloses) continue;
      expect(d.registrationOpens < d.registrationCloses).toBe(true);
      expect(d.registrationCloses < d.date).toBe(true);
    }
  });
});

describe("getNextHpDate", () => {
  it("väljer första provet som ännu inte börjat", () => {
    const next = getNextHpDate(new Date("2026-09-01T00:00:00Z"));
    expect(next?.entry.date).toBe("2026-10-18");
  });

  it("provdagen räknas som passerad när den börjat", () => {
    const start = new Date(hpDateTime("2026-10-18", HP_DAY_START));
    const next = getNextHpDate(new Date(start.getTime() + 1000));
    expect(next?.entry.date).toBe("2027-04-10");
  });

  it("null när alla prov passerat", () => {
    expect(getNextHpDate(new Date("2030-01-01T00:00:00Z"))).toBeNull();
  });
});
