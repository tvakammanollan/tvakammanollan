/**
 * Rank-stegen. EN källa för rank i hela appen — `EloBadge` (navbar) och
 * `RankBadge` (dashboard) hade tidigare varsin tröskeltabell, så samma ELO
 * visades som "Brons" i navbaren och "Silver" på dashboarden på samma skärm.
 *
 * Färgerna är tonade för ljus yta sedan Lunden-vändningen (`accent` = ren
 * färg för text/ikon, `soft`/`line` = fyllning och kant). Inga solida,
 * mättade pillerknappar: de såg inklistrade ut mot resten av ytorna.
 */
export type RankTier = {
  name: string;
  /** Kort namn utan undertitel — "Guld" i stället för "Guld · Aspirant". */
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
 *
 * Skalan är en egen metallprogression och följer INTE varumärkets fyra
 * kulörer. Den ska läsa som brons, silver, guld, platina, diamant även
 * för någon som inte känner till paletten.
 *
 * Omräknad i Lunden-vändningen. De gamla värdena var ljusa metaller
 * gjorda för mörk botten (silver #c3ccd6, platina #9fd4d8) och hade
 * varit nästan osynliga på creme. En svepande palettersättning hann
 * dessutom göra guld äpplerött och diamant barkbrunt, vilket både tog
 * bort metallkänslan och gjorde diamant mörkare än platina.
 *
 * Varje steg är kontrollerat på fyra saker: minst 4,5:1 mot både
 * papper och kort (lägst är guld på 4,95), tillräckligt avstånd till
 * äpple, bark och löv så rank inte förväxlas med semantik, tydligt
 * avstånd mellan stegen, och en ljushet som inte är en rak gradient —
 * metaller är inte en toning.
 */
export const TIER_ACCENT = {
  brons: "#a4530f",
  silver: "#545a66",
  guld: "#7d6a0a",
  platina: "#46686e",
  diamant: "#2b5f8f",
} as const;

export const RANK_TIERS: RankTier[] = [
  {
    tier: "brons",
    name: "Brons · Nybörjare",
    shortName: "Brons",
    minElo: 600,
    maxElo: 999,
    accent: TIER_ACCENT.brons,
    soft: "rgba(164, 83, 15, 0.14)",
    line: "rgba(164, 83, 15, 0.42)",
  },
  {
    tier: "silver",
    name: "Silver · Utmanare",
    shortName: "Silver",
    minElo: 1000,
    maxElo: 1199,
    accent: TIER_ACCENT.silver,
    soft: "rgba(84, 90, 102, 0.12)",
    line: "rgba(84, 90, 102, 0.38)",
  },
  {
    tier: "guld",
    name: "Guld · Aspirant",
    shortName: "Guld",
    minElo: 1200,
    maxElo: 1399,
    accent: TIER_ACCENT.guld,
    soft: "rgba(125, 106, 10, 0.14)",
    line: "rgba(125, 106, 10, 0.42)",
  },
  {
    tier: "platina",
    name: "Platina · Mästare",
    shortName: "Platina",
    minElo: 1400,
    maxElo: 1599,
    accent: TIER_ACCENT.platina,
    soft: "rgba(70, 104, 110, 0.12)",
    line: "rgba(70, 104, 110, 0.38)",
  },
  {
    tier: "diamant",
    name: "Diamant · Elit",
    shortName: "Diamant",
    minElo: 1600,
    maxElo: 9999,
    accent: TIER_ACCENT.diamant,
    soft: "rgba(43, 95, 143, 0.16)",
    line: "rgba(43, 95, 143, 0.48)",
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
