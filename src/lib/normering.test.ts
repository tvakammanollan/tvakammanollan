import { describe, expect, it } from "vitest";
import {
  HP_TOTAL_QUESTIONS,
  hasOfficialNormering,
  normeringForPart,
  normeringFromParts,
  normeringFromRatio,
  normeringFromRaw,
  officialNormering,
  ANTAL_RATT_NIVÅER,
  kravFörNivå,
  nivåFrånSlug,
  nivåSlug,
  normeringTerms,
  officialMinRawFor,
  sammanfattaKrav,
} from "./normering";

describe("normeringFromRaw", () => {
  it("kända ankarvärden ur tabellen", () => {
    expect(normeringFromRaw(0)).toBe(0.0);
    expect(normeringFromRaw(80)).toBe(0.95);
    expect(normeringFromRaw(120)).toBe(1.5);
    expect(normeringFromRaw(155)).toBe(2.0);
    expect(normeringFromRaw(160)).toBe(2.0);
  });

  it("interpolerar mellan ankare (52 rätt → 0,40)", () => {
    // 50→0.35, 55→0.45; t=(52-50)/5=0.4 → 0.39 → avrundat till 0,05-steg = 0.40
    expect(normeringFromRaw(52)).toBe(0.4);
  });

  it("klampar utanför intervallet", () => {
    expect(normeringFromRaw(-5)).toBe(0.0);
    expect(normeringFromRaw(999)).toBe(2.0);
  });

  // Skalan är 0,05 — inte 0,1. Poängräknaren visade länge resultatet med en
  // decimal, vilket tog bort varannat steg: 145 rätt (1,90) och 150 rätt
  // (1,95) blev båda "1,9". Testet pinnar att halvstegen finns i datan, så
  // att nästa formatering inte kan slarva bort dem obemärkt.
  it("ligger på 0,05-steg och når hela skalan, halvsteg inräknade", () => {
    const varden = new Set<number>();
    for (let raw = 0; raw <= HP_TOTAL_QUESTIONS; raw++) {
      const v = normeringFromRaw(raw);
      expect(Math.round(v * 100) % 5).toBe(0);
      varden.add(Math.round(v * 100));
    }
    // Alla 41 värdena mellan 0,00 och 2,00 ska gå att få.
    for (let hundradelar = 0; hundradelar <= 200; hundradelar += 5) {
      expect(varden.has(hundradelar)).toBe(true);
    }
    expect(normeringFromRaw(150)).toBe(1.95);
    expect(normeringFromRaw(145)).toBe(1.9);
  });

  it("är monotont icke-avtagande över hela skalan", () => {
    let prev = -1;
    for (let raw = 0; raw <= HP_TOTAL_QUESTIONS; raw++) {
      const v = normeringFromRaw(raw);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
});

describe("normeringFromRatio", () => {
  it("räknar upp en andel till 160-skalan", () => {
    expect(normeringFromRatio(1)).toBe(2.0);
    expect(normeringFromRatio(0.75)).toBe(normeringFromRaw(120));
    expect(normeringFromRatio(0)).toBe(0);
  });

  it("ger samma poäng oavsett hur många uppgifter andelen räknats på", () => {
    // Ett provpass (36 av 40) och en hel provdel (72 av 80) är samma andel.
    expect(normeringFromRatio(36 / 40)).toBe(normeringFromRatio(72 / 80));
  });

  it("klarar en nolldivision utan att svara NaN", () => {
    expect(normeringFromRatio(0 / 0)).toBe(0);
  });
});

describe("normeringFromParts", () => {
  // Provets poäng är snittet av delarnas, inte en tredje uppslagning.
  it("1,90 verbalt och 2,00 kvantitativt blir 1,95", () => {
    expect(normeringFromParts(1.9, 2.0)).toBe(1.95);
  });

  it("avrundar till närmaste 0,05", () => {
    expect(normeringFromParts(1.0, 1.05)).toBe(1.05);
    expect(normeringFromParts(0.7, 1.35)).toBe(1.05);
    expect(normeringFromParts(2.0, 2.0)).toBe(2.0);
    expect(normeringFromParts(0, 0)).toBe(0);
  });

  // Snittet av två uppslagningar är inte samma sak som en uppslagning av
  // summan, eftersom tabellen inte är rät. Det är snittet som gäller.
  it("skiljer sig medvetet från att slå upp den sammanlagda råpoängen", () => {
    const verbal = normeringFromRatio(20 / 80);
    const kvant = normeringFromRatio(80 / 80);
    expect(normeringFromParts(verbal, kvant)).toBe(1.1);
    expect(normeringFromRaw(100)).toBe(1.25);
  });
});

/* ── Officiell normering per provtillfälle ───────────────────────── */

describe("officialNormering", () => {
  it("olika provtillfällen ger olika poäng för samma antal rätt", () => {
    // Hela poängen med punkt 5: en gemensam tabell för alla prov är i
    // praktiken att normera mot fel prov. UHR sätter gränserna efter
    // provdagen och de rör sig mellan tillfällena.
    const värden = ["2020ht", "2022ht", "2024vt", "2025ht"]
      .map((term) => officialNormering(term, "verbal", 60, 80))
      .filter((v): v is number => v !== null);
    expect(värden.length).toBeGreaterThanOrEqual(3);
    expect(new Set(värden).size).toBeGreaterThan(1);
  });

  it("täcker hela skalan för ett prov som har tabell", () => {
    expect(officialNormering("2025ht", "verbal", 0, 80)).toBe(0);
    expect(officialNormering("2025ht", "verbal", 80, 80)).toBe(2);
    const mitten = officialNormering("2025ht", "verbal", 50, 80);
    expect(mitten).toBeGreaterThan(0);
    expect(mitten).toBeLessThan(2);
  });

  it("är monoton: fler rätt kan aldrig ge lägre poäng", () => {
    let förra = -1;
    for (let rätt = 0; rätt <= 80; rätt++) {
      const v = officialNormering("2025ht", "kvant", rätt, 80);
      expect(v).not.toBeNull();
      expect(v!).toBeGreaterThanOrEqual(förra);
      förra = v!;
    }
  });

  it("provtillfällen utan tabell ger null i stället för en gissning", () => {
    expect(officialNormering("1999vt", "verbal", 40, 80)).toBeNull();
    expect(hasOfficialNormering("1999vt", "verbal")).toBe(false);
  });

  it("räknar upp ett halvt underlag till tabellens skala", () => {
    // Ett skrivet provpass är fyrtio uppgifter av åttio. 30 av 40 ska landa
    // på samma poäng som 60 av 80.
    expect(officialNormering("2025ht", "verbal", 30, 40)).toBe(
      officialNormering("2025ht", "verbal", 60, 80),
    );
  });

  it("2012 hade 76 uppgifter i den verbala delen, inte 80", () => {
    // Provformatet ändrades när ELF infördes. En hårdkodad 80:a hade räknat
    // om alla resultat på det provet till fel andel.
    expect(officialNormering("2012vt", "verbal", 76, 76)).toBe(2);
    expect(officialNormering("2012vt", "verbal", 0, 76)).toBe(0);
  });
});

describe("normeringForPart", () => {
  it("säger vilken väg som användes", () => {
    const officiell = normeringForPart("2025ht", "verbal", 60, 80);
    expect(officiell.official).toBe(true);

    const uppskattad = normeringForPart("1999vt", "verbal", 60, 80);
    expect(uppskattad.official).toBe(false);
    expect(uppskattad.value).toBeGreaterThan(0);
  });
});

describe("normeringssidornas helpers", () => {
  it("normeringTerms är nyast först och har etiketter", async () => {
    const { normeringTerms } = await import("./normering");
    const terms = normeringTerms();
    expect(terms.length).toBeGreaterThan(20);
    for (let i = 1; i < terms.length; i++) {
      expect(terms[i - 1].date >= terms[i].date).toBe(true);
    }
    expect(terms.find((t) => t.term === "2025ht")?.label).toBe("Hösten 2025");
  });

  it("officialTable är sammanhängande från 0 till provdelens längd", async () => {
    const { normeringTerms, officialTable, officialPartMax } = await import("./normering");
    for (const { term } of normeringTerms()) {
      for (const kind of ["verbal", "kvant"] as const) {
        const rows = officialTable(term, kind);
        if (!rows) continue;
        expect(rows[0].from).toBe(0);
        expect(rows[rows.length - 1].to).toBe(officialPartMax(term, kind));
        for (let i = 1; i < rows.length; i++) expect(rows[i].from).toBe(rows[i - 1].to + 1);
      }
    }
  });

  it("saknad tabell ger null, inte approximationen", async () => {
    const { officialTable } = await import("./normering");
    expect(officialTable("2019ht", "kvant")).toBeNull();
    expect(officialTable("1999ht", "verbal")).toBeNull();
  });
});

describe("antal rätt per nivå", () => {
  it("har sexton nivåer från 0,5 till 2,0", () => {
    expect(ANTAL_RATT_NIVÅER).toHaveLength(16);
    expect(ANTAL_RATT_NIVÅER[0]).toBe(0.5);
    expect(ANTAL_RATT_NIVÅER[15]).toBe(2);
  });
  it("översätter mellan nivå och slug", () => {
    expect(nivåSlug(1.5)).toBe("1-5");
    expect(nivåFrånSlug("1-5")).toBe(1.5);
    expect(nivåFrånSlug("2-0")).toBe(2);
    expect(nivåFrånSlug("0-4")).toBeNull();
    expect(nivåFrånSlug("1,5")).toBeNull();
    for (const n of ANTAL_RATT_NIVÅER) expect(nivåFrånSlug(nivåSlug(n))).toBe(n);
  });
  it("följer de officiella tabellerna", () => {
    const rader = kravFörNivå(2.0);
    expect(rader.length).toBe(normeringTerms().length);
    for (const r of rader) {
      if (r.verbal !== null) expect(r.verbal).toBe(officialMinRawFor(r.term, "verbal", 2.0));
      if (r.kvant !== null) expect(r.kvant).toBe(officialMinRawFor(r.term, "kvant", 2.0));
    }
  });
  it("kräver aldrig fler rätt för en lägre nivå", () => {
    const hög = sammanfattaKrav(kravFörNivå(2.0), "kvant")!;
    const låg = sammanfattaKrav(kravFörNivå(1.0), "kvant")!;
    expect(låg.median).toBeLessThan(hög.median);
    expect(hög.min).toBeLessThanOrEqual(hög.median);
    expect(hög.median).toBeLessThanOrEqual(hög.max);
  });
});
