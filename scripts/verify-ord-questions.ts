/**
 * verify-ord-questions.ts
 * ─────────────────────────────────────────────────────────────────
 * Auditerar alla ORD-frågor mot Claude för att hitta felaktiga
 * `correct_answer`-värden. Skapad efter att en 30-fråga-sample
 * visade ~40 % felfrekvens (jämfört med påstådda 3 %).
 *
 * Tre lägen:
 *   sample    – verifiera 30 slumpvis valda frågor inline (snabbt,
 *               för att kalibrera prompten innan en stor körning)
 *   submit    – skickar HELA ORD-databasen som en batch-request
 *               till Anthropics Message Batches API (50 % rabatt,
 *               går asynkront, 24 h SLA). Sparar batch-id lokalt.
 *   fetch     – hämtar resultaten från senaste batch när den är klar
 *               och skriver dem till verify-results.json
 *   report    – tar verify-results.json och bygger en
 *               markdown-rapport med ALLA flaggade frågor + förslag
 *               på rätt svar. INGEN deletion görs här.
 *
 * Användning:
 *   export SUPABASE_SERVICE_ROLE_KEY=...        (krävs för submit/fetch)
 *   export ANTHROPIC_API_KEY=sk-ant-...         (krävs för sample/submit/fetch)
 *   bun run scripts/verify-ord-questions.ts sample
 *   bun run scripts/verify-ord-questions.ts submit
 *   bun run scripts/verify-ord-questions.ts fetch
 *   bun run scripts/verify-ord-questions.ts report
 *
 * Skriver INGENTING till databasen. För att applicera korrigeringar
 * efter granskning, använd scripts/apply-ord-fixes.ts.
 * ─────────────────────────────────────────────────────────────────
 */
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const MODEL = "claude-sonnet-4-7";
const SCRIPT_DIR = new URL(".", import.meta.url).pathname;
const STATE_DIR = join(SCRIPT_DIR, "..", ".ord-audit");
const BATCH_ID_FILE = join(STATE_DIR, "batch-id.txt");
const QUESTIONS_FILE = join(STATE_DIR, "questions.json");
const RESULTS_FILE = join(STATE_DIR, "verify-results.json");
const REPORT_FILE = join(STATE_DIR, "report.md");

type Option = { id: string; text: string };
type OrdQuestion = {
  id: string;
  question_text: string;
  options: Option[];
  correct_answer: string;
};

type Verdict = {
  qId: string;
  word: string;
  marked: string;
  best: string;
  match: boolean;
  confidence: "high" | "medium" | "low";
  reasoning: string;
};

/* ─────────── prompt — exact, no fluff ─────────── */
function buildPrompt(q: OrdQuestion): string {
  const opts = q.options.map((o) => `${o.id}: ${o.text}`).join("\n");
  return `Du är en svensk språkexpert som kvalitetskontrollerar HP-prov i delprovet ORD (ordkunskap).

Granska ord och alternativ nedan. Avgör vilket av alternativen A–E som är **den bästa synonymen eller mest precisa definitionen** av huvudordet, baserat på primärbetydelsen i moderna svenska ordböcker (SAOL/SAOB).

Huvudord: ${q.question_text}

Alternativ:
${opts}

Markerat som rätt: ${q.correct_answer}

Svara med ENBART en JSON-rad (ingen markdown, ingen kommentar):
{"best":"X","confidence":"high|medium|low","reasoning":"max 12 ord på svenska"}

Där X är bokstaven A–E som är det korrekta svaret.
- "high" = du är säker, det finns ett tydligt rätt svar
- "medium" = troligt men det finns flera plausibla
- "low" = ordet kan tolkas på flera sätt eller alternativen är otydliga`;
}

