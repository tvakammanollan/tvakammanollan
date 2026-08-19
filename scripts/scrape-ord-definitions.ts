/**
 * scrape-ord-definitions.ts  (FAS 1 – offline, ingen DB-skrivning)
 * ─────────────────────────────────────────────────────────────────
 * Scrapar ordförklaringar från svenska.se (Svenska Akademiens ordböcker)
 * för ALLA ORD-frågor och skriver dem till en lokal datafil:
 *
 *   scripts/ord-definitions.json
 *
 * Orden läses helst med service-role-nyckeln ur .env.local. Sedan
 * 20260818140100_dolj_facit.sql har `authenticated` inte längre SELECT på
 * questions.correct_answer, och ett anon-anrop som ber om den kolumnen får
 * 401 "permission denied for table questions" – vilket är hela poängen med
 * den migrationen. Utan service-nyckel kör skrapan vidare på anon-nyckeln,
 * men då går sista reservkällan (HP-facits egen synonym) inte att läsa.
 * Att ladda in datan i databasen är ett separat steg:
 * scripts/apply-ord-definitions.ts.
 *
 * Källa: svenska.se:s interna API (samma som sajten anropar). Primärt SO
 * (Svensk ordbok – bäst pedagogiska definitioner), faller tillbaka på SAOL.
 *   GET https://svenska.se/api/search/so?q=<ord>&exact_match=true&size=3
 *   GET https://svenska.se/api/search/saol?q=<ord>&exact_match=true&size=3
 *
 * Egenskaper:
 *   - Återupptagbar: lokal cache (scripts/.ord-defs/cache.json). Avbryt
 *     när som helst och kör igen – redan hämtade ord hoppas över.
 *   - Snäll mot servern: concurrency-pool + jitter + retry/backoff.
 *
 * Användning (kräver bun):
 *   # läser VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY från .env
 *   bun run scrape:ord-defs                 # bygg hela ord-definitions.json
 *   bun run scrape:ord-defs --limit 50      # testa 50 ord
 *   bun run scrape:ord-defs --word krusa    # bara ett ord (skriver ej fil)
 *   bun run scrape:ord-defs --retry-misses  # försök igen på tidigare missar
 *   bun run scrape:ord-defs --concurrency 8
 * ─────────────────────────────────────────────────────────────────
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
// Samma modul som appen renderar med — utskrivna förkortningar och
// textformatet för exempel/liknande ord får inte skilja sig åt mellan det
// som skrivs och det som läses.
import {
  expandOrdAbbreviations,
  formatOrdDefinition,
  parseOrdDefinition,
} from "../src/lib/ord-definition";

// bun läser .env och .env.local automatiskt.
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const READ_KEY = SERVICE_KEY || ANON_KEY;
if (!SUPABASE_URL || !READ_KEY) {
  console.error(
    "Saknar env: VITE_SUPABASE_URL och VITE_SUPABASE_PUBLISHABLE_KEY (finns normalt i .env).",
  );
  process.exit(1);
}

// ---- CLI ----
const args = process.argv.slice(2);
const has = (f: string) => args.includes(f);
const val = (f: string) => {
  const i = args.indexOf(f);
  return i >= 0 ? args[i + 1] : undefined;
};
const RETRY_MISSES = has("--retry-misses");
const REFRESH_FALLBACKS = has("--refresh-fallbacks");
const isPrimarySource = (s: string | null) =>
  s === "SO (svenska.se)" || s === "SAOL (svenska.se)";
const LIMIT = val("--limit") ? parseInt(val("--limit")!, 10) : Infinity;
const ONLY_WORD = val("--word");
const CONCURRENCY = val("--concurrency") ? Math.max(1, parseInt(val("--concurrency")!, 10)) : 6;

// svenska.se vill ha en webbläsarlik UA; Wikimedia kräver en beskrivande UA
// med kontakt (annars throttlas/blockeras anrop).
const UA_BROWSER =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";
const UA_WIKIMEDIA = "tvakommanollan-orddefs/1.0 (https://tvakommanollan.se; niklas.pellkvist@gmail.com)";
const uaFor = (url: string) => (/wik(ipedia|tionary)\.org/.test(url) ? UA_WIKIMEDIA : UA_BROWSER);
const API = "https://svenska.se/api/search";

const SCRIPT_DIR = new URL(".", import.meta.url).pathname;
const STATE_DIR = join(SCRIPT_DIR, ".ord-defs");
const CACHE_FILE = join(STATE_DIR, "cache.json");
const OUT_FILE = join(SCRIPT_DIR, "ord-definitions.json");
const MISS_FILE = join(STATE_DIR, "misses.txt");
if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true });

type CacheVal = { definition: string | null; source: string | null };
const cache: Record<string, CacheVal> = existsSync(CACHE_FILE)
  ? JSON.parse(readFileSync(CACHE_FILE, "utf8"))
  : {};
let dirty = 0;
const flushCache = () => {
  writeFileSync(CACHE_FILE, JSON.stringify(cache));
  dirty = 0;
};

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

const normalizeWord = (raw: string) => raw.trim().toLowerCase().replace(/\s+/g, " ");

// Sista, garanterade källan: ORD-frågans EGET rätta svar (synonym ur HP-facit).
// Fylls i loadWords; används bara om alla ordböcker missar → 100% täckning.
const answerKey = new Map<string, string>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function correctOptionText(options: any, correct: any): string | null {
  if (!Array.isArray(options)) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const txt = (o: any) => (typeof o === "string" ? o : o && typeof o === "object" ? String(o.text ?? "") : "");
  for (const o of options)
    if (o && typeof o === "object" && o.id != null && String(o.id) === String(correct))
      return txt(o).trim() || null;
  const idx = ["A", "B", "C", "D", "E", "F"].indexOf(String(correct).toUpperCase());
  if (idx >= 0 && options[idx]) return txt(options[idx]).trim() || null;
  const n = parseInt(String(correct), 10);
  if (!Number.isNaN(n) && options[n]) return txt(options[n]).trim() || null;
  return null;
}

// ---- Snygg formatering ----
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
function polishSentence(s: string): string {
  let t = expandOrdAbbreviations(s.trim().replace(/\s+/g, " "));
  if (!t) return t;
  t = cap(t);
  if (!/[.!?…]$/.test(t)) t += ".";
  return t;
}
// Flera betydelser → numrerad lista, en betydelse → en mening. Går genom
// formatOrdDefinition så att appens parser läser tillbaka exakt samma form.
function formatSenses(senses: string[], extra: Partial<RichParts> = {}): string | null {
  const clean = senses.map((s) => s.trim()).filter(Boolean).slice(0, 4);
  if (clean.length === 0) return null;
  return formatOrdDefinition({
    senses: clean.map(polishSentence),
    examples: extra.examples ?? [],
    related: extra.related ?? [],
    wordClass: extra.wordClass ?? null,
  });
}

type RichParts = {
  examples: string[];
  related: string[];
  wordClass: string | null;
};

/**
 * Plockar ut det ordboken har utöver själva betydelsen: autentiska
 * exempelmeningar (`syntex`), närliggande ord (JFR-hänvisningarna) och
 * ordklass.
 *
 * Det här är hela poängen med att skrapa om beståndet. En ren definition
 * ("senareläggning av den tidpunkt när något måste ske") säger vad ordet
 * betyder; exempelmeningen visar hur det används, och JFR-listan ger
 * synonymerna — vilket är precis vad ORD-uppgifterna frågar efter. För
 * "frist" ligger andrum, anstånd, nådatid, respit, rådrum och uppskov
 * gratis i svaret och användes inte alls tidigare.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function collectRich(src: any, word: string): RichParts {
  const examples: string[] = [];
  const related: string[] = [];
  const norm = normalizeWord(word);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addRelated = (node: any) => {
    for (const h of node?.hänvisningar ?? []) {
      if (!String(h?.typ ?? "").startsWith("JFR")) continue;
      // Uppslagsordets homografsiffra följer med i länktexten ("entré 1").
      const w = stripHtml(String(h?.hänvisning ?? ""))
        .replace(/\s*\d+$/, "")
        .trim()
        .toLowerCase();
      if (w && w !== norm && !related.includes(w)) related.push(w);
    }
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addExamples = (node: any) => {
    for (const ex of node?.syntex ?? []) {
      const t = stripHtml(String(ex)).trim();
      if (t && !examples.includes(t)) examples.push(t);
    }
  };

  const hbs = src?.huvudbetydelser ?? src?.huvudbetydelse ?? [];
  for (const hb of Array.isArray(hbs) ? hbs : [hbs]) {
    addRelated(hb);
    addExamples(hb);
    for (const ub of hb?.underbetydelser ?? []) {
      addRelated(ub);
      addExamples(ub);
    }
  }

  // Hela meningar före lösryckta fraser: "lotsen kunde äntra skeppet trots
  // sjögången" lär ut mer än "äntra stormasten".
  examples.sort((a, b) => b.split(" ").length - a.split(" ").length);
  return {
    examples: examples.slice(0, 2).map((e) => expandOrdAbbreviations(e)),
    related: related.slice(0, 6),
    wordClass: src?.ordklass ? String(src.ordklass).trim() : null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pickHit(hits: any[], word: string): any | null {
  const norm = normalizeWord(word);
  const exact = hits.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (h: any) => normalizeWord(String(h?._source?.ortografi ?? "")) === norm,
  );
  return exact ?? hits[0] ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildDefinition(hits: any[], word: string): string | null {
  const src = pickHit(hits, word)?._source;
  if (!src) return null;
  const senses: string[] = [];
  const hbs = src.huvudbetydelser ?? src.huvudbetydelse ?? [];
  for (const hb of Array.isArray(hbs) ? hbs : [hbs]) {
    const text = stripHtml(String(hb?.definition_full || hb?.definition || ""));
    if (text) senses.push(text);
  }
  return formatSenses(senses, collectRich(src, word));
}

// ---- Fallback: SO-idiom (för uttryck/fraser, t.ex. "vara i svang") ----
function idiomVariants(idiom: string): string[] {
  // "(komma/vara) i svang" → ["i svang","komma i svang","vara i svang"]
  const base = normalizeWord(idiom.replace(/\(([^)]*)\)/g, " ").replace(/\s+/g, " "));
  const out = new Set<string>([base]);
  const m = idiom.match(/\(([^)]*)\)/);
  if (m) {
    for (const opt of m[1].split("/")) {
      out.add(normalizeWord(idiom.replace(/\([^)]*\)/, opt)));
    }
  }
  return [...out].filter(Boolean);
}
async function lookupSOIdiom(phrase: string): Promise<string | null> {
  const norm = normalizeWord(phrase);
  const data = await fetchJson(`${API}/so?q=${encodeURIComponent(phrase)}&size=10`);
  for (const h of data?.hits?.hits ?? []) {
    const hbs = h?._source?.huvudbetydelser ?? [];
    for (const hb of Array.isArray(hbs) ? hbs : [hbs]) {
      for (const idi of hb?.idiom ?? []) {
        const variants = idiomVariants(String(idi?.idiom ?? ""));
        const pTok = norm.split(" ").filter(Boolean);
        const isSubseq = (idiom: string) => {
          const t = idiom.split(" ").filter(Boolean);
          let j = 0;
          for (const w of t) if (j < pTok.length && w === pTok[j]) j++;
          return j === pTok.length; // alla frasens ord i ordning (tillåter inskjutna "någon/något")
        };
        const hit = variants.some(
          (v) => v === norm || v.includes(norm) || norm.includes(v) || isSubseq(v),
        );
        if (!hit) continue;
        const def = stripHtml(String(idi?.idiombetydelser?.[0]?.definition ?? ""));
        if (def) return polishSentence(def);
      }
    }
  }
  return null;
}

// ---- Fallback: svenska Wiktionary (action-API) ----
function cleanWiki(s: string): string {
  let t = s.replace(/^#+\s*/, "");
  for (let i = 0; i < 4; i++) t = t.replace(/\{\{[^{}]*\}\}/g, " ");
  t = t
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/'{2,}/g, "")
    .replace(/<[^>]+>/g, "");
  return t.replace(/\s+/g, " ").trim();
}
// Hämta första riktiga betydelsen (gloss) från wikitext; föredra Svenska-sektionen.
function firstWiktGloss(wikitext: string): string | null {
  const blocks: string[] = [];
  const m = wikitext.match(/\n==\s*Svenska\s*==\s*\n/);
  if (m) {
    const start = m.index! + m[0].length;
    const nxt = wikitext.slice(start).match(/\n==[^=].*?==\s*\n/);
    blocks.push(wikitext.slice(start, nxt ? start + nxt.index! : undefined));
  }
  blocks.push(wikitext); // fallback: hela texten
  for (const b of blocks) {
    for (const line of b.split("\n")) {
      if (/^#[^:*]/.test(line)) {
        const g = cleanWiki(line);
        if (g) return g;
      }
    }
  }
  return null;
}
async function fetchWiktGloss(word: string): Promise<string | null> {
  const url = `https://sv.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(
    word,
  )}&prop=wikitext&format=json&redirects=1`;
  const d = await fetchJson(url);
  const wt = d?.parse?.wikitext?.["*"];
  return wt ? firstWiktGloss(String(wt)) : null;
}
async function lookupWiktionary(word: string, depth = 0): Promise<string | null> {
  const gloss = await fetchWiktGloss(word);
  if (!gloss) return null;
  // Form-of / variant → följ till grundordet och slå upp det i SO/SAOL/Wiktionary.
  const m = gloss.match(
    /(?:variant av|böjningsform av|böjning av|äldre form av|alternativ (?:stavning|form) av|felstavning av|se)\s+([a-zåäöé][a-zåäöéA-ZÅÄÖ-]+)/i,
  );
  if (m && depth < 1) {
    const target = m[1].toLowerCase();
    const q = encodeURIComponent(target);
    const so = buildDefinition((await fetchJson(`${API}/so?q=${q}&exact_match=true&size=3`))?.hits?.hits ?? [], target);
    if (so) return so;
    const saol = buildDefinition((await fetchJson(`${API}/saol?q=${q}&exact_match=true&size=3`))?.hits?.hits ?? [], target);
    if (saol) return saol;
    const wt = await lookupWiktionary(target, depth + 1);
    if (wt) return wt;
  }
  // Hoppa över rena hänvisningar utan eget innehåll.
  if (/^(se |jämför|jfr)\b/i.test(gloss)) return null;
  return polishSentence(gloss);
}

