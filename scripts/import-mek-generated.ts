/**
 * Importerar Tvåkommanollans egna MEK-uppgifter till `questions`.
 *
 * Uppgifterna byggs av `scripts/mek-gen/` (regelverket i REGELVERK.md) och
 * ligger som `scripts/mek-gen/pilot/batch-NN.json`. Varje rad märks med
 * taggarna `tkn-genererad` och `mek-v1`, så att UI:t kan skriva ut att det är
 * vår egen uppgift och inte UHR:s, och så att hela omgången går att plocka
 * fram, pensionera eller räkna på i efterhand.
 *
 * `exam_term` lämnas tomt med flit: gamla-prov-importen raderar allt med
 * `exam_term` satt (se CLAUDE.md). Importen är idempotent på
 * `lower(question_text)`, samma unika index som resten av tabellen, så en
 * omkörning hoppar över det som redan finns.
 *
 * Kräver SUPABASE_SERVICE_ROLE_KEY i .env.local.
 *
 *   bun run scripts/import-mek-generated.ts            # torrkörning
 *   bun run scripts/import-mek-generated.ts --apply
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { faultsAt } from "../src/lib/mek-rules";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const PILOT = join(HERE, "mek-gen", "pilot");
const APPLY = process.argv.includes("--apply");

interface BatchItem {
  id: string;
  amne: string;
  genre: string;
  text: string;
  alternatives: string[];
  answer: string;
  explanation: string;
  source: { title: string; url: string; publisher?: string };
}

function env(name: string): string {
  for (const file of [".env.local", ".env"]) {
    const p = join(ROOT, file);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = line.match(/^([A-Z_]+)\s*=\s*(.*)$/);
      if (m && m[1] === name) return m[2].replace(/^["']|["']$/g, "");
    }
  }
  throw new Error(`${name} saknas i .env.local`);
}

const URL_BASE = env("SUPABASE_URL");
const KEY = env("SUPABASE_SERVICE_ROLE_KEY");

async function rest(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${URL_BASE}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

/** Alla befintliga uppgiftstexter, gemener, oavsett kategori (indexet är tabellbrett). */
async function existingTexts(): Promise<Set<string>> {
  const out = new Set<string>();
  const page = 1000;
  for (let from = 0; ; from += page) {
    const res = await rest(`questions?select=question_text&order=id`, {
      headers: { Range: `${from}-${from + page - 1}` },
    });
    if (!res.ok) throw new Error(`läsning misslyckades: ${res.status} ${await res.text()}`);
    const rows = (await res.json()) as Array<{ question_text: string }>;
    for (const r of rows) out.add(r.question_text.toLowerCase());
    if (rows.length < page) return out;
  }
}

function isWikipedia(b: BatchItem): boolean {
  return (b.source.publisher ?? "Wikipedia") === "Wikipedia";
}

/** `Utgivare: Titel (licens) url`; licensen anges bara för Wikipedia. */
function sourceLine(b: BatchItem): string {
  return isWikipedia(b)
    ? `Wikipedia: ${b.source.title} (CC BY-SA 4.0) ${b.source.url}`
    : `${b.source.publisher}: ${b.source.title} ${b.source.url}`;
}

function toRow(b: BatchItem) {
  return {
    category: "MEK",
    subject_type: "verbal",
    question_text: b.text,
    options: b.alternatives.map((text, i) => ({ id: "ABCD"[i], text })),
    correct_answer: b.answer,
    explanation: b.explanation,
    // Texten är egen prosa ur källans fakta. Källan skrivs ändå ut, för
    // läsarens skull och, för Wikipedia, för att CC BY-SA ska vara uppfylld om
    // någon formulering ligger nära. Formatet läses av `question-origin.ts`.
    source: sourceLine(b),
    tags: [
      "tkn-genererad",
      "mek-v1",
      b.amne,
      b.genre,
      isWikipedia(b) ? "wikipedia-cc-by-sa" : "egen-text-ur-fakta",
      b.id,
    ],
    clean_status: "ok",
    difficulty: null,
  };
}

const files = readdirSync(PILOT)
  .filter((f) => /^batch-\d+\.json$/.test(f))
  .sort();
const items: BatchItem[] = files.flatMap((f) => JSON.parse(readFileSync(join(PILOT, f), "utf8")));

// Sista spärren: ingen uppgift som fäller regelverkets format- eller stränga
// regler får gå till databasen, även om någon redigerat en batchfil för hand.
const broken = items.filter(
  (b) =>
    faultsAt({ text: b.text, alternatives: b.alternatives, answer: b.answer }, "format", "strikt")
      .length > 0,
);
if (broken.length) {
  for (const b of broken) console.error(`UNDERKÄND ${b.id}`);
  process.exit(1);
}

const seen = await existingTexts();
const fresh: BatchItem[] = [];
const dup: string[] = [];
const local = new Set<string>();
for (const b of items) {
  const k = b.text.toLowerCase();
  if (seen.has(k) || local.has(k)) dup.push(b.id);
  else {
    local.add(k);
    fresh.push(b);
  }
}

console.log(`${files.length} batchfiler, ${items.length} uppgifter`);
console.log(`finns redan: ${dup.length}${dup.length ? ` (${dup.join(", ")})` : ""}`);
console.log(`att infoga: ${fresh.length}`);
if (fresh[0]) console.log("exempelrad:", JSON.stringify(toRow(fresh[0]), null, 2));

if (!APPLY) {
  console.log("\nTorrkörning. Kör med --apply för att skriva.");
  process.exit(0);
}

const CHUNK = 100;
for (let i = 0; i < fresh.length; i += CHUNK) {
  const rows = fresh.slice(i, i + CHUNK).map(toRow);
  const res = await rest("questions", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    console.error(
      `infogning ${i}–${i + rows.length} misslyckades: ${res.status} ${await res.text()}`,
    );
    process.exit(1);
  }
  console.log(`infogade ${i + rows.length}/${fresh.length}`);
}
