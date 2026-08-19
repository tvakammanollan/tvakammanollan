import { describe, it, expect } from "vitest";
import {
  ordDefinition,
  ordText,
  displayCategory,
  formatPercent,
  formatPercentInt,
} from "./sv-format";

describe("ordDefinition", () => {
  it("trimmar och inleder med versal", () => {
    expect(ordDefinition("  vältalig ")).toBe("Vältalig");
  });

  it("hanterar tomt och saknat värde", () => {
    expect(ordDefinition(null)).toBe("");
    expect(ordDefinition(undefined)).toBe("");
    expect(ordDefinition("   ")).toBe("");
  });

  // svenska.se numrerar likstavade uppslagsord och siffran följde med i skrapet.
  describe("homografsiffror", () => {
    it("tar bort siffra som klistrats fast före ett ord", () => {
      expect(ordDefinition("Det att 1ticka.")).toBe("Det att ticka.");
      expect(ordDefinition("2smitta")).toBe("Smitta");
      expect(ordDefinition("uppträda 1kokett")).toBe("Uppträda kokett");
    });

    it("tar bort ensam siffra som blivit kvar sist", () => {
      expect(ordDefinition("ytterligt 1sträng 1")).toBe("Ytterligt sträng");
      expect(ordDefinition("1lag 1")).toBe("Lag");
    });

    it("rör inte mängder eller enheter", () => {
      // "särsk." skrivs ut av förkortningslagret; siffrorna är det som testas.
      expect(ordDefinition("10 000 m2 särsk. för angivande av åkerareal")).toBe(
        "10 000 m2 särskilt för angivande av åkerareal",
      );
    });

    it("rör inte betydelsenumreringen", () => {
      expect(ordDefinition("1. uppsättning egenskaper  2. grundlag")).toBe(
        "1. uppsättning egenskaper  2. grundlag",
      );
    });

    it("rör inte flersiffriga tal på slutet", () => {
      expect(ordDefinition("lag stiftad år 1809")).toBe("Lag stiftad år 1809");
    });
  });

  describe("html-entiteter", () => {
    it("avkodar hex, decimal och namngivna", () => {
      // Avkodningen sker före utskrivningen, så "†" hinner bli "föråldrat" —
      // att det står där bevisar att entiteten lästes.
      expect(ordDefinition("(&#x2020;) i fråga om")).toBe("(föråldrat) i fråga om");
      expect(ordDefinition("&#8224; märke")).toBe("Föråldrat: märke");
      expect(ordDefinition("ett &amp; annat")).toBe("Ett & annat");
    });

    it("lämnar okända entiteter orörda", () => {
      expect(ordDefinition("&hittepa; ord")).toBe("&hittepa; ord");
    });
  });

  it("tar bort länkar som följt med in i texten", () => {
    expect(ordDefinition("anger att något gäller https://www.saob.se/e/E_0221")).toBe(
      "Anger att något gäller",
    );
  });
});

describe("ordText", () => {
  it("normaliserar till gemener och enkla mellanslag", () => {
    expect(ordText("  FÅ  SITT   LYSTMÄTE ")).toBe("få sitt lystmäte");
  });
});

/**
 * De två procenthjälparna tar olika sorters tal trots snarlika namn, och det
 * har redan kostat en bugg: provresultatet visade "0.375 % rätt" i stället för
 * "38 %" eftersom kvoten gick till formatPercentInt. Kontrakten pinnas här.
 */
describe("procentformatering", () => {
  it("formatPercent tar en kvot 0–1 och gör om den till procent", () => {
    expect(formatPercent(0.375)).toBe("38 %");
    expect(formatPercent(0.72)).toBe("72 %");
    expect(formatPercent(0)).toBe("0 %");
    expect(formatPercent(1)).toBe("100 %");
  });

  it("formatPercentInt tar ett färdigt procenttal", () => {
    expect(formatPercentInt(38)).toBe("38 %");
    expect(formatPercentInt(100)).toBe("100 %");
  });

  it("ger tankstreck för saknade värden i stället för NaN", () => {
    expect(formatPercent(null)).toBe("—");
    expect(formatPercent(undefined)).toBe("—");
    expect(formatPercent(Number.NaN)).toBe("—");
    expect(formatPercentInt(null)).toBe("—");
  });
});

describe("displayCategory", () => {
  it("visar LAS som LÄS", () => {
    expect(displayCategory("LAS")).toBe("LÄS");
  });

  it("lämnar redan visningsklara koder orörda", () => {
    expect(displayCategory("ORD")).toBe("ORD");
    expect(displayCategory("MEK")).toBe("MEK");
  });
});