// ---- Fallback: svenska Wikipedia (för facktermer, latinska uttryck m.m.) ----
function firstSentences(text: string, max = 260): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const lastDot = cut.lastIndexOf(". ");
  return (lastDot > 80 ? cut.slice(0, lastDot + 1) : cut.trimEnd()) + "…";
}
async function fetchText(url: string, tries = 4): Promise<string | null> {
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": uaFor(url) } });
      if (res.status === 404) return null;
      if (res.status === 429 || res.status >= 500) {
        await sleep(1000 * (attempt + 1) + Math.random() * 500);
        continue;
      }
      if (!res.ok) return null;
      return await res.text();
    } catch {
      await sleep(800 * (attempt + 1) + Math.random() * 400);
    }
  }
  return null;
}

// ---- Fallback: SAOB (Svenska Akademiens ordbok) – för ålderdomliga ord ----
// Definitionen ligger i en <span class="StorAntikva"> direkt efter uppslagsordets ankare.
async function lookupSAOB(word: string): Promise<string | null> {
  const d = await fetchJson(`${API}/saob?q=${encodeURIComponent(word)}&exact_match=true&size=1`);
  const src = d?.hits?.hits?.[0]?._source;
  if (!src?.anchor || !src?.file || !src?.directory) return null;
  const art = await fetchText(`https://svenska.se/api/saob/${src.directory}/${src.file}`);
  if (!art) return null;
  const i = art.indexOf(`id="${src.anchor}"`);
  if (i < 0) return null;
  const region = art.slice(i, i + 4000);
  for (const m of region.matchAll(/<span class="StorAntikva">(.*?)<\/span>/gs)) {
    const t = stripHtml(m[1]).replace(/^[[\]\s.—–]+/, "").trim();
    if (t.length >= 8 && !t.startsWith("[")) return polishSentence(t);
  }
  return null;
}

