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
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { slugifyTitle } from "../src/lib/forum";
import { SEED_THREADS } from "./forum-seed/trader";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const APPLY = process.argv.includes("--apply");
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

const existing = await rest<Array<{ category_id: number; title: string; slug: string }>>(
  "forum_threads?select=category_id,title,slug",
);
const takenTitle = new Set(existing.map((t) => `${t.category_id}:${t.title.toLowerCase()}`));
const takenSlug = new Set(existing.map((t) => `${t.category_id}:${t.slug}`));

let created = 0;
for (const t of SEED_THREADS) {
  const cid = catId.get(t.category);
  if (!cid) throw new Error(`Okänd kategori ${t.category}`);
  if (t.title.length < 5 || t.title.length > 140) throw new Error(`Rubriklängd: ${t.title}`);
  if (takenTitle.has(`${cid}:${t.title.toLowerCase()}`)) {
    console.log(`  finns   ${t.category}/${t.title}`);
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
    body: JSON.stringify({ category_id: cid, author_id: author.id, title: t.title, slug }),
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
  `\n${created} nya trådar${APPLY ? "" : " (torrkörning, kör med --apply för att skriva)"}`,
);
