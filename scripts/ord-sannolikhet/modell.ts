/**
 * Steg 3–4: modellen, backtestet och artefakten.
 *
 *   bun run scripts/ord-sannolikhet/modell.ts
 *
 * Läser historik.json, bank.json och hp-typiskhet.json. Skriver rapport.md
 * (backtestet) och src/data/ord-sannolikhet.json (ett tal per uppslag).
 *
 * Två klasser, se REGELVERK.md:
 *   A. Ord som stått på ett prov. Sannolikheten är en hasard per ålder
 *      (år sedan senaste förekomst), mätt på proven från 2020.
 *   B. Ord som aldrig stått på ett prov. En låg grundnivå, mätt på de prov
 *      där lektionsorden är oberoende av provet, fördelad efter provlikhet.
 *
 * Provlikheten är en logistisk regression: provord mot aldrig testade ord i
 * banken, på betyg, svårighet, ordklass och frasform. Att ordet tidigare stått
 * som svarsalternativ prövades och bar inte (odds 0,69), så det är inte med.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { termTid, type BankOrd, type Forekomst } from "./historik";

const HERE = import.meta.dir;
const las = <T>(fil: string) => JSON.parse(readFileSync(join(HERE, fil), "utf8")) as T;

const historik = las<{
  prov: Array<{ term: string; antal: number }>;
  ord: Record<string, Forekomst>;
}>("historik.json");
const bank = las<BankOrd[]>("bank.json");
const typiskhet = las<Record<string, number>>("hp-typiskhet.json");

const saknar = bank.filter((b) => !(b.slug in typiskhet));
if (saknar.length) {
  console.error(
    `${saknar.length} ord saknar betyg i hp-typiskhet.json, t.ex. ${saknar
      .slice(0, 5)
      .map((b) => b.slug)
      .join(", ")}`,
  );
  process.exit(1);
}

/** Återanvändningen tog fart här. Hasarden mäts bara på prov från och med detta år. */
const ERA_START = 2020;
/** Delningen i backtestet: träna på eran fram hit, testa på resten. */
const TEST_START = 2023;
/** Åldersklasser i år sedan senaste förekomst. */
const ALDRAR = [0, 10, 16, Infinity];
const aldersklass = (ar: number) => ALDRAR.findIndex((_, i) => ar < ALDRAR[i + 1]);
const ALDERSNAMN = ["under 10 år", "10–16 år", "över 16 år"];

const prov = historik.prov.map((p) => ({ ...p, tid: termTid(p.term) }));
const sistaTid = prov[prov.length - 1].tid;
const NASTA = sistaTid + 0.5;

const bankMap = new Map(bank.map((b) => [b.slug, b]));
const tider = (lista: string[]) => lista.map(termTid);
const uppslagTider = new Map(Object.entries(historik.ord).map(([s, f]) => [s, tider(f.u)]));

const forstaTest = (slug: string) => uppslagTider.get(slug)?.[0] ?? Infinity;
const senasteFore = (slug: string, t: number) => {
  const fore = (uppslagTider.get(slug) ?? []).filter((x) => x < t);
  return fore.length ? fore[fore.length - 1] : null;
};

// ── Provlikheten ────────────────────────────────────────────────────────────

const SARDRAG = [
  "betyg2",
  "betyg3",
  "betyg4",
  "betyg5",
  "lätt",
  "svår",
  "fras",
  "affix",
  "verb",
  "adjektiv",
];

/**
 * De ord som testats två gånger var kända för bedömaren när betygen sattes
 * (listan togs fram i förarbetet), och fick alla 5. Betyget är alltså inte
 * blint för just dem. De räknas som 4, det vanligaste betyget bland provord.
 */
const KANDA = new Set(
  Object.entries(historik.ord)
    .filter(([, f]) => f.u.length > 1)
    .map(([s]) => s),
);
const betyg = (slug: string) => (KANDA.has(slug) ? 4 : typiskhet[slug]);