// ---- Sista fallback: engelska Wiktionary (svensk sektion om den finns; annars först) ----
async function lookupEnWiktionary(word: string): Promise<string | null> {
  const d = await fetchJson(
    `https://en.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(
      word,
    )}&prop=wikitext&format=json&redirects=1`,
  );
  const wt = d?.parse?.wikitext?.["*"];
  if (!wt) return null;
  const g = firstWiktGloss(String(wt));
  return g ? polishSentence(g) : null;
}

async function lookupWikipedia(word: string): Promise<string | null> {
  const d = await fetchJson(
    `https://sv.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(word)}`,
  );
  if (!d || d.type === "disambiguation") return null;
  const ex = String(d.extract ?? "").trim();
  if (!ex || ex.length < 8) return null;
  return polishSentence(firstSentences(ex));
}

// ---- Sista fallback: närmaste uppslagsord (stavningsvariant/felstavning) ----
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
  return dp[m][n];
}
// svenska.se:s egen stavningsrättelse ("menade du?") → slå upp det rättade ordet.
async function lookupSuggest(word: string): Promise<CacheVal> {
  for (const dict of ["so", "saol"] as const) {
    const d = await fetchJson(
      `${API}/${dict}?q=${encodeURIComponent(word)}&exact_match=true&size=1&includeDidYouMean=true`,
    );
    const sug = d?.didYouMean?.[0];
    if (
      sug?.text &&
      sug.kind === "headword" &&
      typeof sug.distance === "number" &&
      sug.distance <= 1 &&
      normalizeWord(String(sug.text)) !== normalizeWord(word)
    ) {
      const r = await resolveSingle(String(sug.text));
      if (r.definition) return { definition: r.definition, source: `${r.source}, rättstavat "${sug.text}"` };
    }
  }
  return { definition: null, source: null };
}

