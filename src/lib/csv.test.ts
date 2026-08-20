import { describe, expect, it } from "vitest";
import { csvField, toCsv } from "./csv";

describe("csvField", () => {
  it("citerar fält som innehåller avgränsare, citattecken eller radbrytning", () => {
    expect(csvField("Anna")).toBe("Anna");
    expect(csvField("Anna; Bengt")).toBe('"Anna; Bengt"');
    expect(csvField('Han sa "hej"')).toBe('"Han sa ""hej"""');
    expect(csvField("rad1\nrad2")).toBe('"rad1\nrad2"');
  });

  it("neutraliserar formelinjektion", () => {
    // Ett telefonnummer i E.164 börjar med +. Utan skyddet räknar Excel ut
    // det som ett tal, och ett fält som börjar med = kan köra kod.
    expect(csvField("+46701234567")).toBe("'+46701234567");
    expect(csvField("=CMD|'/c calc'!A1")).toBe("'=CMD|'/c calc'!A1");
    expect(csvField("-5")).toBe("'-5");
    expect(csvField("@user")).toBe("'@user");
  });

  it("tomma värden blir tomma fält", () => {
    expect(csvField(null)).toBe("");
    expect(csvField(undefined)).toBe("");
    expect(csvField("")).toBe("");
  });
});

describe("toCsv", () => {
  it("skriver BOM, semikolon och CRLF", () => {
    const csv = toCsv(["Namn", "Ort"], [["Åsa", "Malmö"]]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toContain("Namn;Ort");
    expect(csv).toContain("\r\n");
    // Åäö ska överleva — det är hela poängen med BOM:en.
    expect(csv).toContain("Åsa");
  });

  it("går att stänga av BOM och byta avgränsare", () => {
    const csv = toCsv(["a", "b"], [[1, 2]], { delimiter: ",", bom: false });
    expect(csv).toBe("a,b\r\n1,2\r\n");
  });
});
