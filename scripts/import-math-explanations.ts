/**
 * Skriver de handskrivna lösningarna i `scripts/math-expl/<delprov>.json` till
 * `questions.explanation`.
 *
 *   bun run scripts/import-math-explanations.ts            # torrkörning
 *   bun run scripts/import-math-explanations.ts --apply    # skriver
 *   bun run scripts/import-math-explanations.ts --category XYZ
 *
 * Filerna är nycklade på `termin/provpass/uppgift` (samma nyckel som
 * `sync-prov-clean-status.ts`), inte på rad-id: de går då att läsa och granska
 * i git, och de följer med om raderna någon gång importeras om.
 *
 * Varje text skrivs av någon som LÖST uppgiften och landade på facit. Skriptet
 * kan inte kontrollera det, men det avvisar det som bryter sajtens copy-regler,
 * och det skriver aldrig över en förklaring som redan finns
 * (`explanation IS NULL`). Att ersätta en text görs för hand.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";

const CATEGORIES = ["XYZ", "KVA", "NOG", "DTK"] as const;

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const only = args.includes("--category") ? args[args.indexOf("--category") + 1] : null;

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL och SUPABASE_SERVICE_ROLE_KEY krävs (ligger i .env.local).");
  process.exit(1);
}
const supabase = createClient(url, key);

/** Samma regler som lint-copy.cjs, plus längd. Returnerar skälet eller null. */
function problem(text: string): string | null {
  const words = text.trim().split(/\s+/).length;
  if (text.trim().length < 30) return "för kort";
  if (words > 130) return `för lång (${words} ord)`;
  if (/—/.test(text) || /\s–\s/.test(text)) return "tankstreck";
  if (/·/.test(text.replace(/\$[^$]*\$/g, ""))) return "mittpunkt";
  if (/[→←]/.test(text)) return "pil";
  if ((text.match(/\$/g) ?? []).length % 2 !== 0) return "udda antal $";
  return null;
}

async function main() {
  let totalNew = 0;
  let totalSkipped = 0;
  const bad: string[] = [];

  for (const cat of CATEGORIES) {
    if (only && only !== cat) continue;
    const path = new URL(`./math-expl/${cat.toLowerCase()}.json`, import.meta.url).pathname;
    if (!existsSync(path)) continue;
    const file = JSON.parse(readFileSync(path, "utf8")) as Record<string, string>;

    const rows: {
      id: string;
      exam_term: string;
      provpass_num: number;
      q_num: number;
      explanation: string | null;
    }[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase
        .from("questions")
        .select("id, exam_term, provpass_num, q_num, explanation")
        .eq("category", cat)
        .not("exam_term", "is", null)
        .neq("clean_status", "retired")
        .order("id")
        .range(from, from + 999);
      if (error) {
        console.error(`${cat}: kunde inte läsa frågorna: ${error.message}`);
        process.exit(1);
      }
      rows.push(...(data as typeof rows));
      if ((data?.length ?? 0) < 1000) break;
    }
    const byKey = new Map(rows.map((r) => [`${r.exam_term}/${r.provpass_num}/${r.q_num}`, r]));

    let nya = 0;
    let fanns = 0;
    let saknas = 0;
    for (const [k, text] of Object.entries(file)) {
      const p = problem(text);
      if (p) {
        bad.push(`${cat} ${k}: ${p}`);
        continue;
      }
      const row = byKey.get(k);
      if (!row) {
        saknas++;
        continue;
      }
      if (row.explanation) {
        fanns++;
        continue;
      }
      nya++;
      if (!apply) continue;
      const { error: upErr } = await supabase
        .from("questions")
        .update({ explanation: text })
        .eq("id", row.id)
        .is("explanation", null);
      if (upErr) {
        console.error(`  ${cat} ${k}: ${upErr.message}`);
        nya--;
      }
    }
    console.log(
      `${cat}: ${Object.keys(file).length} i filen, ${nya} ${apply ? "skrivna" : "skulle skrivas"}, ${fanns} hade redan, ${saknas} hittades inte i databasen`,
    );
    totalNew += nya;
    totalSkipped += fanns;
  }

  if (bad.length) {
    console.error(`\n${bad.length} texter avvisade:\n  ${bad.join("\n  ")}`);
    process.exitCode = 1;
  }
  if (!apply) console.log(`\nTorrkörning. ${totalNew} nya. Lägg till --apply för att skriva.`);
  else console.log(`\nKlart. ${totalNew} skrivna, ${totalSkipped} hoppades över.`);
}

void main();
