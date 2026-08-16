/**
 * scrape-ord-old.ts
 *
 * Hämtar ORD-uppgifter från högskoleproven i det GAMLA formatet (1977–2011)
 * på hogskoleprovet.nu. Kompletterar scrape-hp-questions.ts, som bara täcker
 * det nya formatet (2013 och framåt).
 *
 * Skillnader mot det nya formatet:
 *   - Mapparna heter v1977 / h1977 (inte var-2013 / host-2013).
 *   - ORD ligger i en egen ord.pdf, inte inbakat i verb1/verb2.
 *   - Delprovet har 40 uppgifter, inte 10 per provpass.
 *   - Facit listar ORD som "Delprov N: ORD" i fyra kolumner (1–10, 11–20,
 *     21–30, 31–40), oftast på samma rader som ELF.
 *
 * Två sidlayouter förekommer i ord.pdf och båda hanteras av samma parser:
 *   A (2007–2011): en uppgift per rad, "2.\tklinga av" följt av "A\t..."
 *   B (1997–2001): tre uppgifter per rad, "1.\ttingest\t2.\tsubstitut\t..."
 *
 * Alla årgångar går inte att läsa. Proven till och med 1996 (och några senare)
 * är inskannade bilder utan textlager och kräver OCR — dem hoppar scriptet
 * över och redovisar i sammanfattningen i stället för att gissa. Proven
 * 2002–2006 såg också tomma ut tills glyfnamnen översattes, se
 * oversattGlyfnamn nedan.
 *
 * Skriver scraper/ord-old-questions.json + scraper/ord-old-fel.log
 *
 * Kör:  bun run scraper/scrape-ord-old.ts [--limit=N] [--only=v2005,h2007]
 */

