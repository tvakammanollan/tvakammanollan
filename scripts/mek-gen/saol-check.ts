/**
 * Finns varje ord i alternativen i SAOL? (REGELVERK.md, C4.3)
 *
 *   bun run scripts/mek-gen/saol-check.ts scripts/mek-gen/pilot/batch-01.json
 *
 * Varje ord i varje alternativ slås upp i svenska.se:s SAOL-sökning, som
 * förstår böjda former (`grasserade` ger `grassera`). Ett fast uttryck kollas
 * ord för ord: SAOL har inte `i kölvattnet av` som uppslag men har alla tre
 * orden, och felet vi letar efter är ett påhittat eller felstavat ord, inte en
 * ovanlig fras. Svaren cachas i `out/saol-cache.json`.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { sourceFile } from "./fetch-sources";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";
const CACHE = join(new URL(".", import.meta.url).pathname, "out", "saol-cache.json");
const cache: Record<string, boolean> = existsSync(CACHE)
  ? JSON.parse(readFileSync(CACHE, "utf8"))
  : {};

async function inSaol(word: string): Promise<boolean> {
  const w = word.toLowerCase();
  if (w in cache) return cache[w];
  for (const index of ["saol", "so"]) {
    const res = await fetch(
      `https://svenska.se/api/search/${index}?q=${encodeURIComponent(w)}&exact_match=true&size=1`,
      { headers: { "User-Agent": UA } },
    );
    if (!res.ok) continue;
    const data = (await res.json()) as { hits?: { total?: { value?: number } } };
    if ((data.hits?.total?.value ?? 0) > 0) {
      cache[w] = true;
      return true;
    }
  }
  cache[w] = false;
  return false;
}

const file = process.argv[2];
if (!file) {
  console.error("Ange en batch-NN.json.");
  process.exit(2);
}
const items = JSON.parse(readFileSync(file, "utf8")) as {
  id: string;
  alternatives: string[];
  source?: { title: string };
}[];

/**
 * Ett ord som står ordagrant i uppgiftens egen källa räknas som belagt.
 * Svenskan bildar sammansättningar fritt och SAOL tar inte upp alla:
 * `resonanssträngar` saknas där men är fackordet i artikeln om nyckelharpan.
 */
function inOwnSource(word: string, ids: string[]): boolean {
  return items
    .filter((it) => ids.includes(it.id) && it.source)
    .some((it) => {
      const f = sourceFile(it.source!.title);
      return existsSync(f) && readFileSync(f, "utf8").toLowerCase().includes(word.toLowerCase());
    });
}
const words = new Set<string>();
for (const it of items) {
  for (const alt of it.alternatives) {
    for (const w of alt.split(/[\s–]+/)) {
      const clean = w.replace(/[^\p{L}-]/gu, "");
      if (clean.length > 1 && !/^\p{Lu}{2,}/u.test(clean)) words.add(clean);
    }
  }
}
/**
 * En sammansättning vars båda led finns i SAOL (med eller utan fogmorfemet
 * -s-) godtas, men listas för granskning: kontrollen kan inte skilja ett
 * etablerat ord som `beskattningsunderlag` från ett påhitt som
 * `rättighetsgrundlagarna`, och ett påhittat fackord pekar ut sig självt som
 * fel svar.
 */
async function compoundParts(word: string): Promise<[string, string] | null> {
  const w = word.toLowerCase();
  for (let i = w.length - 3; i >= 3; i--) {
    const left = w.slice(0, i);
    const right = w.slice(i);
    if (!(await inSaol(right))) continue;
    if (await inSaol(left)) return [left, right];
    if (left.endsWith("s") && (await inSaol(left.slice(0, -1)))) return [left, right];
  }
  return null;
}

const misses: string[] = [];
const compounds: string[] = [];
for (const w of words) {
  // Bindestrecksord (EKG-undersökning) kollas på sista ledet.
  const probe = w.includes("-") ? w.split("-").pop()! : w;
  if (await inSaol(probe)) continue;
  const where = items.filter((it) => it.alternatives.some((a) => a.includes(w))).map((it) => it.id);
  if (inOwnSource(w, where)) continue;
  const parts = await compoundParts(probe);
  if (parts) compounds.push(`${w} (${parts.join(" + ")}; ${where.join(", ")})`);
  else misses.push(w);
  await new Promise((r) => setTimeout(r, 60));
}
writeFileSync(CACHE, JSON.stringify(cache));
console.log(`${words.size} ord, ${misses.length} saknas i SAOL/SO`);
if (compounds.length) {
  console.log(`${compounds.length} sammansättningar godtagna, granska att de är etablerade ord:`);
  for (const c of compounds) console.log(`  ${c}`);
}
for (const m of misses) {
  const where = items.filter((it) => it.alternatives.some((a) => a.includes(m))).map((it) => it.id);
  console.log(`  ${m}  (${where.join(", ")})`);
}
process.exit(misses.length ? 1 : 0);
