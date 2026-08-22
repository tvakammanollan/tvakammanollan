import { describe, expect, it } from "vitest";
import {
  cropIsSane,
  hasOwnOptionsAspect,
  hasOwnOptionsImage,
  hasStemAspect,
  optionRenderable,
  questionFaults,
  questionIsPlayable,
  questionIsServable,
  type ValidatableQuestion,
} from "./question-validity";

const bra = (över: Partial<ValidatableQuestion> = {}): ValidatableQuestion => ({
  id: "q1",
  category: "ORD",
  options: ["alfa", "beta", "gamma", "delta", "epsilon"],
  correct_answer: "A",
  ...över,
});

/** En bilduppgift ur arkivet: alternativen är beskärningar, inte text. */
const bild = (över: Partial<ValidatableQuestion> = {}): ValidatableQuestion =>
  bra({
    category: "XYZ",
    image_url: "/prov-bilder/2019ht/p1/7.webp",
    image_caption: JSON.stringify({ stem: [0.1, 0.0, 0.9, 0.3], aspect: 1.29 }),
    options: [
      { id: "A", text: "A", crop: [0.36, 0.35, 1, 0.5] },
      { id: "B", text: "B", crop: [0.36, 0.5, 1, 0.64] },
      { id: "C", text: "C", crop: [0.36, 0.64, 1, 0.78] },
      { id: "D", text: "D", crop: [0.36, 0.78, 1, 1] },
    ],
    ...över,
  });

describe("cropIsSane", () => {
  it("kräver yta och att beskärningen ligger inom bilden", () => {
    expect(cropIsSane([0, 0, 1, 1])).toBe(true);
    expect(cropIsSane([0.2, 0.3, 0.8, 0.6])).toBe(true);
    // Tom yta: CropView returnerar null och alternativet blir osynligt.
    expect(cropIsSane([0.5, 0.2, 0.5, 0.6])).toBe(false);
    expect(cropIsSane([0.5, 0.6, 0.2, 0.9])).toBe(false);
    // Utanför bilden.
    expect(cropIsSane([-0.1, 0, 1, 1])).toBe(false);
    expect(cropIsSane([0, 0, 1.2, 1])).toBe(false);
    expect(cropIsSane([0, 0, NaN, 1])).toBe(false);
  });
});

describe("optionRenderable", () => {
  it("egen text räcker", () => {
    expect(optionRenderable("förnimma", 0, false)).toBe(true);
    expect(optionRenderable({ id: "A", text: "förnimma" }, 0, false)).toBe(true);
  });

  it("ett alternativ som bara är sin egen bokstav har inget innehåll", () => {
    // `{id:"A", text:"A"}` betyder "alternativet står i bilden".
    expect(optionRenderable({ id: "A", text: "A" }, 0, false)).toBe(false);
    expect(optionRenderable({ id: "A", text: "a" }, 0, false)).toBe(false);
    expect(optionRenderable({ id: "A", text: "  " }, 0, false)).toBe(false);
  });

  it("en beskärning räcker, men bara när det finns en bild att beskära", () => {
    const o = { id: "A", text: "A", crop: [0, 0, 1, 0.2] };
    expect(optionRenderable(o, 0, true)).toBe(true);
    expect(optionRenderable(o, 0, false)).toBe(false);
  });

  it("en trasig beskärning räknas inte som innehåll", () => {
    expect(optionRenderable({ id: "A", text: "A", crop: [0.5, 0, 0.5, 1] }, 0, true)).toBe(false);
    expect(optionRenderable({ id: "A", text: "A", crop: [0, 0, 1] }, 0, true)).toBe(false);
  });
});

describe("hasStemAspect", () => {
  it("kräver både beskärning och positiv bildproportion", () => {
    expect(hasStemAspect(JSON.stringify({ stem: [0, 0, 1, 0.3], aspect: 1.3 }))).toBe(true);
    expect(hasStemAspect(JSON.stringify({ stem: [0, 0, 1, 0.3] }))).toBe(false);
    expect(hasStemAspect(JSON.stringify({ stem: [0, 0, 1, 0.3], aspect: 0 }))).toBe(false);
    // En vanlig bildtext är ingen JSON — och inget fel.
    expect(hasStemAspect("Figur till frågan")).toBe(false);
    expect(hasStemAspect(null)).toBe(false);
    expect(hasStemAspect("{trasig json")).toBe(false);
  });
});

