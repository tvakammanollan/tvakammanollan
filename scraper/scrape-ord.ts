/**
 * scrape-ord.ts
 *
 * Hämtar ordlistor från ordprov.se och ordtestet.nu och bygger ORD-frågor
 * i HP-format. Spara till scraper/ord-questions.json.
 *
 * Kör:  bun run scraper/scrape-ord.ts
 *
 * OBS: Respekterar 1 s fördröjning mellan requests och custom User-Agent.
 *      Granska robots.txt manuellt innan stor körning.
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";

const UA = "HPKampen-Bot/1.0 (educational project)";
const DELAY_MS = 1000;
const OUT_PATH = join(process.cwd(), "scraper", "ord-questions.json");

type Option = { id: "A" | "B" | "C" | "D" | "E"; text: string };
type OrdQuestion = {
  category: "ORD";
  subject_type: "verbal";
  question_text: string;
  options: Option[];
  correct_answer: "A" | "B" | "C" | "D" | "E";
  difficulty: number;
  source: string;
};

type RawWord = {
  word: string;
  synonyms: string[];      // korrekta synonymer
  related?: string[];      // semantiskt nära men inte synonymer (bra distraktorer)
  source: string;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.text();
}

/* ------------------------------------------------------------------ */
/* Källa 1: ordprov.se                                                 */
/* ------------------------------------------------------------------ */
async function scrapeOrdprov(): Promise<RawWord[]> {
  const results: RawWord[] = [];
  // ordprov.se har ordlistor under /ordlista/<bokstav> och /ord/<ord>
  const letters = "abcdefghijklmnopqrstuvwxyzåäö".split("");

  for (const letter of letters) {
    const listUrl = `https://www.ordprov.se/ordlista/${letter}`;
    try {
      const html = await fetchText(listUrl);
      // grov regex för att plocka ord-länkar – justeras efter inspektion av sidan
      const wordLinks = [...html.matchAll(/<a[^>]+href="\/ord\/([^"]+)"[^>]*>([^<]+)<\/a>/g)];
      for (const m of wordLinks) {
        const slug = m[1];
        const word = m[2].trim();
        await sleep(DELAY_MS);
        try {
          const detail = await fetchText(`https://www.ordprov.se/ord/${slug}`);
          // hämta synonymer – sajten brukar ha en sektion "Synonymer:"
          const synBlock = detail.match(/Synonymer?:\s*([^<\n]+)/i);
          const synonyms = synBlock
            ? synBlock[1].split(/[,;]/).map((s) => s.trim()).filter(Boolean)
            : [];
          if (synonyms.length > 0) {
            results.push({ word, synonyms, source: "ordprov.se" });
          }
        } catch (err) {
          console.warn(`[ordprov] kunde inte hämta ${slug}:`, (err as Error).message);
        }
      }
      await sleep(DELAY_MS);
    } catch (err) {
      console.warn(`[ordprov] list ${letter}:`, (err as Error).message);
    }
  }
  return results;
}

/* ------------------------------------------------------------------ */
/* Källa 2: ordtestet.nu                                               */
/* ------------------------------------------------------------------ */
async function scrapeOrdtestet(): Promise<RawWord[]> {
  const results: RawWord[] = [];
  // ordtestet.nu listar ord under /ord/sida/<n>
  for (let page = 1; page <= 50; page++) {
    const url = `https://www.ordtestet.nu/ord/sida/${page}`;
    try {
      const html = await fetchText(url);
      // varje ord brukar ligga i .word-card { h2: ord, .syn: synonymer }
      const cards = [...html.matchAll(
        /<h2[^>]*>([^<]+)<\/h2>[\s\S]*?class="syn"[^>]*>([^<]+)</g,
      )];
      if (cards.length === 0) break; // inga fler sidor
      for (const c of cards) {
        const word = c[1].trim();
        const synonyms = c[2].split(/[,;]/).map((s) => s.trim()).filter(Boolean);
        if (synonyms.length > 0) {
          results.push({ word, synonyms, source: "ordtestet.nu" });
        }
      }
      await sleep(DELAY_MS);
    } catch (err) {
      console.warn(`[ordtestet] sida ${page}:`, (err as Error).message);
      break;
    }
  }
  return results;
}

