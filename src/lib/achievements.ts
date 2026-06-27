/* =====================================================================
   ACHIEVEMENTS — härleds helt från befintlig speldata (inga nya tabeller).
   Definitionerna här är källan; `computeAchievements` tar en samling
   råvärden (hämtas server-side i achievements.functions.ts) och returnerar
   upplåst-status + progress. Återanvänds på /stats och dashboarden.
   ===================================================================== */

export type AchievementTier = "brons" | "silver" | "guld";

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji
  tier: AchievementTier;
  /** Hur värdet mäts mot `target` (för progress-stapeln). */
  metric: "games_played" | "wins" | "perfect_matches" | "longest_streak" | "peak_elo" | "friends";
  target: number;
}

/** Råvärden som behövs för att avgöra alla achievements. */
export interface AchievementStats {
  games_played: number;
  wins: number;
  perfect_matches: number;
  longest_streak: number;
  peak_elo: number;
  friends: number;
}

export interface AchievementState extends AchievementDef {
  unlocked: boolean;
  current: number;
  /** 0–100 hur nära upplåsning. */
  progress: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first_match",
    name: "Första striden",
    description: "Spela din första match.",
    icon: "⚔️",
    tier: "brons",
    metric: "games_played",
    target: 1,
  },
  {
    id: "first_win",
    name: "Första segern",
    description: "Vinn en match.",
    icon: "🎉",
    tier: "brons",
    metric: "wins",
    target: 1,
  },
  {
    id: "ten_matches",
    name: "Stridsvan",
    description: "Spela 10 matcher.",
    icon: "🛡️",
    tier: "brons",
    metric: "games_played",
    target: 10,
  },
  {
    id: "streak_3",
    name: "Tändad",
    description: "Håll en 3-dagars streak.",
    icon: "🔥",
    tier: "brons",
    metric: "longest_streak",
    target: 3,
  },
  {
    id: "first_friend",
    name: "Inte ensam",
    description: "Lägg till en vän.",
    icon: "🤝",
    tier: "brons",
    metric: "friends",
    target: 1,
  },
  {
    id: "perfect_match",
    name: "Felfri",
    description: "Få alla 8 rätt i en match.",
    icon: "💯",
    tier: "silver",
    metric: "perfect_matches",
    target: 1,
  },
  {
    id: "ten_wins",
    name: "Vinnarskalle",
    description: "Vinn 10 matcher.",
    icon: "🏅",
    tier: "silver",
    metric: "wins",
    target: 10,
  },
  {
    id: "elo_1200",
    name: "Guldnivå",
    description: "Nå 1200 ELO.",
    icon: "🥇",
    tier: "silver",
    metric: "peak_elo",
    target: 1200,
  },
  {
    id: "streak_7",
    name: "Eldsjäl",
    description: "Håll en 7-dagars streak.",
    icon: "🌟",
    tier: "silver",
    metric: "longest_streak",
    target: 7,
  },
  {
    id: "fifty_matches",
    name: "Veteran",
    description: "Spela 50 matcher.",
    icon: "🎖️",
    tier: "guld",
    metric: "games_played",
    target: 50,
  },
  {
    id: "elo_1400",
    name: "Platinanivå",
    description: "Nå 1400 ELO.",
    icon: "💎",
    tier: "guld",
    metric: "peak_elo",
    target: 1400,
  },
  {
    id: "elo_1600",
    name: "Diamantnivå",
    description: "Nå 1600 ELO.",
    icon: "✦",
    tier: "guld",
    metric: "peak_elo",
    target: 1600,
  },
  {
    id: "streak_30",
    name: "Obändig",
    description: "Håll en 30-dagars streak.",
    icon: "🚀",
    tier: "guld",
    metric: "longest_streak",
    target: 30,
  },
];

export function computeAchievements(stats: AchievementStats): AchievementState[] {
  return ACHIEVEMENTS.map((def) => {
    const current = stats[def.metric] ?? 0;
    const unlocked = current >= def.target;
    const progress = Math.max(0, Math.min(100, Math.round((current / def.target) * 100)));
    return { ...def, current, unlocked, progress };
  });
}
