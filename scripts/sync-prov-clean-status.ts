/**
 * Synkar `questions`-tabellens XYZ/KVA/NOG-rader mot arkivets NUVARANDE
 * innehåll, UTAN att radera eller nyskapa rader.
 *
 * Bakgrund: `import-prov-questions.ts` gjorde en engångsimport 2026-08-19 och
 * dess "rensa allt, importera om"-steg raderar ALLA arkivrader innan det
 * infogar de nya — säkert bara första gången, eftersom `match_questions.
 * question_id` har `ON DELETE RESTRICT`. 288 matcher pekar redan på
 * arkivrader (2026-08-24), så en omkörning av det skriptet skulle stoppas av
 * databasen på steg 1. Det här skriptet uppdaterar i stället befintliga rader
 * på plats (matchade på exam_term+provpass_num+q_num), vilket aldrig rör
 * `id` och alltså aldrig kan bryta ett FK.
 *
 * Syftet just nu: gamla-prov-arkivet skrivs om provpass för provpass från
 * bildutsnitt till renskriven text (se CLAUDE.md, "Matten i `questions`").
 * Matteduellerna ska bara visa de renskrivna uppgifterna tills hela arkivet
 * är klart — `match.server.ts` filtrerar redan matte på `clean_status="ok"`,
 * så det räcker att sätta `clean_status="pending"` på de rader som
 * fortfarande är bildutsnitt. DTK rörs inte alls: den kategorin är och
 * förblir bilduppgifter med flit (diagrammet), och ingår inte i
 * textomskrivningen.
 *
 *   node scripts/sync-prov-clean-status.ts            # torrkörning
 *   node scripts/sync-prov-clean-status.ts --apply
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const DATA = join(ROOT, "src", "data", "prov");

const TEXT_CATEGORIES = new Set(["XYZ", "KVA", "NOG"]);
const LETTERS = ["A", "B", "C", "D", "E"];

type Crop = [number, number, number, number];

interface ProvQuestion {
  nr: number;
  delprov: string;
  text?: string;
  alternatives?: string[];
  image?: string;
  altCount?: number;
  crops?: Record<string, Crop>;
  figureMissing?: boolean;
  figure?: number;
  answer: string;
}

interface ProvPass {
  term: string;
  label: string;
  pass: number;
  questions: ProvQuestion[];
  figures?: Array<{ src: string }>;
  source: string;
}

interface Collected {
  key: string;
  term: string;
  pass: number;
  nr: number;
  category: string;
  question_text: string;
  options: Array<Record<string, unknown>>;
  correct_answer: string;
  image_url: string | null;
  targetStatus: "ok" | "pending";
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

/** Samma byggregel som import-prov-questions.ts — text om arkivet har den, annars beskärning. */
function buildOptions(q: ProvQuestion, imageUrl: string | null): Array<Record<string, unknown>> {
  if (q.alternatives?.length) {
    return q.alternatives.map((text, i) => ({ id: LETTERS[i], text }));
  }
  const n = Math.max(q.altCount ?? 4, LETTERS.indexOf(q.answer) + 1);
  const cropsApply = imageUrl !== null && imageUrl === q.image;
  return LETTERS.slice(0, n).map((id) => {
    const crop = cropsApply ? q.crops?.[id] : undefined;
    return crop ? { id, text: id, crop } : { id, text: id };
  });
}

function collect(): Collected[] {
  const out: Collected[] = [];
  for (const name of readdirSync(DATA).sort()) {
    if (!/^\d{4}(ht|vt)[ab]?-\d\.json$/.test(name)) continue;
    const pass = JSON.parse(readFileSync(join(DATA, name), "utf8")) as ProvPass;
    for (const q of pass.questions ?? []) {
      if (!TEXT_CATEGORIES.has(q.delprov)) continue;
      if (q.figureMissing) continue;
      if (!q.text && !q.image) continue;
      if (!q.answer) continue;
      const imageUrl =
        (q.figure !== undefined ? pass.figures?.[q.figure]?.src : undefined) ?? q.image ?? null;
      const isTextBased = !!q.alternatives?.length;
      out.push({
        key: `${pass.term}|${pass.pass}|${q.nr}`,
        term: pass.term,
        pass: pass.pass,
        nr: q.nr,
        category: q.delprov,
        question_text: q.text ?? `${q.delprov}-uppgift ${q.nr}, ${pass.label} provpass ${pass.pass}`,
        options: buildOptions(q, imageUrl),
        correct_answer: q.answer,
        image_url: isTextBased ? null : imageUrl,
        targetStatus: isTextBased ? "ok" : "pending",
      });
    }
  }
  return out;
}

/**
 * `questions` har ett unikt index på `lower(question_text)`. Två skilda
 * uppgifter kan råka dela exakt samma stam (t.ex. "Vilket svarsalternativ är
 * störst?" i flera provpass) — samma dedup-regel som import-prov-questions.ts
 * använder, så att texten blir identisk med vad en fullständig ominport
 * skulle ha gett.
 */
