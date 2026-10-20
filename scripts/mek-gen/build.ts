/**
 * Från skrivformat till färdig uppgift, med alla kontroller som inte kräver nät.
 *
 *   bun run scripts/mek-gen/build.ts scripts/mek-gen/pilot/src-01.json
 *
 * Skrivformatet (`src-NN.json`) håller facit och distraktorer isär, så att den
 * som skriver aldrig väljer bokstav. Det gör det här skriptet, ur en
 * balanserad följd per batch (C1.7): lika många A, B, C och D ±1 och aldrig
 * samma bokstav fyra gånger i rad. Ut kommer `batch-NN.json` i samma format som
 * `check.ts` läser, plus fälten importen behöver.
 *
 * Kontroller: allt i `mek-rules.ts` (format + strikt), längsta delade ordföljd
 * mot arkivet och mot källtexten (C7), och bankrapporten över alla batcher i
 * mappen. Avslutar med kod 1 om något underkänns.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import {
  bankReport,
  FAULT_LEVEL,
  LETTERS,
  longestSharedRun,
  MAX_RUN_VS_ARCHIVE,
  MAX_RUN_VS_PROTECTED_SOURCE,
  mekFaults,
  normalizeArchiveItem,
  SLOT_SEPARATOR,
  type MekItem,
} from "../../src/lib/mek-rules";
import { sourceFile } from "./fetch-sources";
import { readWebMeta } from "./fetch-web";

export interface SrcItem {
  id: string;
  amne: string;
  genre: string;
  text: string;
  key: string[];
  distractors: string[][];
  dtyp: string[][];
  faller: number[][];
  ordklass: string[];
  ledtrad: string[];
  explanation: string;
  /** Utan `url` slås källan upp bland webbkällorna (`fetch-web.ts`), annars antas Wikipedia. */
  source: { title: string; url?: string; publisher?: string };
}

export interface BuiltItem extends MekItem {
  id: string;
  amne: string;
  genre: string;
  explanation: string;
  source: { title: string; url: string; publisher: string };
  meta: {
    ordklass: string[];
    ledtrad: string[];
    distraktorer: Record<string, { typer: string[]; faller_pa: number[] }>;
  };
}