// Slår upp ordet löst i SO/SAOL och accepterar närmaste lemma inom redigeringsavstånd.
async function lookupFuzzy(word: string): Promise<CacheVal> {
  const norm = normalizeWord(word);
  const thresh = norm.length <= 5 ? 1 : 2;
  const q = encodeURIComponent(word);
  for (const dict of ["so", "saol"] as const) {
    const data = await fetchJson(`${API}/${dict}?q=${q}&size=6`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hits: any[] = data?.hits?.hits ?? [];
    let best: { d: number; hit: any } | null = null; // eslint-disable-line @typescript-eslint/no-explicit-any
    for (const h of hits) {
      const orto = normalizeWord(String(h?._source?.ortografi ?? ""));
      if (!orto || orto.includes(" ")) continue;
      const d = levenshtein(norm, orto);
      if (best === null || d < best.d) best = { d, hit: h };
    }
    if (best && best.d <= thresh) {
      const def = buildDefinition([best.hit], String(best.hit._source.ortografi));
      if (def) {
        const label = dict === "so" ? "SO" : "SAOL";
        return { definition: def, source: `${label} (svenska.se, närmaste ord)` };
      }
    }
  }
  return { definition: null, source: null };
}

/**
 * Stämmer en gissad definition med uppgiftens eget facit?
 *
 * `lookupSuggest` och `lookupFuzzy` slår upp ett ANNAT uppslagsord än det som
 * efterfrågades — en stavningsrättelse eller närmaste grannen på
 * redigeringsavstånd. Ofta rätt ("obsetrik" → obstetrik), men lika ofta ett
 * helt annat ord: "blam" → blad, "keratit" → keratin, "hema-" → hemi-,
 * "töra" → tora, "fysikus" → fysikum. Avståndet är 1 i samtliga fall, så
 * avståndet kan inte skilja dem åt.
 *
 * Det som kan skilja dem åt är att ORD-uppgifter ÄR synonymuppgifter: facit
 * ger ett ord med samma betydelse. Delar den gissade definitionen inget med
 * facit är den med stor sannolikhet fel ord, och då är det bättre att falla
 * vidare i kedjan – sista anhalten är facit självt, som är rätt per
 * definition. En tunn men riktig synonym slår en fyllig och felaktig artikel.
 *
 * Jämförelsen är medvetet generös (fyra tecken prefix, plus containment åt
 * båda håll) eftersom ett falskt larm bara kostar en fylligare formulering,
 * medan ett missat fel visar något osant för den som pluggar.
 */
// Funktionsord bär ingen betydelse och får inte räknas som träff. Utan den
// här listan godkändes "punktur" (facit "föra in med spruta") av att både
// facit och definitionen råkade innehålla "med".
const STOPWORDS = new Set(
  ("och att som med för den det ett den de dem sig man vid från till ur om av på" +
    " inte icke inom under över inför inte inga inte inte vara blir bli göra inte" +
    " inte eller men samt något någon några sådan sådant annan annat andra")
    .split(" "),
);

function corroboratedByAnswer(definition: string, word: string): boolean {
  const answer = answerKey.get(normalizeWord(word));
  if (!answer) return true; // inget facit att pröva mot – låt den passera
  const parts = parseOrdDefinition(definition);
  const haystack = [...parts.senses, ...parts.related].join(" ").toLowerCase();
  const hayWords = [...haystack.matchAll(/\p{L}{3,}/gu)]
    .map((m) => m[0])
    .filter((w) => !STOPWORDS.has(w));
  const needles = [...String(answer).toLowerCase().matchAll(/\p{L}{3,}/gu)]
    .map((m) => m[0])
    .filter((w) => !STOPWORDS.has(w));
  // Fem tecken, inte fyra: svenskans produktiva förled gör att "förlåta" och
  // "förlöpa" delar sina första fyra. Sammansättningar fångas ändå av
  // containment-ledet ("förstena" ⊃ "sten", "filmscen" ⊃ "film").
  for (const needle of needles) {
    if (hayWords.some((h) => h.slice(0, 5) === needle.slice(0, 5))) return true;
    if (hayWords.some((h) => h.length >= 4 && (h.includes(needle) || needle.includes(h)))) {
      return true;
    }
  }
  return false;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchJson(url: string, tries = 6): Promise<any | null> {
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": uaFor(url), Accept: "application/json" },
      });
      if (res.status === 404) return null; // finns inte – ingen mening att försöka igen
      if (res.status === 429 || res.status >= 500) {
        await sleep(1200 * (attempt + 1) + Math.random() * 600);
        continue;
      }
      if (!res.ok) return null;
      return await res.json();
    } catch {
      await sleep(800 * (attempt + 1) + Math.random() * 500);
    }
  }
  return null;
}

