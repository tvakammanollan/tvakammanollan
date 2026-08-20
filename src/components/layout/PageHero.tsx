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
 * Pass `cycleWords` to render the cycling-word animation. `title` är då den
 * fasta delen av meningen och det cyklande ordet står efter den, på samma
 * rad, med ett vanligt mellanslag emellan.
 */
export function PageHero({
  eyebrow,
  eyebrowTone = "teal",
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
  /** Bark som standard. Löv på sidor som handlar om framsteg och resultat. */
  eyebrowTone?: "teal" | "amber" | "leaf";
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
        // Compact-heron låg 16 px för tätt inpå navbaren. Det syntes mest på
        // /ord, därför att "Öva" börjar på ett Ö: prickarna når 0,99em över
        // baslinjen medan ett vanligt versalt begynnelsebokstav stannar på 0,72,
        // så samma ruta ger 14 px mindre optisk luft än "Se vem som är" på
        // /leaderboard. Rutan var alltså snål överallt och /ord avslöjade det.
        isCompact ? "pt-24 pb-12 sm:pt-28 sm:pb-16" : "pt-28 pb-20 sm:pt-32 sm:pb-24",
        className,
      )}
    >
      <div className={cn("relative mx-auto max-w-6xl px-4 sm:px-6", centered && "text-center")}>
        {eyebrow ? (
          <EyebrowLabel tone={eyebrowTone} className={cn(centered && "mx-auto")}>
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
          {/* Rubrik och cyklande ord är EN mening ("Träna ORD.", "Se vem som
              är bäst."), så mellan dem står ett riktigt mellanslag. Ordet låg
              tidigare som ett eget block under rubriken: meningen bröts mitt
              itu och mellanslaget blev en radbrytning. Mellanslaget är också
              en radbrytningsmöjlighet, så på en smal skärm bryts meningen där
              den ska brytas i stället för att svämma över. */}
          <SplitText as="span">{title}</SplitText>
          {cycleWords && cycleWords.length > 0 ? (
            <>
              {" "}
              <CyclingTitle words={cycleWords} />
            </>
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
