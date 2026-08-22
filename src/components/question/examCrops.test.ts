import { describe, expect, it } from "vitest";
import { parseStem, parseOptionCrops, parseOptionsImage, optionCropSource } from "./examCrops";

describe("parseStem", () => {
  it("läser en giltig stam-beskärning", () => {
    const caption = JSON.stringify({ stem: [0.1, 0.0, 0.9, 0.3], aspect: 1.29 });
    expect(parseStem(caption)).toEqual({ stem: [0.1, 0.0, 0.9, 0.3], aspect: 1.29 });
  });

  it("ger null för fritext, trasig JSON, saknad eller ogiltig data", () => {
    expect(parseStem("Figur till frågan")).toBeNull();
    expect(parseStem("{trasig")).toBeNull();
    expect(parseStem(null)).toBeNull();
    expect(parseStem(JSON.stringify({ stem: [0.1, 0, 0.9] }))).toBeNull();
    expect(parseStem(JSON.stringify({ stem: [0.1, 0, 0.9, 0.3], aspect: 0 }))).toBeNull();
  });

  it("kolliderar inte med optionsImage-formen", () => {
    const caption = JSON.stringify({ optionsImage: "/x.webp", optionsAspect: 2 });
    expect(parseStem(caption)).toBeNull();
  });
});

describe("parseOptionsImage", () => {
  it("läser en bild med proportion (de 59 av 77 DTK-uppgifterna med koordinater)", () => {
    const caption = JSON.stringify({
      optionsImage: "/prov-bilder/2013ht/p3/29.webp",
      optionsAspect: 2.28,
    });
    expect(parseOptionsImage(caption)).toEqual({
      src: "/prov-bilder/2013ht/p3/29.webp",
      aspect: 2.28,
    });
  });

  it("läser en bild UTAN proportion (de 18 utan per-bokstav-koordinater) som aspect: null", () => {
    // PDF-extraktionen fångade aldrig var varje bokstav sitter — bilden
    // finns, men det går inte att räkna ett utsnitt ur den.
    const caption = JSON.stringify({ optionsImage: "/prov-bilder/2013ht/p3/31.webp" });
    expect(parseOptionsImage(caption)).toEqual({
      src: "/prov-bilder/2013ht/p3/31.webp",
      aspect: null,
    });
  });

  it("en 0 eller negativ aspect räknas som saknad, inte som en giltig proportion", () => {
    const caption = JSON.stringify({ optionsImage: "/x.webp", optionsAspect: 0 });
    expect(parseOptionsImage(caption)?.aspect).toBeNull();
  });

  it("ger null för fritext, trasig JSON eller saknad bild", () => {
    expect(parseOptionsImage("Figur till frågan")).toBeNull();
    expect(parseOptionsImage("{trasig")).toBeNull();
    expect(parseOptionsImage(null)).toBeNull();
    expect(parseOptionsImage(JSON.stringify({ optionsAspect: 2 }))).toBeNull();
  });

  it("kolliderar inte med stem-formen", () => {
    const caption = JSON.stringify({ stem: [0, 0, 1, 0.3], aspect: 1.3 });
    expect(parseOptionsImage(caption)).toBeNull();
  });
});

