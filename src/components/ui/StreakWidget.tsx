import { Flame } from "lucide-react";

interface Props {
  currentStreak: number;
  longestStreak: number;
  onStartClick?: () => void;
  className?: string;
}

export function StreakWidget({ currentStreak, longestStreak, onStartClick, className }: Props) {
  if (currentStreak < 1) {
    return (
      <div className={`flex flex-col gap-0.5 ${className ?? ""}`}>
        <span className="text-sm text-muted-foreground" style={{ fontFamily: "DM Sans, sans-serif" }}>
          Ingen aktiv streak
        </span>
        {onStartClick ? (
          <button
            onClick={onStartClick}
            className="text-left text-xs text-[#f2a65a] underline-offset-2 hover:underline"
          >
            Spela idag för att börja!
          </button>
        ) : (
          <span className="text-xs text-muted-foreground">Spela idag för att börja!</span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-0.5 ${className ?? ""}`}>
      <span
        className="inline-flex items-center gap-1 text-sm font-semibold"
        style={{ fontFamily: "DM Sans, sans-serif", color: "#e67e22" }}
      >
        <Flame className="h-4 w-4 fill-current" />
        {currentStreak} dagars streak
      </span>
      <span className="text-xs text-muted-foreground">Rekord: {longestStreak} dagar</span>
    </div>
  );
}