/* ─────────── Supabase fetch ─────────── */
async function fetchAllOrdQuestions(): Promise<OrdQuestion[]> {
  const url = process.env.SUPABASE_URL ?? "https://dqhgnioniarhiugxdgla.supabase.co";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY saknas i miljön — sätt den innan du kör submit/fetch.",
    );
  }
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const all: OrdQuestion[] = [];
  const pageSize = 1000;
  let from = 0;
  // RLS bypassas av service-role; paginera så vi får alla.
  while (true) {
    const { data, error } = await sb
      .from("questions")
      .select("id, question_text, options, correct_answer")
      .eq("category", "ORD")
      .order("id")
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as OrdQuestion[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

/* ─────────── parse Claude response ─────────── */
function parseVerdict(text: string): { best: string; confidence: string; reasoning: string } | null {
  const m = text.match(/\{[^}]*\}/);
  if (!m) return null;
  try {
    const parsed = JSON.parse(m[0]);
    if (typeof parsed.best !== "string") return null;
    return {
      best: parsed.best.toUpperCase().trim()[0] ?? "?",
      confidence: parsed.confidence ?? "medium",
      reasoning: parsed.reasoning ?? "",
    };
  } catch {
    return null;
  }
}

/* ─────────── MODE: sample — verifierar 30 slumpfrågor live ─────────── */
async function runSample() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY saknas.");
  const claude = new Anthropic({ apiKey });

  let questions: OrdQuestion[];
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log("→ hämtar ORD-frågor från Supabase…");
    questions = await fetchAllOrdQuestions();
  } else {
    console.log("→ läser från scraper/hp-questions.json (DB-key saknas)…");
    const raw = JSON.parse(
      readFileSync(join(SCRIPT_DIR, "..", "scraper", "hp-questions.json"), "utf8"),
    );
    questions = raw
      .filter((q: { category: string }) => q.category === "ORD")
      .map((q: { id?: string; question_text: string; options: Option[]; correct_answer: string }, i: number) => ({
        id: q.id ?? `local-${i}`,
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
      }));
  }

  // 30 deterministiska samplade (samma seed varje gång för reprod.)
  const rng = mulberry32(42);
  const shuffled = [...questions].sort(() => rng() - 0.5);
  const sample = shuffled.slice(0, 30);

  console.log(`→ verifierar ${sample.length} frågor med ${MODEL}…\n`);
  const verdicts: Verdict[] = [];
  for (const q of sample) {
    const res = await claude.messages.create({
      model: MODEL,
      max_tokens: 200,
      messages: [{ role: "user", content: buildPrompt(q) }],
    });
    const text = res.content
      .filter((c) => c.type === "text")
      .map((c) => (c as { type: "text"; text: string }).text)
      .join("");
    const parsed = parseVerdict(text);
    if (!parsed) {
      console.warn(`  ⚠ kunde inte parsa svar för "${q.question_text}": ${text}`);
      continue;
    }
    const v: Verdict = {
      qId: q.id,
      word: q.question_text,
      marked: q.correct_answer,
      best: parsed.best,
      match: parsed.best === q.correct_answer,
      confidence: parsed.confidence as Verdict["confidence"],
      reasoning: parsed.reasoning,
    };
    verdicts.push(v);
    const mark = v.match ? "✅" : "❌";
    console.log(
      `${mark} ${v.word.padEnd(24)} markerat=${v.marked}  rätt=${v.best}  [${v.confidence}]  ${v.reasoning}`,
    );
  }
  const wrong = verdicts.filter((v) => !v.match).length;
  const pct = ((wrong / verdicts.length) * 100).toFixed(1);
  console.log(`\n→ Sammanfattning: ${wrong}/${verdicts.length} fel (${pct} %)`);
}

/* ─────────── MODE: submit — bygger batch och skickar ─────────── */
async function runSubmit() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY saknas.");
  const claude = new Anthropic({ apiKey });

  console.log("→ hämtar ALLA ORD-frågor från Supabase…");
  const questions = await fetchAllOrdQuestions();
  console.log(`   hittade ${questions.length} frågor.`);

  ensureDir(STATE_DIR);
  writeFileSync(QUESTIONS_FILE, JSON.stringify(questions, null, 2));

  console.log("→ bygger batch-requests…");
  const requests = questions.map((q) => ({
    custom_id: q.id,
    params: {
      model: MODEL,
      max_tokens: 200,
      messages: [{ role: "user" as const, content: buildPrompt(q) }],
    },
  }));

  console.log(`→ skickar batch med ${requests.length} requests till Anthropic…`);
  const batch = await claude.messages.batches.create({ requests });
  console.log(`   batch_id: ${batch.id}`);
  console.log(`   status: ${batch.processing_status}`);
  console.log(`   uppskattning: klar inom 24 h, men oftast 1–4 h.`);
  writeFileSync(BATCH_ID_FILE, batch.id);
  console.log(`\n→ Kör \`bun run scripts/verify-ord-questions.ts fetch\` när batchen är klar.`);
}

