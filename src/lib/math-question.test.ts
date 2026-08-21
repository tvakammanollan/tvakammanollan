import { describe, expect, it } from "vitest";
import { isImageQuestion, optionHasOwnText, showQuestionText } from "./math-question";

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

  it("hasOwnOptionsImage kortsluter till false — DTK:s image_url är diagrammet, inte uppgiften", () => {
    // Regressionstest (2026-08-21). DTK:s `image_url` pekar alltid på det
    // delade diagramuppslaget och innehåller aldrig alternativen — men
    // `question_text` är på DTK ALLTID riktig, korrekt extraherad text.
    // Utan flaggan läste denna funktion "alternativen saknar egen text" som
    // "hela uppgiften ligger i image_url" och dolde en korrekt frågetext
    // ovanför ett diagram som aldrig visade svaren. 77 uppgifter renderade
    // då varken text eller alternativ.
    expect(
      isImageQuestion({
        image_url: "/prov-bilder/2013ht/p3/diagram-1.webp",
        options: BOKSTAVSALT,
        hasOwnOptionsImage: true,
      }),
    ).toBe(false);
  });

  it("utan hasOwnOptionsImage (eller satt till false) är beteendet oförändrat", () => {
    expect(
      isImageQuestion({
        image_url: "/prov-bilder/kva.png",
        options: BOKSTAVSALT,
        hasOwnOptionsImage: false,
      }),
    ).toBe(true);
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

describe("optionHasOwnText", () => {
  it("en bokstav som bara är sig själv har ingen egen text", () => {
    // `{id:"A", text:"A"}` betyder "alternativet står i bilden". Renderas den
    // texten blir raden "A  A" — brickan följd av samma bokstav igen.
    expect(optionHasOwnText({ id: "A", text: "A" }, 0)).toBe(false);
    expect(optionHasOwnText({ id: "B", text: "b" }, 1)).toBe(false);
    expect(optionHasOwnText({ id: "C", text: "  " }, 2)).toBe(false);
    expect(optionHasOwnText("D", 3)).toBe(false);
  });

  it("riktig text räknas som egen text", () => {
    expect(optionHasOwnText({ id: "A", text: "Kockgård" }, 0)).toBe(true);
    expect(optionHasOwnText("4711", 0)).toBe(true);
    // Ett alternativ som ÄR bokstaven A som svar (t.ex. "A och B") räknas.
    expect(optionHasOwnText({ id: "A", text: "A och B" }, 0)).toBe(true);
  });
});
