/**
 * apply-manual-fixes.ts
 * ─────────────────────────────────────────────────────────────────
 * Applicerar de manuellt granskade ORD-fixarna från
 * `.ord-audit/manual-fixes.json` till databasen.
 *
 * Den enda externa beroende är SUPABASE_SERVICE_ROLE_KEY — ingen
 * Anthropic-API behövs eftersom fixarna redan är skrivna för hand.
 *
 * Dry-run by default. Kör med --apply för att faktiskt skriva.
 *
 *   bun run scripts/apply-manual-fixes.ts                # torrkörning
 *   bun run scripts/apply-manual-fixes.ts --apply        # skriv på riktigt
 *   bun run scripts/apply-manual-fixes.ts --apply --include-low
 *
 * --include-low inkluderar low/medium-confidence fixar (default: bara high).
 * ─────────────────────────────────────────────────────────────────
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SCRIPT_DIR = new URL(".", import.meta.url).pathname;
const FIXES_FILE = join(SCRIPT_DIR, "..", ".ord-audit", "manual-fixes.json");

type Fix = {
  word: string;
  from: string;
  to: string;
  confidence: "high" | "medium" | "low";
  why: string;
};

async function main() {
  const apply = process.argv.includes("--apply");
  const includeLow = process.argv.includes("--include-low");

  const raw = JSON.parse(readFileSync(FIXES_FILE, "utf8")) as { fixes: Fix[] };
  const allFixes = raw.fixes;
  const fixes = includeLow
    ? allFixes
    : allFixes.filter((f) => f.confidence === "high");

  console.log(`→ Mode: ${apply ? "APPLY (skriver till DB)" : "DRY RUN"}`);
  console.log(`→ Confidence: ${includeLow ? "high+medium+low" : "high only"}`);
  console.log(`→ ${fixes.length} fixar matchar.\n`);

  const url = process.env.SUPABASE_URL ?? "https://dqhgnioniarhiugxdgla.supabase.co";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    console.error("✖ SUPABASE_SERVICE_ROLE_KEY saknas. Lägg in den i .env och kör igen.");
    console.error("  Hitta nyckeln i Supabase Dashboard → Project Settings → API.");
    process.exit(1);
  }
  const sb = createClient(url, key, { auth: { persistSession: false } });

  let ok = 0;
  let notFound = 0;
  let mismatched = 0;
  let failed = 0;
  let skipped = 0;

  for (const fix of fixes) {
    // Find by question_text — case-insensitive exact match
    const { data: rows, error: findErr } = await sb
      .from("questions")
      .select("id, question_text, correct_answer")
      .eq("category", "ORD")
      .ilike("question_text", fix.word);

    if (findErr) {
      console.error(`✖ ${fix.word}: lookup failed — ${findErr.message}`);
      failed++;
      continue;
    }
    if (!rows || rows.length === 0) {
      console.warn(`⚠ ${fix.word}: hittades inte i DB`);
      notFound++;
      continue;
    }

    for (const row of rows as Array<{ id: string; question_text: string; correct_answer: string }>) {
      if (row.correct_answer !== fix.from) {
        console.warn(
          `⚠ ${fix.word} (${row.id}): markerat=${row.correct_answer}, men fixen säger from=${fix.from} → hoppar över för säkerhets skull`,
        );
        mismatched++;
        continue;
      }
      if (!apply) {
        console.log(`  ${fix.word.padEnd(24)} ${fix.from} → ${fix.to}   (${fix.why})`);
        skipped++;
        continue;
      }
      const { error: updErr } = await sb
        .from("questions")
        .update({ correct_answer: fix.to })
        .eq("id", row.id);
      if (updErr) {
        console.error(`✖ ${fix.word} (${row.id}): update failed — ${updErr.message}`);
        failed++;
      } else {
        console.log(`✓ ${fix.word.padEnd(24)} ${fix.from} → ${fix.to}`);
        ok++;
      }
    }
  }

  console.log(`\n── Sammanfattning ──`);
  if (!apply) {
    console.log(`→ ${skipped} fixar redo att appliceras.`);
    console.log(`→ ${notFound} hittades inte, ${mismatched} hade fel \`from\` (skippade), ${failed} fel.`);
    console.log(`→ Kör om med --apply för att faktiskt skriva.`);
  } else {
    console.log(`→ ${ok} skrev framgångsrikt.`);
    console.log(`→ ${notFound} hittades inte, ${mismatched} hoppades över (mismatched from), ${failed} misslyckades.`);
  }
}

Promise.resolve(main()).catch((err: { message?: string }) => {
  console.error("✖", err.message ?? err);
  process.exit(1);
});