// Resolva ett ENSKILT ord (utan fras-logik) via ordböckerna.
async function resolveSingle(w: string): Promise<CacheVal> {
  const q = encodeURIComponent(w);
  const so = buildDefinition((await fetchJson(`${API}/so?q=${q}&exact_match=true&size=3`))?.hits?.hits ?? [], w);
  if (so) return { definition: so, source: "SO (svenska.se)" };
  const saol = buildDefinition((await fetchJson(`${API}/saol?q=${q}&exact_match=true&size=3`))?.hits?.hits ?? [], w);
  if (saol) return { definition: saol, source: "SAOL (svenska.se)" };
  const wikt = await lookupWiktionary(w);
  if (wikt) return { definition: wikt, source: "Wiktionary" };
  return { definition: null, source: null };
}

// Fras utan egen ordboksträff → förklara via frasens huvudord (t.ex. "alludera på" → "alludera").
const FUNCTION_WORDS = new Set(
  "i på av med till för en ett att sig den det de som och eller ur ut om upp åt över under från vid mot ngn ngt någon något inte".split(" "),
);
async function lookupPhraseHead(phrase: string): Promise<CacheVal> {
  const content = phrase
    .split(" ")
    .filter((t) => t && !FUNCTION_WORDS.has(t))
    .sort((a, b) => b.length - a.length); // längsta (mest betydelsebärande) först
  for (const w of content) {
    const r = await resolveSingle(w);
    if (r.definition) {
      return { definition: r.definition, source: `${r.source} – om "${w}"` };
    }
  }
  return { definition: null, source: null };
}

