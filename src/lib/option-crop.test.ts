import { describe, expect, it } from "vitest";
import { cropStyle, isCrop, optionCrop } from "./option-crop";

describe("isCrop", () => {
  it("godtar fyra andelar mellan 0 och 1", () => {
    expect(isCrop([0.2669, 0.5914, 1, 0.6837])).toBe(true);
    expect(isCrop([0, 0, 1, 1])).toBe(true);
  });

  it("avvisar allt annat", () => {
    expect(isCrop(null)).toBe(false);
    expect(isCrop([0, 0, 1])).toBe(false);
    expect(isCrop([0, 0, 1, 2])).toBe(false); // utanför bilden
    expect(isCrop([0, 0, 1, -0.1])).toBe(false);
    expect(isCrop(["0", "0", "1", "1"])).toBe(false);
    expect(isCrop([0, 0, 1, Number.NaN])).toBe(false);
  });
});

describe("optionCrop", () => {
  it("plockar ut utsnittet ur ett alternativ", () => {
    expect(optionCrop({ id: "A", text: "A", crop: [0, 0.5, 1, 0.6] })).toEqual([0, 0.5, 1, 0.6]);
  });

  it("ger null när alternativet är text", () => {
    expect(optionCrop({ id: "A", text: "Kockgård" })).toBeNull();
    expect(optionCrop("Kockgård")).toBeNull();
    expect(optionCrop(null)).toBeNull();
  });
});

describe("cropStyle", () => {
  it("förstorar bilden så utsnittet fyller rutan", () => {
    // Ett utsnitt på halva bredden och en fjärdedel av höjden ska skalas
    // 200 % respektive 400 %.
    const s = cropStyle("/bild.png", [0, 0, 0.5, 0.25]);
    expect(s.backgroundSize).toBe("200% 400%");
    expect(s.backgroundImage).toBe('url("/bild.png")');
    expect(s.backgroundRepeat).toBe("no-repeat");
  });

  it("positionerar på andelen av det som ligger utanför rutan", () => {
    // Utsnittet är halva bilden och börjar på halva vägen in: allt som är
    // kvar utanför ligger till höger, alltså 100 %.
    const s = cropStyle("/bild.png", [0.5, 0, 1, 1]);
    expect(s.backgroundPosition).toBe("100% 0%");
  });

  it("delar inte med noll när utsnittet täcker hela bredden", () => {
    // Det vanligaste fallet i datan: alternativen ligger på egna rader och
    // spänner över hela bilden i sidled.
    const s = cropStyle("/bild.png", [0, 0.5914, 1, 0.6837]);
    expect(s.backgroundPosition.startsWith("0%")).toBe(true);
    expect(s.backgroundPosition).not.toContain("NaN");
    expect(s.backgroundPosition).not.toContain("Infinity");
  });

  it("proportionen räknas ur källbildens verkliga mått", () => {
    // Samma utsnitt har olika form beroende på bilden. Utan måtten blir rutan
    // tiogånger för hög och alternativet ligger i ett stort tomt fält.
    const kvadrat = cropStyle("/bild.png", [0, 0, 1, 0.5], { width: 400, height: 400 });
    expect(kvadrat.aspectRatio).toBe("400 / 200");

    const bred = cropStyle("/bild.png", [0, 0, 1, 0.5], { width: 900, height: 300 });
    expect(bred.aspectRatio).toBe("900 / 150");
  });

  it("utan mått utelämnas proportionen hellre än att gissa", () => {
    expect(cropStyle("/bild.png", [0, 0, 1, 0.5]).aspectRatio).toBeUndefined();
    expect(
      cropStyle("/bild.png", [0, 0, 1, 0.5], { width: 0, height: 0 }).aspectRatio,
    ).toBeUndefined();
  });

  it("ett tomt utsnitt ger inga ogiltiga värden", () => {
    const s = cropStyle("/bild.png", [0.5, 0.5, 0.5, 0.5], { width: 400, height: 400 });
    expect(s.backgroundSize).not.toContain("Infinity");
    expect(s.aspectRatio).not.toBe("0 / 0");
  });
});
