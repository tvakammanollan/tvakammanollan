import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { AnalysisResult, ScrapedCompetitor, Competitor } from "./types.ts";

const DATA_PATH = join(import.meta.dirname, "analysis-data.json");

export type ProviderMode = "api" | "prefilled";

export function getProviderMode(): ProviderMode {
  return process.env.ANTHROPIC_API_KEY ? "api" : "prefilled";
}

// --- Pre-filled mode: reads data written by Claude Code in conversation ---

export function loadPrefilledAnalysis(): AnalysisResult {
  if (!existsSync(DATA_PATH)) {
    throw new Error(
      "analysis-data.json saknas. Kör analysen i Claude Code-konversationen först, " +
        "eller sätt ANTHROPIC_API_KEY för att köra automatiskt."
    );
  }
  const raw = readFileSync(DATA_PATH, "utf-8");
  return JSON.parse(raw) as AnalysisResult;
}

// --- API mode: Claude API-anrop (aktiveras automatiskt när ANTHROPIC_API_KEY finns) ---

export async function discoverViaApi(): Promise<Competitor[]> {
  const { Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();

  const msg = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content:
          "Lista 10-12 svenska webbplatser som konkurrerar med tvakommanollan.se kring HP-provförberedelse " +
          "(Högskoleprovet). Returnera ENDAST giltig JSON-array: [{name, url, description}]. " +
          "Inkludera bara sajter som faktiskt finns och är relevanta.",
      },
    ],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Claude API returnerade ingen giltig JSON-array");
  return JSON.parse(jsonMatch[0]) as Competitor[];
}

export async function analyzeViaApi(scraped: ScrapedCompetitor[]): Promise<AnalysisResult> {
  const { Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();

  const prompt = `Du är en SEO- och produktanalytiker. Analysera dessa konkurrenter till tvakommanollan.se
(en svensk app för HP-provförberedelse med ELO-ranking, matchmode och spaced repetition).

Konkurrenter (scrapad data):
${JSON.stringify(scraped, null, 2)}

Analysera varje konkurrent ur 4 perspektiv (betyg 1-5 + noter):
1. SEO & synlighet
2. Features & innehåll
3. UX & design
4. Prissättning & affärsmodell

Returnera ENDAST giltig JSON med strukturen:
{
  "generatedAt": "ISO-datum",
  "summary": "2-3 meningar om marknadsläget",
  "competitors": [{
    "name", "url", "description",
    "seo": {"score", "notes", "strengths": [], "weaknesses": []},
    "features": {"score", "notes", "strengths": [], "weaknesses": []},
    "ux": {"score", "notes", "strengths": [], "weaknesses": []},
    "pricing": {"score", "notes", "strengths": [], "weaknesses": []},
    "overallScore"
  }],
  "opportunities": ["möjlighet 1", ...],
  "tvakommanollanStrengths": ["styrka 1", ...]
}`;

  const msg = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Claude API returnerade ingen giltig JSON");
  return JSON.parse(jsonMatch[0]) as AnalysisResult;
}