describe("hasOwnOptionsImage / hasOwnOptionsAspect", () => {
  it("skiljer på om bilden finns och om den har koordinater", () => {
    // 59 av 77 DTK-uppgifter: egen bild OCH per-bokstav-koordinater.
    const medKoordinater = JSON.stringify({
      optionsImage: "/prov-bilder/2013ht/p3/29.webp",
      optionsAspect: 2.28,
    });
    expect(hasOwnOptionsImage(medKoordinater)).toBe(true);
    expect(hasOwnOptionsAspect(medKoordinater)).toBe(true);

    // 18 av 77: egen bild, men PDF-extraktionen fångade aldrig koordinaterna.
    const utanKoordinater = JSON.stringify({ optionsImage: "/prov-bilder/2013ht/p3/31.webp" });
    expect(hasOwnOptionsImage(utanKoordinater)).toBe(true);
    expect(hasOwnOptionsAspect(utanKoordinater)).toBe(false);
  });

  it("kolliderar inte med XYZ/KVA:s stem-form", () => {
    const stemForm = JSON.stringify({ stem: [0, 0, 1, 0.3], aspect: 1.3 });
    expect(hasOwnOptionsImage(stemForm)).toBe(false);
    expect(hasOwnOptionsAspect(stemForm)).toBe(false);
  });

  it("fritext, trasig JSON och null är inget fel", () => {
    for (const v of ["Figur till frågan", "{trasig", null]) {
      expect(hasOwnOptionsImage(v)).toBe(false);
      expect(hasOwnOptionsAspect(v)).toBe(false);
    }
  });
});

describe("questionFaults", () => {
  it("en komplett verbal uppgift är spelbar", () => {
    expect(questionFaults(bra())).toEqual([]);
    expect(questionIsPlayable(bra())).toBe(true);
  });

  it("en komplett bilduppgift med beskärningar är spelbar", () => {
    expect(questionFaults(bild())).toEqual([]);
  });

  it("saknat facit fångas", () => {
    expect(questionFaults(bra({ correct_answer: null }))).toContain("saknar_facit");
    expect(questionFaults(bra({ correct_answer: "  " }))).toContain("saknar_facit");
  });

  it("facit som inte pekar på något alternativ fångas", () => {
    // "F" finns inte bland A–E: uppgiften går inte att rätta.
    expect(questionFaults(bra({ correct_answer: "F" }))).toContain("facit_utanför_alternativen");
  });

  it("för få alternativ fångas", () => {
    expect(questionFaults(bra({ options: ["a", "b", "c"] }))).toContain("för_få_alternativ");
    // XYZ, KVA och DTK har fyra alternativ — det är inte för få.
    expect(questionFaults(bild())).not.toContain("för_få_alternativ");
  });

  it("halva uppsättningar beskärningar fångas", () => {
    // `parseOptionCrops` faller tillbaka på hela utsnittet vid halva
    // uppsättningar, alltså en bild med tomma bokstavsknappar under.
    const halv = bild();
    (halv.options as Array<Record<string, unknown>>)[2] = { id: "C", text: "C" };
    expect(questionFaults(halv)).toContain("delvis_beskurna_alternativ");
  });

  it("ogiltiga beskärningar fångas", () => {
    const trasig = bild();
    (trasig.options as Array<Record<string, unknown>>)[1] = {
      id: "B",
      text: "B",
      crop: [0.36, 0.5, 0.36, 0.64],
    };
    expect(questionFaults(trasig)).toContain("ogiltig_beskärning");
  });

  it("beskärningar utan bildproportion fångas — CropView faller annars till 1:1", () => {
    expect(questionFaults(bild({ image_caption: null }))).toContain(
      "beskärning_utan_bildproportion",
    );
  });

  it("alternativ utan innehåll och utan bild fångas", () => {
    const utanBild = bra({
      category: "DTK",
      image_url: null,
      options: [
        { id: "A", text: "A" },
        { id: "B", text: "B" },
        { id: "C", text: "C" },
        { id: "D", text: "D" },
      ],
    });
    const fel = questionFaults(utanBild);
    expect(fel).toContain("alternativ_utan_innehåll");
    expect(fel).toContain("bilduppgift_utan_bild");
  });

  it("alternativ som bara står i bilden markeras som reservläge, inte som trasigt", () => {
    // Dokumenterat: 76 av arkivets bilduppgifter saknar beskärningar och visar
    // hela utsnittet med en bokstavsrad under. Spelbart — men bara när bilden
    // är uppgiftens egen, vilket bara arkivet kan avgöra.
    const reserv = bild({
      options: [
        { id: "A", text: "A" },
        { id: "B", text: "B" },
        { id: "C", text: "C" },
        { id: "D", text: "D" },
      ],
      image_caption: null,
    });
    const fel = questionFaults(reserv);
    expect(fel).toContain("alternativ_endast_i_delad_bild");
    expect(fel).not.toContain("alternativ_utan_innehåll");
  });

  it("DTK med egen bild och koordinater är spelbar — image_url är diagrammet, optionsImage bär alternativen", () => {
    const dtkMedKoordinater = bra({
      category: "DTK",
      image_url: "/prov-bilder/2013ht/p3/diagram-1.webp",
      image_caption: JSON.stringify({
        optionsImage: "/prov-bilder/2013ht/p3/29.webp",
        optionsAspect: 2.28,
      }),
      options: [
        { id: "A", text: "A", crop: [0.15, 0.53, 1, 0.63] },
        { id: "B", text: "B", crop: [0.15, 0.63, 1, 0.73] },
        { id: "C", text: "C", crop: [0.15, 0.73, 1, 0.84] },
        { id: "D", text: "D", crop: [0.15, 0.84, 1, 1] },
      ],
    });
    expect(questionFaults(dtkMedKoordinater)).toEqual([]);
  });

  it("DTK med egen bild men UTAN koordinater faller till reservläge, inte trasigt", () => {
    // De 18 av 77 där PDF-extraktionen aldrig fångade var bokstäverna sitter.
    const dtkUtanKoordinater = bra({
      category: "DTK",
      image_url: "/prov-bilder/2013ht/p3/diagram-1.webp",
      image_caption: JSON.stringify({ optionsImage: "/prov-bilder/2013ht/p3/31.webp" }),
      options: [
        { id: "A", text: "A" },
        { id: "B", text: "B" },
        { id: "C", text: "C" },
        { id: "D", text: "D" },
      ],
    });
    const fel = questionFaults(dtkUtanKoordinater);
    expect(fel).toContain("alternativ_endast_i_delad_bild");
    expect(fel).not.toContain("alternativ_utan_innehåll");
    expect(fel).not.toContain("bilduppgift_utan_bild");
  });

  it("rapporterar alla fel, inte bara det första", () => {
    const usel: ValidatableQuestion = {
      id: "x",
      category: "XYZ",
      options: [{ id: "A", text: "A" }],
      correct_answer: null,
      image_url: null,
    };
    const fel = questionFaults(usel);
    expect(fel).toContain("saknar_facit");
    expect(fel).toContain("för_få_alternativ");
    expect(fel).toContain("alternativ_utan_innehåll");
  });
});

