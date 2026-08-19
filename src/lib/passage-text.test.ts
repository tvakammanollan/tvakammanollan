import { describe, it, expect } from "vitest";
import { normalizeParagraphs, normalizePassageText, repairBrokenWords } from "./passage-text";

describe("ligaturer", () => {
  it("fogar ihop ord som brutits vid fi, fl och ff", () => {
    expect(normalizeParagraphs(["De fl esta småfåglar fi nns kvar."])).toEqual([
      "De flesta småfåglar finns kvar.",
    ]);
    expect(normalizeParagraphs(["en träff ande karakteristik."])).toEqual([
      "en träffande karakteristik.",
    ]);
    expect(normalizeParagraphs(["Th e parts that handle verbal fl uency."])).toEqual([
      "Th e parts that handle verbal fluency.",
    ]);
  });

  it("rör inte ett riktigt ordmellanrum efter ett ord som slutar på ff eller fi", () => {
    // Hela poängen: "off the" och "biografi om" ska förbli två ord.
    expect(normalizeParagraphs(["kan plockas off the shelf."])).toEqual([
      "kan plockas off the shelf.",
    ]);
    expect(normalizeParagraphs(["i sin biografi om Selma Lagerlöf."])).toEqual([
      "i sin biografi om Selma Lagerlöf.",
    ]);
    expect(normalizeParagraphs(["Poor staff planning means shortages."])).toEqual([
      "Poor staff planning means shortages.",
    ]);
    expect(normalizeParagraphs(["Falstaff dominates the two Henry IV plays."])).toEqual([
      "Falstaff dominates the two Henry IV plays.",
    ]);
  });
});

describe("lösa bokstäver", () => {
  it("fogar ihop en ensam bokstav med ordet efter", () => {
    expect(normalizeParagraphs(["att elever b ehöver u tveckla förmågan."])).toEqual([
      "att elever behöver utveckla förmågan.",
    ]);
    expect(normalizeParagraphs(["minskar deras m otivation i längden."])).toEqual([
      "minskar deras motivation i längden.",
    ]);
  });

  it("lämnar förkortningar, variabler och riktiga enbokstavsord i fred", () => {
    expect(normalizeParagraphs(["skriv t ex en uppsats om det."])).toEqual([
      "skriv t ex en uppsats om det.",
    ]);
    expect(normalizeParagraphs(["gäller lärare m fl inom skolan."])).toEqual([
      "gäller lärare m fl inom skolan.",
    ]);
    expect(normalizeParagraphs(["antag att x är större än noll."])).toEqual([
      "antag att x är större än noll.",
    ]);
    expect(normalizeParagraphs(["en ö utanför kusten och en å inåt landet."])).toEqual([
      "en ö utanför kusten och en å inåt landet.",
    ]);
  });
});

describe("spalt- och sidbrytningar", () => {
  it("slår ihop ett stycke som fortsätter meningen", () => {
    expect(
      normalizeParagraphs([
        "Ett ”jag” som speglar sig i ett ”du” utan att med Sara Lidman försäga sig i ett",
        "”vars är du barnfödd då?”. Fortfarande är det den frågan som gäller.",
      ]),
    ).toEqual([
      "Ett ”jag” som speglar sig i ett ”du” utan att med Sara Lidman försäga sig i ett " +
        "”vars är du barnfödd då?”. Fortfarande är det den frågan som gäller.",
    ]);
  });

  it("avstavar över brytningen", () => {
    expect(
      normalizeParagraphs(["radiosändare på 22 trädgårds-", "sångare, alla yngre än ett år."]),
    ).toEqual(["radiosändare på 22 trädgårdssångare, alla yngre än ett år."]);
  });

  it("behåller bindestrecket när efterledet är utelämnat", () => {
    // Här är strecket inte avstavning utan ett utelämnat efterled, så det ska
    // stå kvar och styckena fogas ihop med ett mellanslag.
    expect(normalizeParagraphs(["kommunens mark-", "och vattenanvändning."])).toEqual([
      "kommunens mark- och vattenanvändning.",
    ]);
  });

  it("håller isär två riktiga stycken", () => {
    const paras = ["Det är där det krasar och spricker.", "Mot bättre vetande: en dröm."];
    expect(normalizeParagraphs(paras)).toEqual(paras);
  });
});

describe("sidfot", () => {
  it("plockar bort sidnummer och sätterirader", () => {
    expect(
      normalizeParagraphs([
        "Texten fortsätter om en stund.",
        "– 11 –",
        "Verbaldel ELF16A V1.indd 12",
        "2016-01-07 13:27:46",
        "Här kommer nästa stycke.",
      ]),
    ).toEqual(["Texten fortsätter om en stund.", "Här kommer nästa stycke."]);
  });

  it("låter en sidfot mitt i en mening läka ihop meningen", () => {
    expect(
      normalizeParagraphs(["a series of repeated dis-", "– 12 –", "asters and a sense of flux."]),
    ).toEqual(["a series of repeated disasters and a sense of flux."]);
  });

  it("rör inte en riktig mening som råkar börja med ett tankstreck", () => {
    const para = "– 11 skäl till att detta inte stämmer, menar hon, och listar dem sedan.";
    expect(normalizeParagraphs([para])).toEqual([para]);
  });
});

describe("normalizePassageText", () => {
  it("delar på blankrad och städar", () => {
    expect(normalizePassageText("Första stycket fi nns.\n\nAndra stycket.")).toEqual([
      "Första stycket finns.",
      "Andra stycket.",
    ]);
  });

  it("fogar ihop en hårdbruten text men behåller styckena", () => {
    const text = [
      "Den svenska modellen bygger på en samverkan mellan",
      "parterna på arbetsmarknaden och staten.",
      "Nästa stycke börjar här och handlar om något annat.",
    ].join("\n");
    expect(normalizePassageText(text)).toEqual([
      "Den svenska modellen bygger på en samverkan mellan parterna på arbetsmarknaden och staten.",
      "Nästa stycke börjar här och handlar om något annat.",
    ]);
  });

  it("ger en tom lista för text som saknas", () => {
    expect(normalizePassageText(null)).toEqual([]);
    expect(normalizePassageText("")).toEqual([]);
  });
});

describe("repairBrokenWords", () => {
  it("lagar brutna ord i uppgiftstext och alternativ", () => {
    expect(repairBrokenWords("fi nfördela")).toBe("finfördela");
    expect(repairBrokenWords("krass defi nition")).toBe("krass definition");
    expect(repairBrokenWords("den så kallade ”infl ationsteorin”")).toBe(
      "den så kallade ”inflationsteorin”",
    );
    expect(repairBrokenWords("What are we told in the fi rst paragraph?")).toBe(
      "What are we told in the first paragraph?",
    );
  });

  it("rör inte matematikens variabler", () => {
    // Hela skälet till att regeln för lösa bokstäver hålls utanför: i XYZ, KVA
    // och NOG är en ensam bokstav en variabel, inte ett sönderbrutet ord.
    const xyz = "Då det positiva heltalet x divideras med 8 erhålls resten 2.";
    expect(repairBrokenWords(xyz)).toBe(xyz);
    const kva = "Funktionen g ges av g(x) = 4 – x2";
    expect(repairBrokenWords(kva)).toBe(kva);
    const nog = "En bil färdas x km på y min.";
    expect(repairBrokenWords(nog)).toBe(nog);
  });
});
