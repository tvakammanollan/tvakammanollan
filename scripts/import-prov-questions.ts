/**
 * Importerar arkivets matteuppgifter till `questions`.
 *
 * Frågebanken bakom Match och Träna skrapades ur PDF:er och matematiken
 * överlevde inte: alternativ bär nästa uppgifts text, bråk kommer ut som
 * "x 27 37", och DTK saknar sina diagram helt (kategorin har noll rader i
 * produktion). LLM-städningen som lades ovanpå lagar inte det — den hittar på:
 * alternativ B "31x" blev "$\frac{31x}{27}$" i en av raderna.
 *
 * Arkivet under `src/data/prov/` har samma uppgifter i rätt skick: 2 400
 * matteuppgifter med facit ur UHR:s egna häften, XYZ och KVA som bildutsnitt.
 * Det här skriptet flyttar över dem.
 *
 * Rader märks med `exam_term`/`provpass_num`/`q_num`. Det är samma markör som
 * gamla-prov-importen redan använder för att kunna importera om (`delete()
 * .not("exam_term", "is", null)`), och skälet till att ORD-raderna medvetet
 * lämnar `exam_term` tomt — se CLAUDE.md.
 *
 * De skrapade matteraderna raderas inte: `match_answers`, `match_questions` och
 * `question_reports` har främmande nycklar mot `questions.id`, så en radering
 * tar matchhistorik med sig. De får `clean_status = 'retired'` i stället, vilket
 * gör att de faller bort ur läsvägarna som redan filtrerar på `'ok'`.
 *
 * Kräver SUPABASE_SERVICE_ROLE_KEY i .env.local.
 *
 *   node scripts/import-prov-questions.ts            # torrkörning
 *   node scripts/import-prov-questions.ts --apply
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const DATA = join(ROOT, "src", "data", "prov");

const MATH = new Set(["XYZ", "KVA", "NOG", "DTK"]);
const LETTERS = ["A", "B", "C", "D", "E"];

type Crop = [number, number, number, number];

interface ProvQuestion {
  nr: number;
  delprov: string;
  text?: string;
  alternatives?: string[];
  image?: string;
  altCount?: number;
  crops?: Record<string, Crop>;
  imageAspect?: number;
  figureMissing?: boolean;
  /** Index i passets `figures` — DTK:s diagramuppslag, som uppgiften läses ur. */
  figure?: number;
  answer: string;
  answers?: string[];
  utgar?: boolean;
}

interface ProvPass {
  term: string;
  label: string;
  pass: number;
  kind: string;
  questions: ProvQuestion[];
  figures?: Array<{ src: string }>;
  source: string;
}

interface Row {
  category: string;
  subject_type: string;
  question_text: string;
  options: unknown;
  correct_answer: string;
  image_url: string | null;
  exam_term: string;
  provpass_num: number;
  q_num: number;
  source: string;
  clean_status: string;
  /**
   * Bildmetadata som JSON: `{"stem":[x0,y0,x1,y1],"aspect":1.69}`.
   *
   * `questions` har ingen kolumn för uppgiftens stambeskärning, och att lägga
   * till en är en migration mot produktionsdatabasen. Fältet är en fritextrubrik
   * för just den här bilden och används inte till något annat — alla rader har
   * det tomt — så beskrivningen av bilden får bo här tills en kolumn behövs på
   * riktigt. `CropView` behöver proportionen för att ge rutan rätt höjd innan
   * bilden laddats.
   */
  image_caption: string | null;
}

