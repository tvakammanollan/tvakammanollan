import { Shield, Award, Trophy, Gem, Crown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRankForElo, type RankTier } from "@/types";

/**
 * Rank-ikoner. Var tidigare emoji (🥉🥈🥇💎) blandat med typografiskt ✦ —
 * fem tiers, två olika ikonspråk, och emoji renderas dessutom olika på
 * Windows/Android/iOS. Lucide ger samma streckvikt som resten av gränssnittet.
 */
const RANK_ICONS: Record<string, LucideIcon> = {
  brons: Shield,
  silver: Award,
  guld: Trophy,
  platina: Gem,
  diamant: Crown,
};

function rankIconFor(tier: string): LucideIcon {
  return RANK_ICONS[tier] ?? Shield;
}

export function RankIcon({
  rank,
  elo,
  className,
  style,
}: {
  rank?: RankTier;
  elo?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const resolved = rank ?? getRankForElo(elo ?? 1000);
  const Icon = rankIconFor(resolved.tier);
  return <Icon className={cn("h-4 w-4 shrink-0", className)} style={style} aria-hidden />;
}
