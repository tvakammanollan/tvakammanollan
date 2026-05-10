/**
 * seed-to-supabase.ts
 *
 * Läser scraper/ord-questions.json + scraper/hp-questions.json,
 * deduplicerar, validerar och batchinfogar i questions-tabellen via
 * Supabase service-role client (bypasses RLS).
 *
 * Kör:  bun run scraper/seed-to-supabase.ts
 *
 * Kräver i .env:
 *   VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const ORD_PATH = join(process.cwd(), "scraper", "ord-questions.json");
const HP_PATH = join(process.cwd(), "scraper", "hp-questions.json");

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Saknar VITE_SUPABASE_URL eller SUPABASE_SERVICE_ROLE_KEY i miljön.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

type RawQuestion = {
  category: string;
  subject_type: string;
  question_text: string;
  passage_text?: string;
  passage_id?: string;
  options: { id: string; text: string }[];
  correct_answer: string;
  difficulty?: number;
  source?: string;
};

function readJson(path: string): RawQuestion[] {
  if (!existsSync(path)) {
    console.warn(`Hoppar över saknad fil: ${path}`);
    return [];
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

function isValid(q: RawQuestion): boolean {
  if (!q.category || !q.subject_type || !q.question_text) return false;
  if (!Array.isArray(q.options) || q.options.length < 4) return false;
  if (!q.correct_answer) return false;
  const ids = q.options.map((o) => o.id);
  if (!ids.includes(q.correct_answer)) return false;
  return true;
}

async function main() {
  const ord = readJson(ORD_PATH);
  const hp = readJson(HP_PATH);
  console.log(`Läste ${ord.length} ORD + ${hp.length} HP frågor.`);

  // dedup på lowercase question_text
  const seen = new Map<string, RawQuestion>();
  for (const q of [...ord, ...hp]) {
    const key = q.question_text.trim().toLowerCase();
    if (!seen.has(key)) seen.set(key, q);
  }
  const all = [...seen.values()].filter(isValid);
  console.log(`Efter dedup + validering: ${all.length} frågor.`);

  // batch om 100
  const batchSize = 100;
  let inserted = 0;
  for (let i = 0; i < all.length; i += batchSize) {
    const batch = all.slice(i, i + batchSize);
    const { error } = await supabase.from("questions").insert(batch);
    if (error) {
      console.error(`Batch ${i / batchSize}: ${error.message}`);
      continue;
    }
    inserted += batch.length;
    console.log(`  ${inserted}/${all.length} insatta`);
  }

  // statistik per kategori
  const byCat: Record<string, number> = {};
  for (const q of all) byCat[q.category] = (byCat[q.category] || 0) + 1;
  console.log("\nKlar! Fördelning per kategori:");
  for (const [cat, n] of Object.entries(byCat)) {
    console.log(`  ${cat}: ${n}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
