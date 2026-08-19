import { describe, expect, it } from "vitest";
import { isImageQuestion, showQuestionText } from "./math-question";

const BOKSTAVSALT = [
  { id: "A", text: "A" },
  { id: "B", text: "B" },
  { id: "C", text: "C" },
  { id: "D", text: "D" },
];

const RIKTIGA_ALT = [
  { id: "A", text: "Kockgård" },
  { id: "B", text: "Stamgården, nordöstra" },
  { id: "C", text: "Ryssgård" },
  { id: "D", text: "Östra Flintgård" },
];

describe("isImageQuestion", () => {
  it("utsnitt ur provhäftet: alternativen är bara bokstäver", () => {
    // Så här ser en KVA-uppgift ut i beståndet — question_text är
    // PDF-extraktionen av samma sak som bilden visar, och obrukbar.
    expect(isImageQuestion({ image_url: "/prov-bilder/kva.png", options: BOKSTAVSALT })).toBe(true);
  });

  it("löptext med figur: alternativen har egna texter", () => {
    expect(isImageQuestion({ image_url: "/prov-bilder/dtk.png", options: RIKTIGA_ALT })).toBe(
      false,
    );
  });

  it("utan bild är det aldrig en bilduppgift", () => {
    expect(isImageQuestion({ image_url: null, options: BOKSTAVSALT })).toBe(false);
    expect(isImageQuestion({ options: RIKTIGA_ALT })).toBe(false);
  });

  it("ett enda alternativ med riktig text räcker för att texten ska visas", () => {
    const blandat = [
      { id: "A", text: "A" },
      { id: "B", text: "4711" },
    ];
    expect(isImageQuestion({ image_url: "/x.png", options: blandat })).toBe(false);
  });

  it("tomma och saknade alternativ räknas som bilduppgift", () => {
    expect(isImageQuestion({ image_url: "/x.png", options: [] })).toBe(true);
    expect(isImageQuestion({ image_url: "/x.png", options: null })).toBe(true);
    expect(isImageQuestion({ image_url: "/x.png", options: [{ id: "A", text: "  " }] })).toBe(true);
  });

  it("strängalternativ hanteras som objektalternativ", () => {
    expect(isImageQuestion({ image_url: "/x.png", options: ["A", "B", "C", "D"] })).toBe(true);
    expect(isImageQuestion({ image_url: "/x.png", options: ["17", "18"] })).toBe(false);
  });
});

describe("showQuestionText", () => {
  it("döljer den trasiga texten ovanför utsnittet", () => {
    expect(
      showQuestionText({
        question_text: "3 27 x 2 =",
        image_url: "/prov-bilder/xyz.png",
        options: BOKSTAVSALT,
      }),
    ).toBe(false);
  });

  it("visar frågan när bilden bara är ett diagram", () => {
    expect(
      showQuestionText({
        question_text: "Vilken av följande gårdar stämmer med beskrivningen?",
        image_url: "/prov-bilder/dtk.png",
        options: RIKTIGA_ALT,
      }),
    ).toBe(true);
  });

  it("tom text visas aldrig", () => {
    expect(showQuestionText({ question_text: "   ", options: RIKTIGA_ALT })).toBe(false);
    expect(showQuestionText({ question_text: null, options: RIKTIGA_ALT })).toBe(false);
  });
});
