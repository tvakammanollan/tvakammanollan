import { describe, it, expect } from "vitest";
import { addRange, removeAt, segmentParagraph, highlightScope, snapToWords } from "./highlights";

const R = (p: number, start: number, end: number) => ({ p, start, end });

describe("addRange", () => {
  it("lägger till en markering", () => {
    expect(addRange([], R(0, 5, 10))).toEqual([R(0, 5, 10)]);
  });

  it("slår ihop överlappande markeringar i samma stycke", () => {
    const list = addRange([R(0, 5, 10)], R(0, 8, 15));
    expect(list).toEqual([R(0, 5, 15)]);
  });

  it("slår ihop markeringar som ligger kant i kant", () => {
    const list = addRange([R(0, 0, 5)], R(0, 5, 9));
    expect(list).toEqual([R(0, 0, 9)]);
  });

  it("slår ihop flera fält som en ny markering spänner över", () => {
    const list = addRange([R(0, 0, 3), R(0, 10, 13), R(0, 20, 23)], R(0, 2, 21));
    expect(list).toEqual([R(0, 0, 23)]);
  });

  it("håller isär stycken — samma offset i olika stycken är olika ställen", () => {
    const list = addRange([R(0, 5, 10)], R(1, 5, 10));
    expect(list).toEqual([R(0, 5, 10), R(1, 5, 10)]);
  });

  it("ignorerar tomma markeringar (klick utan drag)", () => {
    expect(addRange([], R(0, 7, 7))).toEqual([]);
    expect(addRange([], R(0, 9, 4))).toEqual([]);
  });
});

describe("removeAt", () => {
  it("tar bort fältet som täcker punkten", () => {
    expect(removeAt([R(0, 5, 10), R(0, 20, 25)], 0, 7)).toEqual([R(0, 20, 25)]);
  });

  it("lämnar allt orört när punkten ligger utanför", () => {
    const list = [R(0, 5, 10)];
    expect(removeAt(list, 0, 12)).toEqual(list);
  });

  it("räknar slutet som utanför, så att intilliggande fält inte råkar med", () => {
    expect(removeAt([R(0, 5, 10)], 0, 10)).toEqual([R(0, 5, 10)]);
  });

  it("tar bara bort i rätt stycke", () => {
    expect(removeAt([R(1, 5, 10)], 0, 7)).toEqual([R(1, 5, 10)]);
  });
});

describe("segmentParagraph", () => {
  const text = "Den svenska modellen bygger på samverkan.";

  it("ger hela stycket omarkerat när inget är markerat", () => {
    expect(segmentParagraph(text, [], 0)).toEqual([{ text, marked: false, start: 0 }]);
  });

  it("delar upp texten runt en markering", () => {
    const segs = segmentParagraph(text, [R(0, 4, 11)], 0);
    expect(segs.map((s) => s.text)).toEqual(["Den ", "svenska", " modellen bygger på samverkan."]);
    expect(segs.map((s) => s.marked)).toEqual([false, true, false]);
  });

  it("behåller markering som börjar på tecken noll", () => {
    const segs = segmentParagraph(text, [R(0, 0, 3)], 0);
    expect(segs[0]).toEqual({ text: "Den", marked: true, start: 0 });
  });

  it("bär med startoffset så att suddgummit vet var man klickade", () => {
    const segs = segmentParagraph(text, [R(0, 4, 11)], 0);
    expect(segs[1].start).toBe(4);
    expect(segs[2].start).toBe(11);
  });

  it("klipper markeringar som sträcker sig utanför texten", () => {
    const segs = segmentParagraph("kort", [R(0, 2, 999)], 0);
    expect(segs.map((s) => s.text)).toEqual(["ko", "rt"]);
  });

  it("bryr sig bara om markeringar i det egna stycket", () => {
    expect(segmentParagraph(text, [R(1, 0, 5)], 0)).toEqual([{ text, marked: false, start: 0 }]);
  });

  it("hanterar flera markeringar i samma stycke i rätt ordning", () => {
    const segs = segmentParagraph(text, [R(0, 21, 27), R(0, 4, 11)], 0);
    expect(segs.map((s) => s.marked)).toEqual([false, true, false, true, false]);
  });
});

describe("highlightScope", () => {
  it("bygger en nyckel av delarna", () => {
    expect(highlightScope("gamla-prov", "2026vt", 2, 0)).toBe(
      "hp-highlights:2:gamla-prov:2026vt:2:0",
    );
  });

  it("skiljer olika passager åt", () => {
    expect(highlightScope("train", "abc")).not.toBe(highlightScope("train", "abd"));
  });
});

describe("snapToWords", () => {
  const text = "Den svenska modellen bygger på samverkan.";

  it("drar ut en kant som hamnat mitt i ett ord", () => {
    // "sven|ska modellen bygger" → hela "svenska modellen bygger"
    expect(snapToWords(text, 8, 27)).toEqual({ start: 4, end: 27 });
  });

  it("lämnar en markering som redan följer ordgränserna", () => {
    expect(snapToWords(text, 4, 11)).toEqual({ start: 4, end: 11 });
  });

  it("släpper mellanslag i kanterna", () => {
    expect(snapToWords(text, 3, 12)).toEqual({ start: 4, end: 11 });
  });

  it("tar med hela ordet men inte punkten efter", () => {
    expect(snapToWords(text, 33, 36)).toEqual({ start: 31, end: 40 });
  });

  it("ger null för ett klick utan drag och för bara mellanslag", () => {
    expect(snapToWords(text, 7, 7)).toBeNull();
    expect(snapToWords(text, 9, 4)).toBeNull();
    expect(snapToWords(text, 3, 4)).toBeNull();
  });

  it("håller sig inom texten även när offseten ligger utanför", () => {
    expect(snapToWords(text, -5, 999)).toEqual({ start: 0, end: text.length });
  });

  it("räknar å, ä och ö som bokstäver", () => {
    const s = "påverkan är stor";
    expect(snapToWords(s, 2, 5)).toEqual({ start: 0, end: 8 });
  });
});
