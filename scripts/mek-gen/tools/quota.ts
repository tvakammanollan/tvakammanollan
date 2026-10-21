// Ord som har nått kvoten i hela banken (nyckel högst 2, distraktor högst 4).
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { bankReport } from "../../../src/lib/mek-rules";
const d = join(dirname(fileURLToPath(import.meta.url)), "..", "pilot");
const all = readdirSync(d).filter((f) => /^batch-\d+\.json$/.test(f)).flatMap((f) => JSON.parse(readFileSync(join(d, f), "utf8")));
const r = bankReport(all);
console.log("nyckel:", r.overusedKeyStems, "distraktor:", r.overusedDistractorStems);