/**
 * Är ordet en ordboksartikel för ett förled/efterled, inte ett vanligt ord?
 *
 * Bindestreck räcker inte som kännetecken. "papier-maché", "spin-off",
 * "laissez-faire" och "aha-upplevelse" är hela uppslagsord som SO kan svara
 * på, men de plockades isär i sina delar och förklarades ledvis: papier-maché
 * blev "en sorts formpressad pappersmassa" i stället för SO:s hela artikel.
 * Ett riktigt förled/efterled har strecket i kanten ("de-", "-graf") eller
 * listar sina former med komma eller snedstreck ("graf,gram").
 */
const isAffixEntry = (word: string) => /^-|-$/.test(word.trim()) || /[,/]/.test(word);

// Förled/efterled & kombinationsformer ("hema-", "graf,gram", "sym-,sym-").
async function lookupAffix(word: string): Promise<CacheVal> {
  if (!isAffixEntry(word)) return { definition: null, source: null };
  const parts = [
    ...new Set(
      word
        .split(/[,/]/)
        .map((p) => p.trim())
        .filter(Boolean),
    ),
  ];
  const out: string[] = [];
  for (const p of parts) {
    // Rå gloss från Wiktionary ska poleras; det resolveSingle() ger tillbaka
    // är redan en färdig definition med sina sektionsrader, och polishSentence
    // kollapsar allt blanktecken – då hamnar "Exempel:" och "Ordklass:" mitt
    // inne i meningen. Håll isär de två.
    const gloss = await fetchWiktGloss(p); // affixformen som den är, t.ex. "hema-"
    let text = gloss ? polishSentence(gloss) : null;
    if (!text) {
      const base = p.replace(/-/g, "").trim();
      const resolved = base && base !== p ? (await resolveSingle(base)).definition : null;
      // Ett enda led får behålla hela formen; en lista med flera led radas
      // upp på en rad och då är bara betydelserna läsbara.
      if (resolved) {
        text = parts.length > 1 ? parseOrdDefinition(resolved).senses.join(" ") : resolved;
      }
    }
    if (text) out.push(parts.length > 1 ? `${p}: ${text}` : text);
  }
  if (out.length === 0) return { definition: null, source: null };
  return { definition: out.join("  "), source: "Wiktionary (förled/efterled)" };
}

