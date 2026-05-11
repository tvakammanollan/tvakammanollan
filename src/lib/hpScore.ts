export type HpScoreEstimate = {
  score: string;
  range: string;
  description: string;
};

const ELO_TO_HP_MAP = [
  { minElo: 0,    maxElo: 749,  score: "0.6", range: "0.5–0.7", description: "Under godkänt" },
  { minElo: 750,  maxElo: 899,  score: "0.8", range: "0.7–0.9", description: "Under godkänt" },
  { minElo: 900,  maxElo: 1049, score: "1.0", range: "0.9–1.1", description: "Precis godkänt" },
  { minElo: 1050, maxElo: 1199, score: "1.2", range: "1.1–1.3", description: "Godkänt" },
  { minElo: 1200, maxElo: 1349, score: "1.4", range: "1.3–1.5", description: "Bra resultat" },
  { minElo: 1350, maxElo: 1499, score: "1.6", range: "1.5–1.7", description: "Mycket bra" },
  { minElo: 1500, maxElo: 1649, score: "1.8", range: "1.7–1.9", description: "Utmärkt" },
  { minElo: 1650, maxElo: 9999, score: "2.0", range: "1.9–2.0", description: "Toppresultat" },
];

export function estimateHpScore(elo: number): HpScoreEstimate {
  const entry =
    ELO_TO_HP_MAP.find((e) => elo >= e.minElo && elo <= e.maxElo) ?? ELO_TO_HP_MAP[0];
  return { score: entry.score, range: entry.range, description: entry.description };
}

export function combinedHpScore(eloVerbal: number, eloMath: number): string {
  const v = parseFloat(estimateHpScore(eloVerbal).score);
  const m = parseFloat(estimateHpScore(eloMath).score);
  return (((v + m) / 2)).toFixed(1);
}
