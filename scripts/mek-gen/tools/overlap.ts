import { readFileSync } from "node:fs";
import { tokens } from "../../../src/lib/mek-rules";
import { sourceFile } from "../fetch-sources";
const src = JSON.parse(readFileSync(process.argv[2], "utf8"));
const want = new Set(process.argv.slice(3));
for (const s of src) {
  if (want.size && !want.has(s.id)) continue;
  const a = tokens(s.text), b = tokens(readFileSync(sourceFile(s.source.title), "utf8"));
  let best = 0, at = 0;
  for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) {
    let k = 0; while (i + k < a.length && j + k < b.length && a[i + k] === b[j + k]) k++;
    if (k > best) { best = k; at = i; }
  }
  if (best > 5) console.log(s.id, best, "→", a.slice(at, at + best).join(" "));
}
