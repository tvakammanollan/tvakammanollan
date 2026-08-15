import { cn } from "@/lib/utils";
import { getRankForElo } from "@/types";

interface Props {
  elo: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: "text-[11px] px-2 py-0.5",
  md: "text-xs px-2.5 py-0.5",
  lg: "text-sm px-3 py-1",
} as const;

/**
 * Kompakt ELO-chip (navbar, listor).
 *
 * Härleder rang ur `RANK_TIERS` — samma tabell som `RankBadge`. Tidigare hade
 * den en egen tre-stegs-skala (`eloTier`: brons <1200, silver <1500, guld),
 * så en spelare på 1000 ELO fick "brons" i navbaren och "Silver – Utmanare"
 * på dashboarden samtidigt. Nu kan de inte glida isär.
 */
export function EloBadge({ elo, label, size = "md", className }: Props) {
  const rank = getRankForElo(elo);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold tabular-nums",
        SIZES[size],
        className,
      )}
      style={{ backgroundColor: rank.soft, borderColor: rank.line, color: rank.accent }}
      title={`${rank.name} · ${elo} ELO`}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: rank.accent }}
        aria-hidden
      />
      {label && <span className="font-medium opacity-75">{label}</span>}
      <span style={{ fontFamily: "var(--font-display)" }}>{elo}</span>
    </span>
  );
}
