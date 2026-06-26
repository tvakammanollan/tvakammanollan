/**
 * scrape-ord-definitions.ts
 * ─────────────────────────────────────────────────────────────────
 * Scrapar ordförklaringar från svenska.se (Svenska Akademiens ordböcker)
 * för ALLA ORD-frågor och skriver dem till `questions.definition`
 * (+ `questions.definition_source`). Förklaringen visas sedan i
 * ord-övningen (DefinitionBlock i src/routes/ord.tsx).
 *
 * Källa: svenska.se:s interna Elasticsearch-API (samma som sajten själv
 * anropar). Primärt SO (Svensk ordbok – bäst pedagogiska definitioner),
 * faller tillbaka på SAOL (kortare definitioner) när SO saknar träff.
 *   GET https://svenska.se/api/search/so?q=<ord>&exact_match=true&size=3
 *   GET https://svenska.se/api/search/saol?q=<ord>&exact_match=true&size=3
 *
 * Egenskaper:
 *   - Avdubblar: varje unikt ord slås upp EN gång även om det förekommer
 *     i flera frågor; alla rader med ordet uppdateras.
 *   - Återupptagbar: lokal cache (scripts/.ord-defs/cache.json) gör att
 *     omkörningar hoppar över redan hämtade ord. Och vi väljer bara rader
 *     där definition IS NULL, så avbrutna körningar fortsätter där de slutade.
 *   - Snäll mot servern: liten concurrency-pool + jitter + retry/backoff.
 *
 * Användning (kräver bun):
 *   export SUPABASE_URL=...                 (eller VITE_SUPABASE_URL)
 *   export SUPABASE_SERVICE_ROLE_KEY=...    (service role – skriver till DB)
 *   bun run scripts/scrape-ord-definitions.ts            # kör allt
 *   bun run scripts/scrape-ord-definitions.ts --limit 50 # testa 50 ord
 *   bun run scripts/scrape-ord-definitions.ts --word krusa --dry  # ett ord, skriv inget
 *   bun run scripts/scrape-ord-definitions.ts --retry-misses      # försök igen på tidigare missar
 *
 * Flaggor:
 *   --dry            hämta + parsa men skriv INGET till DB
 *   --limit N        bearbeta max N unika ord (för test)
 *   --word X         bearbeta bara ordet X (implicerar små körningar)
 *   --retry-misses   ignorera cachade missar och försök igen
 *   --concurrency N  antal parallella förfrågningar (default 4)
 * ─────────────────────────────────────────────────────────────────
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Saknar env: sätt SUPABASE_URL (eller VITE_SUPABASE_URL) och SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ---- CLI-flaggor ----
const args = process.argv.slice(2);
const has = (f: string) => args.includes(f);
const val = (f: string) => {
  const i = args.indexOf(f);
  return i >= 0 ? args[i + 1] : undefined;
};
const DRY = has("--dry");
const RETRY_MISSES = has("--retry-misses");
const LIMIT = val("--limit") ? parseInt(val("--limit")!, 10) : Infinity;
const ONLY_WORD = val("--word");
const CONCURRENCY = val("--concurrency") ? Math.max(1, parseInt(val("--concurrency")!, 10)) : 4;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";
const API = "https://svenska.se/api/search";

const STATE_DIR = join(new URL(".", import.meta.url).pathname, ".ord-defs");
const CACHE_FILE = join(STATE_DIR, "cache.json");
if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true });

type CacheVal = { definition: string | null; source: string | null };
const cache: Record<string, CacheVal> = existsSync(CACHE_FILE)
  ? JSON.parse(readFileSync(CACHE_FILE, "utf8"))
  : {};
let cacheDirty = 0;
const flushCache = () => {
  writeFileSync(CACHE_FILE, JSON.stringify(cache));
  cacheDirty = 0;
};

// ---- Hjälpare ----
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

// Normalisera ett frågeord till uppslagsform (svenska.se vill ha gemener).
function normalizeWord(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildDefinition(hits: any[], word: string): string | null {
  // Föredra träff vars ortografi exakt matchar ordet; annars första träffen.
  const norm = normalizeWord(word);
  const exact = hits.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (h: any) => normalizeWord(String(h?._source?.ortografi ?? "")) === norm,
  );
  const chosen = exact ?? hits[0];
  const src = chosen?._source;
  if (!src) return null;

  const senses: string[] = [];
  const hbs = src.huvudbetydelser ?? src.huvudbetydelse ?? [];
  for (const hb of Array.isArray(hbs) ? hbs : [hbs]) {
    const raw = hb?.definition_full || hb?.definition || "";
    const text = stripHtml(String(raw));
    if (text) senses.push(text);
  }
  if (senses.length === 0) return null;
  // Numrera om flera betydelser; håll det kompakt (max 4 betydelser).
  const top = senses.slice(0, 4);
  return top.length === 1 ? top[0] : top.map((s, i) => `${i + 1}. ${s}`).join("  ");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchJson(url: string, tries = 4): Promise<any | null> {
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
      });
      if (res.status === 429 || res.status >= 500) {
        await sleep(800 * (attempt + 1) + Math.random() * 400);
        continue;
      }
      if (!res.ok) return null;
      return await res.json();
    } catch {
      await sleep(600 * (attempt + 1) + Math.random() * 400);
    }
  }
  return null;
}

// Slå upp ett ord: SO först, annars SAOL.
async function lookup(word: string): Promise<CacheVal> {
  const q = encodeURIComponent(word);
  const so = await fetchJson(`${API}/so?q=${q}&exact_match=true&size=3`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const soHits: any[] = so?.hits?.hits ?? [];
  const soDef = buildDefinition(soHits, word);
  if (soDef) return { definition: soDef, source: "SO (svenska.se)" };

  await sleep(120 + Math.random() * 120);
  const saol = await fetchJson(`${API}/saol?q=${q}&exact_match=true&size=3`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const saolHits: any[] = saol?.hits?.hits ?? [];
  const saolDef = buildDefinition(saolHits, word);
  if (saolDef) return { definition: saolDef, source: "SAOL (svenska.se)" };

  return { definition: null, source: null };
}

// ---- Hämta alla ORD-rader som saknar definition ----
async function loadWords(): Promise<Map<string, string[]>> {
  const byWord = new Map<string, string[]>();
  if (ONLY_WORD) {
    // Hämta alla rader vars question_text matchar ordet (case-insensitivt).
    const { data, error } = await supabase
      .from("questions")
      .select("id, question_text")
      .eq("category", "ORD")
      .ilike("question_text", ONLY_WORD);
    if (error) throw error;
    for (const r of data ?? []) {
      const w = normalizeWord(r.question_text as string);
      if (!byWord.has(w)) byWord.set(w, []);
      byWord.get(w)!.push(r.id as string);
    }
    return byWord;
  }

  let from = 0;
  const PAGE = 1000;
  for (;;) {
    const { data, error } = await supabase
      .from("questions")
      .select("id, question_text")
      .eq("category", "ORD")
      .is("definition", null)
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    const rows = data ?? [];
    for (const r of rows) {
      const w = normalizeWord(r.question_text as string);
      if (!w) continue;
      if (!byWord.has(w)) byWord.set(w, []);
      byWord.get(w)!.push(r.id as string);
    }
    if (rows.length < PAGE) break;
    from += PAGE;
  }
  return byWord;
}

async function writeDef(ids: string[], v: CacheVal) {
  if (DRY || !v.definition) return;
  // Chunk:a id-listan för säkerhets skull.
  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200);
    const { error } = await supabase
      .from("questions")
      .update({ definition: v.definition, definition_source: v.source })
      .in("id", chunk);
    if (error) throw error;
  }
}

async function main() {
  console.log(
    `[scrape] startar  dry=${DRY} limit=${LIMIT} concurrency=${CONCURRENCY}` +
      (ONLY_WORD ? ` word=${ONLY_WORD}` : ""),
  );
  const byWord = await loadWords();
  let words = [...byWord.keys()];
  console.log(`[scrape] ${words.length} unika ord saknar definition (av rader utan def)`);
  if (words.length > LIMIT) words = words.slice(0, LIMIT);

  let found = 0;
  let missed = 0;
  let done = 0;
  const total = words.length;

  // Enkel concurrency-pool.
  let cursor = 0;
  async function worker() {
    for (;;) {
      const idx = cursor++;
      if (idx >= words.length) return;
      const word = words[idx];
      const ids = byWord.get(word)!;

      let v: CacheVal;
      const cached = cache[word];
      if (cached && !(RETRY_MISSES && cached.definition === null)) {
        v = cached;
      } else {
        v = await lookup(word);
        cache[word] = v;
        if (++cacheDirty >= 25) flushCache();
        await sleep(100 + Math.random() * 150); // snällt
      }

      if (v.definition) {
        await writeDef(ids, v);
        found++;
      } else {
        missed++;
      }
      done++;
      if (done % 50 === 0 || done === total) {
        console.log(
          `[scrape] ${done}/${total}  hittade=${found} missade=${missed}` +
            `  (senast: "${word}" ${v.definition ? "✓" : "—"})`,
        );
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  flushCache();

  console.log(
    `\n[scrape] KLART. ord=${total} hittade=${found} missade=${missed}` +
      (DRY ? "  (DRY – inget skrevs till DB)" : ""),
  );
  if (missed > 0) {
    const missWords = words.filter((w) => cache[w] && cache[w].definition === null);
    writeFileSync(join(STATE_DIR, "misses.txt"), missWords.join("\n"));
    console.log(`[scrape] missar sparade i scripts/.ord-defs/misses.txt (${missWords.length})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
