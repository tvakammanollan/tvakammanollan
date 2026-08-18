export type HpScoreEstimate = {
  score: string;
  range: string;
  description: string;
};

const ELO_TO_HP_MAP = [
  { minElo: 0, maxElo: 749, score: "0.6", range: "0.5–0.7", description: "Under godkänt" },
  { minElo: 750, maxElo: 899, score: "0.8", range: "0.7–0.9", description: "Under godkänt" },
  { minElo: 900, maxElo: 1049, score: "1.0", range: "0.9–1.1", description: "Godkänt" },
  { minElo: 1050, maxElo: 1199, score: "1.2", range: "1.1–1.3", description: "Godkänt" },
  { minElo: 1200, maxElo: 1349, score: "1.4", range: "1.3–1.5", description: "Bra resultat" },
  { minElo: 1350, maxElo: 1499, score: "1.6", range: "1.5–1.7", description: "Mycket bra" },
  { minElo: 1500, maxElo: 1649, score: "1.8", range: "1.7–1.9", description: "Utmärkt" },
  { minElo: 1650, maxElo: 9999, score: "2.0", range: "1.9–2.0", description: "Toppresultat" },
];

export function estimateHpScore(elo: number): HpScoreEstimate {
  const entry = ELO_TO_HP_MAP.find((e) => elo >= e.minElo && elo <= e.maxElo) ?? ELO_TO_HP_MAP[0];
  return { score: entry.score, range: entry.range, description: entry.description };
}

export function combinedHpScore(eloVerbal: number, eloMath: number): string {
  const v = parseFloat(estimateHpScore(eloVerbal).score);
  const m = parseFloat(estimateHpScore(eloMath).score);
  return ((v + m) / 2).toFixed(1);
}

/**
 * Trolig normering för ETT delprov utifrån andel rätt.
 *
 * Skild från `estimateHpScore`, som går från ELO. Den här används direkt
 * efter en match, där det enda vi vet är hur många av frågorna som blev
 * rätt. Låg tidigare som 20 rader nästlade ternärer inne i resultatskärmen.
 *
 * Grov uppskattning: den riktiga normeringen sätts per provtillfälle och
 * varierar med provets svårighet.
 */
const ACCURACY_TO_NORM: ReadonlyArray<{ minPct: number; norm: number }> = [
  { minPct: 95, norm: 2.0 },
  { minPct: 90, norm: 1.9 },
  { minPct: 82, norm: 1.7 },
  { minPct: 75, norm: 1.5 },
  { minPct: 67, norm: 1.3 },
  { minPct: 58, norm: 1.1 },
  { minPct: 50, norm: 0.9 },
  { minPct: 40, norm: 0.7 },
  { minPct: 30, norm: 0.5 },
  { minPct: 0, norm: 0.3 },
];

export function normeringForAccuracy(correct: number, total: number): number {
  if (total <= 0) return 0.3;
  const pct = (correct / total) * 100;
  return (
    ACCURACY_TO_NORM.find((e) => pct >= e.minPct) ?? ACCURACY_TO_NORM[ACCURACY_TO_NORM.length - 1]
  ).norm;
}

/** Kvalitativ etikett för en sammanlagd HP-poäng (0,00–2,00). */
export function hpScoreLabel(score: number): string {
  if (score < 0.9) return "Under godkänt";
  if (score < 1.3) return "Godkänt";
  if (score < 1.5) return "Bra resultat";
  if (score < 1.7) return "Mycket bra";
  if (score < 1.9) return "Utmärkt";
  return "Toppresultat";
}
