/**
 * scrape-hp-questions.ts
 *
 * Hämtar gamla högskoleprov-PDF:er från hogskoleprovet.nu och parsar
 * frågor per delprov (MEK, LÄS, ELF, XYZ, KVA, NOG, DTK).
 *
 * Kör:  bun run scraper/scrape-hp-questions.ts
 *
 * Skriver scraper/hp-questions.json + scraper/fel.log för PDF:er som inte
 * gick att parsa.
 */

import { writeFileSync, appendFileSync, existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import pdfParse from "pdf-parse";

const UA = "HPKampen-Bot/1.0 (educational project)";
const DELAY_MS = 1000;
const OUT_PATH = join(process.cwd(), "scraper", "hp-questions.json");
const ERR_PATH = join(process.cwd(), "scraper", "fel.log");
const LIST_URL = "https://www.hogskoleprovet.nu/gamla-hogskoleprov/";

type Category = "MEK" | "LAS" | "ELF" | "XYZ" | "KVA" | "NOG" | "DTK";
type SubjectType = "verbal" | "math";

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

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.text();
}

async function fetchPdf(url: string): Promise<Buffer> {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

function logError(file: string, err: unknown) {
  appendFileSync(ERR_PATH, `[${new Date().toISOString()}] ${file}: ${(err as Error).message}\n`);
}

/* ------------------------------------------------------------------ */
/* PDF-länkar                                                          */
/* ------------------------------------------------------------------ */
async function listPdfLinks(): Promise<{ url: string; label: string; year: number; term: "vt" | "ht" }[]> {
  const html = await fetchText(LIST_URL);
  const links = [...html.matchAll(/href="([^"]+\.pdf)"[^>]*>([^<]+)</gi)];
  const out: { url: string; label: string; year: number; term: "vt" | "ht" }[] = [];
  for (const m of links) {
    const url = m[1].startsWith("http") ? m[1] : new URL(m[1], LIST_URL).toString();
    const label = m[2].trim();
    const yMatch = label.match(/(20\d{2})/);
    if (!yMatch) continue;
    const year = Number(yMatch[1]);
    if (year < 2011) continue; // bara post-2011-format
    const term: "vt" | "ht" = /ht|höst/i.test(label) ? "ht" : "vt";
    out.push({ url, label, year, term });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Parsning per delprov – heuristisk, kan behöva justeras efter test   */
/* ------------------------------------------------------------------ */
function parseFacit(text: string): Map<string, string> {
  // Hitta facit-block: t.ex. "Facit" följt av "1. A 2. C 3. B ..."
  const facit = new Map<string, string>();
  const facitMatch = text.match(/Facit[\s\S]+/i);
  if (!facitMatch) return facit;
  const block = facitMatch[0];
  const pairs = [...block.matchAll(/(\d{1,3})\s*[\.\):]\s*([A-E])/g)];
  for (const p of pairs) facit.set(p[1], p[2]);
  return pairs.length > 0 ? facit : facit;
}

function detectSection(line: string): Category | null {
  if (/MEK\b|meningskomplettering/i.test(line)) return "MEK";
  if (/LÄS\b|läsförståelse/i.test(line)) return "LAS";
  if (/\bELF\b|engelsk läsförståelse/i.test(line)) return "ELF";
  if (/\bXYZ\b/i.test(line)) return "XYZ";
  if (/\bKVA\b|kvantitativa jämförelser/i.test(line)) return "KVA";
  if (/\bNOG\b|kvantitativa resonemang/i.test(line)) return "NOG";
  if (/\bDTK\b|diagram[, ]?tabeller/i.test(line)) return "DTK";
  return null;
}

function categoryToSubject(cat: Category): SubjectType {
  return ["MEK", "LAS", "ELF", "ORD" as Category].includes(cat) ? "verbal" : "math";
}

/**
 * Generisk parser: går igenom textraderna och försöker hitta numrerade
 * frågor + svarsalternativ A–D (eller A–E). Mycket av detta är heuristik
 * och måste finjusteras när vi ser hur PDF-texten faktiskt ser ut.
 */
function parseQuestions(text: string, source: string, label: string): HpQuestion[] {
  const out: HpQuestion[] = [];
  const facit = parseFacit(text);

  // splitta på radbrytningar och städa
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  let currentCat: Category | null = null;
  let currentPassage = "";
  let currentPassageId = "";
  let passageCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const sec = detectSection(line);
    if (sec) {
      currentCat = sec;
      currentPassage = "";
      currentPassageId = "";
      continue;
    }
    if (!currentCat) continue;

    // hantera passager för LÄS/ELF/DTK
    if (["LAS", "ELF", "DTK"].includes(currentCat) && line.length > 100 && !/^\d+\./.test(line)) {
      passageCounter++;
      currentPassage = line;
      currentPassageId = `${currentCat.toLowerCase()}-${
        /ht/i.test(label) ? "ht" : "vt"
      }${(label.match(/20\d{2}/) || ["unknown"])[0]}-p${passageCounter}`;
      continue;
    }

    // numrerad fråga: "12. ..."
    const qm = line.match(/^(\d{1,3})\.\s*(.+)/);
    if (!qm) continue;
    const qNum = qm[1];
    let qText = qm[2];

    // läs in svarsalternativ från följande rader: "A) ...", "B) ..." osv.
    const opts: Option[] = [];
    let j = i + 1;
    while (j < lines.length) {
      const om = lines[j].match(/^([A-E])[\)\.]\s*(.+)/);
      if (!om) break;
      opts.push({ id: om[1], text: om[2] });
      j++;
    }
    if (opts.length < 4) continue;

    const correct = facit.get(qNum);
    if (!correct) continue;

    out.push({
      category: currentCat,
      subject_type: categoryToSubject(currentCat),
      question_text: qText.trim(),
      passage_text: currentPassage || undefined,
      passage_id: currentPassageId || undefined,
      options: opts,
      correct_answer: correct,
      source,
    });

    i = j - 1;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */
async function main() {
  if (existsSync(ERR_PATH)) unlinkSync(ERR_PATH);

  console.log("Hämtar PDF-länkar ...");
  const pdfs = await listPdfLinks();
  console.log(`  hittade ${pdfs.length} PDF:er (post-2011)`);

  const all: HpQuestion[] = [];
  for (const pdf of pdfs) {
    console.log(`→ ${pdf.label}`);
    try {
      const buf = await fetchPdf(pdf.url);
      const parsed = await pdfParse(buf);
      const qs = parseQuestions(parsed.text, pdf.url, pdf.label);
      console.log(`   ${qs.length} frågor`);
      all.push(...qs);
    } catch (err) {
      console.warn(`   FEL: ${(err as Error).message}`);
      logError(pdf.url, err);
    }
    await sleep(DELAY_MS);
  }

  writeFileSync(OUT_PATH, JSON.stringify(all, null, 2), "utf8");

  const byCat: Record<string, number> = {};
  for (const q of all) byCat[q.category] = (byCat[q.category] || 0) + 1;
  console.log(`Wrote ${all.length} HP-frågor → ${OUT_PATH}`);
  console.log("Fördelning per kategori:", byCat);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
