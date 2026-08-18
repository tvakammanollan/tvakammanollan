#!/usr/bin/env tsx
/**
 * Konkurrentanalys-workflow för tvakommanollan.se
 *
 * Alt 1 (standard): Kör i Claude Code-konversationen — ingen API-nyckel behövs.
 *   Claude gör discovery + analys och sparar till analysis-data.json.
 *   Det här scriptet läser JSON och genererar PDF.
 *
 * Alt 2 (automatiserbart): Sätt ANTHROPIC_API_KEY i miljön/.env.
 *   Scriptet gör hela flödet självständigt.
 *
 * Kör: npx tsx scripts/competition-analysis/index.ts
 */

import { join } from "node:path";
import { getProviderMode } from "./provider.ts";
import { discoverCompetitors } from "./discover.ts";
import { scrapeCompetitors } from "./scrape.ts";
import { analyzeCompetitors } from "./analyze.ts";
import { generateReport } from "./report.ts";

const OUTPUT_DIR = join(import.meta.dirname);

async function main() {
  const mode = getProviderMode();
  console.log(`\n═══ tvakommanollan.se Konkurrentanalys ═══`);
  console.log(`Läge: ${mode === "api" ? "🤖 Claude API" : "📋 Pre-filled (Claude Code)"}`);
  console.log(`Starttid: ${new Date().toLocaleString("sv-SE")}\n`);

  // Fas 1: Hitta konkurrenter
  console.log("── Fas 1: Discovery ──");
  const competitors = await discoverCompetitors();
  console.log(`   ${competitors.length} konkurrenter identifierade\n`);

  // Fas 2: Skrapa (bara i API-läge)
  console.log("── Fas 2: Scraping ──");
  const scraped = await scrapeCompetitors(competitors);

  // Fas 3: Analysera
  console.log("\n── Fas 3: Analys ──");
  const analysis = await analyzeCompetitors(scraped);

  // Fas 4: Generera rapport
  console.log("\n── Fas 4: Rapport ──");
  const pdfPath = await generateReport(analysis, OUTPUT_DIR);

  console.log(`\n✓ Klar! Rapport sparad:\n  ${pdfPath}\n`);
}

main().catch((err) => {
  console.error("Fel:", err.message);
  process.exit(1);
});
