import { describe, it, expect } from "vitest";
import {
  expandOrdAbbreviations,
  formatOrdDefinition,
  parseOrdDefinition,
  ordDefinitionParts,
  ordDefinition,
  definitionSourceLabel,
} from "./ord-definition";

describe("expandOrdAbbreviations", () => {
  it("skriver ut de vanligaste ordboksförkortningarna", () => {
    expect(expandOrdAbbreviations("prydnad över fasad el. som krön")).toBe(
      "prydnad över fasad eller som krön",
    );
    expect(expandOrdAbbreviations("som stretar emot särsk. om häst")).toBe(
      "som stretar emot särskilt om häst",
    );
    expect(expandOrdAbbreviations("i växter, bl.a. morötter, men äv. i äggula")).toBe(
      "i växter, bland annat morötter, men även i äggula",
    );
    expect(expandOrdAbbreviations("extrakt av ekbark anv. (förr) vid garvning")).toBe(
      "extrakt av ekbark används (förr) vid garvning",
    );
    expect(expandOrdAbbreviations("harm ofta p.g.a. någon oförrätt")).toBe(
      "harm ofta på grund av någon oförrätt",
    );
    expect(expandOrdAbbreviations("härskare spec. som titel")).toBe("härskare speciellt som titel");
    expect(expandOrdAbbreviations("tankar, uttryck m.m.")).toBe("tankar, uttryck med mera");
    expect(expandOrdAbbreviations("analysera något t.ex. ett problem")).toBe(
      "analysera något till exempel ett problem",
    );
    expect(expandOrdAbbreviations("traditioner dvs. seder")).toBe(
      "traditioner det vill säga seder",
    );
  });

  // "el." måste bytas ut sist, annars äter den upp den längre formen.
  it("tar de längre mönstren före de kortare", () => {
    expect(expandOrdAbbreviations("stolar el. d.")).toBe("stolar eller dylikt");
    expect(expandOrdAbbreviations("ngn l. ngt o. d.")).toBe("någon eller något och dylikt");
    expect(expandOrdAbbreviations("t.o.m. i dag")).toBe("till och med i dag");
  });

  /**
   * Ersättningen kräver att ingen bokstav står omedelbart före. Utan det
   * blir "modell." till "modeleller" och varje mening som slutar på -el.
   * går sönder.
   */
  it("rör inte ord som bara slutar likadant", () => {
    expect(expandOrdAbbreviations("en tygbit i en modell.")).toBe("en tygbit i en modell.");
    expect(expandOrdAbbreviations("skriva ett brev.")).toBe("skriva ett brev.");
    expect(expandOrdAbbreviations("hälften av en del.")).toBe("hälften av en del.");
    expect(expandOrdAbbreviations("stiga upp ur en säng.")).toBe("stiga upp ur en säng.");
  });

  it("behåller versal när förkortningen inleder en mening", () => {
    expect(expandOrdAbbreviations("Särsk. om fartyg.")).toBe("Särskilt om fartyg.");
    expect(expandOrdAbbreviations("Äv. bildligt.")).toBe("Även bildligt.");
  });

  describe("former som styrs av ett framförställt ord", () => {
    it("böjer efter bestämd artikel", () => {
      expect(expandOrdAbbreviations("utanför de eg. invånarnas kontroll")).toBe(
        "utanför de egentliga invånarnas kontroll",
      );
      expect(expandOrdAbbreviations("enligt det s.k. naturliga urvalet")).toBe(
        "enligt det så kallade naturliga urvalet",
      );
      expect(expandOrdAbbreviations("de urspr. stora bokstäverna")).toBe(
        "de ursprungliga stora bokstäverna",
      );
    });

    it("böjer efter obestämd neutrum", () => {
      expect(expandOrdAbbreviations("inte leda till något eg. resultat")).toBe(
        "inte leda till något egentligt resultat",
      );
      expect(expandOrdAbbreviations("ett s.k. block")).toBe("ett så kallat block");
    });

    it("hoppar över räkneord och adjektiv på väg till artikeln", () => {
      expect(expandOrdAbbreviations("en av de fyra s.k. elementarandarna")).toBe(
        "en av de fyra så kallade elementarandarna",
      );
    });

    it("faller tillbaka på adverbformen utan bestämmande ord", () => {
      expect(expandOrdAbbreviations("regel som urspr. gällt ett fåtal fall")).toBe(
        "regel som ursprungligen gällt ett fåtal fall",
      );
      expect(expandOrdAbbreviations("som man eg. är beroende av")).toBe(
        "som man egentligen är beroende av",
      );
    });
  });

  it("skriver ut SAOB:s föråldradmarkering", () => {
    expect(expandOrdAbbreviations("(†) i fråga om")).toBe("(föråldrat) i fråga om");
    expect(expandOrdAbbreviations("† märke")).toBe("föråldrat: märke");
  });

  it("skriver ut SAOB:s egna kortformer", () => {
    expect(expandOrdAbbreviations("i praktiken vanl. ockupation")).toBe(
      "i praktiken vanligen ockupation",
    );
    expect(expandOrdAbbreviations("Besvärligt o. tidsödande arbete")).toBe(
      "Besvärligt och tidsödande arbete",
    );
    expect(expandOrdAbbreviations("(numera bl. någon gg i högre stil)")).toBe(
      "(numera blott någon gång i högre stil)",
    );
    expect(expandOrdAbbreviations("i skildring av ä. förh.")).toBe(
      "i skildring av äldre förhållanden",
    );
  });
});

