/**
 * seed-ord-old.ts
 *
 * Lägger in orden från scrape-ord-old.ts (högskoleproven 1977–2011) i
 * questions-tabellen. Till skillnad från seed-to-supabase.ts är den
 * idempotent: den läser vilka ORD-uppgifter som redan finns och infogar bara
 * det som saknas, så den kan köras om utan att skapa dubbletter.
 *
 * Kör:  bun run scraper/seed-ord-old.ts            (torrkörning, skriver inget)
 *       bun run scraper/seed-ord-old.ts --apply    (skriver till databasen)
 *
 * Kräver i .env:
 *   VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * OBS: sätter medvetet inte exam_term. Gamla-prov-importen gör
 * `delete().not("exam_term", "is", null)` innan den importerar om gamla prov,
 * så allt med exam_term satt raderas nästa gång den körs. Terminen ligger i
 * tags i stället, precis som resten av ORD-beståndet lämnar exam_term tomt.
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const IN_PATH = join(process.cwd(), "scraper", "ord-old-questions.json");

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Saknar VITE_SUPABASE_URL eller SUPABASE_SERVICE_ROLE_KEY i miljön.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

type Option = { id: string; text: string };
type OrdRow = {
  category: string;
  subject_type: string;
  question_text: string;
  options: Option[];
  correct_answer: string;
  source: string;
  tags: string[];
};

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

function isValid(q: OrdRow): boolean {
  if (q.category !== "ORD" || q.subject_type !== "verbal") return false;
  if (!q.question_text.trim()) return false;
  if (!Array.isArray(q.options) || q.options.length !== 5) return false;
  if (new Set(q.options.map((o) => o.id)).size !== 5) return false;
  if (q.options.some((o) => !o.text.trim())) return false;
  return q.options.some((o) => o.id === q.correct_answer);
}

async function main() {
  const apply = process.argv.includes("--apply");

  if (!existsSync(IN_PATH)) {
    console.error(`Hittar inte ${IN_PATH}. Kör scraper/scrape-ord-old.ts först.`);
    process.exit(1);
  }
  const incoming: OrdRow[] = JSON.parse(readFileSync(IN_PATH, "utf8"));
  console.log(`Läste ${incoming.length} ORD-uppgifter från ord-old-questions.json.`);

  const invalid = incoming.filter((q) => !isValid(q));
  if (invalid.length > 0) {
    console.error(`${invalid.length} uppgifter underkändes av valideringen — avbryter.`);
    for (const q of invalid.slice(0, 10)) console.error(`  ${q.question_text}`);
    process.exit(1);
  }

  // Hämta befintliga ORD-uppslag så att omkörning inte skapar dubbletter.
  const existing = new Set<string>();
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("questions")
      .select("question_text")
      .eq("category", "ORD")
      .range(from, from + pageSize - 1);
    if (error) {
      console.error(`Kunde inte läsa befintliga ord: ${error.message}`);
      process.exit(1);
    }
    for (const r of data ?? []) existing.add(norm(r.question_text as string));
    if (!data || data.length < pageSize) break;
  }
  console.log(`Databasen har ${existing.size} unika ORD-uppslag sedan tidigare.`);

  // Dubbletter inom filen: samma ord kan ha testats flera terminer.
  const seen = new Set<string>();
  const toInsert: OrdRow[] = [];
  let dupInFile = 0;
  let dupInDb = 0;
  for (const q of incoming) {
    const key = norm(q.question_text);
    if (existing.has(key)) {
      dupInDb++;
      continue;
    }
    if (seen.has(key)) {
      dupInFile++;
      continue;
    }
    seen.add(key);
    toInsert.push(q);
  }

  console.log(`Hoppar över ${dupInDb} som redan finns och ${dupInFile} dubbletter inom filen.`);
  console.log(`Att lägga in: ${toInsert.length} nya ord.`);

  const perTerm = new Map<string, number>();
  for (const q of toInsert) {
    const t = q.tags[0] ?? "?";
    perTerm.set(t, (perTerm.get(t) ?? 0) + 1);
  }
  console.log(
    "Per termin: " +
      [...perTerm]
        .sort()
        .map(([t, n]) => `${t}:${n}`)
        .join("  "),
  );

  if (!apply) {
    console.log("\nTorrkörning — inget skrevs. Kör om med --apply för att spara.");
    return;
  }

  let inserted = 0;
  const batchSize = 100;
  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize);
    const { error } = await supabase.from("questions").insert(batch);
    if (error) {
      console.error(`Batch ${i / batchSize}: ${error.message}`);
      continue;
    }
    inserted += batch.length;
    console.log(`  ${inserted}/${toInsert.length} insatta`);
  }
  console.log(`\nKlart. ${inserted} nya ord i ordlistan.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
