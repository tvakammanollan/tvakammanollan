/**
 * Regelverket för MEK-uppgifter, som kod.
 *
 * Reglerna står i ord i `scripts/mek-gen/REGELVERK.md`; det här är de av dem
 * som går att kontrollera utan nät och utan språkmodell. Uppdelningen är den
 * vanliga i repot: ren logik här och testad, körningen mot filer i
 * `scripts/mek-gen/check.ts`.
 *
 * Felen är delade i tre nivåer, och skillnaden är hela poängen:
 *
 * - `format`: regler UHR själv följer. Alla 600 arkivuppgifter ska klara dem,
 *   och testet pinnar det. Underkänner en formatregel en riktig uppgift är det
 *   regeln som är fel, inte uppgiften.
 * - `strikt`: regler vi är strängare än UHR med, för att skydda mot sådant UHR
 *   inte behöver skydda sig mot (tidsord i en bank som ska leva i åratal,
 *   typografi från en språkmodell, ligaturskräp). Gäller bara egna uppgifter.
 * - `varning`: tillåtet men kvoterat på banknivå, se `bankReport`.
 */

export type Answer = "A" | "B" | "C" | "D";

export interface MekItem {
  text: string;
  alternatives: string[];
  answer: string;
}

export const LETTERS: Answer[] = ["A", "B", "C", "D"];

/** Luckmarkeringen i egna uppgifter. Arkivet har både fyra och fem understreck. */
export const GAP = "_____";
const GAP_RE = /_{2,}/g;

/** Avskiljaren mellan luckorna i ett flerluckealternativ (alla 1 440 i arkivet). */
export const SLOT_SEPARATOR = " – ";

/** Ordantal per luckantal: arkivets faktiska spann (C1.5). */
export const WORD_LIMITS: Record<1 | 2 | 3, [number, number]> = {
  1: [12, 61],
  2: [15, 67],
  3: [21, 77],
};

export const MAX_SENTENCES = 5;

/**
 * Funktionsord som ensamt luckvärde. UHR tillåter det bara i flerluckor
 * (`När – omhuldade – komplex`, `med – opålitliga`), fem gånger på 600.
 */
const FUNCTION_WORDS = new Set(
  (
    "i på av för till med om från under över vid mot hos efter utan genom kring inom " +
    "och eller men att som dels samt både när eftersom medan om då fast ty så " +
    "den det de en ett han hon hen man vi ni jag sig sin sitt sina inte"
  ).split(" "),
);

/** Tidsord som gör en text osann med tiden (C2.3). */
const TIME_WORDS =
  /\b(i år|i fjol|nyligen|just nu|förra året|nästa år|i dag|idag|i höstas|i våras|i somras|i vintras|i sommar|i vinter|i höst|i vår|häromåret|häromdagen|denna vecka|den här veckan)\b/i;

/** Ligaturfel ur PDF-extraktion: `fl ickor`, `defi nition`, `fi skar`. */
const LIGATURE_RE = /\b(\p{L}*f[il]) (?=\p{Ll})/gu;

export type FaultLevel = "format" | "strikt" | "varning";

export type MekFault =
  // format
  | "fel_antal_alternativ"
  | "ogiltigt_facit"
  | "inga_luckor"
  | "för_många_luckor"
  | "fel_antal_luckvärden"
  | "tomt_luckvärde"
  | "upprepat_luckvärde"
  | "för_kort"
  | "för_lång"
  | "för_många_meningar"
  | "intilliggande_luckor"
  | "funktionsord_i_enlucka"
  | "flera_funktionsordsluckor"
  | "gemen_vid_meningsstart"
  // strikt
  | "fel_luckmarkering"
  | "em_streck"
  | "raka_citattecken"
  | "tidsord"
  | "ligaturfel"
  | "dubbla_mellanslag"
  // varning
  | "nyckel_i_texten"
  | "luckor_tätt";

export const FAULT_LEVEL: Record<MekFault, FaultLevel> = {
  fel_antal_alternativ: "format",
  ogiltigt_facit: "format",
  inga_luckor: "format",
  för_många_luckor: "format",
  fel_antal_luckvärden: "format",
  tomt_luckvärde: "format",
  upprepat_luckvärde: "format",
  för_kort: "format",
  för_lång: "format",
  för_många_meningar: "format",
  intilliggande_luckor: "format",
  funktionsord_i_enlucka: "format",
  flera_funktionsordsluckor: "format",
  gemen_vid_meningsstart: "format",
  fel_luckmarkering: "strikt",
  em_streck: "strikt",
  raka_citattecken: "strikt",
  tidsord: "strikt",
  ligaturfel: "strikt",
  dubbla_mellanslag: "strikt",
  nyckel_i_texten: "varning",
  luckor_tätt: "varning",
};

