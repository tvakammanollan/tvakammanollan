import * as cheerio from "cheerio";
import type { Competitor, ScrapedCompetitor, ScrapedPage } from "./types.ts";
import { getProviderMode } from "./provider.ts";

const UA = "Tvakommanollan-Analysis/1.0 (competitive research)";
const DELAY_MS = 1200;

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function parsePage(url: string, html: string): ScrapedPage {
  const $ = cheerio.load(html);

  const title = $("title").first().text().trim();
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() ??
    $('meta[property="og:description"]').attr("content")?.trim() ??
    "";

  const headings: string[] = [];
  $("h1, h2, h3").each((_, el) => {
    const text = $(el).text().trim();
    if (text) headings.push(text);
  });

  const bodyText = $("body").text().toLowerCase();
  const pricePatterns = [/\d+\s*kr/g, /gratis/g, /prenumeration/g, /premium/g, /fri\s+provperiod/g];
  const priceText: string[] = [];
  for (const pattern of pricePatterns) {
    const matches = bodyText.match(pattern);
    if (matches) priceText.push(...matches.slice(0, 3));
  }

  const hasAnalytics =
    html.includes("google-analytics") ||
    html.includes("gtag(") ||
    html.includes("_gaq") ||
    html.includes("gtm.js");
  const hasAds = html.includes("adsbygoogle") || html.includes("adsense");

  return { url, title, metaDescription, headings: headings.slice(0, 10), priceText, hasAnalytics, hasAds };
}

async function scrapeCompetitor(competitor: Competitor): Promise<ScrapedCompetitor> {
  const base = competitor.url.replace(/\/$/, "");
  const pagePaths = ["/", "/pris", "/priser", "/premium", "/om", "/om-oss", "/features", "/guide"];

  const pages: ScrapedPage[] = [];

  for (const path of pagePaths.slice(0, 4)) {
    const url = path === "/" ? base : `${base}${path}`;
    const html = await fetchPage(url);
    if (html) {
      pages.push(parsePage(url, html));
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  return { ...competitor, pages, scrapedAt: new Date().toISOString() };
}

export async function scrapeCompetitors(competitors: Competitor[]): Promise<ScrapedCompetitor[]> {
  const mode = getProviderMode();

  // I pre-filled läge är scraping ej nödvändig — analysen är redan klar
  if (mode === "prefilled") {
    console.log("[scrape] Pre-filled läge — hoppar över scraping");
    return [];
  }

  console.log(`[scrape] Skrapar ${competitors.length} konkurrenter...`);
  const results: ScrapedCompetitor[] = [];

  for (const competitor of competitors) {
    console.log(`  → ${competitor.name} (${competitor.url})`);
    const scraped = await scrapeCompetitor(competitor);
    results.push(scraped);
    console.log(`     ${scraped.pages.length} sidor hämtade`);
  }

  return results;
}