async function lookup(word: string): Promise<CacheVal> {
  const q = encodeURIComponent(word);
  const isPhrase = word.includes(" ");

  // 1. SO (Svensk ordbok) – bäst pedagogiska definitioner.
  const soDef = buildDefinition((await fetchJson(`${API}/so?q=${q}&exact_match=true&size=3`))?.hits?.hits ?? [], word);
  if (soDef) return { definition: soDef, source: "SO (svenska.se)" };

  // 2. SAOL – när det finns en definition.
  const saolDef = buildDefinition((await fetchJson(`${API}/saol?q=${q}&exact_match=true&size=3`))?.hits?.hits ?? [], word);
  if (saolDef) return { definition: saolDef, source: "SAOL (svenska.se)" };

  // 2b. Förled/efterled & kombinationsformer (streck i kanten, eller lista).
  //
  // Efter ordböckerna, inte före. SO har egna artiklar för många förled och
  // de är utförligare än Wiktionarys: "de-" blev "Miss, av, ner, från" när
  // affix-vägen kördes först, mot SO:s "med avskiljande eller avslutande
  // verkan i förhållande till den aktuella processen". Affix-vägen behövs
  // fortfarande för det ordböckerna inte har ("hema-", "graf,gram").
  if (isAffixEntry(word) && !isPhrase) {
    const affix = await lookupAffix(word);
    if (affix.definition) return affix;
  }

  // 3. Idiom/uttryck → SO:s idiomdata under huvudordet.
  if (isPhrase) {
    const idi = await lookupSOIdiom(word);
    if (idi) return { definition: idi, source: "SO idiom (svenska.se)" };
  }

  // 4. Svenska Wiktionary (följer varianter/böjningsformer till grundordet).
  const wikt = await lookupWiktionary(word);
  if (wikt) return { definition: wikt, source: "Wiktionary" };

  // 5. Svenska Wikipedia (facktermer, latinska uttryck, namngivna begrepp).
  const wiki = await lookupWikipedia(word);
  if (wiki) return { definition: wiki, source: "Wikipedia" };

  // 6. svenska.se:s stavningsrättelse + närmaste uppslagsord (felstavningar/varianter).
  //    Båda gissar ett annat uppslagsord och måste stämmas mot facit först.
  if (!isPhrase) {
    const sug = await lookupSuggest(word);
    if (sug.definition && corroboratedByAnswer(sug.definition, word)) return sug;
    const fuzzy = await lookupFuzzy(word);
    if (fuzzy.definition && corroboratedByAnswer(fuzzy.definition, word)) return fuzzy;
    // 7. SAOB (Svenska Akademiens ordbok) – ålderdomliga/ovanliga ord.
    const saob = await lookupSAOB(word);
    if (saob) return { definition: saob, source: "SAOB (svenska.se)" };
  }

  // 8. Fras utan egen träff → förklara via frasens huvudord. Också en gissning
  //    på ett annat uppslagsord, och den slår fel på just de uttryck som inte
  //    betyder summan av sina delar: "vinna gehör" fick "utgå som segrare i
  //    tävling", "linda in orden" fick tygremsan man lindade spädbarn med.
  if (isPhrase) {
    const head = await lookupPhraseHead(word);
    if (head.definition && corroboratedByAnswer(head.definition, word)) return head;
  }

  // 9. Engelska Wiktionary – engelsk förklaring av ordet. Samma korroborering
  //    som gissningarna ovan: engelskan har egna homografer, och "blam" fick
  //    "a sudden, explosive sound" när facit säger skam, "filera" fick "row,
  //    line" när facit säger hålla ut tonen. En engelsk text som dessutom är
  //    fel hjälper ingen som pluggar svenska ord.
  const en = await lookupEnWiktionary(word);
  if (en && corroboratedByAnswer(en, word)) {
    return { definition: en, source: "Wiktionary (engelska)" };
  }

  // 10. Garanterad fallback: ORD-frågans eget rätta svar (synonym ur HP-facit).
  const ans = answerKey.get(word);
  if (ans) return { definition: polishSentence(ans), source: "HP-facit (rätt svar)" };

  return { definition: null, source: null };
}

