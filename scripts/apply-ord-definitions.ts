/**
 * apply-ord-definitions.ts  (FAS 2 – skriver till databasen)
 * ─────────────────────────────────────────────────────────────────
 * Läser scripts/ord-definitions.json (byggd av scrape-ord-definitions.ts)
 * och skriver definitionerna till questions.definition + definition_source
 * för alla ORD-frågor. Matchar på question_text (normaliserat, case-insensitivt).
 *
 * KRÄVER service-role-nyckel (skriver till DB). Körs när nyckeln finns,
 * t.ex. lokalt med nyckeln från Lovable:
 *
 *   export SUPABASE_URL=...               (eller VITE_SUPABASE_URL)
 *   export SUPABASE_SERVICE_ROLE_KEY=...
 *   bun run apply:ord-defs --dry          # visa vad som skulle skrivas
 *   bun run apply:ord-defs                # skriv på riktigt
 *
 * Säkert: rör som standard bara rader där definition IS NULL (återupptagbart),
 * och skriver inget i --dry. Definitionerna syns direkt i ord-övningen efteråt
 * (DefinitionBlock i src/routes/ord.tsx) – ingen deploy behövs.
 *
 *   bun run apply:ord-defs --overwrite --dry   # räkna om hur många som ändras
 *   bun run apply:ord-defs --overwrite         # skriv över befintliga texter
 *
 * --overwrite behövs när skrapan har byggts om och redan ifyllda rader ska
 * ersättas – t.ex. när exempelmeningar, liknande ord och ordklass tillkom.
 * Även då skrivs bara de rader vars text faktiskt skiljer sig, så en andra
 * körning rör ingenting.
 * ─────────────────────────────────────────────────────────────────
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Saknar env: SUPABASE_URL (eller VITE_SUPABASE_URL) och SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const OVERWRITE = args.includes("--overwrite");
const LIMIT = args.includes("--limit")
  ? parseInt(args[args.indexOf("--limit") + 1], 10)
  : Infinity;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const ARTIFACT = join(new URL(".", import.meta.url).pathname, "ord-definitions.json");
const normalizeWord = (raw: string) => raw.trim().toLowerCase().replace(/\s+/g, " ");

async function main() {
  if (!existsSync(ARTIFACT)) {
    console.error("Hittar inte scripts/ord-definitions.json – kör scrape:ord-defs först.");
    process.exit(1);
  }
  const artifact = JSON.parse(readFileSync(ARTIFACT, "utf8")) as {
    definitions: Record<string, { definition: string | null; source: string | null }>;
  };
  const defs = artifact.definitions;
  console.log(`[apply] ${Object.keys(defs).length} ord med definition i artefakten  dry=${DRY}`);

  // Läs ORD-raderna → mappa normaliserat ord -> ids. Utan --overwrite bara de
  // som saknar definition; med --overwrite alla, men rader som redan har exakt
  // rätt text filtreras bort nedan så att en omkörning inte skriver något.
  const byWord = new Map<string, string[]>();
  let from = 0;
  let unchanged = 0;
  const PAGE = 1000;
  for (;;) {
    let query = supabase
      .from("questions")
      .select("id, question_text, definition")
      .eq("category", "ORD");
    if (!OVERWRITE) query = query.is("definition", null);
    const { data, error } = await query
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    const rows = data ?? [];
    for (const r of rows) {
      const w = normalizeWord(r.question_text as string);
      if (!w) continue;
      const next = defs[w]?.definition;
      if (next && r.definition === next) {
        unchanged++;
        continue;
      }
      if (!byWord.has(w)) byWord.set(w, []);
      byWord.get(w)!.push(r.id as string);
    }
    if (rows.length < PAGE) break;
    from += PAGE;
  }
  console.log(
    `[apply] ${byWord.size} unika ord att skriva` +
      (OVERWRITE ? `  (${unchanged} rader redan aktuella)` : "  (saknar definition)"),
  );

  let updatedWords = 0;
  let updatedRows = 0;
  let noMatch = 0;
  let processed = 0;

  for (const [word, v] of Object.entries(defs)) {
    if (processed >= LIMIT) break;
    processed++;
    if (!v.definition) continue;
    const ids = byWord.get(word);
    if (!ids || ids.length === 0) {
      noMatch++;
      continue;
    }
    if (!DRY) {
      for (let i = 0; i < ids.length; i += 200) {
        const chunk = ids.slice(i, i + 200);
        const { error } = await supabase
          .from("questions")
          .update({ definition: v.definition, definition_source: v.source })
          .in("id", chunk);
        if (error) throw error;
      }
    }
    updatedWords++;
    updatedRows += ids.length;
    if (updatedWords % 200 === 0) {
      console.log(`[apply] ${updatedWords} ord uppdaterade (${updatedRows} rader)…`);
    }
  }

  console.log(
    `\n[apply] KLART. ord=${updatedWords} rader=${updatedRows}` +
      ` utan_match_i_db=${noMatch}` +
      (DRY ? "  (DRY – inget skrevs)" : ""),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