/**
 * svenska.se numrerar likstavade uppslagsord och siffran följde med skrapet
 * ut i löptexten. Fallen nedan är hämtade ur de 8 761 rader som ligger i
 * databasen — både de som ska städas och de som absolut inte får röras.
 */
describe("lösa homografsiffror", () => {
  it("tar bort siffran när den står mellan två vanliga ord", () => {
    expect(ordDefinition("Ge ifrån sig 1 något viktigt eller värdefullt.")).toBe(
      "Ge ifrån sig något viktigt eller värdefullt.",
    );
    expect(ordDefinition("Formellt utföra 1 handling, ofta ceremoniell")).toBe(
      "Formellt utföra handling, ofta ceremoniell",
    );
    expect(ordDefinition("(obestämt) fel eller krångel 2 ofta av tekniskt slag")).toBe(
      "(obestämt) fel eller krångel ofta av tekniskt slag",
    );
    expect(ordDefinition("Försäkra med ed 1 i juridiska sammanhang")).toBe(
      "Försäkra med ed i juridiska sammanhang",
    );
  });

  it("tar bort siffran sist i en betydelse utan att röra numreringen", () => {
    expect(ordDefinition("1. det att putsa 1  2. tunt murbrukslager")).toBe(
      "1. det att putsa  2. tunt murbrukslager",
    );
    expect(ordDefinition("1. skicklig i dans 1  2. som rör dans")).toBe(
      "1. skicklig i dans  2. som rör dans",
    );
  });

  it("rör inte riktiga tal", () => {
    const real = [
      "Period på fyra månader vanligen med början 1 januari, 1 maj eller 1 september",
      "Produkten av alla heltal mellan 1 och ett visst större heltal",
      "Kåren representerar ca 5 500 studenter i Linköping",
      "Åtskillnad i språk (sedan Babels torn, enligt 1 Mos. 11:1–9).",
    ];
    for (const s of real) expect(ordDefinition(s)).toBe(s);
  });
});

