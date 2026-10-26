import { describe, expect, it } from "vitest";
import { type Produktzon, zonDekor, zonForPath, zonText, zonYta } from "./produktzon";

const ZONER: Produktzon[] = ["prov", "duell", "mek", "ord"];

describe("zonYta", () => {
  it("ger varje zon en egen färg", () => {
    const farger = ZONER.map((z) => zonYta[z]);
    expect(new Set(farger).size).toBe(ZONER.length);
  });

  it("pekar på tokens, aldrig på hårdkodad hex", () => {
    for (const z of ZONER) {
      expect(zonYta[z]).toMatch(/^var\(--[a-z-]+\)$/);
      expect(zonText[z]).toMatch(/^var\(--[a-z-]+\)$/);
    }
  });

  it("har text definierad för varje zon", () => {
    for (const z of ZONER) {
      expect(zonText[z]).toBeTruthy();
    }
  });

  it("ger Plum ljus text, de tre ljusa ytorna mörk", () => {
    expect(zonText.mek).toBe("var(--on-brand)");
    expect(zonText.prov).toBe("var(--cream)");
    expect(zonText.duell).toBe("var(--cream)");
    expect(zonText.ord).toBe("var(--cream)");
  });
});

describe("zonDekor", () => {
  it("använder aldrig Plum som dekorform", () => {
    // Formerna ligger bakom rubriken och överlappar den på smala skärmar.
    // En mörk form där ger mörk text på nästan svart. Plum hör hemma på
    // fyllda ytor, inte bakom text.
    for (const z of ZONER) {
      expect(zonDekor[z]).not.toBe("var(--plum)");
    }
  });

  it("ger MEK sin ljusa släkting i stället", () => {
    expect(zonYta.mek).toBe("var(--plum)");
    expect(zonDekor.mek).toBe("var(--lavender)");
  });

  it("låter de ljusa zonerna behålla sin egen färg", () => {
    expect(zonDekor.prov).toBe(zonYta.prov);
    expect(zonDekor.duell).toBe(zonYta.duell);
    expect(zonDekor.ord).toBe(zonYta.ord);
  });
});

describe("zonForPath", () => {
  it("känner igen de fyra zonernas ingångar", () => {
    expect(zonForPath("/gamla-prov")).toBe("prov");
    expect(zonForPath("/ordlista")).toBe("ord");
    expect(zonForPath("/mek-ovning")).toBe("mek");
    expect(zonForPath("/leaderboard")).toBe("duell");
  });

  it("följer med ner i undersidorna", () => {
    expect(zonForPath("/gamla-prov/2026vt/2")).toBe("prov");
    expect(zonForPath("/ordlista/bokstav/s")).toBe("ord");
    expect(zonForPath("/ordlista/skrodera")).toBe("ord");
    expect(zonForPath("/match/abc-123")).toBe("duell");
    expect(zonForPath("/result/abc-123")).toBe("duell");
  });

  it("låter /ordlista vinna över /ord, inte tvärtom", () => {
    // /ord är träningsläget för ord och hör till samma zon, men prefixen
    // överlappar. Faller ordningen om matchar /ord även /ordlista, vilket
    // hade varit harmlöst här men inte om de två någonsin skiljs åt.
    expect(zonForPath("/ord")).toBe("ord");
    expect(zonForPath("/ordlista")).toBe("ord");
  });

  it("ger null för sidor som inte är en produktyta", () => {
    expect(zonForPath("/")).toBeNull();
    expect(zonForPath("/guider")).toBeNull();
    expect(zonForPath("/forum")).toBeNull();
    expect(zonForPath("/integritetspolicy")).toBeNull();
    expect(zonForPath("/hogskoleprovet-normering")).toBeNull();
  });

  it("matchar inte på en adress som bara börjar med samma bokstäver", () => {
    expect(zonForPath("/ordning")).toBeNull();
    expect(zonForPath("/matcher-i-siffror")).toBeNull();
  });

  it("bryr sig inte om skiftläge", () => {
    expect(zonForPath("/Gamla-Prov")).toBe("prov");
  });
});