function dedupe(rows: Collected[]): void {
  const seen = new Set<string>();
  for (const r of rows) {
    const key = r.question_text.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      continue;
    }
    r.question_text = `${r.question_text} (${r.term}, provpass ${r.pass}, uppgift ${r.nr})`;
    seen.add(r.question_text.toLowerCase());
  }
}

interface DbRow {
  id: string;
  exam_term: string;
  provpass_num: number;
  q_num: number;
  clean_status: string;
  question_text: string;
  options: unknown;
  correct_answer: string;
  image_url: string | null;
}

async function fetchExisting(): Promise<Map<string, DbRow>> {
  const map = new Map<string, DbRow>();
  const fields =
    "id,exam_term,provpass_num,q_num,clean_status,question_text,options,correct_answer,image_url";
  for (let from = 0; ; from += 1000) {
    const res = await rest(
      `questions?select=${fields}&category=in.(XYZ,KVA,NOG)&exam_term=not.is.null&order=id`,
      { headers: { Range: `${from}-${from + 999}` } },
    );
    if (!res.ok) throw new Error(`fetch: ${res.status} ${await res.text()}`);
    const page = (await res.json()) as DbRow[];
    for (const r of page) map.set(`${r.exam_term}|${r.provpass_num}|${r.q_num}`, r);
    if (page.length < 1000) break;
  }
  return map;
}

function sameOptions(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function main() {
  const apply = process.argv.includes("--apply");
  const collected = collect();
  dedupe(collected);
  console.log(`Arkivet (XYZ/KVA/NOG): ${collected.length} uppgifter`);

  const existing = await fetchExisting();
  console.log(`Databasen (XYZ/KVA/NOG, exam_term satt): ${existing.size} rader`);

  const missing: string[] = [];
  const toOk: Collected[] = [];
  const toPending: Collected[] = [];
  const unchanged: Collected[] = [];

  for (const c of collected) {
    const row = existing.get(c.key);
    if (!row) {
      missing.push(c.key);
      continue;
    }
    const contentSame =
      row.question_text === c.question_text &&
      sameOptions(row.options, c.options) &&
      row.correct_answer === c.correct_answer &&
      row.image_url === c.image_url;
    const statusSame = row.clean_status === c.targetStatus;
    if (contentSame && statusSame) {
      unchanged.push(c);
    } else if (c.targetStatus === "ok") {
      toOk.push({ ...c, key: row.id }); // key now carries the DB id for the patch step
    } else {
      toPending.push({ ...c, key: row.id });
    }
  }

  console.log(`\nOförändrade: ${unchanged.length}`);
  console.log(`Ska bli clean_status="ok" (text finns): ${toOk.length}`);
  console.log(`Ska bli clean_status="pending" (fortfarande bild): ${toPending.length}`);
  if (missing.length) {
    console.log(`\nVARNING: ${missing.length} arkivuppgifter saknar motsvarande DB-rad:`);
    console.log(missing.slice(0, 10).join(", "), missing.length > 10 ? "…" : "");
  }

  if (!apply) {
    console.log("\nTORRKÖRNING — inget skrevs. Kör med --apply.");
    return;
  }

  if (missing.length > 50) {
    throw new Error(
      `${missing.length} saknade rader är för många för att fortsätta automatiskt — kontrollera manuellt.`,
    );
  }

  const CONCURRENCY = 12;
  const todo = [...toOk, ...toPending];
  let done = 0;
  let i = 0;
  async function patchOnce(c: Collected, text: string) {
    return rest(`questions?id=eq.${c.key}`, {
      method: "PATCH",
      body: JSON.stringify({
        question_text: text,
        options: c.options,
        correct_answer: c.correct_answer,
        image_url: c.image_url,
        clean_status: c.targetStatus,
      }),
      headers: { Prefer: "return=minimal" },
    });
  }
  async function worker() {
    while (i < todo.length) {
      const c = todo[i++];
      let res = await patchOnce(c, c.question_text);
      if (!res.ok && res.status === 409) {
        // Kolliderar med en rad utanför den här körningens dedup-universum
        // (t.ex. en DTK-rad). Samma disambiguering som dedupe() ger, fast
        // riktad — texten är fortfarande unik för just den här uppgiften.
        const disambiguated = `${c.question_text} (${c.term}, provpass ${c.pass}, uppgift ${c.nr})`;
        res = await patchOnce(c, disambiguated);
      }
      if (!res.ok) throw new Error(`PATCH ${c.key}: ${res.status} ${await res.text()}`);
      done++;
      if (done % 200 === 0 || done === todo.length) console.log(`  ${done}/${todo.length}`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  console.log(`\nKlart. ${toOk.length} uppgifter satta till "ok", ${toPending.length} till "pending".`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
