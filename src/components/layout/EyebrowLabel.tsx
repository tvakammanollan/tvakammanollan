import { m } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Tonerna heter fortfarande teal och amber sedan den mörka paletten;
 * namnen behålls så att alla anropsställen slipper röras. Värdena är
 * Lundens: teal = bark, amber = äpple. `leaf` är ny och finns för att
 * äpplerött annars bär i stort sett varje accent på sajten — 293
 * förekomster mot lövets 6 när det här skrevs.
 *
 * Riktlinje: äpple för det som leder till handling, bark för struktur
 * och sammanhang, löv för framsteg och det som gått bra.
 */
type Tone = "teal" | "amber" | "leaf" | "muted";

const toneClass: Record<Tone, string> = {
  teal: "text-[#7a5236]",
  amber: "text-[#ae2f26]",
  leaf: "text-[#2f6b3c]",
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