function sardrag(b: BankOrd): number[] {
  const g = betyg(b.slug);
  return [
    +(g === 2),
    +(g === 3),
    +(g === 4),
    +(g === 5),
    +(b.sv === 1),
    +(b.sv === 3),
    +b.ord.includes(" "),
    +(b.ord.startsWith("-") || b.ord.endsWith("-") || b.ord.includes(",")),
    +(b.klass?.startsWith("verb") ?? false),
    +(b.klass?.startsWith("adjektiv") ?? false),
  ];
}

/** Logistisk regression med Newtons metod och en liten ridge på vikterna. */
function logit(X: number[][], y: number[], ridge = 0.5): number[] {
  const d = X[0].length + 1;
  let w = new Array(d).fill(0);
  for (let iter = 0; iter < 30; iter++) {
    const g = new Array(d).fill(0);
    const H = Array.from({ length: d }, () => new Array(d).fill(0));
    for (let i = 0; i < X.length; i++) {
      const x = [1, ...X[i]];
      const p = 1 / (1 + Math.exp(-x.reduce((s, v, j) => s + v * w[j], 0)));
      for (let j = 0; j < d; j++) {
        g[j] += (y[i] - p) * x[j];
        for (let k = 0; k < d; k++) H[j][k] += p * (1 - p) * x[j] * x[k];
      }
    }
    for (let j = 1; j < d; j++) {
      g[j] -= ridge * w[j];
      H[j][j] += ridge;
    }
    const steg = los(H, g);
    w = w.map((v, j) => v + steg[j]);
    if (Math.max(...steg.map(Math.abs)) < 1e-8) break;
  }
  return w;
}

/** Gausselimination med pivotering. */
function los(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    [M[c], M[piv]] = [M[piv], M[c]];
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    x[r] = (M[r][n] - M[r].slice(r + 1, n).reduce((s, v, k) => s + v * x[r + 1 + k], 0)) / M[r][r];
  }
  return x;
}

/** Tränar provlikheten på det som var känt före `cutoff`. Ger oddsen (utan intercept). */
function tranaProvlikhet(cutoff: number) {
  const X = bank.map(sardrag);
  const y = bank.map((b) => +(forstaTest(b.slug) < cutoff));
  const w = logit(X, y);
  const odds = (b: BankOrd) => Math.exp(sardrag(b).reduce((s, v, j) => s + v * w[j + 1], 0));
  return { w, odds };
}

function auc(pos: number[], neg: number[]): number {
  const alla = [...pos.map((s) => [s, 1]), ...neg.map((s) => [s, 0])].sort((a, b) => a[0] - b[0]);
  let rang = 0;
  for (let i = 0; i < alla.length; ) {
    let j = i;
    while (j < alla.length && alla[j][0] === alla[i][0]) j++;
    const medel = (i + j + 1) / 2;
    for (let k = i; k < j; k++) if (alla[k][1]) rang += medel;
    i = j;
  }
  return (rang - (pos.length * (pos.length + 1)) / 2) / (pos.length * neg.length);
}

// ── Hasarden för testade ord ────────────────────────────────────────────────

type Hasard = { exponering: number[]; traffar: number[]; h: number[] };

/** Räknar ord-prov-par per åldersklass över de givna proven. */
function matHasard(provLista: typeof prov): Hasard {
  const exponering = ALDRAR.slice(1).map(() => 0);
  const traffar = ALDRAR.slice(1).map(() => 0);
  for (const p of provLista) {
    for (const [slug, ts] of uppslagTider) {
      const senast = senasteFore(slug, p.tid);
      if (senast === null) continue;
      const k = aldersklass(p.tid - senast);
      // Prov med 40 ord väger dubbelt mot prov med 20. Eran har bara 20-ordsprov.
      exponering[k]++;
      if (ts.includes(p.tid)) traffar[k]++;
    }
  }
  // Den yngsta klassen har aldrig gett en träff. En halv pseudoträff håller
  // den över noll utan att låtsas veta mer än datan säger.
  const h = exponering.map((e, k) => (traffar[k] + (k === 0 ? 0.5 : 0)) / Math.max(e, 1));
  return { exponering, traffar, h };
}

// ── Grundnivån för aldrig testade ord ───────────────────────────────────────

