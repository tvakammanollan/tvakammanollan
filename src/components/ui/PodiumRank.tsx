import { Trophy, Medal, Award } from "lucide-react";
import { cn } from "@/lib/utils";

const PODIUM = {
  1: { Icon: Trophy, color: "#f2a65a", label: "Förstaplats" },
  2: { Icon: Medal, color: "#c3ccd6", label: "Andraplats" },
  3: { Icon: Award, color: "#c98a5e", label: "Tredjeplats" },
} as const;

/**
 * Placeringscell i topplistorna: medalj för topp 3, annars "#n".
 *
 * Fanns tidigare som tre kopior av samma `rank === 1 ? "🥇" : …`-uttryck i
 * leaderboard.tsx, med olika bricka och storlek i varje kopia — och emojin
 * ritas olika på varje plattform, så kolumnbredden hoppade.
 */
export function PodiumRank({
  rank,
  size = "sm",
  className,
}: {
  rank: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const entry = PODIUM[rank as 1 | 2 | 3];

  if (!entry) {
    return (
      <span
        className={cn("text-sm font-bold tabular-nums text-white/45", className)}
        style={{ fontFamily: "var(--font-display)" }}
      >
        #{rank}
      </span>
    );
  }

  const { Icon, color, label } = entry;
  const box = size === "md" ? "h-10 w-10" : "h-8 w-8";
  const icon = size === "md" ? "h-5 w-5" : "h-4 w-4";

  return (
    <span
      className={cn("inline-flex items-center justify-center rounded-full border", box, className)}
      style={{ borderColor: `${color}59`, background: `${color}1f` }}
      title={label}
    >
      <Icon className={icon} style={{ color }} aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}
