import { cn } from "@/lib/utils";

const SIZES = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-[3px]",
} as const;

/**
 * Ringspinner för helskärmsladdning.
 *
 * Fanns tidigare i två handrullade varianter med olika utseende: `gamla-prov`
 * hade en helt amberfärgad ring med transparent topp, `train` en vit ring med
 * amber topp. Resten av appen använder `<Loader2 className="animate-spin" />`
 * från Lucide, som passar inuti knappar men blir tunn i helskärmsläge.
 */
export function Spinner({
  size = "md",
  className,
  label,
}: {
  size?: keyof typeof SIZES;
  className?: string;
  label?: string;
}) {
  return (
    <span
      role="status"
      aria-label={label ?? "Laddar"}
      className={cn(
        "inline-block animate-spin rounded-full border-white/12 border-t-[#ae2f26]",
        SIZES[size],
        className,
      )}
    />
  );
}
