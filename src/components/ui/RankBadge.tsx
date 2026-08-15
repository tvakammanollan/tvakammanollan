import { cn } from "@/lib/utils";
import { RankIcon } from "@/components/ui/RankIcon";
import { getRankForElo, getEloProgressInTier } from "@/types";

interface RankBadgeProps {
  elo: number;
  size?: "sm" | "md" | "lg";
  showProgress?: boolean;
  /** Visa rangens namn i stället för ELO-talet. */
  showName?: boolean;
  /** Kort namn ("Guld") i stället för fullt ("Guld – Aspirant"). */
  short?: boolean;
  className?: string;
}

const SIZES = {
  sm: { pill: "text-[11px] px-2 py-0.5 gap-1", icon: "h-3 w-3" },
  md: { pill: "text-[13px] px-2.5 py-1 gap-1.5", icon: "h-3.5 w-3.5" },
  lg: { pill: "text-[15px] px-3.5 py-1.5 gap-2", icon: "h-4 w-4" },
} as const;

/**
 * Rank-pillret. Tonad yta + kant i rangens accentfärg, samma glasspråk som
 * korten. Tidigare var det ett solitt, mättat piller med 2px kant och emoji,
 * vilket låg som en klistermärke ovanpå den mörka ytan.
 */
export function RankBadge({
  elo,
  size = "md",
  showProgress = false,
  showName = false,
  short = false,
  className,
}: RankBadgeProps) {
  const rank = getRankForElo(elo);
  const progress = getEloProgressInTier(elo);
  const s = SIZES[size];
  const label = showName ? (short ? rank.shortName : rank.name) : elo;

  return (
    <div className={cn("inline-flex flex-col gap-1", className)}>
      <span
        className={cn(
          "inline-flex items-center rounded-full border font-semibold tabular-nums",
          s.pill,
        )}
        style={{ backgroundColor: rank.soft, borderColor: rank.line, color: rank.accent }}
        title={rank.name}
      >
        <RankIcon rank={rank} className={s.icon} />
        <span>{label}</span>
      </span>
      {showProgress && (
        <div
          className="h-1 w-full overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progress till nästa rank: ${progress} %`}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: rank.accent }}
          />
        </div>
      )}
    </div>
  );
}
