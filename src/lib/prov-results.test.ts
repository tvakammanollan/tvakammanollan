import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  loadResults,
  parseResults,
  RESULTS_STORAGE_KEY,
  saveResult,
  summariseExam,
  type PassResult,
  type ProvResults,
} from "./prov-results";
import type { ExamSummary } from "@/types/gamla-prov";

/** Ett provtillfälle med de fyra räknade passen, som i arkivet. */
const EXAM: ExamSummary = {
  term: "2020ht",
  date: "2020-10-25",
  label: "Höstprovet 2020",
  questions: 160,
  passes: [
    { pass: 1, kind: "verbal", minutes: 55, questions: 40, delprov: [], missing: [] },
    { pass: 2, kind: "kvant", minutes: 55, questions: 40, delprov: [], missing: [] },
    { pass: 4, kind: "kvant", minutes: 55, questions: 40, delprov: [], missing: [] },
    { pass: 5, kind: "verbal", minutes: 55, questions: 40, delprov: [], missing: [] },
  ],
};

function result(
  score: number,
  kind: "verbal" | "kvant",
  mode: "prov" | "ova" = "prov",
): PassResult {
  return { score, total: 40, kind, mode, at: 1_700_000_000_000 };
}

describe("summariseExam", () => {
  it("utan skrivna pass finns varken delpoäng eller totalpoäng", () => {
    const r = summariseExam(EXAM, {});
    expect(r.done).toBe(0);
    expect(r.passes).toBe(4);
    expect(r.verbal.normering).toBeNull();
    expect(r.kvant.normering).toBeNull();
    expect(r.normering).toBeNull();
  });

  // Ett verbalt pass är fyrtio uppgifter av åttio. En normering ur halva
  // underlaget hade sett ut som ett provresultat utan att vara det.
  it("ger ingen delpoäng förrän båda passen i delen är skrivna", () => {
    const halv = summariseExam(EXAM, { "2020ht:1": result(36, "verbal") });
    expect(halv.verbal.done).toBe(1);
    expect(halv.verbal.passes).toBe(2);
    expect(halv.verbal.normering).toBeNull();

    const hel = summariseExam(EXAM, {
      "2020ht:1": result(36, "verbal"),
      "2020ht:5": result(36, "verbal"),
    });
    expect(hel.verbal.normering).toBe(1.9);
    expect(hel.verbal.score).toBe(72);
    expect(hel.verbal.total).toBe(80);
    // Den kvantitativa delen är orörd, alltså finns ingen totalpoäng.
    expect(hel.kvant.normering).toBeNull();
    expect(hel.normering).toBeNull();
  });

  // Exemplet som funktionen finns för: verbalt 1,90 och kvantitativt 2,00 ska
  // ge 1,95 — medelvärdet — inte något tredje tal ur normeringstabellen.
  it("hela provet ger delpoäng och en totalpoäng som är snittet av dem", () => {
    const r = summariseExam(EXAM, {
      "2020ht:1": result(36, "verbal"),
      "2020ht:5": result(36, "verbal"),
      "2020ht:2": result(39, "kvant"),
      "2020ht:4": result(39, "kvant"),
    });
    expect(r.done).toBe(4);
    expect(r.verbal.normering).toBe(1.9);
    expect(r.kvant.normering).toBe(2.0);
    expect(r.normering).toBe(1.95);
    expect(r.practice).toBe(false);
  });

  it("räknar pass med olika många uppgifter på andelen, inte på antalet", () => {
    // Äldre pass kan sakna ELF och därmed ha färre uppgifter.
    const r = summariseExam(EXAM, {
      "2020ht:1": { ...result(30, "verbal"), total: 30 },
      "2020ht:5": result(30, "verbal"),
    });
    expect(r.verbal.score).toBe(60);
    expect(r.verbal.total).toBe(70);
    expect(r.verbal.normering).toBe(1.8); // 60/70 rätt ≈ 137 av 160
  });

  it("flaggar att något pass skrevs i övningsläge", () => {
    const r = summariseExam(EXAM, {
      "2020ht:1": result(36, "verbal"),
      "2020ht:5": result(40, "verbal", "ova"),
    });
    expect(r.practice).toBe(true);
  });

  it("blandar inte ihop två provtillfällen", () => {
    const r = summariseExam(EXAM, {
      "2019vt:1": result(40, "verbal"),
      "2019vt:5": result(40, "verbal"),
    });
    expect(r.done).toBe(0);
    expect(r.verbal.normering).toBeNull();
  });
});

describe("parseResults", () => {
  it("läser tillbaka det som skrevs", () => {
    const results: ProvResults = { "2020ht:1": result(36, "verbal") };
    expect(parseResults(JSON.stringify(results))).toEqual(results);
  });

  it("behandlar tom eller trasig lagring som inga resultat", () => {
    expect(parseResults(null)).toEqual({});
    expect(parseResults("")).toEqual({});
    expect(parseResults("inte json")).toEqual({});
    expect(parseResults("null")).toEqual({});
    expect(parseResults("[1,2,3]")).toEqual({});
  });

  // En trasig post ska försvinna tyst. Släpps den igenom hamnar den inte i en
  // logg utan i en poäng: "NaN/40" bredvid provpasset.
  it("kastar poster som inte håller och behåller de som gör det", () => {
    const parsed = parseResults(
      JSON.stringify({
        "2020ht:1": { score: "trettiosex", total: 40, kind: "verbal", mode: "prov", at: 1 },
        "2020ht:2": { score: 36, total: 0, kind: "verbal", mode: "prov", at: 1 },
        "2020ht:4": { score: 36, total: 40, kind: "matte", mode: "prov", at: 1 },
        "2020ht:5": { score: 36, total: 40, kind: "verbal", mode: "prov", at: 1 },
      }),
    );
    expect(Object.keys(parsed)).toEqual(["2020ht:5"]);
  });

  it("klipper en poäng som är högre än antalet uppgifter", () => {
    const parsed = parseResults(
      JSON.stringify({ "2020ht:1": { score: 99, total: 40, kind: "verbal", mode: "prov", at: 1 } }),
    );
    expect(parsed["2020ht:1"].score).toBe(40);
  });
});

describe("lagringen", () => {
  function fakeStorage(): Storage {
    const map = new Map<string, string>();
    return {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => void map.set(k, v),
      removeItem: (k: string) => void map.delete(k),
      clear: () => map.clear(),
      key: (i: number) => [...map.keys()][i] ?? null,
      get length() {
        return map.size;
      },
    } as Storage;
  }

  let store: Storage;

  beforeEach(() => {
    store = fakeStorage();
    (globalThis as { window?: unknown }).window = { localStorage: store };
  });

  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  it("sparar flera provpass i samma nyckel", () => {
    saveResult("2020ht", 1, result(36, "verbal"));
    saveResult("2020ht", 5, result(38, "verbal"));

    expect(Object.keys(loadResults()).sort()).toEqual(["2020ht:1", "2020ht:5"]);
    expect(store.getItem(RESULTS_STORAGE_KEY)).toContain("2020ht:5");
  });

  it("ett omskrivet provpass ersätter det gamla resultatet", () => {
    saveResult("2020ht", 1, result(12, "verbal"));
    saveResult("2020ht", 1, result(36, "verbal"));

    expect(loadResults()["2020ht:1"].score).toBe(36);
  });

  it("överlever att lagringen innehåller skräp", () => {
    store.setItem(RESULTS_STORAGE_KEY, "{trasig");
    expect(loadResults()).toEqual({});

    saveResult("2020ht", 1, result(36, "verbal"));
    expect(loadResults()["2020ht:1"].score).toBe(36);
  });
});
