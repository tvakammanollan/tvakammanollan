/**
 * Publicerar forumets starttrådar (`forum-seed/trader.ts`) från grundarens
 * konto. Varje tråd får två inlägg: frågan och svaret. Svaret är ett eget
 * inlägg så att tråden har ett svar (forumsitemapen tar bara med trådar med
 * svar) och så att andra kan svara bredvid det.
 *
 * Idempotent på rubrik per kategori: en tråd som redan finns rörs inte.
 * Skriver direkt i tabellerna med service role, förbi `forum_create_thread`:
 * RPC:n kräver en inloggad användare och kvoterna (5 trådar/h) är byggda för
 * spam, inte för sajtens egen startpublicering. Triggrarna sköter
 * svarsräknaren, söktexten och inläggsräknaren som vanligt.
 *
 * Kräver SUPABASE_SERVICE_ROLE_KEY i .env.local. Pekar på produktion.
 *
 *   bun run scripts/seed-forum.ts            # torrkörning
 *   bun run scripts/seed-forum.ts --apply
 *   bun run scripts/seed-forum.ts --dump     # trådarna som JSON, ingen databas
 *   bun run scripts/seed-forum.ts --apply --limit 50   # högst 50 nya trådar
 *
 * --limit finns för att publicera i takt. Flera hundra trådar från samma konto
 * på en och samma dag ser ut som massproducerat innehåll för en sökmotor, även
 * när varje tråd är unik. Kör med --limit 50 i veckan; skriptet är idempotent
 * och tar nästa omgång vid nästa körning.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { slugifyTitle } from "../src/lib/forum";
import { SEED_THREADS, type SeedThread } from "./forum-seed/trader";
import { GENOMGANGAR } from "./forum-seed/genomgangar";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const APPLY = process.argv.includes("--apply");
const LIMIT_ARG = process.argv.indexOf("--limit");
const LIMIT = LIMIT_ARG > -1 ? Number(process.argv[LIMIT_ARG + 1]) : Infinity;
if (Number.isNaN(LIMIT) || LIMIT < 1) throw new Error("--limit kräver ett positivt tal");
const AUTHOR_USERNAME = "niklas";

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

type ProvQuestion = {
  nr: number;
  delprov: string;
  text?: string;
  alternatives?: string[];
  answer: string;
  image?: string;
};
type ProvPass = { label: string; kind: string; questions: ProvQuestion[] };

const VERBAL = new Set(["ORD", "LAS", "LÄS", "MEK", "ELF"]);
const LETTERS = "ABCDE";

/** Uppgiftstexten med (1), (2) och NOG:s slutfras på egna rader. */
function quoteLines(text: string): string {
  return text
    .replace(/ \((1|2)\) /g, "\n($1) ")
    .replace(/ Tillräcklig information/g, "\nTillräcklig information")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => `> ${l}`)
    .join("\n");
}

/**
 * En genomgång blir en tråd: frågan är uppgiften citerad ur arkivet, svaret
 * är lösningen. Stämmer lösningens bokstav inte med facit publiceras ingenting.
 */
function genomgangThread(g: (typeof GENOMGANGAR)[number]): SeedThread {
  const pass = JSON.parse(
    readFileSync(join(ROOT, "src/data/prov", `${g.term}-${g.pass}.json`), "utf8"),
  ) as ProvPass;
  const q = pass.questions.find((x) => x.nr === g.nr);
  if (!q) throw new Error(`${g.term}-${g.pass} saknar uppgift ${g.nr}`);
  if (q.image || !q.text) throw new Error(`${g.term}-${g.pass}/${g.nr} är en bilduppgift`);
  if (q.answer !== g.svar) {
    throw new Error(`${g.term}-${g.pass}/${g.nr}: lösningen säger ${g.svar}, facit ${q.answer}`);
  }
  const delprov = q.delprov === "LAS" ? "LÄS" : q.delprov;
  const passLink = `https://tvakommanollan.se/gamla-prov/${g.term}/${g.pass}`;
  const alts = (q.alternatives ?? []).map((a, i) => `- **${LETTERS[i]}** ${a}`).join("\n");
  const question = [
    `Uppgift ${g.nr} i provpass ${g.pass} på ${pass.label.toLowerCase()}, delprov ${delprov}. Hela passet finns i [gamla prov](${passLink}).`,
    quoteLines(q.text),
    alts ? `Svarsalternativ:\n${alts}` : "",
    "Lösningen ligger nedanför. Skriv gärna om du löste den på ett annat sätt.",
  ]
    .filter(Boolean)
    .join("\n\n");
  return {
    category: VERBAL.has(q.delprov) ? "verbal" : "kvantitativ",
    title: `${pass.label}, provpass ${g.pass}, uppgift ${g.nr} (${delprov}): lösning`,
    question,
    answer: g.losning,
    provTerm: g.term,
  };
}

