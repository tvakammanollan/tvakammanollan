#!/usr/bin/env node
/**
 * Sätter <lastmod> i public/sitemap.xml ur git-historiken.
 *
 * Sitemapen är handskriven, och lastmod stod kvar på det datum raden
 * skrevs: 11 sidor sa "2026-06-26" fast route-filerna ändrats fyra gånger
 * sedan dess. Google väger lastmod bara när den visat sig stämma, så ett
 * stillastående datum är värre än inget.
 *
 * Regel: lastmod = senaste commit som rört sidans filer, men ALDRIG bakåt
 * (ett datum någon satt för hand därför att datan ändrats ligger kvar).
 * Delen mellan gamla-prov-markörerna rörs inte; den skrivs av
 * scripts/hp-import/build.py.
 *
 *   node scripts/sitemap-lastmod.mjs          # skriver
 *   node scripts/sitemap-lastmod.mjs --dry    # visar bara vad som ändras
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const FILE = "public/sitemap.xml";
const dry = process.argv.includes("--dry");
const ROUTES = "src/routes";

/** Vilka filer en adress byggs av. Första träffen gäller. */
function filesFor(path) {
  if (path === "/") return ["src/routes/index.tsx", "src/components/landing"];
  if (path === "/guider") return [`${ROUTES}/guider/index.tsx`, "src/lib/guider-meta.tsx"];
  if (path.startsWith("/guider/")) return [`${ROUTES}/guider/${path.slice(8)}.tsx`, "src/lib/guide-faq.ts"];
  if (path.startsWith("/ova/")) return [`${ROUTES}/ova.$delprov.tsx`];
  if (path.startsWith("/hogskoleprovet-poang/")) return [`${ROUTES}/hogskoleprovet-poang_.$program.tsx`];
  if (path.startsWith("/hogskoleprovet-normering/"))
    return [`${ROUTES}/hogskoleprovet-normering_.$term.tsx`, "src/data/prov/normering.json"];
  if (path === "/hogskoleprovet-normering")
    return [`${ROUTES}/hogskoleprovet-normering.tsx`, "src/data/prov/normering.json"];
  if (path.startsWith("/hogskoleprovet-ord/")) {
    const term = path.slice("/hogskoleprovet-ord/".length);
    return [`${ROUTES}/hogskoleprovet-ord_.$term.tsx`, `src/data/prov/${term}-2.json`, `src/data/prov/${term}-4.json`];
  }
  if (path.startsWith("/hogskoleprovet-antal-ratt/"))
    return [`${ROUTES}/hogskoleprovet-antal-ratt_.$niva.tsx`, "src/lib/antal-ratt.ts", "src/data/prov/normering.json"];
  if (path === "/hogskoleprovet-antal-ratt")
    return [`${ROUTES}/hogskoleprovet-antal-ratt.tsx`, "src/lib/antal-ratt.ts", "src/data/prov/normering.json"];
  if (path === "/hogskoleprovet-facit") return [`${ROUTES}/hogskoleprovet-facit.tsx`, "src/lib/preliminart-facit.ts"];
  if (path === "/hogskoleprovet-datum") return [`${ROUTES}/hogskoleprovet-datum.tsx`, "src/lib/hp-dates.ts"];
  if (path === "/forum/regler") return [`${ROUTES}/forum_.regler.tsx`];
  // Platta sidor: /faq → src/routes/faq.tsx
  return [`${ROUTES}/${path.slice(1)}.tsx`];
}

function gitDate(files) {
  const existing = files.filter((f) => existsSync(f));
  if (existing.length === 0) return null;
  const out = execFileSync("git", ["log", "-1", "--format=%cs", "--", ...existing], {
    encoding: "utf8",
  }).trim();
  return out || null;
}

const xml = readFileSync(FILE, "utf8");
const START = "<!-- gamla-prov: genererad av scripts/hp-import/build.py -->";
const END = "<!-- /gamla-prov -->";
const a = xml.indexOf(START);
const b = xml.indexOf(END);
if (a < 0 || b < 0) throw new Error("gamla-prov-markörerna saknas i sitemapen");

let changed = 0;
let missing = 0;
const rewrite = (chunk) =>
  chunk.replace(
    /(<loc>https:\/\/tvakommanollan\.se([^<]*)<\/loc>\s*<lastmod>)(\d{4}-\d{2}-\d{2})(<\/lastmod>)/g,
    (m, pre, path, old, post) => {
      const files = filesFor(path || "/");
      const fresh = gitDate(files);
      if (!fresh) {
        missing++;
        console.warn(`  ? ${path}: ingen fil hittad (${files.join(", ")})`);
        return m;
      }
      if (fresh <= old) return m;
      changed++;
      console.log(`  ${path}: ${old} -> ${fresh}`);
      return `${pre}${fresh}${post}`;
    },
  );

const head = rewrite(xml.slice(0, a));
const tail = rewrite(xml.slice(b));
const next = head + xml.slice(a, b) + tail;
console.log(`${changed} ändrade, ${missing} utan fil${dry ? " (torrkörning)" : ""}`);
if (!dry && next !== xml) writeFileSync(FILE, next);
