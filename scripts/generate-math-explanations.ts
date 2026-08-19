/**
 * Genererar lösningar till matteuppgifterna och skriver dem till
 * `questions.explanation`.
 *
 *   bun run scripts/generate-math-explanations.ts                 # torrkörning
 *   bun run scripts/generate-math-explanations.ts --apply         # skriver
 *   bun run scripts/generate-math-explanations.ts --apply --limit 50
 *   bun run scripts/generate-math-explanations.ts --category XYZ
 *
 * VARFÖR
 * `explanation` fanns i tabellen men var NULL på samtliga 12 338 rader
 * (kontrollerat 2026-08-19). Rättningen på mattedelen kunde alltså bara säga
 * "rätt svar: C" — vilket inte lär någon någonting, och som var hela punkt 15
 * i buggfixuppdraget. UI:t har sedan dess en reserv som skriver ut rätt
 * alternativ i klartext (se `ExplanationBlock`), men den riktiga lösningen är
 * att fylla fältet.
 *
 * VAD SOM INTE GÅR ATT GENERERA
 * De flesta XYZ- och KVA-uppgifter ligger som **bildutsnitt** ur provhäftet:
 * `question_text` är PDF-extraktionen och obrukbar (`3 27 x 2 =` där häftet
 * visar en kubikrot), och alternativen är bara bokstäverna A–D. En modell som
 * får den texten hittar på en uppgift och löser den — och en påhittad lösning
 * bredvid ett riktigt facit är sämre än ingen lösning alls. Det här scriptet
 * hoppar därför över dem och redovisar hur många det blev. De kräver att
 * bilden skickas med, vilket är ett eget jobb (`--vision`, ej byggt).
 *
 * SÄKERHETSVENTIL
 * Modellen får facit och ombeds förklara VÄGEN dit. Svarar den att den inte
 * kan lösa uppgiften, eller landar den i ett annat svar än facit, skrivs
 * ingenting — en lösning som motsäger facit är den värsta möjliga produkten.
 */
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const MODEL = "claude-sonnet-5";
const MATH = ["XYZ", "KVA", "NOG", "DTK"] as const;

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const limit = Number(args[args.indexOf("--limit") + 1]) || 200;
const only = args.includes("--category") ? args[args.indexOf("--category") + 1] : null;

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL och SUPABASE_SERVICE_ROLE_KEY krävs (ligger i .env.local).");
  process.exit(1);
}
if (!anthropicKey) {
  console.error("ANTHROPIC_API_KEY krävs. Kostar pengar per uppgift — kör --limit först.");
  process.exit(1);
}

const supabase = createClient(url, key);
const anthropic = new Anthropic({ apiKey: anthropicKey });

interface Row {
  id: string;
  category: string;
  question_text: string;
  options: unknown;
  correct_answer: string;
  image_url: string | null;
}

/** Samma regel som `src/lib/math-question.ts`: bilden är uppgiften. */
function isImageQuestion(row: Row): boolean {
  if (!row.image_url) return false;
  const opts = Array.isArray(row.options) ? row.options : [];
  if (opts.length === 0) return true;
  return opts.every((o, i) => {
    const letter = String.fromCharCode(65 + i);
    const text =
      typeof o === "string" ? o : String((o as { text?: unknown })?.text ?? "");
    return text.trim() === "" || text.trim() === letter;
  });
}

function optionLines(options: unknown): string {
  const opts = Array.isArray(options) ? options : [];
  return opts
    .map((o, i) => {
      const letter = String.fromCharCode(65 + i);
      const text = typeof o === "string" ? o : String((o as { text?: unknown })?.text ?? "");
      return `${letter}. ${text}`;
    })
    .join("\n");
}

const SYSTEM = `Du skriver lösningar till uppgifter från det svenska högskoleprovets kvantitativa del.

Regler:
- Skriv på svenska, i du-form, som till någon som just svarade fel.
- Visa VÄGEN till svaret, steg för steg. Högst 120 ord.
- Börja med det avgörande steget, inte med att upprepa uppgiften.
- Inga rubriker, ingen punktlista, ingen inledande fras som "Här är lösningen".
- Matematik skrivs som vanlig text eller enkel LaTeX mellan $...$.
- Du får facit. Om din uträkning landar i ett ANNAT svar än facit, eller om
  uppgiften inte går att förstå ur texten, svarar du exakt: KAN_INTE_LÖSA`;

async function explain(row: Row): Promise<string | null> {
  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 600,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Delprov: ${row.category}
Uppgift: ${row.question_text}

Svarsalternativ:
${optionLines(row.options)}

Facit: ${row.correct_answer}`,
      },
    ],
  });
  const text = res.content
    .filter((c): c is { type: "text"; text: string } => c.type === "text")
    .map((c) => c.text)
    .join("")
    .trim();
  if (!text || text.includes("KAN_INTE_LÖSA")) return null;
  return text;
}

async function main() {
  let query = supabase
    .from("questions")
    .select("id, category, question_text, options, correct_answer, image_url")
    .in("category", only ? [only] : MATH)
    .is("explanation", null)
    .limit(limit);

  const { data, error } = await query;
  if (error) {
    console.error("Kunde inte läsa frågorna:", error.message);
    process.exit(1);
  }

  const rows = (data ?? []) as Row[];
  const bild = rows.filter(isImageQuestion);
  const text = rows.filter((r) => !isImageQuestion(r));

  console.log(`${rows.length} uppgifter utan förklaring i urvalet.`);
  console.log(`  ${text.length} med läsbar text — går att förklara`);
  console.log(`  ${bild.length} bildutsnitt — hoppas över (texten är obrukbar)`);
  if (!apply) {
    console.log("\nTorrkörning. Lägg till --apply för att skriva.");
    if (text[0]) {
      const prov = await explain(text[0]);
      console.log(`\nExempel (${text[0].category}):\n${prov ?? "KAN_INTE_LÖSA"}`);
    }
    return;
  }

  let skrivna = 0;
  let avstådda = 0;
  for (const row of text) {
    try {
      const forklaring = await explain(row);
      if (!forklaring) {
        avstådda++;
        continue;
      }
      const { error: upErr } = await supabase
        .from("questions")
        .update({ explanation: forklaring })
        .eq("id", row.id)
        .is("explanation", null);
      if (upErr) {
        console.error(`  ${row.id}: ${upErr.message}`);
        continue;
      }
      skrivna++;
      if (skrivna % 25 === 0) console.log(`  ${skrivna} skrivna…`);
    } catch (e) {
      console.error(`  ${row.id}: ${e instanceof Error ? e.message : e}`);
    }
  }

  console.log(`\nKlart. ${skrivna} skrivna, ${avstådda} avstådda (modellen kunde inte lösa dem).`);
}

void main();
