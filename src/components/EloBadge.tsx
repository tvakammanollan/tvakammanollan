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
      ? "bg-gradient-to-br from-[#E8E4DA] to-[#DAD4C5] text-[#C97B41] ring-[#F2A65A]/30 shadow-[0_1px_3px_rgba(212,160,23,0.20)]"
      : tier === "silver"
      ? "bg-gradient-to-br from-[#f3f4f6] to-[#e5e7eb] text-[#475569] ring-[#94a3b8]/35 shadow-[0_1px_3px_rgba(71,85,105,0.10)]"
      : "bg-gradient-to-br from-[#fce7d3] to-[#f5d4ad] text-[#8b4513] ring-[#c08552]/30 shadow-[0_1px_3px_rgba(139,69,19,0.15)]";

  const sizing =
    size === "sm"
      ? "text-[11px] px-2 py-0.5"
      : size === "lg"
      ? "text-sm px-3 py-1"
      : "text-xs px-2.5 py-0.5";

  const dot =
    tier === "gold"
      ? "bg-[#F2A65A]"
      : tier === "silver"
      ? "bg-[#94a3b8]"
      : "bg-[#c08552]";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full ring-1 font-semibold tabular-nums",
        styles,
        sizing,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {label && <span className="font-medium opacity-75">{label}</span>}
      <span style={{ fontFamily: "var(--font-display)" }}>{elo}</span>
    </span>
  );
}
