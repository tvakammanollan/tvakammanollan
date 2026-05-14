/**
 * apply-ord-fixes.ts
 * ─────────────────────────────────────────────────────────────────
 * Tar verify-results.json (från verify-ord-questions.ts) och
 * applicerar korrigeringar/borttagningar i databasen.
 *
 * STÄNGT BY DEFAULT — kräver `--apply` för att faktiskt skriva.
 * Utan flaggan görs en torrkörning som bara visar vad som skulle
 * hända.
 *
 * Strategier:
 *   --strategy=fix     uppdaterar correct_answer till Claudes
 *                       föreslagna bokstav (rekommenderat — sparar
 *                       innehållet i frågorna).
 *   --strategy=delete  raderar rader där markerat ≠ bästa.
 *   --strategy=disable lägger till is_disabled=true (mjukare än
 *                       delete — kräver att kolumnen finns).
 *
 * Filter:
 *   --confidence=high       (default — bara high-confidence flaggor)
 *   --confidence=medium     high + medium
 *   --confidence=all        alla
 *
 * Exempel:
 *   bun run scripts/apply-ord-fixes.ts --strategy=fix
 *   bun run scripts/apply-ord-fixes.ts --strategy=fix --apply
 *   bun run scripts/apply-ord-fixes.ts --strategy=fix --apply --confidence=high
 * ─────────────────────────────────────────────────────────────────
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const SCRIPT_DIR = new URL(".", import.meta.url).pathname;
const STATE_DIR = join(SCRIPT_DIR, "..", ".ord-audit");
const RESULTS_FILE = join(STATE_DIR, "verify-results.json");

type Verdict = {
  qId: string;
  word: string;
  marked: string;
  best: string;
  match: boolean;
  confidence: "high" | "medium" | "low";
  reasoning: string;
};

function arg(name: string, dflt?: string): string | undefined {
  const m = process.argv.find((a) => a.startsWith(`--${name}=`));
  return m ? m.split("=")[1] : process.argv.includes(`--${name}`) ? "" : dflt;
}

async function main() {
  if (!existsSync(RESULTS_FILE)) {
    throw new Error(`Saknar ${RESULTS_FILE}. Kör verify-ord-questions.ts fetch först.`);
  }
  const verdicts: Verdict[] = JSON.parse(readFileSync(RESULTS_FILE, "utf8"));
  const strategy = arg("strategy", "fix") as "fix" | "delete" | "disable";
  const confLevel = arg("confidence", "high") as "high" | "medium" | "all";
  const apply = process.argv.includes("--apply");

  const confidenceFilter = (v: Verdict) =>
    confLevel === "all"
      ? true
      : confLevel === "medium"
        ? v.confidence !== "low"
        : v.confidence === "high";

  const flagged = verdicts.filter((v) => !v.match && confidenceFilter(v));

  console.log(`→ Strategi: ${strategy}`);
  console.log(`→ Confidence-filter: ${confLevel}`);
  console.log(`→ ${flagged.length} frågor matchar kriterierna.`);
  console.log(`→ Mode: ${apply ? "APPLY (skriver till DB)" : "DRY RUN (visar bara)"}\n`);

  if (!apply) {
    for (const v of flagged.slice(0, 20)) {
      console.log(
        `  ${v.word.padEnd(22)} markerat=${v.marked} → ${strategy === "fix" ? `rätt=${v.best}` : strategy}  [${v.confidence}]`,
      );
    }
    if (flagged.length > 20) console.log(`  ... och ${flagged.length - 20} till`);
    console.log(`\n→ Kör med --apply för att faktiskt ${strategy === "fix" ? "uppdatera" : strategy === "delete" ? "radera" : "inaktivera"}.`);
    return;
  }

  const url = process.env.SUPABASE_URL ?? "https://dqhgnioniarhiugxdgla.supabase.co";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY saknas.");
  const sb = createClient(url, key, { auth: { persistSession: false } });

  let ok = 0;
  let failed = 0;
  for (const v of flagged) {
    let err: { message: string } | null = null;
    if (strategy === "fix") {
      const res = await sb
        .from("questions")
        .update({ correct_answer: v.best })
        .eq("id", v.qId);
      err = res.error;
    } else if (strategy === "delete") {
      const res = await sb.from("questions").delete().eq("id", v.qId);
      err = res.error;
    } else if (strategy === "disable") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await (sb.from("questions").update as any)({ is_disabled: true }).eq(
        "id",
        v.qId,
      );
      err = res.error;
    }
    if (err) {
      failed++;
      console.error(`  ✖ ${v.word}: ${err.message}`);
    } else {
      ok++;
    }
  }
  console.log(`\n→ Klart. ${ok} lyckades, ${failed} misslyckades.`);
}

main().catch((err) => {
  console.error("✖", err.message ?? err);
  process.exit(1);
});
