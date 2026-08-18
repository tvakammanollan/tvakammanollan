/**
 * fetch-ord-definitions.ts
 *
 * Hämtar definitioner från svenska.se/SAOL för alla ORD-frågor som saknar definition.
 * Använder puppeteer (redan installerat) för att rendera JS-sidan.
 *
 * Körning:
 *   bun run scraper/fetch-ord-definitions.ts           # Kör alla ord (~9 000)
 *   bun run scraper/fetch-ord-definitions.ts --test    # Kör bara 5 ord för att verifiera
 *   bun run scraper/fetch-ord-definitions.ts --resume  # Hoppar över ord med definition
 *
 * Kräver VITE_SUPABASE_URL och SUPABASE_SERVICE_ROLE_KEY i .env (bun laddar .env automatiskt)
 */

import puppeteer, { type Browser } from "puppeteer";
import { createClient } from "@supabase/supabase-js";
import { appendFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Saknar VITE_SUPABASE_URL eller SUPABASE_SERVICE_ROLE_KEY i .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const GAPS_LOG = join(import.meta.dirname, "definition-gaps.log");
const DELAY_MS = 2000;
const TEST_LIMIT = 5;

// Selektorer att pröva i ordning — första träff vinner
const DEF_SELECTORS = [
  ".superlemma .def",
  ".ordartikel .def",
  ".superlemma .definition",
  ".lexem .def",
  ".artikelblock .def",
  "article .def",
  ".def",
  ".definition",
];

async function fetchDefinition(
  browser: Browser,
  word: string
): Promise<string | null> {
  const url = `https://svenska.se/saol/?sok=${encodeURIComponent(word)}`;
  const page = await browser.newPage();

  try {
    await page.setUserAgent("Tvakommanollan-Bot/1.0 (educational project)");
    await page.goto(url, { waitUntil: "networkidle2", timeout: 20_000 });

    // Vänta kort på att eventuellt lazy-loaded innehåll renderas
    await new Promise((r) => setTimeout(r, 800));

    for (const selector of DEF_SELECTORS) {
      const text = await page.evaluate((sel: string) => {
        const el = document.querySelector(sel);
        return el ? (el as HTMLElement).innerText.trim() : null;
      }, selector);
      if (text && text.length > 5) {
        return text;
      }
    }

    // Fallback: ta all text ur main-elementet, plocka ut första stycket
    const fallback = await page.evaluate(() => {
      const main = document.querySelector("main") ?? document.body;
      const paragraphs = Array.from(main.querySelectorAll("p")).map((p) =>
        (p as HTMLElement).innerText.trim()
      );
      return paragraphs.find((t) => t.length > 20) ?? null;
    });

    return fallback ?? null;
  } catch (err) {
    console.error(`  ✗ Fel vid hämtning av "${word}":`, (err as Error).message);
    return null;
  } finally {
    await page.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isTest = args.includes("--test");
  const isResume = args.includes("--resume");

  console.log("\n═══ Definitions-scraper för ORD-frågor ═══");
  console.log(`Läge: ${isTest ? "TEST (5 ord)" : isResume ? "Resumé (hoppar ifyllda)" : "Full körning"}\n`);

  // Hämta frågor
  let query = supabase
    .from("questions")
    .select("id, question_text")
    .eq("category", "ORD")
    .order("question_text");

  if (isResume) query = query.is("definition", null);
  if (isTest) query = query.limit(TEST_LIMIT);

  const { data: questions, error } = await query;
  if (error) throw new Error(error.message);
  if (!questions || questions.length === 0) {
    console.log("Inga frågor att uppdatera.");
    return;
  }

  console.log(`Hittade ${questions.length} frågor att bearbeta.\n`);

  // Rensa gap-log vid full körning
  if (!isTest && !isResume) {
    writeFileSync(GAPS_LOG, `# Ord utan definition – ${new Date().toISOString()}\n`);
  }

  const browser = await puppeteer.launch({ headless: true });
  let filled = 0;
  let gaps = 0;

  for (let i = 0; i < questions.length; i++) {
    const { id, question_text } = questions[i] as { id: string; question_text: string };
    const word = question_text.trim().toLowerCase();
    const progress = `[${i + 1}/${questions.length}]`;

    process.stdout.write(`${progress} ${word} … `);
    const definition = await fetchDefinition(browser, word);

    if (definition) {
      const { error: updateErr } = await supabase
        .from("questions")
        .update({ definition, definition_source: "svenska.se/saol" })
        .eq("id", id);
      if (updateErr) {
        console.log(`✗ DB-fel: ${updateErr.message}`);
      } else {
        console.log(`✓  "${definition.slice(0, 60)}…"`);
        filled++;
      }
    } else {
      console.log("— (ingen träff)");
      appendFileSync(GAPS_LOG, `${word}\n`);
      gaps++;
    }

    if (i < questions.length - 1) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  await browser.close();

  console.log(`\n───────────────────────────────`);
  console.log(`Klart! ${filled} definitioner sparade, ${gaps} saknas.`);
  if (gaps > 0) {
    console.log(`Saknade ord loggade till: ${GAPS_LOG}`);
  }
}

main().catch((err) => {
  console.error("Oväntat fel:", err);
  process.exit(1);
});
