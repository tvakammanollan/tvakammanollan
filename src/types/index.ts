/**
 * Rank-stegen. EN källa för rank i hela appen — `EloBadge` (navbar) och
 * `RankBadge` (dashboard) hade tidigare varsin tröskeltabell, så samma ELO
 * visades som "Brons" i navbaren och "Silver" på dashboarden på samma skärm.
 *
 * Färgerna är tonade för mörk yta (`accent` = ren färg för text/ikon,
 * `soft`/`line` = fyllning och kant). Inga solida, mättade pillerknappar:
 * de såg inklistrade ut mot resten av glas-ytorna.
 */
export type RankTier = {
  name: string;
  /** Kort namn utan undertitel — "Guld" i stället för "Guld – Aspirant". */
  shortName: string;
  tier: string;
  minElo: number;
  maxElo: number;
  /** Ren accentfärg: text, ikon, progressfyllning. */
  accent: string;
  /** Bakgrundstint. */
  soft: string;
  /** Kantfärg. */
  line: string;
};

/**
 * Accentfärg per tier-namn. Rank-stegen och utmärkelsernas tiers
 * ("brons"/"silver"/"guld") delar de tre metallfärgerna — de var tidigare
 * skrivna för hand på tre ställen (RANK_TIERS, utmärkelsernas ikonfärger och
 * `TIER_RING` i AchievementsCard) och hann redan glida isär en gång.
 *
 * Bor här och inte i en komponentfil, så att både `lib/`- och UI-lagret kan
 * läsa den utan att dra in React.
 */
export const TIER_ACCENT = {
  brons: "#c98a5e",
  silver: "#c3ccd6",
  guld: "#ae2f26",
  platina: "#9fd4d8",
  diamant: "#7a5236",
} as const;

export const RANK_TIERS: RankTier[] = [
  {
    tier: "brons",
    name: "Brons – Nybörjare",
    shortName: "Brons",
    minElo: 600,
    maxElo: 999,
    accent: TIER_ACCENT.brons,
    soft: "rgba(201, 138, 94, 0.14)",
    line: "rgba(201, 138, 94, 0.42)",
  },
  {
    tier: "silver",
    name: "Silver – Utmanare",
    shortName: "Silver",
    minElo: 1000,
    maxElo: 1199,
    accent: TIER_ACCENT.silver,
    soft: "rgba(195, 204, 214, 0.12)",
    line: "rgba(195, 204, 214, 0.38)",
  },
  {
    tier: "guld",
    name: "Guld – Aspirant",
    shortName: "Guld",
    minElo: 1200,
    maxElo: 1399,
    accent: TIER_ACCENT.guld,
    soft: "rgba(174, 47, 38, 0.14)",
    line: "rgba(174, 47, 38, 0.42)",
  },
  {
    tier: "platina",
    name: "Platina – Mästare",
    shortName: "Platina",
    minElo: 1400,
    maxElo: 1599,
    accent: TIER_ACCENT.platina,
    soft: "rgba(159, 212, 216, 0.12)",
    line: "rgba(159, 212, 216, 0.38)",
  },
  {
    tier: "diamant",
    name: "Diamant – Elit",
    shortName: "Diamant",
    minElo: 1600,
    maxElo: 9999,
    accent: TIER_ACCENT.diamant,
    soft: "rgba(122, 82, 54, 0.16)",
    line: "rgba(122, 82, 54, 0.48)",
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
