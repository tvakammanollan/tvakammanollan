import { cn } from "@/lib/utils";

type Variant = "default" | "interactive" | "raised";

const variantClass: Record<Variant, string> = {
  default: "border-white/10 bg-white/[0.02]",
  interactive:
    "border-white/10 bg-white/[0.02] transition-colors hover:border-[#f2a65a]/40 hover:bg-white/[0.04]",
  raised: "border-white/12 bg-white/[0.04] shadow-[0_14px_36px_rgba(0,0,0,0.25)]",
};

export function GlassCard({
  children,
  variant = "default",
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
  as?: "div" | "article" | "section" | "li";
}) {
  return (
    <Tag
      className={cn("rounded-2xl border p-6 backdrop-blur-sm", variantClass[variant], className)}
    >
      {children}
    </Tag>
  );
}