import { writeFileSync, appendFileSync, existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { PDFParse } from "pdf-parse";

const UA = "HPKampen-Bot/1.0 (educational project)";
const DELAY_MS = 1000;
const OUT_PATH = join(process.cwd(), "scraper", "ord-old-questions.json");
const ERR_PATH = join(process.cwd(), "scraper", "ord-old-fel.log");
const LIST_URL = "https://www.hogskoleprovet.nu/gamla-hogskoleprov/";
const BASE = "https://www.hogskoleprovet.nu/public/uploads/hogskoleprovet/hogskoleprov";

/** Antal uppgifter i ORD-delprovet i det gamla formatet. */
const ORD_COUNT = 40;

type Option = { id: string; text: string };
type OrdQuestion = {
  category: "ORD";
  subject_type: "verbal";
  question_text: string;
  options: Option[];
  correct_answer: string;
  source: string;
  tags: string[];
};

/** Varför en termin inte gav några frågor — redovisas i sammanfattningen. */
type SkipReason =
  | "ingen ord.pdf"
  | "404"
  | "inskannad utan textlager"
  | "glyfkodad font"
  | "facit saknar ORD"
  | "nätfel"
  | "parsefel";

type TerminResult = {
  slug: string;
  term: string;
  questions: OrdQuestion[];
  skipped?: SkipReason;
  detail?: string;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function logError(what: string, err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  appendFileSync(ERR_PATH, `[${new Date().toISOString()}] ${what}: ${msg}\n`);
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.text();
}

/**
 * Proven 2002–2006 bäddar in delmängdsfonter vars /Differences använder
 * glyfnamn på formen /G228, där talet är teckenkoden (228 = 'ä'). pdfjs känner
 * bara igen /uniXXXX och /uXXXX, så utan detta kommer texten ut som glyfindex
 * och PDF:en ser tom ut. Kodtabellen finns alltså i filen — det här är en
 * översättning av namnen, inte en gissning om innehållet.
 *
 * De nya namnen är längre, vilket förskjuter alla objekt och gör xref-tabellen
 * felaktig. För de flesta årgångar räcker det att pdfjs bygger om
 * korsreferenserna själv, men v2006 och h2006 är krypterade (`/Encrypt`, tomt
 * lösenord). Glyfnamnen står visserligen i klartext — PDF-kryptering omfattar
 * bara strängar och strömmar — men med trasig xref tappar pdfjs
 * dekrypteringsnyckeln och svarar "No password given". Därför räknas offseten
 * om nedan i stället. Byte-längden går inte att bevara: kortaste namn pdfjs
 * förstår för 'ä' är /u00E4, som är längre än /G228.
 *
 * Resultatet kontrolleras ändå av att varje uppgift måste ge fem alternativ och
 * stämma mot facit, och anropet nedan behåller den tolkning som gav mest
 * läsbar svenska.
 */
function oversattGlyfnamn(buf: Buffer): Buffer {
  const s = buf.toString("latin1");
  const fixed = s.replace(/\/G(\d{1,3})(?![0-9])/g, (m, num: string) => {
    const code = Number(num);
    return code > 0 && code <= 0xffff ? "/u" + code.toString(16).toUpperCase().padStart(4, "0") : m;
  });
  if (fixed === s) return buf;
  return lagaXref(Buffer.from(fixed, "latin1"));
}

/**
 * Räkna om xref-tabellernas offset efter att objekten flyttat sig.
 *
 * Posterna är exakt 20 byte (`0000000016 00000 n\r\n`), så de kan skrivas över
 * på plats utan att filen ändrar längd igen. `/Prev` och `startxref` pekar på
 * tabellerna själva och fylls med inledande nollor för att behålla fältbredden.
 * Linjäriserade filer har två tabeller: en för första sidan och en för resten.
 */
function lagaXref(buf: Buffer): Buffer {
  const s = buf.toString("latin1");

  const offsets = new Map<number, number>();
  for (const m of s.matchAll(/(?:^|[\r\n\s])(\d+)\s+\d+\s+obj\b/g)) {
    offsets.set(Number(m[1]), m.index + (m[0].length - m[0].trimStart().length));
  }
  const tables = [...s.matchAll(/(?:^|[\r\n])xref[\r\n]/g)].map(
    (m) => m.index + m[0].indexOf("xref"),
  );
  if (tables.length === 0 || offsets.size === 0) return buf;

  for (const at of tables) {
    let p = at + "xref".length;
    while (s[p] === "\r" || s[p] === "\n") p++;
    for (;;) {
      const head = s.slice(p, p + 40).match(/^(\d+)\s+(\d+)[\r\n]+/);
      if (!head) break;
      const start = Number(head[1]);
      const count = Number(head[2]);
      p += head[0].length;
      for (let i = 0; i < count; i++) {
        const entry = s.slice(p, p + 20).match(/^\d{10} (\d{5}) ([nf])/);
        if (!entry) return buf;
        const off = entry[2] === "n" ? offsets.get(start + i) : undefined;
        if (off !== undefined) {
          buf.write(`${String(off).padStart(10, "0")} ${entry[1]} n`, p, "latin1");
        }
        p += 20;
      }
    }
  }

  /** Skriv talet på plats med bibehållen fältbredd. */
  const setNumber = (text: string, re: RegExp, value: number, base = 0) => {
    const m = text.match(re);
    if (!m) return;
    const padded = String(value).padStart(m[1].length, "0");
    if (padded.length !== m[1].length) return;
    buf.write(padded, base + m.index! + m[0].indexOf(m[1]), "latin1");
  };
  setNumber(s, /\/Prev\s+(\d+)/, Math.max(...tables));
  const lastStart = s.lastIndexOf("startxref");
  if (lastStart >= 0) {
    setNumber(s.slice(lastStart), /startxref[\r\n\s]+(\d+)/, Math.min(...tables), lastStart);
  }
  return buf;
}

/** null = 404 (död länk på listsidan, förekommer för ett par terminer). */
async function fetchPdfText(url: string): Promise<string | null> {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const text = (await new PDFParse({ data: buf }).getText()).text;

  const repaired = oversattGlyfnamn(buf);
  if (repaired === buf) return text;
  // Behåll den tolkning som ger mest läsbar svenska; omskrivningen kan aldrig
  // göra en redan läsbar PDF sämre utan att det syns här.
  try {
    const retry = (await new PDFParse({ data: repaired }).getText()).text;
    return svenskaOrd(retry) > svenskaOrd(text) ? retry : text;
  } catch {
    return text;
  }
}

/** Grovt mått på hur mycket läsbar svenska en PDF-tolkning gav. */
const svenskaOrd = (text: string) => (text.match(/[a-zåäö]{4,}/g) || []).length;

/* ------------------------------------------------------------------ */
/* Lista gamla terminer från hogskoleprovet.nu                         */
/* ------------------------------------------------------------------ */
type Termin = {
  /** Mappnamn på servern, t.ex. "v2005". */
  slug: string;
  /** Terminskod i appens format, t.ex. "2005vt". */
  term: string;
  year: number;
  files: string[];
};

async function listOldTerminer(): Promise<Termin[]> {
  const html = await fetchText(LIST_URL);
  const byFolder = new Map<string, Set<string>>();
  for (const m of html.matchAll(/hogskoleprov\/([vh]\d{4})\/([A-Za-z0-9_.-]+\.pdf)/g)) {
    const files = byFolder.get(m[1]) ?? new Set<string>();
    files.add(m[2]);
    byFolder.set(m[1], files);
  }
  const out: Termin[] = [];
  for (const [slug, files] of byFolder) {
    const year = Number(slug.slice(1));
    if (year < 1977 || year > 2011) continue;
    out.push({
      slug,
      term: `${year}${slug[0] === "v" ? "vt" : "ht"}`,
      year,
      files: [...files].sort(),
    });
  }
  // Kronologiskt: vårterminen före höstterminen samma år.
  return out.sort((a, b) => a.year - b.year || (a.slug[0] === "v" ? -1 : 1));
}

/* ------------------------------------------------------------------ */
/* Facit: plocka ut ORD-delprovets 40 svar                             */
/* ------------------------------------------------------------------ */

/**
 * Facit listar flera delprov sida vid sida. ORD står i fyra kolumner, så varje
 * datarad bär svaren för n, n+10, n+20 och n+30 — t.ex.
 *
 *   Delprov 3: ELF  +  Delprov 4: ORD
 *   1  A  11  B     1  B  11  B  21  A  31  D
 *
 * De fyra ORD-paren hittas på just det talmönstret i stället för på kolumn-
 * position, så att ELF:s par bredvid aldrig kan förväxlas med ORD:s.
 */
function parseOrdFacit(text: string): Map<number, string> {
  const out = new Map<number, string>();
  const lines = text.split(/\r?\n/);

  let headerIdx = -1;
  let ordIsLast = true;
  for (let i = 0; i < lines.length; i++) {
    if (!/\bORD\b/.test(lines[i])) continue;
    const delprov = [...lines[i].matchAll(/Delprov[^:]*:\s*([A-ZÅÄÖ]{3})/g)].map((m) => m[1]);
    if (!delprov.includes("ORD")) continue;
    headerIdx = i;
    ordIsLast = delprov[delprov.length - 1] === "ORD";
    break;
  }
  if (headerIdx < 0) return out;

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/BLOCK|Delprov/i.test(line)) break;
    const pairs = [...line.matchAll(/(\d{1,2})\s+([A-E])(?![A-Za-zÅÄÖåäö])/g)].map(
      (m) => [Number(m[1]), m[2]] as [number, string],
    );
    if (pairs.length < 4) continue;

    // Leta fyra par i följd som är n, n+10, n+20, n+30.
    const starts = [...Array(pairs.length - 3).keys()];
    if (ordIsLast) starts.reverse();
    for (const s of starts) {
      const run = pairs.slice(s, s + 4);
      const n = run[0][0];
      if (n < 1 || n > 10) continue;
      if (run[1][0] !== n + 10 || run[2][0] !== n + 20 || run[3][0] !== n + 30) continue;
      run.forEach(([num, letter]) => out.set(num, letter));
      break;
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Frågeparser — kolumnmedveten, klarar både layout A och B            */
/* ------------------------------------------------------------------ */
type ParsedQuestion = { num: number; word: string; options: Option[] };

/**
 * Rader som avslutar en kolumnuppsättning: sidbrytning, instruktioner, exempel.
 *
 * Nyckelorden måste utgöra hela raden. De är vanliga svenska ord och dyker upp
 * som svarsalternativ i proven — v2000 uppgift 31 (rön) har "anvisningar" som
 * alternativ B, och en substrängmatchning där kapade uppgiften mitt itu.
 * Raden testas dessutom först när den inte redan har tolkats som innehåll.
 */
const RESET_LINE =
  /^(?:-- \d+ of \d+ --|Övningsexempel.*|Anvisningar|BÖRJA INTE MED.*|Provtiden är.*|DELPROV.*|Svarshäfte.*|©?\s*Högskole(?:verket|provet).*|PROVET ÄR SLUT.*)$/;

/** Sätterirader som ligger kvar i PDF:en: filnamn och tidsstämplar från InDesign. */
const SATTERI_SKRAP = /\.indd\b|^\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2}:\d{2})?$|^\d{2}:\d{2}:\d{2}$/;

/**
 * v1999 och v2001 deklarerar MacRomanEncoding men innehåller Latin-1-bytes, så
 * de svenska vokalerna kommer ut som helt andra tecken ("språk" → "sprÂk",
 * "förklaring" → "fˆrklaring"). Varje post nedan är samma byte läst på de två
 * sätten: 'Â' är MacRoman 0xE5, och Latin-1 0xE5 är 'å'.
 */
const MACROMAN_FELLASNING: Record<string, string> = {
  Â: "å", // 0xE5
  ˆ: "ö", // 0xF6
  "‰": "ä", // 0xE4
  ƒ: "Ä", // 0xC4
  "≈": "Å", // 0xC5
  "÷": "Ö", // 0xD6
  È: "é", // 0xE9
};

function cleanText(s: string): string {
  return s
    .replace(/[Âˆ‰ƒ≈÷È]/g, (c) => MACROMAN_FELLASNING[c] ?? c)
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function parseOrdQuestions(text: string): Map<number, ParsedQuestion> {
  const out = new Map<number, ParsedQuestion>();
  /** Frågenummer per kolumn på den senast lästa frågeraden. */
  let cols: number[] = [];
  /** Kolumnen som senast fick text, för radbrytna alternativ. */
  let lastCol = -1;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\u00a0/g, " ").trim();
    if (!line.trim()) continue;
    const tokens = line
      .split("\t")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const qNums: number[] = [];
    const opts: { col: number; id: string; text: string }[] = [];
    const loose: string[] = [];
    let col = 0;

    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];

      const qm = tok.match(/^(\d{1,2})\.\s*(.*)$/);
      if (qm && Number(qm[1]) >= 1 && Number(qm[1]) <= ORD_COUNT) {
        const word = qm[2] || tokens[++i] || "";
        qNums.push(Number(qm[1]));
        out.set(Number(qm[1]), { num: Number(qm[1]), word: cleanText(word), options: [] });
        continue;
      }

      const om = tok.match(/^([A-E])(?:\s+(.*))?$/);
      if (om) {
        const body = om[2] || tokens[++i] || "";
        opts.push({ col: col++, id: om[1], text: cleanText(body) });
        continue;
      }

      loose.push(tok);
    }

    if (qNums.length > 0) {
      cols = qNums;
      lastCol = -1;
      continue;
    }

    // Först när raden inte bär något innehåll får den räknas som sidhuvud.
    if (opts.length === 0) {
      if (RESET_LINE.test(line)) {
        cols = [];
        lastCol = -1;
        continue;
      }
      // Sidnummer och tryckerimetadata ska inte klistras på föregående
      // alternativ. v2009 har InDesign-sidfötter ("Ord 09A.indd 2" följt av en
      // tidsstämpel) som annars hamnade sist i alternativ E.
      const rest = loose
        .filter((t) => !/^[–-]?\s*\d{1,3}\s*[–-]?$/.test(t))
        .filter((t) => !SATTERI_SKRAP.test(t))
        .join(" ");
      if (rest && cols.length > 0 && lastCol >= 0) {
        const q = out.get(cols[lastCol]);
        const last = q?.options[q.options.length - 1];
        if (last) last.text = cleanText(`${last.text} ${rest}`);
      }
      continue;
    }
    for (const o of opts) {
      const num = cols[o.col];
      if (num === undefined) continue;
      const q = out.get(num);
      if (!q) continue;
      q.options.push({ id: o.id, text: o.text });
      lastCol = o.col;
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Klassificera varför en PDF inte gick att läsa                       */
/* ------------------------------------------------------------------ */
function diagnose(text: string): SkipReason | null {
  if (svenskaOrd(text) >= 100) return null;
  // Glyfkodade PDF:er har gott om textitems men nästan inga läsbara ord.
  if (text.replace(/\s/g, "").length > 400) return "glyfkodad font";
  return "inskannad utan textlager";
}

/* ------------------------------------------------------------------ */
/* Bearbeta en termin                                                  */
/* ------------------------------------------------------------------ */
async function processTermin(t: Termin): Promise<TerminResult> {
  const base = `${BASE}/${t.slug}`;
  const empty = (skipped: SkipReason, detail?: string): TerminResult => ({
    slug: t.slug,
    term: t.term,
    questions: [],
    skipped,
    detail,
  });

  if (!t.files.includes("ord.pdf")) {
    return empty("ingen ord.pdf", `har: ${t.files.join(", ")}`);
  }

  let ordText: string | null;
  try {
    ordText = await fetchPdfText(`${base}/ord.pdf`);
  } catch (err) {
    logError(`${t.slug}/ord.pdf`, err);
    return empty("nätfel", err instanceof Error ? err.message : String(err));
  }
  await sleep(DELAY_MS);
  if (ordText === null) return empty("404", "ord.pdf");

  const bad = diagnose(ordText);
  if (bad) return empty(bad);

  if (!t.files.includes("facit.pdf")) return empty("facit saknar ORD", "ingen facit.pdf");

  let facitText: string | null;
  try {
    facitText = await fetchPdfText(`${base}/facit.pdf`);
  } catch (err) {
    logError(`${t.slug}/facit.pdf`, err);
    return empty("nätfel", `facit: ${err instanceof Error ? err.message : String(err)}`);
  }
  await sleep(DELAY_MS);
  if (facitText === null) return empty("404", "facit.pdf");

  const facit = parseOrdFacit(facitText);
  if (facit.size === 0) {
    // h1999 har läsbara frågor men ett inskannat facit. Utan verifierade svar
    // är uppgifterna värdelösa — gissade rättsvar vore sämre än inga alls.
    const facitBad = diagnose(facitText);
    return empty(
      "facit saknar ORD",
      facitBad === "inskannad utan textlager" ? "inskannat facit" : undefined,
    );
  }

  const parsed = parseOrdQuestions(ordText);
  const questions: OrdQuestion[] = [];
  const rejected: string[] = [];

  for (let n = 1; n <= ORD_COUNT; n++) {
    const q = parsed.get(n);
    if (!q) {
      rejected.push(`${n}: saknas i ord.pdf`);
      continue;
    }
    if (!q.word) {
      rejected.push(`${n}: tomt uppslagsord`);
      continue;
    }
    const ids = q.options.map((o) => o.id);
    if (q.options.length !== 5 || new Set(ids).size !== 5) {
      rejected.push(`${n} (${q.word}): ${q.options.length} alternativ [${ids.join("")}]`);
      continue;
    }
    const correct = facit.get(n);
    if (!correct) {
      rejected.push(`${n} (${q.word}): saknas i facit`);
      continue;
    }
    if (!ids.includes(correct)) {
      rejected.push(`${n} (${q.word}): facit ${correct} finns inte bland alternativen`);
      continue;
    }
    if (q.options.some((o) => !o.text)) {
      rejected.push(`${n} (${q.word}): tomt alternativ`);
      continue;
    }
    questions.push({
      category: "ORD",
      subject_type: "verbal",
      question_text: q.word.toUpperCase(),
      options: q.options,
      correct_answer: correct,
      source: `${base}/ord.pdf`,
      tags: [t.term],
    });
  }

  if (rejected.length > 0) {
    logError(`${t.slug} bortsorterade`, new Error(rejected.join(" | ")));
  }
  return {
    slug: t.slug,
    term: t.term,
    questions,
    detail: rejected.length ? `${rejected.length} bortsorterade` : undefined,
  };
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */
async function main() {
  if (existsSync(ERR_PATH)) unlinkSync(ERR_PATH);

  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : Infinity;
  const only = onlyArg ? new Set(onlyArg.split("=")[1].split(",")) : null;

  console.log("Hämtar terminslista ...");
  let terminer = await listOldTerminer();
  console.log(`  ${terminer.length} terminer i gamla formatet (1977–2011)`);
  if (only) terminer = terminer.filter((t) => only.has(t.slug));
  if (Number.isFinite(limit)) terminer = terminer.slice(0, limit);

  const results: TerminResult[] = [];
  for (const t of terminer) {
    process.stdout.write(`→ ${t.slug} (${t.term}) `);
    try {
      const r = await processTermin(t);
      results.push(r);
      if (r.skipped) console.log(`hoppar över: ${r.skipped}${r.detail ? ` — ${r.detail}` : ""}`);
      else console.log(`${r.questions.length}/${ORD_COUNT} ord${r.detail ? ` (${r.detail})` : ""}`);
    } catch (err) {
      console.log(`FEL: ${err instanceof Error ? err.message : String(err)}`);
      logError(t.slug, err);
      results.push({ slug: t.slug, term: t.term, questions: [], skipped: "parsefel" });
    }
  }

  const all = results.flatMap((r) => r.questions);
  writeFileSync(OUT_PATH, JSON.stringify(all, null, 2), "utf8");

  /* --- sammanfattning --- */
  const ok = results.filter((r) => !r.skipped);
  const unika = new Set(all.map((q) => q.question_text.toLowerCase()));
  console.log(`\nSkrev ${all.length} ORD-uppgifter (${unika.size} unika ord) → ${OUT_PATH}`);
  console.log(`Terminer med data: ${ok.length}/${results.length}`);

  const bySkip = new Map<string, string[]>();
  for (const r of results) {
    if (!r.skipped) continue;
    const arr = bySkip.get(r.skipped) ?? [];
    arr.push(r.slug);
    bySkip.set(r.skipped, arr);
  }
  if (bySkip.size > 0) {
    console.log("\nUtelämnade terminer:");
    for (const [reason, slugs] of [...bySkip].sort((a, b) => b[1].length - a[1].length)) {
      console.log(`  ${reason} (${slugs.length}): ${slugs.join(", ")}`);
    }
  }
  const partial = ok.filter((r) => r.questions.length < ORD_COUNT);
  if (partial.length > 0) {
    console.log("\nOfullständiga terminer (se ord-old-fel.log):");
    for (const r of partial) console.log(`  ${r.slug}: ${r.questions.length}/${ORD_COUNT}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