describe("optionCropSource — var alternativens beskärningar klipps ifrån", () => {
  const stem = { stem: [0.1, 0, 0.9, 0.3] as [number, number, number, number], aspect: 1.29 };

  it("XYZ/KVA: samma bild som stammen, `stem.aspect` som proportion", () => {
    expect(optionCropSource("/prov-bilder/x.webp", stem, null)).toEqual({
      src: "/prov-bilder/x.webp",
      aspect: 1.29,
    });
  });

  it("DTK med koordinater: `optionsImage`, inte `image_url` (diagrammet)", () => {
    // Regressionstest för den faktiska buggen: `image_url` är diagram-
    // uppslaget och innehåller aldrig alternativen. Källan måste vara den
    // EGNA bilden när den finns, aldrig diagrammet — annars klipps
    // "alternativ B" ur ett diagram som inte har det.
    const optionsImage = { src: "/prov-bilder/2013ht/p3/29.webp", aspect: 2.28 };
    expect(optionCropSource("/prov-bilder/2013ht/p3/diagram-1.webp", null, optionsImage)).toEqual({
      src: "/prov-bilder/2013ht/p3/29.webp",
      aspect: 2.28,
    });
  });

  it("optionsImage vinner över stem när båda skulle finnas", () => {
    const optionsImage = { src: "/eget.webp", aspect: 2 };
    expect(optionCropSource("/image_url.webp", stem, optionsImage)).toEqual({
      src: "/eget.webp",
      aspect: 2,
    });
  });

  it("optionsImage utan aspect (de 18) ger ingen källa — beskärningsmatte kräver en proportion", () => {
    const optionsImage = { src: "/prov-bilder/2013ht/p3/31.webp", aspect: null };
    expect(optionCropSource("/diagram.webp", null, optionsImage)).toBeNull();
  });

  it("varken stem eller optionsImage ger null", () => {
    expect(optionCropSource("/x.webp", null, null)).toBeNull();
    expect(optionCropSource(null, null, null)).toBeNull();
  });

  it("stem utan image_url ger null — CropView kan inte klippa ur en bild som inte finns", () => {
    expect(optionCropSource(null, stem, null)).toBeNull();
  });
});

describe("parseOptionCrops (regression: gäller lika för optionsImage-formen)", () => {
  it("halva uppsättningar faller till null, oavsett vilken bild de hör till", () => {
    const options = [
      { id: "A", text: "A", crop: [0, 0, 1, 0.2] },
      { id: "B", text: "B" },
    ];
    expect(parseOptionCrops(options)).toBeNull();
  });

  it("klampar ett sista alternativ som sträcker sig till bildkanten och är mycket högre än sina syskon", () => {
    // Regressionstest mot skarpa data (2026-08-22, 19 uppgifter XYZ/KVA/NOG/DTK):
    // importen satte sista alternativets y1 till hela bildens botten i stället
    // för där svaret faktiskt tar slut. Exempel: 2017ht/p5/7.webp, uppgift
    // "Hur många biljetter...", där D ("5600") fick dy=0,712 mot syskonens 0,041
    // (17× högre) — en enorm, nästan tom knapp med "5600" hopklämt högst upp.
    const options = [
      { id: "A", text: "A", crop: [0.12, 0.288, 1, 0.329] },
      { id: "B", text: "B", crop: [0.12, 0.329, 1, 0.37] },
      { id: "C", text: "C", crop: [0.12, 0.37, 1, 0.411] },
      { id: "D", text: "D", crop: [0.122, 0.4106, 1, 1] },
    ];
    const crops = parseOptionCrops(options)!;
    expect(crops[0]).toEqual([0.12, 0.288, 1, 0.329]);
    expect(crops[1]).toEqual([0.12, 0.329, 1, 0.37]);
    expect(crops[2]).toEqual([0.12, 0.37, 1, 0.411]);
    // Klampad till syskonens medianhöjd (0,041) × 1,3 marginal, inte längre
    // ända ner till bildkanten.
    const [x0, y0, x1, y1] = crops[3];
    expect([x0, y0, x1]).toEqual([0.122, 0.4106, 1]);
    expect(y1).toBeCloseTo(0.4106 + 0.041 * 1.3, 5);
    expect(y1).toBeLessThan(1);
  });

  it("rör inte alternativ som redan är i linje med sina syskon, även om sista når bildkanten", () => {
    const options = [
      { id: "A", text: "A", crop: [0.12, 0.1, 1, 0.3] },
      { id: "B", text: "B", crop: [0.12, 0.3, 1, 0.5] },
      { id: "C", text: "C", crop: [0.12, 0.5, 1, 0.7] },
      { id: "D", text: "D", crop: [0.12, 0.7, 1, 1] },
    ];
    expect(parseOptionCrops(options)).toEqual(options.map((o) => o.crop));
  });

  it("rör inte ett sista alternativ som inte når bildkanten, hur högt det än är", () => {
    const options = [
      { id: "A", text: "A", crop: [0.12, 0.1, 1, 0.15] },
      { id: "B", text: "B", crop: [0.12, 0.15, 1, 0.2] },
      { id: "C", text: "C", crop: [0.12, 0.2, 1, 0.6] }, // legitimt hög, men slutar inte vid kanten
    ];
    expect(parseOptionCrops(options)).toEqual(options.map((o) => o.crop));
  });
});
