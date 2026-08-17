/**
 * Typer för gamla högskoleprov (src/data/prov/*.json, byggda av
 * scripts/hp-import/). Ett provtillfälle består av fyra provpass; varje
 * provpass är en egen fil med sina uppgifter, lästexter och facit.
 *
 * Uppgifterna kommer i två former:
 *  - text  — ORD, MEK, LÄS, ELF, NOG och de flesta DTK-uppgifter
 *  - bild  — XYZ och KVA, samt de uppgifter som har en egen figur. Matematiken
 *            går inte att extrahera som text ur UHR:s PDF:er, så uppgiften
 *            visas som ett utsnitt ur provhäftet med svarsknappar under.
 */

/** Delprov i den ordning de förekommer på provet. */
export const DELPROV_ORDER = ["ORD", "LÄS", "MEK", "ELF", "XYZ", "KVA", "NOG", "DTK"] as const;

export type Delprov = (typeof DELPROV_ORDER)[number];

/** Kort etikett (används i chips och navigatorn). */
const SHORT: Record<string, string> = {
  ORD: "Ordförståelse",
  LÄS: "Läsförståelse",
  MEK: "Meningskompl.",
  ELF: "Engelsk läs.",
  XYZ: "Problemlösning",
  KVA: "Kvant. jämf.",
  NOG: "Kvant. resonem.",
  DTK: "Diagram & tabeller",
};

/** Fullt namn (rubriker och SEO-text). */
const FULL: Record<string, string> = {
  ORD: "Ordförståelse",
  LÄS: "Svensk läsförståelse",
  MEK: "Meningskomplettering",
  ELF: "Engelsk läsförståelse",
  XYZ: "Matematisk problemlösning",
  KVA: "Kvantitativa jämförelser",
  NOG: "Kvantitativa resonemang",
  DTK: "Diagram, tabeller och kartor",
};

export function delprovShort(code: string): string {
  return SHORT[code] ?? code;
}

export function delprovFull(code: string): string {
  return FULL[code] ?? code;
}

/** Delprov som har en lästext bredvid uppgiften. */
export function hasPassage(code: string): boolean {
  return code === "LÄS" || code === "ELF";
}

export interface ProvSection {
  code: string;
  count: number;
  first: number;
  last: number;
  /** Rekommenderad tid i minuter enligt provhäftets framsida. */
  minutes: number;
}

export interface ProvQuestion {
  nr: number;
  delprov: string;
  /** Frågetext. Finns även för bilduppgifter, som underlag för sök och alt-text. */
  text?: string;
  /** Svarsalternativ A–E. Saknas för bilduppgifter — alternativen syns i bilden. */
  alternatives?: string[];
  /** Bildutsnitt ur provhäftet. */
  image?: string;
  /** Antal svarsalternativ för bilduppgifter. */
  altCount?: number;
  /** Index i passets `passages`. */
  passage?: number;
  /** Index i passets `figures` (DTK-diagram). */
  figure?: number;
  /** ELF-luckuppgift: numret är markerat i texten, frågan har ingen egen mening. */
  cloze?: boolean;
  answer: string;
  /** Fler godkända svar — UHR har underkänt uppgiften i efterhand. */
  answers?: string[];
  /**
   * UHR strök uppgiften efter provdagen ("C – utgår" i facit) och räknade inte
   * med den i resultatet. Den har ändå ett rätt svar och ingår i provhäftet, så
   * den visas som vanligt — men det ska framgå att den inte gav poäng.
   */
  utgar?: boolean;
}

export interface ProvGlossEntry {
  term: string;
  definition: string;
}

export interface ProvPassage {
  title?: string;
  paragraphs: string[];
  byline?: string;
  /** Ordförklaringarna som står i en ruta under texten i provhäftet. */
  glossary?: ProvGlossEntry[];
}

export interface ProvPass {
  term: string;
  date: string;
  label: string;
  pass: number;
  kind: "verbal" | "kvant";
  minutes: number;
  sections: ProvSection[];
  /** Delprov som UHR inte publicerar (ELF, av upphovsrättsskäl). */
  missing: string[];
  questions: ProvQuestion[];
  passages: ProvPassage[];
  figures: { src: string }[];
  /** Länk till provhäftet hos UHR. */
  source: string;
}

export interface PassSummary {
  pass: number;
  kind: "verbal" | "kvant";
  minutes: number;
  questions: number;
  delprov: string[];
  missing: string[];
}

export interface ExamSummary {
  term: string;
  date: string;
  label: string;
  questions: number;
  passes: PassSummary[];
}

export interface ExamIndex {
  exams: ExamSummary[];
}

/** Enstaka uppgift ur arkivet, för delprovssidorna under /ova. */
export interface ProvExample {
  term: string;
  label: string;
  pass: number;
  nr: number;
  answer: string;
  text?: string;
  alternatives?: string[];
  image?: string;
  altCount?: number;
  /** Början av lästexten, för LÄS och ELF. */
  passage?: string;
  /** Diagrammet uppgiften hör till, för DTK. */
  figure?: string;
}

/**
 * "2026vt" → "Vårprovet 2026". Används bara som reserv — provens etiketter
 * kommer normalt från indexfilen, som kan skilja på två prov samma säsong
 * ("Vårprovet 2022 (12 mars)").
 */
export function termToLabel(term: string): string {
  const m = term.match(/^(\d{4})(ht|vt)([ab])?$/);
  if (!m) return term;
  const season = m[2] === "ht" ? "Höstprovet" : "Vårprovet";
  // 2021vta och 2021vtb är två skilda provtillfällen samma vår. Utan suffixet
  // får de identisk etikett och går inte att skilja åt i listor eller länkar.
  // Bokstaven följer inte datumordning (2022vta är 7 maj, 2022vtb 12 mars), så
  // reserven påstår ingen ordning — indexets label har det riktiga datumet.
  return `${season} ${m[1]}${m[3] ? ` (prov ${m[3].toUpperCase()})` : ""}`;
}

/** "verbal" → "Verbal del". */
export function passKindLabel(kind: "verbal" | "kvant"): string {
  return kind === "verbal" ? "Verbal del" : "Kvantitativ del";
}
