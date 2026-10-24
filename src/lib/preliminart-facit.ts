/**
 * Preliminärt facit och trolig normering för det senaste högskoleprovet.
 *
 * Sidan /hogskoleprovet-facit och den runda "Efter provet"-knappen på
 * startsidan läser allt härifrån. Byt prov genom att byta objektet.
 *
 * Facit skrivs som strängar på 40 bokstäver per provpass och valideras av
 * testet. En felskriven bokstav här syns inte i någon typkontroll men hamnar
 * i Googles utdrag för "facit högskoleprovet", så strängarna är lätta att
 * jämföra rad för rad mot källan.
 */

export type PassKind = "verbal" | "kvant";
export type Letter = "A" | "B" | "C" | "D" | "E";

export interface FacitPass {
  /** Provpassets nummer på provdagen. */
  pass: number;
  kind: PassKind;
  /** 40 bokstäver, uppgift 1 först. */
  answers: string;
}

export interface PreliminartFacit {
  /** Samma termnyckel som arkivet (`2026ht`). */
  term: string;
  /** "Höstprovet 2026". */
  label: string;
  /** "hösten 2026", som det skrivs i en söktitel. */
  period: string;
  /** ISO-datum för provdagen. */
  date: string;
  /** ISO-datum då sidan senast ändrades i sak. Går till `dateModified`. */
  updated: string;
  passes: FacitPass[];
  /**
   * Trolig gräns för 2,0: antal rätt av 80 per provdel. Sajtens bedömning,
   * gjord mot UHR:s tabeller för de senaste proven (se `historiskaKrav` i normering.ts),
   * inte UHR:s besked. `null` tar bort avsnittet.
   */
  troligGrans: { verbal: number; kvant: number } | null;
  /**
   * Knappen på startsidan visas fram till och med det här datumet. Efter det
   * har UHR publicerat både facit och normering, och då är ett preliminärt
   * facit ett gammalt besked. Sidan själv ligger kvar.
   */
  promoUntil: string;
  /**
   * Datum då UHR publicerade det officiella facit OCH vi kontrollerat att
   * våra 160 bokstäver är identiska med det. `null` så länge det inte är
   * gjort; då säger sidan "preliminärt". Sätt det bara efter en riktig
   * jämförelse rad för rad.
   */
  officielltFacit: string | null;
}

/** Antal uppgifter per provpass och per provdel. */
export const PASS_LENGTH = 40;
export const PART_LENGTH = 80;

/** Delprovens ordning inom ett provpass (provformatet sedan 2011). */
export const DELPROV: Record<PassKind, ReadonlyArray<{ kod: string; from: number; to: number }>> = {
  verbal: [
    { kod: "ORD", from: 1, to: 10 },
    { kod: "LÄS", from: 11, to: 20 },
    { kod: "MEK", from: 21, to: 30 },
    { kod: "ELF", from: 31, to: 40 },
  ],
  kvant: [
    { kod: "XYZ", from: 1, to: 12 },
    { kod: "KVA", from: 13, to: 22 },
    { kod: "NOG", from: 23, to: 28 },
    { kod: "DTK", from: 29, to: 40 },
  ],
};

export const FACIT: PreliminartFacit = {
  term: "2026ht",
  label: "Höstprovet 2026",
  period: "hösten 2026",
  date: "2026-10-18",
  updated: "2026-10-24",
  passes: [
    { pass: 1, kind: "kvant", answers: "DCBCDAACAC" + "BBCACADBDC" + "CBBDCADEDC" + "ACBDACBBBD" },
    { pass: 2, kind: "verbal", answers: "CADCDEECBE" + "BDAACDBCDC" + "ACDAABBCBB" + "BDACBADACC" },
    { pass: 4, kind: "kvant", answers: "DDBACDAACA" + "BCACCDACCB" + "DCCEDCBABB" + "DBAABCBDCD" },
    { pass: 5, kind: "verbal", answers: "DCBBBADEED" + "CDADBDCABC" + "ADDABDCABA" + "CDBADBDCDB" },
  ],
  troligGrans: { verbal: 76, kvant: 76 },
  promoUntil: "2026-11-30",
  // Jämfört 2026-10-24 mot hogskoleprovet-facit-26b.pdf på studera.nu:
  // alla fyra provpass identiska, inga uppgifter utgår.
  officielltFacit: "2026-10-21",
};

/** Delprovet en uppgift hör till. */
export function delprovFor(kind: PassKind, q: number): string {
  return DELPROV[kind].find((d) => q >= d.from && q <= d.to)?.kod ?? "";
}

/** Facit som bokstäver, med validering. Kastar hellre än visar fel facit. */
export function passAnswers(p: FacitPass): Letter[] {
  if (!/^[A-E]{40}$/.test(p.answers)) {
    throw new Error(`Provpass ${p.pass}: facit måste vara exakt 40 bokstäver A–E`);
  }
  return p.answers.split("") as Letter[];
}

/**
 * Hur långt från den troliga 2,0-gränsen ett antal rätt ligger.
 * Positivt = över gränsen. `null` när ingen gräns är satt.
 */
export function distansTillGrans(rätt: number, grans: number | null): number | null {
  if (grans === null || !Number.isFinite(rätt)) return null;
  return Math.round(rätt) - grans;
}

/** Antal rätt per provdel ur rätt per provpass. Ogiltiga fält räknas som tomma. */
export function summaPerDel(
  f: PreliminartFacit,
  rättPerPass: Record<number, number | null>,
): Record<PassKind, number | null> {
  const ut: Record<PassKind, number | null> = { verbal: null, kvant: null };
  for (const kind of ["verbal", "kvant"] as const) {
    const pass = f.passes.filter((p) => p.kind === kind);
    const värden = pass.map((p) => rättPerPass[p.pass]);
    if (värden.some((v) => v === null || v === undefined || !Number.isFinite(v))) continue;
    ut[kind] = värden.reduce<number>(
      (s, v) => s + Math.max(0, Math.min(PASS_LENGTH, Math.round(v as number))),
      0,
    );
  }
  return ut;
}

/** Ska "Efter provet"-knappen synas? Sista dagen inräknad, svensk tid. */
export function facitKnappSynlig(f: PreliminartFacit, now: Date = new Date()): boolean {
  const slut = Date.parse(`${f.promoUntil}T23:59:59+01:00`);
  return Number.isFinite(slut) && now.getTime() <= slut;
}
