export interface Competitor {
  name: string;
  url: string;
  description: string;
}

export interface ScrapedPage {
  url: string;
  title: string;
  metaDescription: string;
  headings: string[];
  priceText: string[];
  hasAnalytics: boolean;
  hasAds: boolean;
}

export interface ScrapedCompetitor extends Competitor {
  pages: ScrapedPage[];
  scrapedAt: string;
}

export interface DimensionScore {
  score: number; // 1–5
  notes: string;
  strengths: string[];
  weaknesses: string[];
}

export interface CompetitorAnalysis {
  name: string;
  url: string;
  description: string;
  seo: DimensionScore;
  features: DimensionScore;
  ux: DimensionScore;
  pricing: DimensionScore;
  overallScore: number;
}

export interface AnalysisResult {
  generatedAt: string;
  summary: string;
  competitors: CompetitorAnalysis[];
  opportunities: string[];
  hpkampenStrengths: string[];
}