describe("formatOrdDefinition / parseOrdDefinition", () => {
  const parts = {
    senses: ["Ta sig upp ombord på rigg", "Göra entré på en scen"],
    examples: ["äntra stormasten", "rektor äntrade talarstolen"],
    related: ["borda", "entré"],
    wordClass: "verb",
  };

  it("går fram och tillbaka utan att tappa något", () => {
    expect(parseOrdDefinition(formatOrdDefinition(parts))).toEqual(parts);
  });

  it("numrerar bara när det finns fler än en betydelse", () => {
    const one = formatOrdDefinition({ ...parts, senses: ["Enda betydelsen"] });
    expect(one.split("\n")[0]).toBe("Enda betydelsen");
    expect(formatOrdDefinition(parts).split("\n")[0]).toBe("1. Ta sig upp ombord på rigg");
  });

  it("utelämnar tomma sektioner", () => {
    expect(
      formatOrdDefinition({ senses: ["Bara detta"], examples: [], related: [], wordClass: null }),
    ).toBe("Bara detta");
  });

  // Alla 8 761 rader som redan ligger i databasen har den här formen.
  it("läser den äldre formen med dubbla mellanslag mellan betydelserna", () => {
    expect(parseOrdDefinition("1. uppsättning egenskaper  2. grundlag").senses).toEqual([
      "uppsättning egenskaper",
      "grundlag",
    ]);
  });

  it("läser en omärkt rad som en enda betydelse", () => {
    const p = parseOrdDefinition("unge av get");
    expect(p.senses).toEqual(["unge av get"]);
    expect(p.examples).toEqual([]);
    expect(p.wordClass).toBeNull();
  });

  it("rör inte årtal eller mängder som ser ut som numrering", () => {
    expect(parseOrdDefinition("lag stiftad år 1809").senses).toEqual(["lag stiftad år 1809"]);
  });
});

describe("ordDefinitionParts", () => {
  it("städar, skriver ut förkortningar och delar upp i ett svep", () => {
    const p = ordDefinitionParts(
      "1. gul färg anv. i konst el. hantverk\n" +
        "2. 1lera med hög järnhalt\n" +
        "Exempel: väggen målades i ockra | ockra och umbra\n" +
        "Liknande ord: umbra, terrakotta\n" +
        "Ordklass: substantiv",
    );
    expect(p.senses).toEqual(["Gul färg används i konst eller hantverk", "Lera med hög järnhalt"]);
    expect(p.examples).toEqual(["väggen målades i ockra", "ockra och umbra"]);
    expect(p.related).toEqual(["umbra", "terrakotta"]);
    expect(p.wordClass).toBe("substantiv");
  });

  it("hanterar tomt värde", () => {
    expect(ordDefinitionParts(null).senses).toEqual([]);
    expect(ordDefinitionParts("   ").senses).toEqual([]);
  });

  it("versaliserar varje betydelse, inte bara den första", () => {
    expect(ordDefinition("1. första  2. andra")).toBe("1. första  2. andra");
    expect(ordDefinitionParts("1. första  2. andra").senses).toEqual(["Första", "Andra"]);
  });
});

describe("definitionSourceLabel", () => {
  it("namnger ordböckerna", () => {
    expect(definitionSourceLabel("SO (svenska.se)")).toBe("SO · Svensk ordbok (svenska.se)");
    expect(definitionSourceLabel("SO idiom (svenska.se)")).toBe("SO · idiom (svenska.se)");
    expect(definitionSourceLabel("SAOL (svenska.se)")).toBe("SAOL (svenska.se)");
    expect(definitionSourceLabel("SAOB (svenska.se)")).toBe("SAOB (svenska.se)");
    expect(definitionSourceLabel("HP-facit (rätt svar)")).toBe("Synonym (HP-facit)");
    expect(definitionSourceLabel(null)).toBe("Förklaring");
  });

  /**
   * Det här är hela poängen: texten förklarar ett annat ord än det som står
   * på uppgiften, och kapas kvalifikationen bort går det inte att se.
   */
  it("visar att förklaringen gäller ett annat uppslagsord", () => {
    expect(definitionSourceLabel('SO (svenska.se) – om "sälla"')).toBe(
      'SO · Svensk ordbok (svenska.se) · om "sälla"',
    );
    expect(definitionSourceLabel('SO (svenska.se), rättstavat "obstetrik"')).toBe(
      'SO · Svensk ordbok (svenska.se) · uppslag "obstetrik"',
    );
    expect(definitionSourceLabel('SAOL (svenska.se), rättstavat "hemi-"')).toBe(
      'SAOL (svenska.se) · uppslag "hemi-"',
    );
  });
});
