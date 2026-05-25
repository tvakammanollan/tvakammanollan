import type { ScrapedCompetitor, AnalysisResult } from "./types.ts";
import { getProviderMode, loadPrefilledAnalysis, analyzeViaApi } from "./provider.ts";

export async function analyzeCompetitors(scraped: ScrapedCompetitor[]): Promise<AnalysisResult> {
  const mode = getProviderMode();
  console.log(`[analyze] Läge: ${mode}`);

  if (mode === "prefilled") {
    const data = loadPrefilledAnalysis();
    console.log(`[analyze] Läste in analys med ${data.competitors.length} konkurrenter`);
    return data;
  }

  console.log("[analyze] Anropar Claude API...");
  const result = await analyzeViaApi(scraped);
  result.generatedAt = new Date().toISOString();
  console.log(`[analyze] Analys klar — ${result.competitors.length} konkurrenter`);
  return result;
}
