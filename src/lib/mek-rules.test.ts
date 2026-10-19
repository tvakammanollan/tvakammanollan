import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  bankReport,
  faultsAt,
  GAP,
  gapCount,
  longestSharedRun,
  mekFaults,
  mekItemPasses,
  normalizeArchiveItem,
  normalizeArchiveText,
  sentenceCount,
  type MekItem,
} from "./mek-rules";

/** Alla MEK-uppgifter ur arkivet, normaliserade som generatorn ser dem. */
function archive(): (MekItem & { ref: string })[] {
  const dir = join(process.cwd(), "src/data/prov");
  const out: (MekItem & { ref: string })[] = [];
  for (const f of readdirSync(dir).sort()) {
    const d = JSON.parse(readFileSync(join(dir, f), "utf8"));
    if (!Array.isArray(d.questions)) continue;
    for (const q of d.questions) {
      if (q.delprov !== "MEK") continue;
      out.push(
        normalizeArchiveItem({
          ref: `${d.term}-${d.pass}/${q.nr}`,
          text: q.text,
          alternatives: q.alternatives,
          answer: q.answer,
        }),
      );
    }
  }
  return out;
}

const bra = (över: Partial<MekItem> = {}): MekItem => ({
  text:
    `De ekorrar som vi har i Sverige lever inte i flock utan är i det närmaste ${GAP}, ` +
    "det vill säga ensamlevande, och de försvarar sitt revir mot andra ekorrar.",
  alternatives: ["solitära", "separata", "isolerade", "individuella"],
  answer: "A",
  ...över,
});

const tvåluckor = (över: Partial<MekItem> = {}): MekItem => ({
  text:
    `Inom medieforskningen är man överens om att begreppet ”fake news” är ett ${GAP} ` +
    `begrepp, som används för att ${GAP} alla sorters åsikter man själv ogillar.`,
  alternatives: [
    "avigt – framhäva",
    "trubbigt – avfärda",
    "markant – rannsaka",
    "träffsäkert – bekräfta",
  ],
  answer: "B",
  ...över,
});

describe("arkivet som facit", () => {
  const items = archive();

  it("har 600 uppgifter", () => {
    expect(items).toHaveLength(600);
  });

  // En formatregel som underkänner en riktig UHR-uppgift är fel regel.
  it("klarar alla formatregler", () => {
    const fel = items
      .map((q) => ({ ref: q.ref, fel: faultsAt(q, "format") }))
      .filter((x) => x.fel.length > 0);
    expect(fel).toEqual([]);
  });

  it("har UHR:s luckfördelning 40/40/20", () => {
    const r = bankReport(items);
    expect(r.gaps).toEqual({ 1: 240, 2: 240, 3: 120 });
  });

  it("har nyckeln i texten i högst 3 % (kvoten är satt efter arkivet)", () => {
    expect(bankReport(items).echoShare).toBeLessThanOrEqual(0.03);
  });

  it("lagar ligaturfelen", () => {
    expect(normalizeArchiveText("nya böckers fl ickor och defi nition")).toBe(
      "nya böckers flickor och definition",
    );
    expect(normalizeArchiveText("en ____ i texten")).toBe(`en ${GAP} i texten`);
  });
});

