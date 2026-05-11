export type RankTier = {
  name: string;
  tier: string;
  minElo: number;
  maxElo: number;
  bgColor: string;
  textColor: string;
  borderColor: string;
  icon: string;
};

export const RANK_TIERS: RankTier[] = [
  {
    tier: "brons",
    name: "Brons – Nybörjare",
    minElo: 600,
    maxElo: 999,
    bgColor: "#a0704a",
    textColor: "#ffffff",
    borderColor: "#8a5e3a",
    icon: "🥉",
  },
  {
    tier: "silver",
    name: "Silver – Utmanare",
    minElo: 1000,
    maxElo: 1199,
    bgColor: "#8a9ba8",
    textColor: "#ffffff",
    borderColor: "#6b7f8a",
    icon: "🥈",
  },
  {
    tier: "guld",
    name: "Guld – Aspirant",
    minElo: 1200,
    maxElo: 1399,
    bgColor: "#d4a017",
    textColor: "#1a1a1a",
    borderColor: "#b88c12",
    icon: "🥇",
  },
  {
    tier: "platina",
    name: "Platina – Mästare",
    minElo: 1400,
    maxElo: 1599,
    bgColor: "#a8c0cc",
    textColor: "#1a1a1a",
    borderColor: "#8aaab8",
    icon: "💎",
  },
  {
    tier: "diamant",
    name: "Diamant – Elite",
    minElo: 1600,
    maxElo: 9999,
    bgColor: "#1a5c3a",
    textColor: "#d4a017",
    borderColor: "#154d30",
    icon: "✦",
  },
];

export function getRankForElo(elo: number): RankTier {
  return RANK_TIERS.find((r) => elo >= r.minElo && elo <= r.maxElo) ?? RANK_TIERS[0];
}

export function getNextRank(elo: number): RankTier | null {
  const current = getRankForElo(elo);
  const idx = RANK_TIERS.findIndex((r) => r.tier === current.tier);
  return idx >= 0 && idx < RANK_TIERS.length - 1 ? RANK_TIERS[idx + 1] : null;
}

export function getEloProgressInTier(elo: number): number {
  const rank = getRankForElo(elo);
  if (rank.tier === "diamant") return 100;
  const range = rank.maxElo - rank.minElo + 1;
  return Math.max(0, Math.min(100, Math.round(((elo - rank.minElo) / range) * 100)));
}