/**
 * Ett prov är "rent" när dess ord kom in i banken som egna provrader efter att
 * lektionslistan fanns. Bara där är en träff på ett lektionsord en riktig
 * förutsägelse och inte ett ord som står i listan därför att det stod på provet.
 */
function arRent(p: (typeof prov)[number]): boolean {
  if (p.tid < 2019) return false;
  let egna = 0;
  for (const [slug, ts] of uppslagTider) {
    if (ts[0] === p.tid && bankMap.get(slug)?.kalla === "prov") egna++;
  }
  return egna >= 10;
}

function lektionstraffar(p: (typeof prov)[number]): string[] {
  const ut: string[] = [];
  for (const [slug, ts] of uppslagTider) {
    if (ts[0] === p.tid && bankMap.get(slug)?.kalla === "lektion") ut.push(slug);
  }
  return ut;
}

// ── Sannolikheten per ord inför ett givet prov ──────────────────────────────

type Modell = { hasard: Hasard; grundB: number; odds: (b: BankOrd) => number };

function sannolikheter(m: Modell, t: number): Map<string, number> {
  const ut = new Map<string, number>();
  const klassB: BankOrd[] = [];
  const iKlass: BankOrd[][] = ALDRAR.slice(1).map(() => []);
  for (const b of bank) {
    const senast = senasteFore(b.slug, t);
    if (senast === null) {
      // Provrader som inte testats före t fanns inte i banken då.
      if (b.kalla === "lektion" || forstaTest(b.slug) === Infinity) klassB.push(b);
    } else iKlass[aldersklass(t - senast)].push(b);
  }
  // Inom varje grupp fördelas gruppens summa efter provlikhetens odds.
  const fordela = (grupp: BankOrd[], summa: number, exponent: number) => {
    const vikt = grupp.map((b) => Math.pow(m.odds(b), exponent));
    const tot = vikt.reduce((s, v) => s + v, 0);
    grupp.forEach((b, i) => ut.set(b.slug, tot ? (summa * vikt[i]) / tot : 0));
  };
  fordela(klassB, m.grundB, 1);
  iKlass.forEach((grupp, k) => fordela(grupp, m.hasard.h[k] * grupp.length, EXPONENT_A));
  return ut;
}

/**
 * Hur mycket provlikheten får styra bland redan testade ord. De är alla valda
 * av UHR en gång, så signalen antas vara svagare där. 0 = ingen, 1 = full.
 * Går inte att mäta (se KANDA), så värdet är ett försiktigt antagande.
 */
const EXPONENT_A = 0.5;

// ── Backtest ────────────────────────────────────────────────────────────────

const era = prov.filter((p) => p.tid >= ERA_START);
const traning = era.filter((p) => p.tid < TEST_START);
const test = era.filter((p) => p.tid >= TEST_START);

const rad: string[] = [];
const skriv = (s = "") => rad.push(s);
const pct = (x: number, d = 3) => (x * 100).toFixed(d).replace(".", ",") + " %";

skriv("# Ordsannolikheten: backtest");
skriv();
skriv(
  `Genererad av \`modell.ts\`. ${prov.length} prov ${prov[0].term}–${prov[prov.length - 1].term}, ${bank.length} ord i banken.`,
);
skriv();

// 1. Provlikheten: tränad på det som var känt före eran, prövad på eran.
{
  const { w, odds } = tranaProvlikhet(ERA_START);
  const otestade = bank.filter((b) => forstaTest(b.slug) >= ERA_START);
  const pos = otestade.filter((b) => forstaTest(b.slug) < Infinity).map(odds);
  const neg = otestade.filter((b) => forstaTest(b.slug) === Infinity).map(odds);
  skriv("## Provlikheten");
  skriv();
  skriv(
    `Tränad på provord före ${ERA_START} mot övriga bankord. Prövad på de ${pos.length} bankord som stod på ett prov för första gången ${ERA_START}–, mot ${neg.length} som aldrig gjort det.`,
  );
  skriv();
  skriv(`AUC ${auc(pos, neg).toFixed(3)} (0,5 är slump).`);
  skriv();
  skriv("| Särdrag | Odds |");
  skriv("| --- | --- |");
  SARDRAG.forEach((namn, j) =>
    skriv(
      `| ${namn} | ${Math.exp(w[j + 1])
        .toFixed(2)
        .replace(".", ",")} |`,
    ),
  );
  skriv();
  skriv("Odds mot ett ord med betyg 1, medelsvårt, substantiv, enstaka ord.");
  skriv();

  skriv(
    `Bland redan testade ord går provlikheten inte att pröva: de ${KANDA.size} som kommit tillbaka var kända när betygen sattes. Att den får styra där (exponent ${String(EXPONENT_A).replace(".", ",")}) är ett antagande, inte ett mätresultat.`,
  );
  skriv();
}

