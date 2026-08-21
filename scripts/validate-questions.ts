/**
 * Går hela frågebanken att spela?
 *
 * Kör reglerna i `src/lib/question-validity.ts` mot varje rad i `questions`
 * och skriver en rapport per delprov. Reglerna bor där och inte här, så att de
 * går att enhetstesta utan databas — se `question-validity.test.ts`.
 *
 *   bun run scripts/validate-questions.ts              # alla delprov
 *   bun run scripts/validate-questions.ts XYZ KVA      # bara några
 *   bun run scripts/validate-questions.ts --exempel 5  # visa fem trasiga rader
 *
 * Avslutar med kod 1 om något delprov har trasiga uppgifter, så den kan
 * användas som CI-steg. Kräver SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 */
import {
  questionFaults,
  type QuestionFault,
  type ValidatableQuestion,
} from "../src/lib/question-validity";

const URL_ = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL_ || !KEY) {
  console.error("Saknar SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (ligger i .env.local).");
  process.exit(2);
}

const args = process.argv.slice(2);
const exempelIdx = args.indexOf("--exempel");
const antalExempel = exempelIdx >= 0 ? Number(args[exempelIdx + 1] ?? 3) : 3;
const kategorier = args.filter((a) => /^[A-ZÄÖÅ]{3}$/.test(a));
const ALLA = ["ORD", "MEK", "LAS", "ELF", "XYZ", "KVA", "NOG", "DTK"];
const valda = kategorier.length > 0 ? kategorier : ALLA;

const FÄLT =
  "id,category,exam_term,provpass_num,q_num,question_text,options,correct_answer,image_url,image_caption";

async function hämta(kategori: string): Promise<ValidatableQuestion[]> {
  const ut: ValidatableQuestion[] = [];
  // PostgREST svarar med max ~1000 rader — sidbrytning krävs.
  for (let offset = 0; ; offset += 500) {
    const svar = await fetch(
      // `retired` serveras aldrig (duellen kräver clean_status=ok, träningen
      // filtrerar bort retired) — en pensionerad rad är inte ett fel att laga,
      // den är resultatet av en lagning.
      `${URL_}/rest/v1/questions?select=${FÄLT}&category=eq.${kategori}` +
        `&clean_status=neq.retired&limit=500&offset=${offset}`,
      { headers: { apikey: KEY!, Authorization: `Bearer ${KEY}` } },
    );
    if (!svar.ok) throw new Error(`${kategori}: ${svar.status} ${await svar.text()}`);
    const sida = (await svar.json()) as ValidatableQuestion[];
    ut.push(...sida);
    if (sida.length < 500) break;
  }
  return ut;
}

const totalt: Record<QuestionFault, number> = {} as Record<QuestionFault, number>;
let trasigaTotalt = 0;
let misslyckades = false;
let radertotalt = 0;
const exempel: Array<{ q: ValidatableQuestion; fel: QuestionFault[] }> = [];
const exempelAlla: Array<{ q: ValidatableQuestion; fel: QuestionFault[] }> = [];

for (const kategori of valda) {
  const rader = await hämta(kategori);
  radertotalt += rader.length;
  const perFel: Record<string, number> = {};
  let trasiga = 0;

  for (const rad of rader) {
    const fel = questionFaults(rad);
    if (fel.length === 0) continue;
    // Räknas som trasig först efter arkivavstämningen längst ned.
    const bara_bildreserv = fel.length === 1 && fel[0] === "alternativ_endast_i_delad_bild";
    if (!bara_bildreserv) {
      trasiga++;
      trasigaTotalt++;
    }
    if (exempel.length < antalExempel) exempel.push({ q: rad, fel });
    exempelAlla.push({ q: rad, fel });
    for (const f of fel) {
      perFel[f] = (perFel[f] ?? 0) + 1;
      totalt[f] = (totalt[f] ?? 0) + 1;
    }
  }

  const status = trasiga === 0 ? "OK " : "FEL";
  console.log(
    `${status} ${kategori.padEnd(4)} ${String(rader.length).padStart(5)} uppgifter, ` +
      `${String(trasiga).padStart(4)} trasiga` +
      (trasiga
        ? `  (${Object.entries(perFel)
            .map(([k, v]) => `${k}:${v}`)
            .join(", ")})`
        : ""),
  );
}

console.log(
  `\n${radertotalt} uppgifter granskade, ${trasigaTotalt} trasiga` +
    (trasigaTotalt
      ? `\nfel per typ: ${Object.entries(totalt)
          .map(([k, v]) => `${k}=${v}`)
          .join(", ")}`
      : ""),
);

for (const { q, fel } of exempel) {
  console.log(`\n  ${q.category} ${q.exam_term ?? "?"} uppgift ${q.q_num ?? "?"} (${q.id})`);
  console.log(`    fel: ${fel.join(", ")}`);
  console.log(`    bild: ${q.image_url ?? "saknas"}  facit: ${q.correct_answer ?? "saknas"}`);
  console.log(`    alternativ: ${JSON.stringify(q.options)?.slice(0, 160)}`);
}