/* ─────────── MODE: fetch — hämtar resultat ─────────── */
async function runFetch() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY saknas.");
  const claude = new Anthropic({ apiKey });

  if (!existsSync(BATCH_ID_FILE)) {
    throw new Error("Ingen batch-id sparad. Kör submit först.");
  }
  const batchId = readFileSync(BATCH_ID_FILE, "utf8").trim();
  console.log(`→ kollar status på batch ${batchId}…`);

  const status = await claude.messages.batches.retrieve(batchId);
  console.log(`   status: ${status.processing_status}`);
  console.log(`   request_counts:`, status.request_counts);

  if (status.processing_status !== "ended") {
    console.log("\n→ Batchen är inte klar än. Vänta och kör fetch igen.");
    return;
  }

  if (!existsSync(QUESTIONS_FILE)) {
    throw new Error("questions.json saknas — kör submit först.");
  }
  const questions: OrdQuestion[] = JSON.parse(readFileSync(QUESTIONS_FILE, "utf8"));
  const qMap = new Map(questions.map((q) => [q.id, q]));

  console.log("→ hämtar batch-resultat…");
  const verdicts: Verdict[] = [];
  for await (const result of await claude.messages.batches.results(batchId)) {
    if (result.result.type !== "succeeded") {
      console.warn(`  ⚠ ${result.custom_id} failed:`, result.result.type);
      continue;
    }
    const q = qMap.get(result.custom_id);
    if (!q) continue;
    const text = result.result.message.content
      .filter((c) => c.type === "text")
      .map((c) => (c as { type: "text"; text: string }).text)
      .join("");
    const parsed = parseVerdict(text);
    if (!parsed) continue;
    verdicts.push({
      qId: q.id,
      word: q.question_text,
      marked: q.correct_answer,
      best: parsed.best,
      match: parsed.best === q.correct_answer,
      confidence: parsed.confidence as Verdict["confidence"],
      reasoning: parsed.reasoning,
    });
  }

  writeFileSync(RESULTS_FILE, JSON.stringify(verdicts, null, 2));
  const wrong = verdicts.filter((v) => !v.match).length;
  const pct = ((wrong / verdicts.length) * 100).toFixed(1);
  console.log(`\n→ ${verdicts.length} resultat sparade. ${wrong} flaggade (${pct} %).`);
  console.log(`→ Kör \`bun run scripts/verify-ord-questions.ts report\` för rapport.`);
}

/* ─────────── MODE: report — bygger markdown ─────────── */
function runReport() {
  if (!existsSync(RESULTS_FILE)) {
    throw new Error("verify-results.json saknas. Kör fetch först.");
  }
  const verdicts: Verdict[] = JSON.parse(readFileSync(RESULTS_FILE, "utf8"));
  const questions: OrdQuestion[] = JSON.parse(readFileSync(QUESTIONS_FILE, "utf8"));
  const qMap = new Map(questions.map((q) => [q.id, q]));

  const flagged = verdicts.filter((v) => !v.match);
  const byConfidence = {
    high: flagged.filter((v) => v.confidence === "high"),
    medium: flagged.filter((v) => v.confidence === "medium"),
    low: flagged.filter((v) => v.confidence === "low"),
  };

  const lines: string[] = [];
  lines.push("# ORD-audit — rapport\n");
  lines.push(`Totalt: ${verdicts.length} frågor verifierade.`);
  lines.push(`Flaggade: ${flagged.length} (${((flagged.length / verdicts.length) * 100).toFixed(1)} %).`);
  lines.push(`\n— Confidence-fördelning:`);
  lines.push(`  · high   = ${byConfidence.high.length}`);
  lines.push(`  · medium = ${byConfidence.medium.length}`);
  lines.push(`  · low    = ${byConfidence.low.length}`);
  lines.push(`\n`);

  for (const conf of ["high", "medium", "low"] as const) {
    if (byConfidence[conf].length === 0) continue;
    lines.push(`\n## Confidence: ${conf.toUpperCase()} (${byConfidence[conf].length} st)\n`);
    for (const v of byConfidence[conf]) {
      const q = qMap.get(v.qId);
      if (!q) continue;
      const markedOpt = q.options.find((o) => o.id === v.marked);
      const bestOpt = q.options.find((o) => o.id === v.best);
      lines.push(`### ${v.word}`);
      lines.push(`- id: \`${v.qId}\``);
      lines.push(`- markerat: **${v.marked}** = ${markedOpt?.text ?? "?"}`);
      lines.push(`- föreslås: **${v.best}** = ${bestOpt?.text ?? "?"}`);
      lines.push(`- motivering: _${v.reasoning}_`);
      lines.push(``);
    }
  }

  writeFileSync(REPORT_FILE, lines.join("\n"));
  console.log(`→ Rapport sparad till ${REPORT_FILE}`);
}

/* ─────────── helpers ─────────── */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function ensureDir(d: string) {
  try {
    Deno; // eslint-disable-line @typescript-eslint/no-unused-expressions
  } catch {
    /* not deno */
  }
  // node: mkdir sync
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { mkdirSync } = require("node:fs");
  mkdirSync(d, { recursive: true });
}

/* ─────────── entry ─────────── */
const mode = process.argv[2];
const main = {
  sample: runSample,
  submit: runSubmit,
  fetch: runFetch,
  report: runReport,
}[mode ?? ""];

if (!main) {
  console.log(
    `Usage: bun run scripts/verify-ord-questions.ts <sample|submit|fetch|report>`,
  );
  process.exit(1);
}

Promise.resolve(main()).catch((err: { message?: string }) => {
  console.error("✖", err.message ?? err);
  process.exit(1);
});

declare const Deno: unknown;