/** Deterministisk slump, så att en omkörning ger samma bokstäver. */
function rng(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export function balancedAnswers(n: number, seed: number): string[] {
  const rand = rng(seed);
  for (let attempt = 0; attempt < 1000; attempt++) {
    const pool = Array.from({ length: n }, (_, i) => LETTERS[i % 4]);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    let ok = true;
    for (let i = 3; i < pool.length; i++) {
      if (pool[i] === pool[i - 1] && pool[i] === pool[i - 2] && pool[i] === pool[i - 3]) ok = false;
    }
    if (ok) return pool;
  }
  throw new Error("Hittade ingen balanserad följd");
}

export function buildItems(src: SrcItem[], seed: number): BuiltItem[] {
  const web = readWebMeta();
  const answers = balancedAnswers(src.length, seed);
  return src.map((s, i) => {
    const k = LETTERS.indexOf(answers[i] as (typeof LETTERS)[number]);
    const alts: string[][] = [...s.distractors];
    alts.splice(k, 0, s.key);
    const letterOf = (d: number) => LETTERS[d >= k ? d + 1 : d];
    const distraktorer: BuiltItem["meta"]["distraktorer"] = {};
    s.distractors.forEach((_, d) => {
      distraktorer[letterOf(d)] = { typer: s.dtyp[d] ?? [], faller_pa: s.faller[d] ?? [1] };
    });
    return {
      id: s.id,
      amne: s.amne,
      genre: s.genre,
      text: s.text,
      alternatives: alts.map((a) => a.join(SLOT_SEPARATOR)),
      answer: answers[i],
      explanation: s.explanation,
      source: {
        title: s.source.title,
        url:
          s.source.url ??
          web[s.source.title]?.url ??
          `https://sv.wikipedia.org/wiki/${encodeURIComponent(s.source.title.replace(/ /g, "_"))}`,
        publisher: s.source.publisher ?? web[s.source.title]?.publisher ?? "Wikipedia",
      },
      meta: { ordklass: s.ordklass, ledtrad: s.ledtrad, distraktorer },
    };
  });
}

function loadArchive(): MekItem[] {
  const dir = "src/data/prov";
  const out: MekItem[] = [];
  for (const f of readdirSync(dir).sort()) {
    const d = JSON.parse(readFileSync(join(dir, f), "utf8"));
    if (!Array.isArray(d.questions)) continue;
    for (const q of d.questions) {
      if (q.delprov === "MEK")
        out.push(
          normalizeArchiveItem({ text: q.text, alternatives: q.alternatives, answer: q.answer }),
        );
    }
  }
  return out;
}

if (import.meta.main) {
  const file = process.argv[2];
  if (!file) {
    console.error("Ange en src-NN.json.");
    process.exit(2);
  }
  const src = JSON.parse(readFileSync(file, "utf8")) as SrcItem[];
  const nr = Number(basename(file).match(/(\d+)/)?.[1] ?? 1);
  const built = buildItems(src, 1000 + nr);
  const outFile = join(dirname(file), basename(file).replace(/^src-/, "batch-"));

  const archive = loadArchive();
  let rejected = 0;
  const ids = new Set<string>();
  for (const [i, item] of built.entries()) {
    const s = src[i];
    const problems: string[] = [];
    if (ids.has(item.id)) problems.push("dubblett-id");
    ids.add(item.id);
    const lens = [s.dtyp.length, s.faller.length, s.distractors.length];
    if (lens.some((l) => l !== 3)) problems.push(`metadata ofullständig (${lens.join("/")})`);
    if (s.ordklass.length !== s.key.length || s.ledtrad.length !== s.key.length)
      problems.push("ordklass/ledtrad per lucka saknas");
    if (!s.explanation || s.explanation.length < 40) problems.push("förklaring saknas");
    if (/\s[–—]\s/.test(s.explanation)) problems.push("tankstreck i förklaringen");
    for (const f of mekFaults(item)) if (FAULT_LEVEL[f] !== "varning") problems.push(f);
    const runArchive = Math.max(...archive.map((a) => longestSharedRun(item.text, a.text)));
    if (runArchive > MAX_RUN_VS_ARCHIVE) problems.push(`för_lik_arkivet (${runArchive} ord)`);
    const sf = sourceFile(s.source.title);
    if (existsSync(sf)) {
      const run = longestSharedRun(item.text, readFileSync(sf, "utf8"));
      if (run > MAX_RUN_VS_PROTECTED_SOURCE) problems.push(`kopierar_källan (${run} ord i följd)`);
    } else {
      problems.push("källtext ej hämtad");
    }
    const warn = mekFaults(item).filter((f) => FAULT_LEVEL[f] === "varning");
    if (problems.length) {
      rejected++;
      console.log(`UNDERKÄND ${item.id}: ${problems.join(", ")}`);
    } else if (warn.length) {
      console.log(`varning   ${item.id}: ${warn.join(", ")}`);
    }
  }
  writeFileSync(outFile, JSON.stringify(built, null, 1));

  const all: BuiltItem[] = readdirSync(dirname(file))
    .filter((f) => /^batch-\d+\.json$/.test(f))
    .flatMap((f) => JSON.parse(readFileSync(join(dirname(file), f), "utf8")) as BuiltItem[]);
  const r = bankReport(all);
  console.log(`\n${built.length} i batchen, ${rejected} underkända → ${outFile}`);
  console.log(
    `Banken (${r.total}): luckor ${r.gaps[1]}/${r.gaps[2]}/${r.gaps[3]}, facit A${r.answers.A} B${r.answers.B} C${r.answers.C} D${r.answers.D}, facit längst ${[1, 2, 3].map((g) => (r.keyLongestShare[g as 1 | 2 | 3] * 100).toFixed(0) + "%").join("/")}, medianord ${r.medianWords[1]}/${r.medianWords[2]}/${r.medianWords[3]}`,
  );
  if (r.problems.length) console.log(`Avsteg: ${r.problems.join("; ")}`);
  process.exit(rejected > 0 ? 1 : 0);
}
