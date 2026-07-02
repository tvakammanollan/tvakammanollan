import { getRankForElo, getEloProgressInTier } from "@/types";

interface RankBadgeProps {
  elo: number;
  size?: "sm" | "md" | "lg";
  showProgress?: boolean;
  showName?: boolean;
}

export function RankBadge({
  elo,
  size = "md",
  showProgress = false,
  showName = false,
}: RankBadgeProps) {
  const rank = getRankForElo(elo);
  const progress = getEloProgressInTier(elo);

  const sizeStyles =
    size === "sm"
      ? { fontSize: 11, padding: "2px 8px" }
      : size === "lg"
        ? { fontSize: 16, padding: "6px 16px" }
        : { fontSize: 13, padding: "4px 12px" };

  return (
    <div className="inline-flex flex-col gap-1">
      <span
        className="inline-flex items-center gap-1.5 font-semibold tabular-nums"
        style={{
          backgroundColor: rank.bgColor,
          color: rank.textColor,
          border: `2px solid ${rank.borderColor}`,
          borderRadius: 20,
          ...sizeStyles,
        }}
      >
        <span aria-hidden>{rank.icon}</span>
        <span>{showName ? rank.name : elo}</span>
      </span>
      {showProgress && (
        <div
          className="h-1 w-full overflow-hidden rounded-full bg-black/10"
          aria-label={`Progress till nästa rank: ${progress}%`}
        >
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              backgroundColor: rank.borderColor,
            }}
          />
        </div>
      )}
    </div>
  );
}
