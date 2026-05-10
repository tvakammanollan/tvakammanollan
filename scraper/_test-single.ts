import { writeFileSync } from "node:fs";
// Snabbtest: kör processTermin på var-2024 för att verifiera parsern
process.argv = ["bun", "scrape", "--single"];

// Kopiera nödvändiga delar från scrape-hp-questions.ts
import { PDFParse } from "pdf-parse";

const UA = "HPKampen-Bot/1.0 (educational project)";
async function fetchPdfText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return (await new PDFParse({ data: buf }).getText()).text;
}

// Re-importera funktioner via dynamisk eval skulle vara messy – kör istället
// hela scrapern men med hårdkodad lista
const t = { slug: "var-2024", label: "var-2024", year: 2024, term: "vt" as const };
const base = `https://www.hogskoleprovet.nu/public/uploads/hogskoleprovet/hogskoleprov/${t.slug}`;

// Importera parser-funktioner från huvudfilen
const mod = await import("./scrape-hp-questions.ts" as string).catch(() => null);
console.log("(modulen kör main() automatiskt vilket vi inte vill — använd direkt anrop istället)");