const ALL_THREADS: SeedThread[] = [...SEED_THREADS, ...GENOMGANGAR.map(genomgangThread)];

// --dump skriver ut trådarna som JSON utan att röra databasen, för kontroll
// av texterna (parser, KaTeX) innan något publiceras.
if (process.argv.includes("--dump")) {
  console.log(JSON.stringify(ALL_THREADS));
  process.exit(0);
}

const URL_BASE = env("SUPABASE_URL");
const KEY = env("SUPABASE_SERVICE_ROLE_KEY");

async function rest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${URL_BASE}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok)
    throw new Error(`${init.method ?? "GET"} ${path}: ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}

const [author] = await rest<Array<{ id: string; is_admin: boolean }>>(
  `users?select=id,is_admin&username=eq.${AUTHOR_USERNAME}`,
);
if (!author?.is_admin) throw new Error(`Kontot ${AUTHOR_USERNAME} saknas eller är inte admin`);

const cats = await rest<Array<{ id: number; slug: string }>>("forum_categories?select=id,slug");
const catId = new Map(cats.map((c) => [c.slug, c.id]));

const existing = await rest<
  Array<{ id: number; category_id: number; title: string; slug: string; prov_term: string | null }>
>("forum_threads?select=id,category_id,title,slug,prov_term");
const byTitle = new Map(existing.map((t) => [`${t.category_id}:${t.title.toLowerCase()}`, t]));
const takenSlug = new Set(existing.map((t) => `${t.category_id}:${t.slug}`));

let created = 0;
let waiting = 0;
for (const t of ALL_THREADS) {
  const cid = catId.get(t.category);
  if (!cid) throw new Error(`Okänd kategori ${t.category}`);
  if (t.title.length < 5 || t.title.length > 140) throw new Error(`Rubriklängd: ${t.title}`);
  const found = byTitle.get(`${cid}:${t.title.toLowerCase()}`);
  if (found) {
    // Trådar från före kopplingen till gamla prov får terminen i efterhand.
    if (t.provTerm && found.prov_term !== t.provTerm) {
      if (APPLY) {
        await rest(`forum_threads?id=eq.${found.id}`, {
          method: "PATCH",
          body: JSON.stringify({ prov_term: t.provTerm }),
        });
      }
      console.log(`  termin  ${t.category}/${found.id} → ${t.provTerm}`);
    } else {
      console.log(`  finns   ${t.category}/${t.title}`);
    }
    continue;
  }
  if (created >= LIMIT) {
    waiting++;
    continue;
  }
  let slug = slugifyTitle(t.title);
  for (let n = 2; takenSlug.has(`${cid}:${slug}`); n++) slug = `${slugifyTitle(t.title)}-${n}`;
  takenSlug.add(`${cid}:${slug}`);

  if (!APPLY) {
    console.log(`  ny      ${t.category}/${slug}`);
    created++;
    continue;
  }
  const [thread] = await rest<Array<{ id: number }>>("forum_threads", {
    method: "POST",
    body: JSON.stringify({
      category_id: cid,
      author_id: author.id,
      title: t.title,
      slug,
      prov_term: t.provTerm ?? null,
    }),
  });
  const now = Date.now();
  await rest("forum_posts", {
    method: "POST",
    body: JSON.stringify([
      {
        thread_id: thread.id,
        author_id: author.id,
        body: t.question,
        created_at: new Date(now).toISOString(),
      },
      {
        thread_id: thread.id,
        author_id: author.id,
        body: t.answer,
        created_at: new Date(now + 1000).toISOString(),
      },
    ]),
  });
  console.log(`  skapad  /forum/${t.category}/${thread.id}-${slug}`);
  created++;
}

console.log(
  `\n${created} nya trådar${APPLY ? "" : " (torrkörning, kör med --apply för att skriva)"}` +
    (waiting ? `, ${waiting} väntar till nästa körning (--limit)` : ""),
);