// Läs alla ORD-ord via anon-nyckeln + bygg HP-facit-synonymkarta (answerKey).
async function loadWords(): Promise<string[]> {
  const supabase = createClient(SUPABASE_URL!, READ_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  // Anon-nyckeln måste logga in för att komma förbi RLS; service-nyckeln
  // går förbi den ändå och ska inte logga in som någon.
  if (!SERVICE_KEY) {
    const { error: authErr } = await supabase.auth.signInAnonymously();
    if (authErr) throw authErr;
    console.warn(
      "[bygg] ingen SUPABASE_SERVICE_ROLE_KEY – facit (correct_answer) kan inte läsas, så" +
        ' reservkällan "HP-facit (rätt svar)" är avstängd för den här körningen.',
    );
  }
  // correct_answer är revokerad för anon sedan facit-migrationen; be inte om
  // kolumnen då, för PostgREST svarar 401 på hela anropet.
  const COLUMNS = SERVICE_KEY ? "question_text, options, correct_answer" : "question_text, options";

  const fill = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rows: any[],
  ) => {
    for (const r of rows) {
      const w = normalizeWord(r.question_text as string);
      if (!w) continue;
      const ans = correctOptionText(r.options, r.correct_answer);
      if (ans) answerKey.set(w, ans);
    }
  };

  if (ONLY_WORD) {
    const { data } = await supabase
      .from("questions")
      .select(COLUMNS)
      .eq("category", "ORD")
      .ilike("question_text", ONLY_WORD);
    fill(data ?? []);
    return [normalizeWord(ONLY_WORD)];
  }

  const set = new Set<string>();
  let from = 0;
  const PAGE = 1000;
  for (;;) {
    const { data, error } = await supabase
      .from("questions")
      .select(COLUMNS)
      .eq("category", "ORD")
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    const rows = data ?? [];
    fill(rows);
    for (const r of rows) {
      const w = normalizeWord(r.question_text as string);
      if (w) set.add(w);
    }
    if (rows.length < PAGE) break;
    from += PAGE;
  }
  return [...set];
}

function writeArtifact(words: string[]) {
  const definitions: Record<string, CacheVal> = {};
  let found = 0;
  const misses: string[] = [];
  for (const w of words) {
    const v = cache[w];
    if (v && v.definition) {
      definitions[w] = v;
      found++;
    } else {
      misses.push(w);
    }
  }
  const artifact = {
    generatedAt: new Date().toISOString(),
    source: "svenska.se (SO primärt, SAOL fallback)",
    totalWords: words.length,
    found,
    missed: misses.length,
    definitions,
  };
  writeFileSync(OUT_FILE, JSON.stringify(artifact, null, 2));
  writeFileSync(MISS_FILE, misses.join("\n"));
  return { found, missed: misses.length };
}

async function main() {
  console.log(`[bygg] startar  concurrency=${CONCURRENCY}${ONLY_WORD ? ` word=${ONLY_WORD}` : ""}`);
  let words = await loadWords();
  console.log(`[bygg] ${words.length} unika ord`);
  if (words.length > LIMIT) words = words.slice(0, LIMIT);

  const total = words.length;
  let done = 0;
  let found = 0;
  let missed = 0;
  let cursor = 0;

  async function worker() {
    for (;;) {
      const idx = cursor++;
      if (idx >= words.length) return;
      const word = words[idx];
      const cached = cache[word];
      const stale =
        cached &&
        ((RETRY_MISSES && cached.definition === null) ||
          (REFRESH_FALLBACKS && !isPrimarySource(cached.source)));
      let v: CacheVal;
      if (cached && !stale) {
        v = cached;
      } else {
        v = await lookup(word);
        cache[word] = v;
        if (++dirty >= 25) flushCache();
        await sleep(80 + Math.random() * 140);
      }
      if (v.definition) found++;
      else missed++;
      done++;
      if (done % 50 === 0 || done === total) {
        console.log(
          `[bygg] ${done}/${total}  hittade=${found} missade=${missed}  (senast: "${word}" ${v.definition ? "✓" : "—"})`,
        );
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  flushCache();

  if (ONLY_WORD) {
    console.log("\n" + JSON.stringify(cache[words[0]], null, 2));
    return;
  }
  const stats = writeArtifact(words);
  console.log(
    `\n[bygg] KLART → scripts/ord-definitions.json` +
      `\n        ord=${total} hittade=${stats.found} missade=${stats.missed}` +
      `\n        missar i scripts/.ord-defs/misses.txt`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