/* ── Andra passet: stäm av mot arkivet ────────────────────────────────────
   `alternativ_endast_i_delad_bild` betyder "alternativen står i bilden".
   Det är spelbart när bilden är uppgiftens EGEN, och trasigt när den delas
   med andra uppgifter — DTK:s `image_url` är diagramuppslaget, som flera
   uppgifter i samma provpass pekar på. Skillnaden syns bara mot arkivet. */
const delad = exempelAlla.filter((e) => e.fel.includes("alternativ_endast_i_delad_bild"));
if (delad.length > 0) {
  const { readFileSync, existsSync } = await import("node:fs");
  let egenBild = 0;
  const delarBild: typeof delad = [];
  for (const e of delad) {
    const term = e.q.exam_term;
    if (!term) continue;
    // Frågenummer är inte unikt per TERMIN — det är unikt per PROVPASS
    // (varje kvantitativt pass har sina egna 1–40). Att leta i "alla pass för
    // terminen" utan att kolla `provpass_num` kan råka hitta en annan
    // uppgift med samma nummer i ett annat pass och jämföra fel bild mot
    // fel arkivrad — exakt den bugg det här skriptet en gång skulle avslöja.
    let arkivfråga: { image?: string } | undefined;
    const pass = e.q.provpass_num;
    if (pass != null) {
      const fil = `src/data/prov/${term}-${pass}.json`;
      if (existsSync(fil)) {
        const data = JSON.parse(readFileSync(fil, "utf8")) as {
          questions?: Array<{ nr?: number; delprov?: string; image?: string }>;
        };
        arkivfråga = (data.questions ?? []).find(
          (q) => q.nr === e.q.q_num && q.delprov === e.q.category,
        );
      }
    }
    // Bilden att jämföra mot arkivet är `image_caption.optionsImage` när den
    // finns (DTK, efter 2026-08-21-fixen) — annars `image_url`, som gällde
    // innan (XYZ/KVA). De två bär aldrig samma sak samtidigt.
    let egenBildFältet: string | undefined;
    if (typeof e.q.image_caption === "string" && e.q.image_caption.startsWith("{")) {
      try {
        const parsed = JSON.parse(e.q.image_caption) as { optionsImage?: unknown };
        if (typeof parsed.optionsImage === "string") egenBildFältet = parsed.optionsImage;
      } catch {
        /* ingen JSON — inget fel, faller vidare till image_url */
      }
    }
    egenBildFältet ??= e.q.image_url ?? undefined;
    if (arkivfråga?.image && arkivfråga.image === egenBildFältet) egenBild++;
    else delarBild.push(e);
  }
  console.log(
    `\n${delad.length} uppgifter har alternativen i bilden:\n` +
      `  ${egenBild} pekar på sin EGEN bild (dokumenterat reservläge, spelbart)\n` +
      `  ${delarBild.length} pekar på en ANNAN bild än uppgiftens (alternativen syns inte)`,
  );
  for (const e of delarBild.slice(0, 5)) {
    console.log(
      `    ${e.q.category} ${e.q.exam_term} uppgift ${e.q.q_num}: raden har ${e.q.image_url}`,
    );
  }
  if (delarBild.length > 0) misslyckades = true;
}

/* ── Tredje passet: pekar bilderna på filer som finns? ────────────────────
   `image_url` kan peka på en fil som aldrig publicerades. Vårprovet 2012:s
   kvantitativa del lades bara ut som webbsidor och diagrammen arkiverades
   aldrig; arkivfilerna städades av `fix_missing_images.py`, men raderna i
   `questions` behöll sina döda referenser. En DTK-uppgift utan sitt diagram
   går inte att besvara. Kontrollen kräver filsystemet och kan därför inte
   ligga i de rena reglerna. */
{
  const { existsSync } = await import("node:fs");
  const döda = new Map<string, number>();
  for (const { q } of exempelAlla.length ? exempelAlla : []) void q;
  // Gå igenom alla rader igen — billigt, de ligger redan i minnet per kategori.
  // (exempelAlla innehåller bara trasiga; bilderna måste kollas på allt.)
  let kollade = 0;
  for (const kategori of valda) {
    for (const rad of await hämta(kategori)) {
      if (!rad.image_url) continue;
      kollade++;
      if (!existsSync(`public${rad.image_url}`)) {
        döda.set(rad.image_url, (döda.get(rad.image_url) ?? 0) + 1);
      }
    }
  }
  const radermedDöd = [...döda.values()].reduce((a, b) => a + b, 0);
  console.log(
    `\n${kollade} uppgifter har en bild; ${döda.size} bildfiler saknas på disk ` +
      `(${radermedDöd} rader pekar på dem)`,
  );
  for (const [fil, antal] of [...döda].slice(0, 8)) console.log(`    ${fil}  (${antal} rader)`);
  if (radermedDöd > 0) misslyckades = true;
}

process.exit(trasigaTotalt > 0 || misslyckades ? 1 : 0);