// 2. Hasarden per ålder.
const hasardAlla = matHasard(era);
skriv("## Återkomst efter ålder");
skriv();
skriv(`Mätt på de ${era.length} proven ${era[0].term}–${era[era.length - 1].term}.`);
skriv();
skriv("| Sedan senaste prov | Ord-prov-par | Återkom | Per ord och prov |");
skriv("| --- | --- | --- | --- |");
ALDERSNAMN.forEach((namn, k) =>
  skriv(
    `| ${namn} | ${hasardAlla.exponering[k]} | ${hasardAlla.traffar[k]} | ${pct(hasardAlla.h[k])} |`,
  ),
);
skriv();

// 3. Grundnivån.
const rena = era.filter(arRent);
const renaTraffar = rena.map((p) => lektionstraffar(p).length);
const grundAlla = renaTraffar.reduce((s, v) => s + v, 0) / rena.length;
skriv("## Aldrig testade ord");
skriv();
skriv(
  `${rena.length} prov är rena (${rena.map((p) => p.term).join(", ")}). På dem stod ${renaTraffar.reduce((s, v) => s + v, 0)} lektionsord, alltså ${grundAlla.toFixed(2).replace(".", ",")} per prov.`,
);
skriv();

// 4. Utfall utanför träningsdatan.
{
  const m: Modell = {
    hasard: matHasard(traning),
    grundB: (() => {
      const r = traning.filter(arRent);
      // Få rena prov i träningsdelen: en halv pseudoträff mot noll.
      return (r.reduce((s, p) => s + lektionstraffar(p).length, 0) + 0.5) / Math.max(r.length, 1);
    })(),
    odds: tranaProvlikhet(TEST_START).odds,
  };
  const TOPP = [100, 500, 1000];
  const iTopp = TOPP.map(() => 0);
  const slump = TOPP.map(() => 0);
  let vantatA = 0;
  let faktiskA = 0;
  let vantatB = 0;
  let faktiskB = 0;
  const band = [0, 0.0001, 0.0005, 0.0015, 1];
  const bandVantat = band.slice(1).map(() => 0);
  const bandFaktiskt = band.slice(1).map(() => 0);
  const bandAntal = band.slice(1).map(() => 0);
  for (const p of test) {
    const ps = sannolikheter(m, p.tid);
    const ren = arRent(p);
    // På ett orent prov går bara klass A att utvärdera.
    const kandidater = [...ps.keys()].filter((s) => ren || senasteFore(s, p.tid) !== null);
    const ordning = kandidater.sort((a, b) => ps.get(b)! - ps.get(a)!);
    const traff = new Set(kandidater.filter((s) => uppslagTider.get(s)?.includes(p.tid)));
    TOPP.forEach((n, i) => {
      iTopp[i] += ordning.slice(0, n).filter((s) => traff.has(s)).length;
      slump[i] += (traff.size * Math.min(n, ordning.length)) / ordning.length;
    });
    for (const s of kandidater) {
      const v = ps.get(s)!;
      const a = senasteFore(s, p.tid) !== null;
      const t = traff.has(s) ? 1 : 0;
      if (a) {
        vantatA += v;
        faktiskA += t;
      } else {
        vantatB += v;
        faktiskB += t;
      }
      const k = band.findIndex((_, i) => v < band[i + 1]);
      bandVantat[k] += v;
      bandFaktiskt[k] += t;
      bandAntal[k]++;
    }
  }
  skriv("## Utfall utanför träningsdatan");
  skriv();
  skriv(
    `Modellen tränad på ${traning[0].term}–${traning[traning.length - 1].term}, prövad på ${test[0].term}–${test[test.length - 1].term} (${test.length} prov).`,
  );
  skriv();
  skriv("| | Väntat | Faktiskt |");
  skriv("| --- | --- | --- |");
  skriv(`| Testade ord som återkom | ${vantatA.toFixed(1).replace(".", ",")} | ${faktiskA} |`);
  skriv(
    `| Aldrig testade ord som kom (rena prov) | ${vantatB.toFixed(1).replace(".", ",")} | ${faktiskB} |`,
  );
  skriv();
  skriv("| Modellens topp | Träffar | Slumpen hade gett |");
  skriv("| --- | --- | --- |");
  TOPP.forEach((n, i) =>
    skriv(`| ${n} | ${iTopp[i]} | ${slump[i].toFixed(1).replace(".", ",")} |`),
  );
  skriv();
  skriv("| Sannolikhet | Ord-prov-par | Väntade träffar | Faktiska |");
  skriv("| --- | --- | --- | --- |");
  bandAntal.forEach((n, k) =>
    skriv(
      `| ${pct(band[k], 2)} till ${k === band.length - 2 ? "" : pct(band[k + 1], 2)} | ${n} | ${bandVantat[k].toFixed(1).replace(".", ",")} | ${bandFaktiskt[k]} |`,
    ),
  );
  skriv();
}

