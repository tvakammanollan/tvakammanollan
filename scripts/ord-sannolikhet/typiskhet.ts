/**
 * Steg 2: den blinda bedömningen av HP-typiskhet (1–5, se REGELVERK.md).
 *
 *   bun run scripts/ord-sannolikhet/typiskhet.ts prep  [mapp]
 *   bun run scripts/ord-sannolikhet/typiskhet.ts samla [mapp]
 *
 * `prep` blandar bankens ord (samma ordning varje gång) och skriver dem i
 * omgångar om 1 000, tio ord per numrerad rad, utan källa eller historik.
 * Bedömaren skriver en fil per omgång med samma radnummer och tio siffror:
 *
 *   omgang-01.txt   001: flamsig | karoten | ...
 *   betyg-01.txt    001: 3254311425
 *
 * `samla` kontrollerar att varje rad har rätt antal siffror och skriver
 * `hp-typiskhet.json` (slug -> betyg). Redan bedömda ord ligger kvar; `prep`
 * tar bara med ord som saknar betyg.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { BankOrd } from "./historik";

const HERE = import.meta.dir;
const UT = join(HERE, "hp-typiskhet.json");
const [kommando, mappArg] = process.argv.slice(2);
const mapp = mappArg ?? join(HERE, ".omgangar");
const PER_RAD = 10;
const PER_OMGANG = 1000;

/** FNV-1a. Ger en blandning som är stabil mellan körningar. */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const bank = JSON.parse(readFileSync(join(HERE, "bank.json"), "utf8")) as BankOrd[];
const klara: Record<string, number> = existsSync(UT) ? JSON.parse(readFileSync(UT, "utf8")) : {};

function kvar(): BankOrd[] {
  return bank.filter((b) => !(b.slug in klara)).sort((a, b) => hash(a.slug) - hash(b.slug));
}

function rader(ord: BankOrd[]): BankOrd[][] {
  const ut: BankOrd[][] = [];
  for (let i = 0; i < ord.length; i += PER_RAD) ut.push(ord.slice(i, i + PER_RAD));
  return ut;
}

const nr = (n: number, bredd: number) => String(n).padStart(bredd, "0");

if (kommando === "prep") {
  mkdirSync(mapp, { recursive: true });
  const ord = kvar();
  for (let i = 0, o = 1; i < ord.length; i += PER_OMGANG, o++) {
    const text = rader(ord.slice(i, i + PER_OMGANG))
      .map((rad, r) => `${nr(r + 1, 3)}: ${rad.map((b) => b.ord).join(" | ")}`)
      .join("\n");
    writeFileSync(join(mapp, `omgang-${nr(o, 2)}.txt`), text + "\n");
  }
  console.log(`${ord.length} ord att bedöma, skrivna till ${mapp}`);
} else if (kommando === "samla") {
  const ord = kvar();
  const fel: string[] = [];
  let nya = 0;
  for (const fil of readdirSync(mapp)
    .filter((f) => /^betyg-\d+\.txt$/.test(f))
    .sort()) {
    const o = Number(fil.match(/\d+/)![0]);
    const omgang = rader(ord.slice((o - 1) * PER_OMGANG, o * PER_OMGANG));
    const rad = new Map<number, string>();
    for (const l of readFileSync(join(mapp, fil), "utf8").split("\n")) {
      const m = l.match(/^(\d{3}):\s*([1-5]+)\s*$/);
      if (m) rad.set(Number(m[1]), m[2]);
      else if (l.trim()) fel.push(`${fil}: oläsbar rad "${l}"`);
    }
    omgang.forEach((words, r) => {
      const siffror = rad.get(r + 1);
      if (!siffror) return fel.push(`${fil}: rad ${r + 1} saknas`);
      if (siffror.length !== words.length) {
        return fel.push(
          `${fil}: rad ${r + 1} har ${siffror.length} siffror, ska ha ${words.length}`,
        );
      }
      words.forEach((b, i) => {
        klara[b.slug] = Number(siffror[i]);
        nya++;
      });
    });
  }
  if (fel.length) {
    console.error(fel.join("\n"));
    process.exit(1);
  }
  const sorterad = Object.fromEntries(
    Object.entries(klara).sort(([a], [b]) => a.localeCompare(b, "sv")),
  );
  writeFileSync(UT, JSON.stringify(sorterad) + "\n");
  const saknas = bank.filter((b) => !(b.slug in klara)).length;
  console.log(`${nya} nya betyg, ${Object.keys(klara).length} totalt, ${saknas} ord saknar betyg.`);
} else {
  console.error("Ange prep eller samla.");
  process.exit(1);
}
