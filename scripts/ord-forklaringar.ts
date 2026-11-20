/**
 * Skriver in ordets förklaring på varje ORD-uppgift i gamla prov
 * (`explain` i `src/data/prov/<term>-<pass>.json`).
 *
 *   bun run scripts/ord-forklaringar.ts            # torrkörning
 *   bun run scripts/ord-forklaringar.ts --apply    # skriver
 *
 * Förr hämtade provpasset förklaringen ur ordlistan först när facit visades,
 * och visade ingenting när ordet saknades där (45 av 620 ord). Rutan kom
 * alltså på vissa uppgifter och inte på andra, och en stund efter facit.
 * Nu står den i provdatan och syns direkt, på varje ORD-uppgift.
 *
 * Källan är ordlistan (samma första betydelse och källrad som på
 * `/ordlista/<ord>`); ord som saknas där tas ur
 * `scripts/ord-forklaringar-egna.json`. Skriptet vägrar skriva om något
 * ord saknar förklaring. Kör om det när ett nytt prov lagts till
 * (`add_exam.py`) och lägg till de ord det klagar på i den egna filen.
 *
 * Läser bara ur databasen.
 */
import { createClient } from "@supabase/supabase-js";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ordSlug } from "../src/lib/ord-slug";
import { definitionSourceLabel, ordDefinitionParts } from "../src/lib/ord-definition";
import { trimToWord } from "../src/lib/seo-text";

const SENSE_MAX = 180; // samma som ordlistans uppslag
const EGEN_KALLA = "Tvåkommanollans förklaring";

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL och SUPABASE_SERVICE_ROLE_KEY krävs (ligger i .env.local).");
  process.exit(1);
}
const supabase = createClient(url, key);
const apply = process.argv.includes("--apply");

const ROOT = new URL("..", import.meta.url).pathname;
const DATA = join(ROOT, "src/data/prov");
const egna: Record<string, string> = JSON.parse(
  readFileSync(join(ROOT, "scripts/ord-forklaringar-egna.json"), "utf8"),
);

type Row = { question_text: string; definition: string | null; definition_source: string | null };
const bank = new Map<string, Row>();
for (let from = 0; ; from += 1000) {
  const { data, error } = await supabase
    .from("questions")
    .select("question_text,definition,definition_source")
    .eq("category", "ORD")
    .order("id")
    .range(from, from + 999);
  if (error) throw error;
  for (const row of data as Row[]) {
    const slug = ordSlug(row.question_text);
    // Första raden med en betydelse vinner, som i ordlistans register.
    if (slug && !bank.has(slug) && ordDefinitionParts(row.definition).senses[0]) {
      bank.set(slug, row);
    }
  }
  if (data.length < 1000) break;
}

type Explain = { sense: string; source: string; slug?: string };
const missing = new Set<string>();
const writes: [string, string][] = [];
let total = 0;
const fromBank = new Set<string>();
const fromOwn = new Set<string>();

for (const file of readdirSync(DATA).sort()) {
  if (!/^\d{4}(vt|ht)[ab]?-\d\.json$/.test(file)) continue;
  const path = join(DATA, file);
  const raw = readFileSync(path, "utf8");
  const pass = JSON.parse(raw);
  if (pass.kind !== "verbal") continue;
  let changed = false;
  for (const q of pass.questions) {
    if (q.delprov !== "ORD" || !q.text) continue;
    total++;
    const slug = ordSlug(q.text);
    const row = bank.get(slug);
    let explain: Explain | undefined;
    if (row) {
      const sense = trimToWord(ordDefinitionParts(row.definition).senses[0] ?? "", SENSE_MAX);
      explain = { sense, source: definitionSourceLabel(row.definition_source), slug };
      fromBank.add(slug);
    } else if (egna[slug]) {
      explain = { sense: egna[slug], source: EGEN_KALLA };
      fromOwn.add(slug);
    } else {
      missing.add(`${slug}  (${pass.term}/${pass.pass}/${q.nr})`);
      continue;
    }
    if (JSON.stringify(q.explain) !== JSON.stringify(explain)) {
      q.explain = explain;
      changed = true;
    }
  }
  if (changed) writes.push([path, JSON.stringify(pass)]);
}

console.log(
  `${total} ORD-uppgifter: ${fromBank.size} ord ur ordlistan, ${fromOwn.size} ur den egna filen.`,
);
if (missing.size) {
  console.error(
    `\n${missing.size} ord saknar förklaring. Lägg dem i scripts/ord-forklaringar-egna.json:`,
  );
  for (const m of missing) console.error("  " + m);
  process.exit(1);
}
if (apply) for (const [path, text] of writes) writeFileSync(path, text);
console.log(`${writes.length} provpass ${apply ? "skrivna" : "skulle ändras (torrkörning)"}.`);