function env(name: string): string {
  for (const file of [".env.local", ".env"]) {
    const p = join(ROOT, file);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = line.match(/^([A-Z_]+)\s*=\s*(.*)$/);
      if (m && m[1] === name) return m[2].replace(/^["']|["']$/g, "");
    }
  }
  throw new Error(`${name} saknas i .env.local`);
}

const URL_BASE = env("SUPABASE_URL");
const KEY = env("SUPABASE_SERVICE_ROLE_KEY");

async function rest(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${URL_BASE}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

async function count(query: string): Promise<number> {
  const res = await rest(query, { headers: { Prefer: "count=exact", Range: "0-0" } });
  const cr = res.headers.get("content-range") ?? "";
  return Number(cr.split("/")[1] ?? 0);
}

/**
 * Svarsalternativen i den form läsvägarna redan förstår.
 *
 * Textuppgifter får sin text. Bilduppgifter har alternativen inne i bilden, så
 * de får bokstaven som text — det är exakt vad kortet visar idag — plus
 * `crop`, så att samma rad kan rita riktiga knappar när uppgiftskortet lärt sig
 * det. Utan `text` skulle `train.tsx` mappa objektet med `String(o)` och skriva
 * ut "[object Object]".
 */
function buildOptions(q: ProvQuestion, imageUrl: string | null): Array<Record<string, unknown>> {
  if (q.alternatives?.length) {
    return q.alternatives.map((text, i) => ({ id: LETTERS[i], text }));
  }
  const n = Math.max(q.altCount ?? 4, LETTERS.indexOf(q.answer) + 1);
  // Beskärningarna är räknade mot uppgiftens eget utsnitt. Får raden i stället
  // DTK:s diagramuppslag som bild pekar samma koordinater ut fel yta helt, så
  // då åker de inte med alls.
  const cropsApply = imageUrl !== null && imageUrl === q.image;
  return LETTERS.slice(0, n).map((id) => {
    const crop = cropsApply ? q.crops?.[id] : undefined;
    return crop ? { id, text: id, crop } : { id, text: id };
  });
}

/**
 * `questions` har ett unikt index på `lower(question_text)`. Det passar
 * textuppgifter — samma ord ska inte ligga två gånger i banken — men inte
 * bilduppgifter, där texten bara är en stubb bredvid bilden som bär uppgiften.
 * Fem skilda XYZ-uppgifter frågar "Hur stor är vinkeln v?".
 *
 * De 17 fallen får därför provtillfället tillagt, och bara de: att märka alla
 * 1 537 bilduppgifter hade lagt brus på rader som inte behöver det. Indata är
 * sorterad, så samma rad får samma text vid varje körning.
 */
function dedupe(rows: Row[]): number {
  const seen = new Set<string>();
  let renamed = 0;
  for (const r of rows) {
    const key = r.question_text.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      continue;
    }
    r.question_text = `${r.question_text} (${r.exam_term}, provpass ${r.provpass_num}, uppgift ${r.q_num})`;
    seen.add(r.question_text.toLowerCase());
    renamed++;
  }
  return renamed;
}

function collect(): { rows: Row[]; skipped: Record<string, number> } {
  const rows: Row[] = [];
  const skipped: Record<string, number> = {};
  const bump = (k: string) => (skipped[k] = (skipped[k] ?? 0) + 1);

  for (const name of readdirSync(DATA).sort()) {
    if (!/^\d{4}(ht|vt)[ab]?-\d\.json$/.test(name)) continue;
    const pass = JSON.parse(readFileSync(join(DATA, name), "utf8")) as ProvPass;
    for (const q of pass.questions ?? []) {
      if (!MATH.has(q.delprov)) continue;
      if (q.figureMissing) {
        bump("bild saknas hos UHR (vt2012)");
        continue;
      }
      if (!q.text && !q.image) {
        bump("varken text eller bild");
        continue;
      }
      if (!q.answer) {
        bump("saknar facit");
        continue;
      }
      const imageUrl =
        (q.figure !== undefined ? pass.figures?.[q.figure]?.src : undefined) ?? q.image ?? null;
      rows.push({
        category: q.delprov,
        subject_type: "math",
        question_text:
          q.text ?? `${q.delprov}-uppgift ${q.nr}, ${pass.label} provpass ${pass.pass}`,
        options: buildOptions(q, imageUrl),
        correct_answer: q.answer,
        // DTK läses ur ett diagramuppslag som ligger för sig i passet, inte i
        // uppgiftens eget utsnitt — utan det går uppgiften inte att svara på.
        // Alla 719 DTK har ett diagram; 77 har dessutom ett eget utsnitt, men
        // deras frågetext finns i question_text, så diagrammet är det som måste
        // med när raden bara rymmer en bild.
        image_url: imageUrl,
        image_caption:
          imageUrl !== null && imageUrl === q.image && q.crops?.stem && q.imageAspect
            ? JSON.stringify({ stem: q.crops.stem, aspect: q.imageAspect })
            : null,
        exam_term: pass.term,
        provpass_num: pass.pass,
        q_num: q.nr,
        source: pass.source,
        // Läsvägarna filtrerar matte på clean_status = 'ok'. Arkivuppgifterna är
        // hämtade ur häftena och behöver ingen städning — de är redan rena.
        clean_status: "ok",
      });
    }
  }
  return { rows, skipped };
}

/** Alla question_id som matchhistorik eller rapporter pekar på. */
async function referencedIds(): Promise<Set<string>> {
  const out = new Set<string>();
  for (const table of ["match_questions", "match_answers", "question_reports"]) {
    for (let from = 0; ; from += 1000) {
      const res = await rest(`${table}?select=question_id`, {
        headers: { Range: `${from}-${from + 999}` },
      });
      if (!res.ok) throw new Error(`${table}: ${res.status} ${await res.text()}`);
      const page = (await res.json()) as Array<{ question_id: string | null }>;
      for (const r of page) if (r.question_id) out.add(r.question_id);
      if (page.length < 1000) break;
    }
  }
  return out;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const { rows, skipped } = collect();
  const renamed = dedupe(rows);

  const perCat: Record<string, number> = {};
  const withImage: Record<string, number> = {};
  const withCrops: Record<string, number> = {};
  for (const r of rows) {
    perCat[r.category] = (perCat[r.category] ?? 0) + 1;
    if (r.image_url) withImage[r.category] = (withImage[r.category] ?? 0) + 1;
    const opts = r.options as Array<Record<string, unknown>>;
    if (opts.some((o) => o.crop)) withCrops[r.category] = (withCrops[r.category] ?? 0) + 1;
  }

  console.log("Att importera:", rows.length);
  console.log("  per kategori :", perCat);
  console.log("  med bild     :", withImage);
  console.log("  med crops    :", withCrops);
  if (Object.keys(skipped).length) console.log("  överhoppade  :", skipped);

  console.log(`  fick provreferens för att texten återkom: ${renamed}`);

  const existingArchive = await count("questions?select=id&exam_term=not.is.null");

  // De skrapade matteraderna måste bort ur vägen *innan* importen: det unika
  // indexet på lower(question_text) gäller även rader som pensionerats, och
  // arkivets version av en uppgift har ofta exakt samma text som den skrapade.
  const scrapedRes = await rest(
    "questions?select=id,question_text&category=in.(XYZ,KVA,NOG,DTK)&exam_term=is.null",
  );
  const scraped = (await scrapedRes.json()) as Array<{ id: string; question_text: string }>;
  const referenced = await referencedIds();
  const archiveTexts = new Set(rows.map((r) => r.question_text.toLowerCase()));

  // Orefererade rader går att radera. De som matchhistorik eller rapporter
  // pekar på behålls — annars försvinner gamla matcher — och pensioneras.
  const drop = scraped.filter((r) => !referenced.has(r.id));
  const retire = scraped.filter((r) => referenced.has(r.id));
  const clash = retire.filter((r) => archiveTexts.has((r.question_text ?? "").toLowerCase()));

  console.log(`\nI databasen nu: ${existingArchive} arkivrader, ${scraped.length} skrapade matterader`);
  console.log(`  orefererade, raderas      : ${drop.length}`);
  console.log(`  refererade, pensioneras   : ${retire.length}`);
  console.log(`  ...varav texten krockar   : ${clash.length} (får prefix så indexet släpper)`);

  if (!apply) {
    console.log("\nExempel på rad:");
    console.log(JSON.stringify(rows[0], null, 1).slice(0, 500));
    const imgRow = rows.find((r) =>
      (r.options as Array<Record<string, unknown>>).some((o) => o.crop),
    );
    if (imgRow) {
      console.log("\nExempel på bilduppgift med crops:");
      console.log(JSON.stringify(imgRow, null, 1).slice(0, 560));
    }
    console.log("\nTORRKÖRNING - inget skrevs. Kör med --apply.");
    return;
  }

  // 1. Rensa tidigare arkivimport (markören är exam_term, precis som förut).
  if (existingArchive > 0) {
    const del = await rest("questions?exam_term=not.is.null", { method: "DELETE" });
    if (!del.ok) throw new Error(`DELETE misslyckades: ${del.status} ${await del.text()}`);
    console.log(`Raderade ${existingArchive} tidigare arkivrader`);
  }

  // 2. Rensa undan de skrapade.
  for (let i = 0; i < drop.length; i += 100) {
    const ids = drop.slice(i, i + 100).map((r) => r.id);
    const res = await rest(`questions?id=in.(${ids.join(",")})`, { method: "DELETE" });
    if (!res.ok) throw new Error(`DELETE skrapade: ${res.status} ${await res.text()}`);
  }
  for (const r of clash) {
    // Raden visas aldrig i banken igen, men syns i gamla matchgenomgångar.
    // Prefixet säger vad den är i stället för att texten bara byts ut.
    const res = await rest(`questions?id=eq.${r.id}`, {
      method: "PATCH",
      body: JSON.stringify({ question_text: `[utgången] ${r.question_text}` }),
      headers: { Prefer: "return=minimal" },
    });
    if (!res.ok) throw new Error(`PATCH text: ${res.status} ${await res.text()}`);
  }
  if (retire.length) {
    for (let i = 0; i < retire.length; i += 100) {
      const ids = retire.slice(i, i + 100).map((r) => r.id);
      const res = await rest(`questions?id=in.(${ids.join(",")})`, {
        method: "PATCH",
        body: JSON.stringify({ clean_status: "retired" }),
        headers: { Prefer: "return=minimal" },
      });
      if (!res.ok) throw new Error(`PATCH retired: ${res.status} ${await res.text()}`);
    }
  }

  // 2. Infoga i satser.
  const SIZE = 100;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += SIZE) {
    const batch = rows.slice(i, i + SIZE);
    const res = await rest("questions", {
      method: "POST",
      body: JSON.stringify(batch),
      headers: { Prefer: "return=minimal" },
    });
    if (!res.ok) throw new Error(`Sats ${i}: ${res.status} ${await res.text()}`);
    inserted += batch.length;
    if (inserted % 500 === 0 || inserted === rows.length) {
      console.log(`  ${inserted}/${rows.length}`);
    }
  }

  console.log(`Pensionerade ${retire.length}, raderade ${drop.length} skrapade matterader`);
  console.log("\nKlart.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