describe("mekFaults", () => {
  it("godkänner en riktig uppgift", () => {
    expect(mekFaults(bra())).toEqual([]);
    expect(mekFaults(tvåluckor())).toEqual([]);
    expect(mekItemPasses(tvåluckor())).toBe(true);
  });

  it("kräver fyra alternativ och giltigt facit", () => {
    expect(mekFaults(bra({ alternatives: ["a", "b", "c"] }))).toContain("fel_antal_alternativ");
    expect(mekFaults(bra({ answer: "E" }))).toContain("ogiltigt_facit");
  });

  it("kräver 1–3 luckor", () => {
    expect(
      mekFaults(bra({ text: "En text utan lucka som är lång nog att räknas här." })),
    ).toContain("inga_luckor");
    const fyra = `${GAP} och ${GAP} och ${GAP} och ${GAP} ` + "ord ".repeat(30);
    expect(mekFaults(bra({ text: fyra }))).toContain("för_många_luckor");
  });

  it("kräver ett luckvärde per lucka", () => {
    const q = tvåluckor({
      alternatives: ["avigt", "trubbigt – avfärda", "markant – rannsaka", "a – b"],
    });
    expect(mekFaults(q)).toContain("fel_antal_luckvärden");
    const bindestreck = tvåluckor({
      alternatives: ["avigt - framhäva", "trubbigt – avfärda", "markant – rannsaka", "a – b"],
    });
    expect(mekFaults(bindestreck)).toContain("fel_antal_luckvärden");
  });

  it("underkänner ett luckvärde som två alternativ delar", () => {
    const q = tvåluckor({
      alternatives: [
        "avigt – avfärda",
        "trubbigt – avfärda",
        "markant – rannsaka",
        "träffsäkert – bekräfta",
      ],
    });
    expect(mekFaults(q)).toContain("upprepat_luckvärde");
  });

  it("håller längden inom arkivets spann", () => {
    expect(mekFaults(bra({ text: `Ekorren är ${GAP}.` }))).toContain("för_kort");
    expect(mekFaults(bra({ text: `Ekorren är ${GAP} ` + "och lever ".repeat(40) }))).toContain(
      "för_lång",
    );
  });

  it("tillåter funktionsord bara i flerluckor, och bara ett", () => {
    expect(mekFaults(bra({ alternatives: ["med", "genom", "för", "kring"] }))).toContain(
      "funktionsord_i_enlucka",
    );
    const två = tvåluckor({
      alternatives: ["med – och", "genom – samt", "för – dels", "kring – som"],
    });
    expect(mekFaults(två)).toContain("flera_funktionsordsluckor");
    const ett = tvåluckor({
      alternatives: ["med – framhäva", "genom – avfärda", "för – rannsaka", "kring – bekräfta"],
    });
    expect(mekFaults(ett)).not.toContain("flera_funktionsordsluckor");
  });

  it("kräver versal när luckan inleder en mening", () => {
    const q = tvåluckor({
      text: `${GAP} till våra tiders breda vaccinationsprogram är de smittkoppsepidemier som ${GAP} i Europa under 1700-talet.`,
      alternatives: [
        "tillkomsten – chockerade",
        "Förstadiet – frapperade",
        "Upprinnelsen – grasserade",
        "Anslaget – frotterade",
      ],
      answer: "C",
    });
    expect(mekFaults(q)).toContain("gemen_vid_meningsstart");
  });

  it("underkänner luckor som står intill varandra", () => {
    const q = tvåluckor({
      text: `Begreppet är ett ${GAP} ${GAP} begrepp som används om alla sorters åsikter man själv ogillar.`,
    });
    expect(mekFaults(q)).toContain("intilliggande_luckor");
  });

  it("varnar när nyckeln redan står i texten", () => {
    const q = bra({ text: bra().text.replace("ensamlevande", "solitära djur") });
    expect(faultsAt(q, "varning")).toContain("nyckel_i_texten");
    expect(mekItemPasses(q)).toBe(true);
  });

  it("är strängare än UHR med typografi, tidsord och markering", () => {
    expect(faultsAt(bra({ text: bra().text + " Det visade en studie i år." }), "strikt")).toContain(
      "tidsord",
    );
    expect(faultsAt(bra({ text: bra().text.replace(GAP, "____") }), "strikt")).toContain(
      "fel_luckmarkering",
    );
    expect(
      faultsAt(tvåluckor({ text: tvåluckor().text.replace(/[”]/g, '"') }), "strikt"),
    ).toContain("raka_citattecken");
    expect(faultsAt(bra({ text: bra().text.replace(", det", " — det") }), "strikt")).toContain(
      "em_streck",
    );
    expect(faultsAt(bra({ text: bra().text.replace("flock", "fl ock") }), "strikt")).toContain(
      "ligaturfel",
    );
  });
});

describe("hjälpare", () => {
  it("räknar luckor och meningar", () => {
    expect(gapCount(tvåluckor().text)).toBe(2);
    expect(sentenceCount("En mening. En till! Och en tredje?")).toBe(3);
    expect(sentenceCount("Ingen punkt")).toBe(1);
  });

  it("mäter längsta delade ordföljd", () => {
    expect(
      longestSharedRun(
        "Den svenska regeringen har aviserat höjd ålder",
        "regeringen har aviserat något",
      ),
    ).toBe(3);
    expect(longestSharedRun("helt olika", "ingenting gemensamt")).toBe(0);
  });
});

describe("bankReport", () => {
  it("flaggar fel luckfördelning och skev facitfördelning", () => {
    const r = bankReport(Array.from({ length: 20 }, () => bra()));
    expect(r.problems.some((p) => p.startsWith("1 luckor"))).toBe(true);
    expect(r.problems.some((p) => p.startsWith("facit A"))).toBe(true);
    expect(r.longestAnswerRun).toBe(20);
    expect(r.duplicateTexts).toHaveLength(1);
    expect(r.overusedKeyStems[0]).toEqual(["solitära", 20]);
  });
});
