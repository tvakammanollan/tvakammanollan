/**
 * scrape-hp-questions.ts
 *
 * Hämtar gamla HP-PDF:er från hogskoleprovet.nu och parsar frågor från
 * alla 8 delprov (ORD, LÄS, MEK, ELF, XYZ, KVA, NOG, DTK).
 *
 * Struktur per termin (var-YYYY / host-YYYY):
 *   verb1.pdf  → Provpass 1  (ORD 1-10, LÄS 11-20, MEK 21-30, ELF 31-40)
 *   verb2.pdf  → Provpass 4  (samma uppdelning)
 *   kvant1.pdf → Provpass 2  (XYZ 1-12, KVA 13-22, NOG 23-28, DTK 29-40)
 *   kvant2.pdf → Provpass 5  (samma uppdelning)
 *   facit.pdf  → 4 kolumner med svar (pp1, pp2, pp4, pp5)
 *
 * Skriver scraper/hp-questions.json + scraper/fel.log
 */

import { writeFileSync, appendFileSync, existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { PDFParse } from "pdf-parse";

const UA = "HPKampen-Bot/1.0 (educational project)";
const DELAY_MS = 1000;
const OUT_PATH = join(process.cwd(), "scraper", "hp-questions.json");
const ERR_PATH = join(process.cwd(), "scraper", "fel.log");
const LIST_URL = "https://www.hogskoleprovet.nu/gamla-hogskoleprov/";

type Category = "ORD" | "MEK" | "LAS" | "ELF" | "XYZ" | "KVA" | "NOG" | "DTK";
type SubjectType = "verbal" | "math";
type Pass = "verb1" | "kvant1" | "verb2" | "kvant2";

type Option = { id: string; text: string };
type HpQuestion = {
  category: Category;
  subject_type: SubjectType;
  question_text: string;
  passage_text?: string;
  passage_id?: string;
  options: Option[];
  correct_answer: string;
  difficulty?: number;
  source: string;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function logError(file: string, err: unknown) {
  appendFileSync(ERR_PATH, `[${new Date().toISOString()}] ${file}: ${(err as Error).message}\n`);
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.text();
}

async function fetchPdfText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const parsed = await new PDFParse({ data: buf }).getText();
  return parsed.text;
}

/* ------------------------------------------------------------------ */
/* Lista terminer från hogskoleprovet.nu                               */
/* ------------------------------------------------------------------ */
type Termin = { slug: string; label: string; year: number; term: "vt" | "ht" };

async function listTerminer(): Promise<Termin[]> {
  const html = await fetchText(LIST_URL);
  const matches = [...html.matchAll(
    /\/uploads\/hogskoleprovet\/hogskoleprov\/(var|host)-(20\d{2})\//g,
  )];
  const seen = new Set<string>();
  const out: Termin[] = [];
  for (const m of matches) {
    const slug = `${m[1]}-${m[2]}`;
    if (seen.has(slug)) continue;
    seen.add(slug);
    const year = Number(m[2]);
    if (year < 2011) continue;
    out.push({ slug, label: slug, year, term: m[1] === "var" ? "vt" : "ht" });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Facit-parser: 4 kolumner (pp1, pp2, pp4, pp5)                        */
/* ------------------------------------------------------------------ */
function parseFacitOldFourCol(text: string): Record<Pass, Map<number, string>> | null {
  const empty = (): Map<number, string> => new Map();
  const result: Record<Pass, Map<number, string>> = {
    verb1: empty(), kvant1: empty(), verb2: empty(), kvant2: empty(),
  };
  const passByCol: Pass[] = ["verb1", "kvant1", "verb2", "kvant2"];
  let hits = 0;
  for (const line of text.split(/\r?\n/)) {
    const pairs = [...line.matchAll(/\b(\d{1,2})\s+([A-E])\b/g)];
    if (pairs.length < 2) continue;
    const firstNum = Number(pairs[0][1]);
    if (!pairs.every((p) => Number(p[1]) === firstNum)) continue;
    if (firstNum < 1 || firstNum > 40) continue;
    pairs.forEach((p, i) => {
      if (i < 4) result[passByCol[i]].set(firstNum, p[2]);
    });
    hits++;
  }
  return hits >= 10 ? result : null;
}

function parseFacitNewSections(text: string): Record<Pass, Map<number, string>> {
  const empty = (): Map<number, string> => new Map();
  const result: Record<Pass, Map<number, string>> = {
    verb1: empty(), kvant1: empty(), verb2: empty(), kvant2: empty(),
  };

  type Section = { kind: "verbal" | "kvant"; pairs: Map<number, string> };
  const sections: Section[] = [];
  let current: Section | null = null;

  // Buffrar för column-stil: när vi ser stackade siffror följt av stackade bokstäver
  let pendingNums: number[] = [];
  let pendingLetters: string[] = [];

  const flushColumn = () => {
    if (!current) return;
    const n = Math.min(pendingNums.length, pendingLetters.length);
    for (let i = 0; i < n; i++) {
      if (!current.pairs.has(pendingNums[i])) {
        current.pairs.set(pendingNums[i], pendingLetters[i]);
      }
    }
    pendingNums = [];
    pendingLetters = [];
  };

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    // Sektionsheader
    const isVerbal = /verbal\s*del/i.test(line);
    const isKvant = /kvantitativ\s*del/i.test(line);
    if (isVerbal || isKvant) {
      flushColumn();
      current = { kind: isVerbal ? "verbal" : "kvant", pairs: new Map() };
      sections.push(current);
      continue;
    }
    if (!current) continue;

    // Rad med pair "12\tA" eller "12 A"
    const pair = line.match(/^(\d{1,2})\s+([A-E])$/);
    if (pair) {
      flushColumn();
      const n = Number(pair[1]);
      if (n >= 1 && n <= 40 && !current.pairs.has(n)) {
        current.pairs.set(n, pair[2]);
      }
      continue;
    }

    // Rad med endast siffra
    const numOnly = line.match(/^(\d{1,2})$/);
    if (numOnly) {
      const n = Number(numOnly[1]);
      if (n >= 1 && n <= 40) {
        // Om bokstäver redan börjat samlas, töm först
        if (pendingLetters.length > 0) flushColumn();
        pendingNums.push(n);
      }
      continue;
    }

    // Rad med endast bokstav
    const letOnly = line.match(/^([A-E])$/);
    if (letOnly) {
      pendingLetters.push(letOnly[1]);
      continue;
    }

    // Övriga rader (rubriker, brus) → ignorera men flusha column om vi har data
    if (pendingLetters.length > 0 && pendingNums.length > 0) flushColumn();
  }
  flushColumn();

  // Tilldela: 1:a verbal-sektion → verb1, 2:a → verb2; samma för kvant
  const verbal = sections.filter((s) => s.kind === "verbal");
  const kvant = sections.filter((s) => s.kind === "kvant");
  if (verbal[0]) result.verb1 = verbal[0].pairs;
  if (verbal[1]) result.verb2 = verbal[1].pairs;
  if (kvant[0]) result.kvant1 = kvant[0].pairs;
  if (kvant[1]) result.kvant2 = kvant[1].pairs;
  return result;
}

function parseFacit(text: string): Record<Pass, Map<number, string>> {
  return parseFacitOldFourCol(text) ?? parseFacitNewSections(text);
}

/* ------------------------------------------------------------------ */
/* Frågeparser: hittar numrerade frågor + A–E-alternativ              */
/* ------------------------------------------------------------------ */
function categoryForVerbal(n: number): Category | null {
  if (n >= 1 && n <= 10) return "ORD";
  if (n >= 11 && n <= 20) return "LAS";
  if (n >= 21 && n <= 30) return "MEK";
  if (n >= 31 && n <= 40) return "ELF";
  return null;
}
function categoryForKvant(n: number): Category | null {
  if (n >= 1 && n <= 12) return "XYZ";
  if (n >= 13 && n <= 22) return "KVA";
  if (n >= 23 && n <= 28) return "NOG";
  if (n >= 29 && n <= 40) return "DTK";
  return null;
}

function cleanText(s: string): string {
  return s
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

/**
 * Plocka ut frågor och deras alternativ ur PDF-texten.
 * Returnerar { qNum: { body, options } } – outparsad rå text för senare bearbetning.
 */
type RawBlock = { num: number; body: string; options: Option[] };

function extractQuestionBlocks(text: string): RawBlock[] {
  // Ta bort sidnummer och dekoration
  const cleaned = text
    .replace(/-- \d+ of \d+ --/g, "\n")
    .replace(/^– \d+ –$/gm, "")
    .replace(/Svarshäfte nummer/g, "")
    .replace(/Tillstånd har inhämtats[^\n]*\n?/g, "");

  // Hitta alla position där en numrerad fråga börjar: "\nN.\s" eller "^N.\s"
  // Frågenummer 1–40
  const lines = cleaned.split(/\r?\n/);
  type Marker =
    | { kind: "q"; num: number; lineIdx: number; rest: string }
    | { kind: "opt"; letter: string; lineIdx: number; rest: string }
    | { kind: "text"; lineIdx: number; text: string };

  const markers: Marker[] = [];
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i].trim();
    if (!ln) continue;
    const qm = ln.match(/^(\d{1,2})\.\s*(.*)$/);
    if (qm && Number(qm[1]) >= 1 && Number(qm[1]) <= 40) {
      markers.push({ kind: "q", num: Number(qm[1]), lineIdx: i, rest: qm[2] });
      continue;
    }
    const om = ln.match(/^([A-E])\s+(.*)$/);
    if (om && om[2].length > 0) {
      markers.push({ kind: "opt", letter: om[1], lineIdx: i, rest: om[2] });
      continue;
    }
    markers.push({ kind: "text", lineIdx: i, text: ln });
  }

  // Bygg block: ett block startar vid en q-marker och slutar vid nästa q-marker
  const blocks: RawBlock[] = [];
  for (let i = 0; i < markers.length; i++) {
    const m = markers[i];
    if (m.kind !== "q") continue;
    const num = m.num;
    let bodyParts: string[] = [m.rest];
    const options: Option[] = [];
    let optionStarted = false;

    let j = i + 1;
    while (j < markers.length && markers[j].kind !== "q") {
      const mm = markers[j];
      if (mm.kind === "opt") {
        optionStarted = true;
        // Om alternativet redan finns – append (multi-line option)
        const existing = options.find((o) => o.id === mm.letter);
        if (existing) {
          existing.text += " " + mm.rest;
        } else {
          options.push({ id: mm.letter, text: mm.rest });
        }
      } else if (mm.kind === "text") {
        if (!optionStarted) {
          bodyParts.push(mm.text);
        } else {
          // Texten tillhör senast tillagt alternativ (multi-line)
          if (options.length > 0) {
            options[options.length - 1].text += " " + mm.text;
          }
        }
      }
      j++;
    }

    blocks.push({
      num,
      body: cleanText(bodyParts.join(" ")),
      options: options.map((o) => ({ id: o.id, text: cleanText(o.text) })),
    });
    // Hoppa inte – nästa loop hittar nästa q naturligt
  }

  // Sortera och deduplicera på num (behåll det med flest options)
  const byNum = new Map<number, RawBlock>();
  for (const b of blocks) {
    const cur = byNum.get(b.num);
    if (!cur || b.options.length > cur.options.length) byNum.set(b.num, b);
  }
  return [...byNum.values()].sort((a, b) => a.num - b.num);
}

/**
 * För LÄS/ELF: hitta passager. En passage = textrad utan frågenummer som är
 * lång (>200 tecken sammanlagt) och inte är ett alternativ.
 *
 * Eftersom passager i texten ligger efter sina frågor (2-kolumners layout)
 * letar vi i intervallet mellan fråga N och fråga N+1, och kopplar passagen
 * till föregående frågegrupp.
 */
function extractPassagesByGroup(
  text: string,
  groupSize = 2,
): Map<number, string> {
  // Map: första-frågenummer-i-grupp → passage
  // Passage-grupper: typiskt 2-4 frågor delar samma passage. Vi kollar enkelt.
  // För enkelhets skull associerar vi passage med varje frågenummer i intervallet.
  const passages = new Map<number, string>();

  const cleaned = text
    .replace(/-- \d+ of \d+ --/g, "\n")
    .replace(/^– \d+ –$/gm, "");

  // Hitta alla q-markörer med deras textposition
  const lines = cleaned.split(/\r?\n/);
  const qPositions: { num: number; idx: number }[] = [];
  lines.forEach((ln, i) => {
    const m = ln.trim().match(/^(\d{1,2})\.\s/);
    if (m) {
      const n = Number(m[1]);
      if (n >= 1 && n <= 40) qPositions.push({ num: n, idx: i });
    }
  });

  // Mellan varje q-position, leta efter långa textstycken som inte är options
  for (let i = 0; i < qPositions.length; i++) {
    const start = qPositions[i].idx + 1;
    const end = i + 1 < qPositions.length ? qPositions[i + 1].idx : lines.length;
    const chunk: string[] = [];
    for (let k = start; k < end; k++) {
      const ln = lines[k].trim();
      if (!ln) continue;
      if (/^[A-E]\s/.test(ln)) continue;       // option
      if (/^\d{1,2}\.\s/.test(ln)) continue;   // fråga
      chunk.push(ln);
    }
    const joined = chunk.join(" ").trim();
    if (joined.length > 200) {
      // Koppla passagen till föregående frågegrupp (grovt: gruppera per groupSize)
      const passageNum = qPositions[i].num;
      passages.set(passageNum, cleanText(joined));
    }
  }
  return passages;
}

/* ------------------------------------------------------------------ */
/* Bygg HpQuestion från ett block                                      */
/* ------------------------------------------------------------------ */
function buildQuestion(
  block: RawBlock,
  category: Category,
  facitMap: Map<number, string>,
  passageText: string | undefined,
  passageId: string | undefined,
  source: string,
  expectedOpts: number,
): HpQuestion | null {
  if (block.options.length < expectedOpts) return null;
  if (block.body.length < 1) return null;

  const correct = facitMap.get(block.num);
  if (!correct) return null;
  if (!block.options.some((o) => o.id === correct)) return null;

  const subject_type: SubjectType =
    ["ORD", "LAS", "MEK", "ELF"].includes(category) ? "verbal" : "math";

  const q_text = category === "ORD" ? block.body.toUpperCase() : block.body;

  return {
    category,
    subject_type,
    question_text: q_text,
    passage_text: passageText,
    passage_id: passageId,
    options: block.options.slice(0, 5), // max 5
    correct_answer: correct,
    source,
  };
}

/* ------------------------------------------------------------------ */
/* Bearbeta en termin: ladda 5 PDF:er, parsa, returnera frågor          */
/* ------------------------------------------------------------------ */
async function processTermin(t: Termin): Promise<HpQuestion[]> {
  const base = `https://www.hogskoleprovet.nu/public/uploads/hogskoleprovet/hogskoleprov/${t.slug}`;
  const out: HpQuestion[] = [];

  let facitText = "";
  try {
    facitText = await fetchPdfText(`${base}/facit.pdf`);
  } catch (err) {
    logError(`${t.slug}/facit.pdf`, err);
    return out;
  }
  await sleep(DELAY_MS);
  const facit = parseFacit(facitText);

  const passes: { file: Pass; cat: (n: number) => Category | null; opts: number }[] = [
    { file: "verb1", cat: categoryForVerbal, opts: 4 },
    { file: "verb2", cat: categoryForVerbal, opts: 4 },
    { file: "kvant1", cat: categoryForKvant, opts: 4 },
    { file: "kvant2", cat: categoryForKvant, opts: 4 },
  ];

  for (const pass of passes) {
    let text = "";
    try {
      text = await fetchPdfText(`${base}/${pass.file}.pdf`);
    } catch (err) {
      logError(`${t.slug}/${pass.file}.pdf`, err);
      await sleep(DELAY_MS);
      continue;
    }
    await sleep(DELAY_MS);

    const blocks = extractQuestionBlocks(text);
    const passages = extractPassagesByGroup(text);
    const facitMap = facit[pass.file];

    for (const b of blocks) {
      const cat = pass.cat(b.num);
      if (!cat) continue;
      // ORD har 5 alternativ, övriga 4
      const expectedOpts = cat === "ORD" ? 5 : 4;
      let pText: string | undefined;
      let pId: string | undefined;
      if (cat === "LAS" || cat === "ELF" || cat === "DTK") {
        const p = passages.get(b.num);
        if (p) {
          pText = p;
          pId = `${cat.toLowerCase()}-${t.term}${t.year}-${pass.file}-q${b.num}`;
        }
      }
      const q = buildQuestion(
        b, cat, facitMap, pText, pId,
        `${base}/${pass.file}.pdf`,
        expectedOpts,
      );
      if (q) out.push(q);
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */
async function main() {
  if (existsSync(ERR_PATH)) unlinkSync(ERR_PATH);

  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : Infinity;

  console.log("Hämtar terminslista ...");
  let terminer = await listTerminer();
  console.log(`  hittade ${terminer.length} terminer (post-2011)`);
  if (Number.isFinite(limit)) {
    terminer = terminer.slice(0, limit);
    console.log(`  begränsar till ${terminer.length} (--limit)`);
  }

  const all: HpQuestion[] = [];
  for (const t of terminer) {
    console.log(`→ ${t.slug}`);
    try {
      const qs = await processTermin(t);
      console.log(`   ${qs.length} frågor`);
      all.push(...qs);
    } catch (err) {
      console.warn(`   FEL: ${(err as Error).message}`);
      logError(t.slug, err);
    }
  }

  writeFileSync(OUT_PATH, JSON.stringify(all, null, 2), "utf8");

  const byCat: Record<string, number> = {};
  for (const q of all) byCat[q.category] = (byCat[q.category] || 0) + 1;
  console.log(`\nWrote ${all.length} HP-frågor → ${OUT_PATH}`);
  console.log("Fördelning per kategori:");
  for (const [k, v] of Object.entries(byCat)) console.log(`  ${k}: ${v}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
