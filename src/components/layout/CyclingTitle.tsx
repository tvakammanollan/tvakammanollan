import { useEffect, useState } from "react";
import { m, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The word that swaps out under a page title.
 *
 * Four things here are deliberate and easy to undo by accident:
 *
 * 1. **The vertical padding is the only reason the glyphs are whole.**
 *    `overflow-hidden` clips at the *padding* edge, and Young Serif's ink runs
 *    from 0.99em above the baseline ("Ä") to 0.215em below it ("g") — 1.21em
 *    against a line box of 1.02–1.05em. The box is therefore 0.14em too short
 *    above the baseline and 0.045em below it; the padding buys that back plus
 *    ~0.06em of margin, measured across every word on all five pages at both
 *    hero sizes. Before this, the tails of "Läsning." and "Tidspress." were
 *    shaved flat and "LÄS." nearly lost its dots. It is asymmetric because the
 *    shortfall is — do not "tidy" it into a single `py-`.
 * 2. **The height comes from the content, not from the caller.** PageHero used
 *    to hand down `h-[1.05em]`, i.e. exactly the line box, with `md:pb-3`
 *    bolted on to rescue the descenders on wide screens only. That padding was
 *    also the off-centre: 3px of air above the word and 16px below it.
 * 3. **Every word sits in the same grid cell**, centred with
 *    `justify-items-center`. They were absolutely positioned inside a flex
 *    container before, which leaves the horizontal placement to the browser's
 *    static-position rules for abspos flex children. Chrome does centre them,
 *    but nothing in the layout said so, and the same trick is what forced the
 *    fixed height in (2).
 * 4. **Offsets are a percentage of the word's own height, not pixels.** The old
 *    ±150px was most of a line on a phone and a third of one on desktop, and
 *    the spring it rode on (stiffness 50, default damping) overshot far enough
 *    to bounce the word against the clip edge on the way in.
 *
 * Direction is the same every time, wrap-around included: the word leaving goes
 * up, the next one rises from below. Words that are neither are parked below at
 * opacity 0, so resetting them never sweeps anything across the window.
 */
export function CyclingTitle({
  words,
  intervalMs = 2200,
  className,
}: {
  words: string[];
  intervalMs?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [{ index, previous }, setStep] = useState({ index: 0, previous: -1 });

  useEffect(() => {
    if (words.length < 2) return;
    const id = setTimeout(() => {
      setStep((step) => ({ index: (step.index + 1) % words.length, previous: step.index }));
    }, intervalMs);
    return () => clearTimeout(id);
  }, [index, intervalMs, words.length]);

  return (
    <span
      className={cn(
        "grid grid-cols-1 grid-rows-1 justify-items-center overflow-hidden pt-[0.22em] pb-[0.12em]",
        className,
      )}
    >
      {words.map((word, i) => {
        const active = i === index;
        const leaving = i === previous;
        return (
          <m.span
            key={i}
            aria-hidden={!active}
            className="col-start-1 row-start-1 whitespace-nowrap text-[var(--amber)]"
            initial={{ opacity: 0, y: reduce ? "0%" : "110%" }}
            animate={{
              opacity: active ? 1 : 0,
              y: reduce || active ? "0%" : leaving ? "-110%" : "110%",
            }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            {word}
          </m.span>
        );
      })}
    </span>
  );
}
