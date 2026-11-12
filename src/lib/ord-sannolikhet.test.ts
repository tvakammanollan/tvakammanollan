import { describe, it, expect } from "vitest";
import data from "@/data/ord-sannolikhet.json";
import {
  formatEttPa,
  formatSannolikhet,
  ordSannolikhet,
  sannolikhetSkal,
  termText,
  type OrdSannolikhetPost,
} from "./ord-sannolikhet";

const ORD = data.ord as Record<string, OrdSannolikhetPost>;

describe("formatSannolikhet", () => {
  it("skriver två decimaler från en tiondels procent", () => {
    expect(formatSannolikhet(0.33)).toBe("0,33 %");
    expect(formatSannolikhet(0.1)).toBe("0,10 %");
  });
  it("skriver tre decimaler under det", () => {
    expect(formatSannolikhet(0.022)).toBe("0,022 %");
  });
  it("låtsas inte veta något under en hundradels procent", () => {
    expect(formatSannolikhet(0.0016)).toBe("under 0,01 %");
  });
  it("ger tankstreck för skräp", () => {
    expect(formatSannolikhet(NaN)).toBe("–");
    expect(formatSannolikhet(-1)).toBe("–");
  });
});

describe("formatEttPa", () => {
  it("avrundar till två värdesiffror", () => {
    expect(formatEttPa(0.18)).toBe("1 på 560");
    expect(formatEttPa(0.33)).toBe("1 på 300");
  });
  it("ger tankstreck för noll", () => {
    expect(formatEttPa(0)).toBe("–");
  });
});

describe("termText", () => {
  it("skriver ut terminen", () => {
    expect(termText("2004vt")).toBe("våren 2004");
    expect(termText("2021ht")).toBe("hösten 2021");
    expect(termText("2022vtb")).toBe("våren 2022");
  });
});

describe("sannolikhetSkal", () => {
  it("skiljer nyligen testade ord från gamla", () => {
    expect(sannolikhetSkal({ p: 0.001, band: 1, typ: 5, senast: "2024vt" }, 2026.77)).toContain(
      "inom 10 år",
    );
    expect(sannolikhetSkal({ p: 0.2, band: 5, typ: 5, senast: "2004vt" }, 2026.77)).toContain(
      "återanvändas",
    );
  });
  it("säger aldrig att ett ord kommer på provet", () => {
    for (const typ of [1, 3, 5]) {
      expect(sannolikhetSkal({ p: 0.01, band: 2, typ }, 2026.77)).not.toMatch(/kommer på/);
    }
  });
});

describe("artefakten", () => {
  const poster = Object.values(ORD);

  it("täcker hela banken", () => {
    expect(poster.length).toBeGreaterThan(8000);
  });
  it("har rimliga tal på varje ord", () => {
    for (const p of poster) {
      expect(p.p).toBeGreaterThan(0);
      expect(p.p).toBeLessThan(1);
      expect([1, 2, 3, 4, 5]).toContain(p.band);
      expect([1, 2, 3, 4, 5]).toContain(p.typ);
    }
  });
  it("summerar till färre ord än ett prov rymmer", () => {
    const summa = poster.reduce((s, p) => s + p.p / 100, 0);
    expect(summa).toBeGreaterThan(0.5);
    expect(summa).toBeLessThan(20);
  });
  it("håller ord från de senaste tio åren nere", () => {
    const farska = poster.filter((p) => p.senast && Number(p.senast.slice(0, 4)) >= 2018);
    expect(farska.length).toBeGreaterThan(100);
    // Under en tjugondel av vad ett gammalt provord får.
    for (const p of farska) expect(p.p).toBeLessThan(0.05);
  });
  it("slår upp ett ord", () => {
    const o = ordSannolikhet("fadäs");
    expect(o?.senast).toBe("2026vt");
    expect(ordSannolikhet("finns-inte-i-banken")).toBeNull();
  });
});
