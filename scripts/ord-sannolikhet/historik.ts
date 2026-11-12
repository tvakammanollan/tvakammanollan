/**
 * Steg 1 i ordsannolikheten: provhistoriken per ord, och en ögonblicksbild av
 * ordbanken som resten av pipelinen räknar på utan databas.
 *
 *   bun run scripts/ord-sannolikhet/historik.ts
 *
 * Tre källor slås ihop till en lista över vilka ord som stått som uppslag i
 * ORD på vilket prov:
 *   - scraper/ord-old-questions.json   1997–2011 (40 ord per prov)
 *   - src/data/prov/<termin>-<pass>.json   2012–  (20 ord per prov)
 *   - questions-rader med source "spraakbanken-swesat:h11b…", som är den enda
 *     källan till hösten 2011 (19 av 20 ord)
 *
 * Skriver `historik.json` (prov per ord, som uppslag, rätt svar och
 * distraktor) och `bank.json` (alla ORD-uppslag i databasen). Läser bara.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ordSlug } from "../../src/lib/ord-slug";
import { parseOrdDefinition } from "../../src/lib/ord-definition";

const HERE = import.meta.dir;
const ROOT = join(HERE, "..", "..");

export type Forekomst = { u: string[]; r: string[]; d: string[] };
export type BankOrd = {
  slug: string;
  ord: string;
  /** "prov" = raden kom in i banken därför att ordet stod på ett prov. */
  kalla: "prov" | "lektion";
  sv: number | null;
  klass: string | null;
};

/** Provets plats på tidslinjen, i år. Vår ≈ april, höst ≈ oktober. */
export function termTid(term: string): number {
  const year = Number(term.slice(0, 4));
  if (term.includes("ht")) return year + 0.8;
  return year + (term.endsWith("b") ? 0.35 : 0.27);
}

type Uppgift = { term: string; ord: string; alternativ: string[]; ratt: number };

function gamlaProv(): Uppgift[] {
  const rows = JSON.parse(
    readFileSync(join(ROOT, "scraper/ord-old-questions.json"), "utf8"),
  ) as Array<{
    question_text: string;
    options: Array<{ id: string; text: string }>;
    correct_answer: string;
    tags: string[];
  }>;
  return rows.map((q) => ({
    term: q.tags[0],
    ord: q.question_text,
    alternativ: q.options.map((o) => o.text),
    ratt: q.options.findIndex((o) => o.id === q.correct_answer),
  }));
}

function arkivet(): Uppgift[] {
  const dir = join(ROOT, "src/data/prov");
  const ut: Uppgift[] = [];
  for (const f of readdirSync(dir)) {
    const m = f.match(/^(\d{4}(?:vt|ht)[ab]?)-\d\.json$/);
    if (!m) continue;
    const pass = JSON.parse(readFileSync(join(dir, f), "utf8")) as {
      questions?: Array<{
        delprov: string;
        text?: string;
        alternatives?: string[];
        answer?: string;
      }>;
    };
    for (const q of pass.questions ?? []) {
      if (q.delprov !== "ORD" || !q.text) continue;
      ut.push({
        term: m[1],
        ord: q.text,
        alternativ: q.alternatives ?? [],
        ratt: q.answer ? "ABCDE".indexOf(q.answer.trim()[0]) : -1,
      });
    }
  }
  return ut;
}

type Rad = {
  question_text: string;
  options: Array<{ id: string; text: string }>;
  correct_answer: string;
  source: string | null;
  difficulty: number | null;
  definition: string | null;
};

async function ordRader(): Promise<Rad[]> {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("SUPABASE_URL och SUPABASE_SERVICE_ROLE_KEY krävs (ligger i .env.local).");
    process.exit(1);
  }
  const supabase = createClient(url, key);
  const rows: Rad[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("questions")
      .select("question_text,options,correct_answer,source,difficulty,definition")
      .eq("category", "ORD")
      .order("id")
      .range(from, from + 999);
    if (error) throw error;
    rows.push(...(data as Rad[]));
    if (data.length < 1000) break;
  }
  return rows;
}

const rader = await ordRader();

const hosten2011: Uppgift[] = rader
  .filter((r) => r.source?.startsWith("spraakbanken-swesat:h11b"))
  .map((r) => ({
    term: "2011ht",
    ord: r.question_text,
    alternativ: r.options.map((o) => o.text),
    ratt: r.options.findIndex((o) => o.id === r.correct_answer),
  }));

const uppgifter = [...gamlaProv(), ...arkivet(), ...hosten2011];

const bank: BankOrd[] = rader
  .map((r) => ({
    slug: ordSlug(r.question_text),
    ord: r.question_text.toLowerCase(),
    kalla: (r.source ? "prov" : "lektion") as BankOrd["kalla"],
    sv: r.difficulty,
    klass: r.definition ? parseOrdDefinition(r.definition).wordClass || null : null,
  }))
  .sort((a, b) => a.slug.localeCompare(b.slug, "sv"));

// Bara slugar som är uppslag någonstans (i banken eller på ett prov) sparas
// som svar/distraktor. Resten är fraser som aldrig kan vara ett uppslag.
const uppslag = new Set([...bank.map((b) => b.slug), ...uppgifter.map((u) => ordSlug(u.ord))]);
const ord: Record<string, Forekomst> = {};
const post = (slug: string) => (ord[slug] ??= { u: [], r: [], d: [] });
const lagg = (lista: string[], term: string) => {
  if (!lista.includes(term)) lista.push(term);
};
for (const u of uppgifter) {
  lagg(post(ordSlug(u.ord)).u, u.term);
  u.alternativ.forEach((alt, i) => {
    const slug = ordSlug(alt);
    if (!uppslag.has(slug)) return;
    lagg(i === u.ratt ? post(slug).r : post(slug).d, u.term);
  });
}
for (const f of Object.values(ord)) {
  for (const lista of [f.u, f.r, f.d]) lista.sort((a, b) => termTid(a) - termTid(b));
}

const perTerm: Record<string, number> = {};
for (const u of uppgifter) perTerm[u.term] = (perTerm[u.term] ?? 0) + 1;
const prov = Object.keys(perTerm)
  .sort((a, b) => termTid(a) - termTid(b))
  .map((term) => ({ term, antal: perTerm[term] }));

const sorterad = Object.fromEntries(
  Object.entries(ord).sort(([a], [b]) => a.localeCompare(b, "sv")),
);
writeFileSync(join(HERE, "historik.json"), JSON.stringify({ prov, ord: sorterad }) + "\n");
writeFileSync(join(HERE, "bank.json"), JSON.stringify(bank) + "\n");

const tvaGanger = Object.values(ord).filter((f) => f.u.length > 1).length;
console.log(
  `${prov.length} prov, ${uppgifter.length} uppgifter, ${Object.values(ord).filter((f) => f.u.length).length} olika uppslag, ` +
    `${tvaGanger} testade två gånger. Banken: ${bank.length} ord.`,
);