/** Gör en arkivtext jämförbar: ligaturfel lagade, luckorna som `GAP` (A5). */
export function normalizeArchiveText(text: string): string {
  return text.replace(LIGATURE_RE, "$1").replace(GAP_RE, GAP).replace(/ {2,}/g, " ").trim();
}

/** Hela uppgiften: ligaturfelen sitter i alternativen också (`fi nansiellt`). */
export function normalizeArchiveItem<T extends MekItem>(item: T): T {
  return {
    ...item,
    text: normalizeArchiveText(item.text),
    alternatives: item.alternatives.map((a) => a.replace(LIGATURE_RE, "$1").trim()),
  };
}

export function gapCount(text: string): number {
  return (text.match(GAP_RE) ?? []).length;
}

export function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** Meningar räknas på avslutande skiljetecken; en text utan sådant är en mening. */
export function sentenceCount(text: string): number {
  const n = (text.match(/[.!?]["”»]?(\s|$)/g) ?? []).length;
  return Math.max(1, n);
}

/** Alternativets luckvärden, i luckornas ordning. */
export function slots(alternative: string, gaps: number): string[] {
  return gaps > 1 ? alternative.split(SLOT_SEPARATOR).map((s) => s.trim()) : [alternative.trim()];
}

export function answerIndex(answer: string): number {
  return LETTERS.indexOf(answer as Answer);
}

export function keySlots(item: MekItem): string[] {
  return slots(item.alternatives[answerIndex(item.answer)] ?? "", gapCount(item.text));
}

/** Ordtokens utan skiljetecken och utan luckor, gemener. */
export function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w && !w.includes("__"))
    .map((w) => w.replace(/[^\p{L}\p{N}-]/gu, ""))
    .filter(Boolean);
}

/**
 * Grov lemmanyckel: de sex första bokstäverna. `förklara`/`förklaring` och
 * `periodicitet`/`periodiskt` hamnar ihop, `förkasta` inte. Den är till för
 * kvoter och läckvarningar, där ett falskt larm kostar en titt.
 */
export function stem(word: string): string {
  const w = word.toLowerCase();
  return w.length >= 6 ? w.slice(0, 6) : w;
}

/** Index (i ordflödet) för varje lucka. */
function gapPositions(text: string): number[] {
  const words = text.split(/\s+/).filter(Boolean);
  return words.flatMap((w, i) => (w.includes("__") ? [i] : []));
}

/** Står luckan först i en mening? */
function gapsAtSentenceStart(text: string): boolean[] {
  const out: boolean[] = [];
  for (const m of text.matchAll(GAP_RE)) {
    const before = text.slice(0, m.index).trimEnd();
    out.push(before === "" || /[.!?]["”»]?$/.test(before));
  }
  return out;
}

export function mekFaults(item: MekItem): MekFault[] {
  const f = new Set<MekFault>();
  const { text, alternatives } = item;
  const g = gapCount(text);

  if (alternatives.length !== 4) f.add("fel_antal_alternativ");
  if (answerIndex(item.answer) < 0 || answerIndex(item.answer) >= alternatives.length) {
    f.add("ogiltigt_facit");
  }
  if (g === 0) f.add("inga_luckor");
  if (g > 3) f.add("för_många_luckor");
  if (g === 0 || g > 3) return [...f];

  const [min, max] = WORD_LIMITS[g as 1 | 2 | 3];
  const wc = wordCount(text);
  if (wc < min) f.add("för_kort");
  if (wc > max) f.add("för_lång");
  if (sentenceCount(text) > MAX_SENTENCES) f.add("för_många_meningar");

  const parsed = alternatives.map((a) => slots(a, g));
  if (parsed.some((p) => p.length !== g)) {
    f.add("fel_antal_luckvärden");
  } else {
    if (parsed.some((p) => p.some((s) => s === ""))) f.add("tomt_luckvärde");
    for (let i = 0; i < g; i++) {
      const values = parsed.map((p) => p[i].toLowerCase());
      if (new Set(values).size !== values.length) f.add("upprepat_luckvärde");
    }
    const fwSlots = Array.from({ length: g }, (_, i) =>
      parsed.some((p) => FUNCTION_WORDS.has(p[i].toLowerCase())),
    ).filter(Boolean).length;
    if (g === 1 && fwSlots > 0) f.add("funktionsord_i_enlucka");
    if (g > 1 && fwSlots > 1) f.add("flera_funktionsordsluckor");

    gapsAtSentenceStart(text).forEach((atStart, i) => {
      if (atStart && parsed.some((p) => !/^[\p{Lu}\d]/u.test(p[i]))) {
        f.add("gemen_vid_meningsstart");
      }
    });

    // Nyckeln eller en avledning av den står redan i texten (C3.3).
    const textStems = new Set(
      tokens(text)
        .filter((w) => w.length >= 5)
        .map(stem),
    );
    const key = parsed[answerIndex(item.answer)] ?? [];
    for (const word of key.flatMap((s) => s.toLowerCase().split(/\s+/))) {
      if (word.length >= 5 && !FUNCTION_WORDS.has(word) && textStems.has(stem(word))) {
        f.add("nyckel_i_texten");
      }
    }
  }

  const pos = gapPositions(text);
  for (let i = 1; i < pos.length; i++) {
    const between = pos[i] - pos[i - 1] - 1;
    if (between < 1) f.add("intilliggande_luckor");
    else if (between < 3) f.add("luckor_tätt");
  }

  // Strikt: bara egna uppgifter.
  const markers = text.match(GAP_RE) ?? [];
  if (markers.some((m) => m !== GAP)) f.add("fel_luckmarkering");
  const all = [text, ...alternatives].join("\n");
  if (all.includes("—")) f.add("em_streck");
  if (/["']/.test(all)) f.add("raka_citattecken");
  if (TIME_WORDS.test(text)) f.add("tidsord");
  if (new RegExp(LIGATURE_RE.source, "u").test(all)) f.add("ligaturfel");
  if (/ {2,}/.test(all)) f.add("dubbla_mellanslag");

  return [...f];
}

export function faultsAt(item: MekItem, ...levels: FaultLevel[]): MekFault[] {
  return mekFaults(item).filter((x) => levels.includes(FAULT_LEVEL[x]));
}

/** En egen uppgift släpps bara utan format- och striktfel. */
export function mekItemPasses(item: MekItem): boolean {
  return faultsAt(item, "format", "strikt").length === 0;
}

/**
 * Längsta följd av ord två texter delar. Används två gånger: mot arkivet (ingen
 * egen uppgift får likna en UHR-uppgift) och mot upphovsrättsskyddade källor
 * (nivå D får inte dela 6 ord i följd med källan, C7).
 */
export function longestSharedRun(a: string, b: string): number {
  const x = tokens(a);
  const y = tokens(b);
  let best = 0;
  let prev = new Array<number>(y.length + 1).fill(0);
  for (let i = 1; i <= x.length; i++) {
    const cur = new Array<number>(y.length + 1).fill(0);
    for (let j = 1; j <= y.length; j++) {
      if (x[i - 1] === y[j - 1]) {
        cur[j] = prev[j - 1] + 1;
        if (cur[j] > best) best = cur[j];
      }
    }
    prev = cur;
  }
  return best;
}

/** Max delad ordföljd mot arkivet resp. mot en skyddad källa. */
export const MAX_RUN_VS_ARCHIVE = 8;
export const MAX_RUN_VS_PROTECTED_SOURCE = 5;

/** Bankkvoter (C1.7, C1.8, C3.3, C3.7), kalibrerade mot arkivet 2026-10-19. */
export const BANK_TARGETS = {
  gapShare: { 1: 0.4, 2: 0.4, 3: 0.2 } as Record<1 | 2 | 3, number>,
  gapShareTolerance: 0.02,
  answerShareTolerance: 0.02,
  // Ordningen i banken spelar ingen roll för den som spelar (uppgifterna dras
  // slumpvis), men en lång svit i en batch skvallrar om en skev generator.
  maxAnswerRun: 4,
  // UHR:s egen nivå: 37,1 / 32,5 / 31,7 % för 1/2/3 luckor. Vi får inte vara
  // skevare än UHR, men att kräva mindre skevhet än UHR vore att jaga brus.
  maxKeyLongestShare: 0.38,
  maxEchoShare: 0.03,
  maxKeyStemUses: 2,
  maxDistractorStemUses: 4,
} as const;

export interface BankReport {
  total: number;
  gaps: Record<1 | 2 | 3, number>;
  answers: Record<Answer, number>;
  longestAnswerRun: number;
  keyLongestShare: Record<1 | 2 | 3, number>;
  echoShare: number;
  medianWords: Record<1 | 2 | 3, number>;
  overusedKeyStems: [string, number][];
  overusedDistractorStems: [string, number][];
  duplicateTexts: string[];
  /** Avsteg från BANK_TARGETS i klartext. Tom lista = banken håller kvoterna. */
  problems: string[];
}

function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function bankReport(items: MekItem[]): BankReport {
  const gaps = { 1: 0, 2: 0, 3: 0 } as Record<1 | 2 | 3, number>;
  const answers = { A: 0, B: 0, C: 0, D: 0 } as Record<Answer, number>;
  const longest = { 1: 0, 2: 0, 3: 0 } as Record<1 | 2 | 3, number>;
  const words = { 1: [], 2: [], 3: [] } as Record<1 | 2 | 3, number[]>;
  const keyStems = new Map<string, number>();
  const distStems = new Map<string, number>();
  const seen = new Map<string, number>();
  let echo = 0;
  let run = 0;
  let longestRun = 0;
  let last = "";

  for (const item of items) {
    const g = gapCount(item.text) as 1 | 2 | 3;
    if (!(g in gaps)) continue;
    gaps[g]++;
    words[g].push(wordCount(item.text));
    const k = answerIndex(item.answer);
    if (k >= 0) answers[LETTERS[k]]++;
    run = item.answer === last ? run + 1 : 1;
    last = item.answer;
    longestRun = Math.max(longestRun, run);

    const lens = item.alternatives.map((a) => a.length);
    if (lens[k] === Math.max(...lens)) longest[g]++;
    if (mekFaults(item).includes("nyckel_i_texten")) echo++;

    item.alternatives.forEach((alt, i) => {
      const target = i === k ? keyStems : distStems;
      // Kvoten räknas på hela ordformen, inte på `stem`: sex bokstäver slår
      // ihop `komplex`, `komplement` och `komplicerad`, som är olika ord.
      for (const s of slots(alt, g)) {
        const w = s.toLowerCase();
        if (FUNCTION_WORDS.has(w)) continue;
        target.set(w, (target.get(w) ?? 0) + 1);
      }
    });

    const norm = tokens(item.text).join(" ");
    seen.set(norm, (seen.get(norm) ?? 0) + 1);
  }

  const total = items.length;
  const share = (n: number, d: number) => (d === 0 ? 0 : n / d);
  const keyLongestShare = {
    1: share(longest[1], gaps[1]),
    2: share(longest[2], gaps[2]),
    3: share(longest[3], gaps[3]),
  };
  const over = (m: Map<string, number>, max: number) =>
    [...m].filter(([, n]) => n > max).sort((a, b) => b[1] - a[1]);

  const report: BankReport = {
    total,
    gaps,
    answers,
    longestAnswerRun: longestRun,
    keyLongestShare,
    echoShare: share(echo, total),
    medianWords: { 1: median(words[1]), 2: median(words[2]), 3: median(words[3]) },
    overusedKeyStems: over(keyStems, BANK_TARGETS.maxKeyStemUses),
    overusedDistractorStems: over(distStems, BANK_TARGETS.maxDistractorStemUses),
    duplicateTexts: [...seen].filter(([, n]) => n > 1).map(([t]) => t),
    problems: [],
  };

  const t = BANK_TARGETS;
  const p = report.problems;
  for (const g of [1, 2, 3] as const) {
    const s = share(gaps[g], total);
    if (Math.abs(s - t.gapShare[g]) > t.gapShareTolerance) {
      p.push(`${g} luckor: ${(s * 100).toFixed(1)} % (mål ${t.gapShare[g] * 100} %)`);
    }
    if (keyLongestShare[g] > t.maxKeyLongestShare) {
      p.push(`facit längst i ${g}-luckor: ${(keyLongestShare[g] * 100).toFixed(1)} %`);
    }
  }
  for (const a of LETTERS) {
    const s = share(answers[a], total);
    if (Math.abs(s - 0.25) > t.answerShareTolerance) {
      p.push(`facit ${a}: ${(s * 100).toFixed(1)} % (mål 25 %)`);
    }
  }
  if (longestRun > t.maxAnswerRun) p.push(`samma facit ${longestRun} gånger i rad`);
  if (report.echoShare > t.maxEchoShare) {
    p.push(`nyckeln i texten: ${(report.echoShare * 100).toFixed(1)} % (max 3 %)`);
  }
  if (report.overusedKeyStems.length)
    p.push(`${report.overusedKeyStems.length} nyckelord över kvot`);
  if (report.overusedDistractorStems.length) {
    p.push(`${report.overusedDistractorStems.length} distraktorord över kvot`);
  }
  if (report.duplicateTexts.length) p.push(`${report.duplicateTexts.length} dubbletter`);
  return report;
}
