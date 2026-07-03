import { m } from "framer-motion";
import { cn } from "@/lib/utils";
import { EyebrowLabel } from "./EyebrowLabel";
import { CyclingTitle } from "./CyclingTitle";
import { SplitText } from "@/components/landing/MotionFX";

type Variant = "compact" | "content";

/**
 * Page hero used across all non-landing routes.
 *
 * `compact` = workspace pages (lower height).
 * `content` = marketing/long-form pages (taller).
 *
 * Pass `cycleWords` to render the cycling-word animation instead of a
 * static `title`. When `cycleWords` is set, `title` becomes the static
 * prefix shown above the cycling line.
 */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  cycleWords,
  primaryCta,
  secondaryCta,
  variant = "compact",
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  cycleWords?: string[];
  primaryCta?: React.ReactNode;
  secondaryCta?: React.ReactNode;
  variant?: Variant;
  align?: "left" | "center";
  className?: string;
}) {
  const isCompact = variant === "compact";
  const centered = align === "center";

  return (
    <section
      className={cn(
        "relative overflow-hidden",
        isCompact ? "pt-20 pb-12 sm:pt-24 sm:pb-16" : "pt-28 pb-20 sm:pt-32 sm:pb-24",
        className,
      )}
    >
      <div className={cn("relative mx-auto max-w-6xl px-4 sm:px-6", centered && "text-center")}>
        {eyebrow ? (
          <EyebrowLabel tone="teal" className={cn(centered && "mx-auto")}>
            {eyebrow}
          </EyebrowLabel>
        ) : null}

        <h1
          className={cn(
            "mt-4 font-bold tracking-tight text-white",
            isCompact
              ? "text-[40px] leading-[1.05] sm:text-[56px] md:text-[64px]"
              : "text-[48px] leading-[1.02] sm:text-[68px] md:text-[84px]",
          )}
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.025em" }}
        >
          <SplitText as="span" className="block">
            {title}
          </SplitText>
          {cycleWords && cycleWords.length > 0 ? (
            <CyclingTitle
              words={cycleWords}
              className={cn("mt-1", isCompact ? "h-[1.05em]" : "h-[1.02em]")}
            />
          ) : null}
        </h1>

        {subtitle ? (
          <m.p
            initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "mt-6 text-[17px] leading-relaxed text-white/65 sm:text-[18px]",
              centered ? "mx-auto max-w-2xl" : "max-w-2xl",
            )}
          >
            {subtitle}
          </m.p>
        ) : null}

        {primaryCta || secondaryCta ? (
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={cn("mt-8 flex flex-wrap items-center gap-3", centered && "justify-center")}
          >
            {primaryCta}
            {secondaryCta}
          </m.div>
        ) : null}
      </div>
    </section>
  );
}
