import { m } from "framer-motion";
import { cn } from "@/lib/utils";

type Tone = "teal" | "amber" | "muted";

const toneClass: Record<Tone, string> = {
  teal: "text-[#6fb3b8]",
  amber: "text-[#f2a65a]",
  muted: "text-white/60",
};

export function EyebrowLabel({
  children,
  tone = "teal",
  className,
  animate = true,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
  animate?: boolean;
}) {
  const base = cn(
    "text-[12px] font-semibold uppercase italic tracking-[0.14em]",
    toneClass[tone],
    className,
  );

  if (!animate) {
    return <p className={base}>{children}</p>;
  }

  return (
    <m.p
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={base}
    >
      {children}
    </m.p>
  );
}