/* ------------------------------------------------------------------ */
/* Distraktor-pool: byggs från alla insamlade ord                      */
/* ------------------------------------------------------------------ */
function buildDistractorPool(words: RawWord[]): string[] {
  const pool = new Set<string>();
  for (const w of words) {
    pool.add(w.word);
    w.synonyms.forEach((s) => pool.add(s));
  }
  return [...pool];
}

function pickDistractors(
  correct: string,
  wordEntry: RawWord,
  pool: string[],
  n: number,
): string[] {
  const banned = new Set<string>([
    correct.toLowerCase(),
    wordEntry.word.toLowerCase(),
    ...wordEntry.synonyms.map((s) => s.toLowerCase()),
  ]);

  // försök hitta ord med liknande prefix (3 första bokstäverna)
  const prefix = correct.slice(0, 3).toLowerCase();
  const similar = pool.filter(
    (p) => p.toLowerCase().startsWith(prefix) && !banned.has(p.toLowerCase()),
  );

  const others = pool.filter((p) => !banned.has(p.toLowerCase()));

  const chosen: string[] = [];
  const tryPush = (arr: string[]) => {
    while (chosen.length < n && arr.length > 0) {
      const idx = Math.floor(Math.random() * arr.length);
      const [pick] = arr.splice(idx, 1);
      if (!chosen.includes(pick)) chosen.push(pick);
    }
  };
  tryPush([...similar]);
  tryPush([...others]);
  return chosen;
}

function difficultyFor(word: string): number {
  // grov heuristik: längre + mer ovanliga bokstäver = svårare
  const len = word.length;
  if (len <= 5) return 1;
  if (len <= 7) return 2;
  if (len <= 9) return 3;
  if (len <= 11) return 4;
  return 5;
}

function buildQuestion(
  entry: RawWord,
  pool: string[],
  positionTarget: 0 | 1 | 2 | 3 | 4,
): OrdQuestion | null {
  const correct = entry.synonyms[0];
  if (!correct) return null;
  const distractors = pickDistractors(correct, entry, pool, 4);
  if (distractors.length < 4) return null;

  const ids: Option["id"][] = ["A", "B", "C", "D", "E"];
  const texts: string[] = [...distractors];
  texts.splice(positionTarget, 0, correct);

  const options: Option[] = ids.map((id, i) => ({ id, text: texts[i] }));
  return {
    category: "ORD",
    subject_type: "verbal",
    question_text: entry.word.toUpperCase(),
    options,
    correct_answer: ids[positionTarget],
    difficulty: difficultyFor(entry.word),
    source: entry.source,
  };
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */
async function main() {
  console.log("Scraping ordprov.se ...");
  const a = await scrapeOrdprov();
  console.log(`  ${a.length} ord från ordprov.se`);

  console.log("Scraping ordtestet.nu ...");
  const b = await scrapeOrdtestet();
  console.log(`  ${b.length} ord från ordtestet.nu`);

  // dedup på word (lowercase)
  const map = new Map<string, RawWord>();
  for (const w of [...a, ...b]) {
    const key = w.word.toLowerCase();
    if (!map.has(key)) map.set(key, w);
    else {
      const cur = map.get(key)!;
      cur.synonyms = [...new Set([...cur.synonyms, ...w.synonyms])];
    }
  }
  const all = [...map.values()];
  console.log(`Totalt unika ord: ${all.length}`);

  const pool = buildDistractorPool(all);

  const questions: OrdQuestion[] = [];
  let posCounter = 0;
  for (const entry of all) {
    const target = (posCounter % 5) as 0 | 1 | 2 | 3 | 4;
    posCounter++;
    const q = buildQuestion(entry, pool, target);
    if (q) questions.push(q);
  }

  // shuffle correct_answer-distributionen lite så det inte är perfekt cykliskt
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }

  writeFileSync(OUT_PATH, JSON.stringify(questions, null, 2), "utf8");
  console.log(`Wrote ${questions.length} ORD-frågor → ${OUT_PATH}`);

  const dist: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  questions.forEach((q) => dist[q.correct_answer]++);
  console.log("Fördelning correct_answer:", dist);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