// ── Slutmodellen och artefakten ─────────────────────────────────────────────

const slut: Modell = {
  hasard: hasardAlla,
  grundB: grundAlla,
  odds: tranaProvlikhet(Infinity).odds,
};
const ps = sannolikheter(slut, NASTA);

/** Bandgränser i sannolikhet per prov. Band 5 är högst. */
export const BAND = [0.00005, 0.00015, 0.0005, 0.0015];
const bandFor = (p: number) => 1 + BAND.filter((g) => p >= g).length;

type Post = { p: number; band: number; typ: number; senast?: string };
const artefakt: Record<string, Post> = {};
for (const b of bank) {
  const p = ps.get(b.slug) ?? 0;
  const f = historik.ord[b.slug];
  const post: Post = { p: Number((p * 100).toPrecision(2)), band: bandFor(p), typ: betyg(b.slug) };
  if (f?.u.length) post.senast = f.u[f.u.length - 1];
  artefakt[b.slug] = post;
}
writeFileSync(
  join(HERE, "..", "..", "src", "data", "ord-sannolikhet.json"),
  JSON.stringify({
    nasta: Number(NASTA.toFixed(2)),
    band: BAND.map((g) => g * 100),
    ord: artefakt,
  }) + "\n",
);

const summa = [...ps.values()].reduce((s, v) => s + v, 0);
skriv("## Inför nästa prov");
skriv();
skriv(
  `Summan över banken är ${summa.toFixed(2).replace(".", ",")} väntade ord av provets 20. Resten väntas ligga utanför banken.`,
);
skriv();
skriv("| Band | Sannolikhet per prov | Antal ord |");
skriv("| --- | --- | --- |");
for (let k = 5; k >= 1; k--) {
  const lag = k === 1 ? 0 : BAND[k - 2];
  const hog = k === 5 ? null : BAND[k - 1];
  const n = Object.values(artefakt).filter((a) => a.band === k).length;
  skriv(
    `| ${k} | ${hog === null ? `minst ${pct(lag, 3)}` : `${pct(lag, 3)} till ${pct(hog, 3)}`} | ${n} |`,
  );
}
skriv();
const topp = [...ps.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25);
skriv("De 25 högsta: " + topp.map(([s, v]) => `${s} (${pct(v, 2)})`).join(", ") + ".");
skriv();

writeFileSync(join(HERE, "rapport.md"), rad.join("\n"));
console.log(rad.join("\n"));
