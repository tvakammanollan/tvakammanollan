/**
 * Klarar en batch MEK-uppgifter regelverket?
 *
 *   bun run scripts/mek-gen/check.ts --arkiv            # de 600 riktiga, som kalibrering
 *   bun run scripts/mek-gen/check.ts out/batch-01.json   # en egen batch
 *
 * Reglerna bor i `src/lib/mek-rules.ts` (testade). En egen batch jämförs
 * dessutom mot arkivet: ingen uppgift får dela mer än `MAX_RUN_VS_ARCHIVE` ord
 * i följd med en UHR-uppgift. Avslutar med kod 1 om något underkänns.
 *
 * Batchfilen är en JSON-lista av `{ id, text, alternatives, answer }`.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  bankReport,
  FAULT_LEVEL,
  longestSharedRun,
  MAX_RUN_VS_ARCHIVE,
  mekFaults,
  normalizeArchiveItem,
  type MekFault,
  type MekItem,
} from "../../src/lib/mek-rules";

type Item = MekItem & { id: string };

function loadArchive(): Item[] {
  const dir = "src/data/prov";
  const out: Item[] = [];
  for (const f of readdirSync(dir).sort()) {
    const d = JSON.parse(readFileSync(join(dir, f), "utf8"));
    if (!Array.isArray(d.questions)) continue;
    for (const q of d.questions) {
      if (q.delprov !== "MEK") continue;
      out.push(
        normalizeArchiveItem({
          id: `${d.term}-${d.pass}/${q.nr}`,
          text: q.text,
          alternatives: q.alternatives,
          answer: q.answer,
        }),
      );
    }
  }
  return out;
}

const args = process.argv.slice(2);
const isArchive = args.includes("--arkiv");
const file = args.find((a) => !a.startsWith("--"));
if (!isArchive && !file) {
  console.error("Ange en batchfil eller --arkiv.");
  process.exit(2);
}

const archive = loadArchive();
const items: Item[] = isArchive ? archive : JSON.parse(readFileSync(file!, "utf8"));

const counts = new Map<MekFault, string[]>();
let rejected = 0;
for (const item of items) {
  const faults = mekFaults(item);
  for (const f of faults) counts.set(f, [...(counts.get(f) ?? []), item.id]);
  const hard = faults.filter(
    (f) => FAULT_LEVEL[f] !== "varning" && (isArchive ? FAULT_LEVEL[f] === "format" : true),
  );
  if (!isArchive) {
    const run = Math.max(...archive.map((a) => longestSharedRun(item.text, a.text)));
    if (run > MAX_RUN_VS_ARCHIVE) {
      hard.push("för_lik_arkivet" as MekFault);
      counts.set("för_lik_arkivet" as MekFault, [
        ...(counts.get("för_lik_arkivet" as MekFault) ?? []),
        item.id,
      ]);
    }
  }
  if (hard.length) rejected++;
}

console.log(
  `${items.length} uppgifter, ${rejected} underkända${isArchive ? " (formatregler)" : ""}\n`,
);
for (const [f, ids] of [...counts].sort((a, b) => b[1].length - a[1].length)) {
  const level = FAULT_LEVEL[f] ?? "strikt";
  console.log(
    `  ${String(ids.length).padStart(4)}  ${level.padEnd(7)}  ${f}   ${ids.slice(0, 4).join(", ")}`,
  );
}

const r = bankReport(items);
const pct = (n: number) => `${(n * 100).toFixed(1)} %`;
console.log("\nBanken");
console.log(`  luckor        1: ${r.gaps[1]}  2: ${r.gaps[2]}  3: ${r.gaps[3]}`);
console.log(
  `  facit         A: ${r.answers.A}  B: ${r.answers.B}  C: ${r.answers.C}  D: ${r.answers.D}  (längsta svit ${r.longestAnswerRun})`,
);
console.log(
  `  facit längst  1: ${pct(r.keyLongestShare[1])}  2: ${pct(r.keyLongestShare[2])}  3: ${pct(r.keyLongestShare[3])}`,
);
console.log(
  `  medianord     1: ${r.medianWords[1]}  2: ${r.medianWords[2]}  3: ${r.medianWords[3]}`,
);
console.log(`  nyckel i text ${pct(r.echoShare)}`);
if (r.overusedKeyStems.length)
  console.log(
    `  nyckelord över kvot: ${r.overusedKeyStems
      .slice(0, 8)
      .map(([s, n]) => `${s}×${n}`)
      .join(", ")}`,
  );
if (r.problems.length) console.log(`\nAvsteg från kvoterna:\n  ${r.problems.join("\n  ")}`);

process.exit(rejected > 0 ? 1 : 0);