describe("questionIsServable", () => {
  it("en textuppgift utan bild är alltid servable när den är felfri", () => {
    expect(questionIsServable(bra())).toBe(true);
  });

  it("XYZ/KVA/NOG vars bild legitimt innehåller alternativen är servable trots alternativ_endast_i_delad_bild", () => {
    // Samma rad som testet ovan ("markeras som reservläge, inte som
    // trasigt") — men här kontrolleras spärren som faktiskt avgör om
    // duellen/träningen serverar frågan, inte bara felkoden.
    const reserv = bild({
      options: [
        { id: "A", text: "A" },
        { id: "B", text: "B" },
        { id: "C", text: "C" },
        { id: "D", text: "D" },
      ],
      image_caption: null,
    });
    expect(questionFaults(reserv)).toContain("alternativ_endast_i_delad_bild");
    expect(questionIsServable(reserv)).toBe(true);
  });

  it("DTK utan egen alternativbild är INTE servable — image_url är ett delat diagram utan svaren", () => {
    const dtkDeladBild = bra({
      category: "DTK",
      image_url: "/prov-bilder/2013ht/p3/diagram-1.webp",
      image_caption: null,
      options: [
        { id: "A", text: "A" },
        { id: "B", text: "B" },
        { id: "C", text: "C" },
        { id: "D", text: "D" },
      ],
    });
    expect(questionIsServable(dtkDeladBild)).toBe(false);
  });

  it("DTK med egen alternativbild är servable, med eller utan per-bokstav-koordinater", () => {
    const medKoordinater = bra({
      category: "DTK",
      image_url: "/prov-bilder/2013ht/p3/diagram-1.webp",
      image_caption: JSON.stringify({
        optionsImage: "/prov-bilder/2013ht/p3/29.webp",
        optionsAspect: 2.28,
      }),
      options: [
        { id: "A", text: "A", crop: [0.15, 0.53, 1, 0.63] },
        { id: "B", text: "B", crop: [0.15, 0.63, 1, 0.73] },
        { id: "C", text: "C", crop: [0.15, 0.73, 1, 0.84] },
        { id: "D", text: "D", crop: [0.15, 0.84, 1, 1] },
      ],
    });
    expect(questionIsServable(medKoordinater)).toBe(true);

    const utanKoordinater = bra({
      category: "DTK",
      image_url: "/prov-bilder/2013ht/p3/diagram-1.webp",
      image_caption: JSON.stringify({ optionsImage: "/prov-bilder/2013ht/p3/31.webp" }),
      options: [
        { id: "A", text: "A" },
        { id: "B", text: "B" },
        { id: "C", text: "C" },
        { id: "D", text: "D" },
      ],
    });
    expect(questionIsServable(utanKoordinater)).toBe(true);
  });

  it("hårda fel (saknat facit, för få alternativ) blockerar oavsett kategori", () => {
    expect(questionIsServable(bra({ correct_answer: null }))).toBe(false);
    expect(questionIsServable(bra({ options: ["a", "b", "c"] }))).toBe(false);
  });
});
