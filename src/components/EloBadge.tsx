import { cn } from "@/lib/utils";
import { eloTier } from "@/lib/elo";

interface Props {
  elo: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function EloBadge({ elo, label, size = "md", className }: Props) {
  const tier = eloTier(elo);
  const styles =
    tier === "gold"
      ? "bg-gold/15 text-gold-foreground ring-gold/40"
      : tier === "silver"
      ? "bg-silver/20 text-foreground ring-silver/50"
      : "bg-bronze/15 text-bronze ring-bronze/40";

  const sizing =
    size === "sm"
      ? "text-[11px] px-2 py-0.5"
      : size === "lg"
      ? "text-sm px-3 py-1"
      : "text-xs px-2.5 py-0.5";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full ring-1 font-medium tabular-nums",
        styles,
        sizing,
        className,
      )}
    >
      {label && <span className="opacity-70">{label}</span>}
      <span>{elo}</span>
    </span>
  );
}
