import { useEffect, useState } from "react";
import { m, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

// Hur långt ett ord färdas, i procent av sin egen höjd.
const TRAVEL = "70%";

// Bytet är sekventiellt, inte samtidigt: det gamla ordet är borta innan det nya
// börjar. Båda de samtidiga varianterna såg fel ut, på var sitt sätt — med lång
// resa syns två halvt avskurna ord samtidigt (masken är bara ~1,35em hög), och
// med kort resa ryms båda i fönstret och lägger sig ovanpå varandra som en
// dubbelexponering. Det som är kvar när ingendera går att ha är att låta dem
// turas om.
const HANDOFF = 0.26;

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
 * 2. **The height comes from the content, not from the caller, and the padding
 *    is cancelled by matching negative margins.** PageHero used to hand down
 *    `h-[1.05em]`, i.e. exactly the line box, with `md:pb-3` bolted on to
 *    rescue the descenders on wide screens only. That padding was also the
 *    off-centre: 3px of air above the word and 16px below it. Padding without
 *    the negative margins is not the fix either — it pushes the word down and
 *    opens a 0.62em gap between the two heading lines, so they stop reading as
 *    one block. Grow the window, keep the footprint.
 * 3. **Every word sits in the same grid cell**, centred with
 *    `justify-items-center`. They were absolutely positioned inside a flex
 *    container before, which leaves the horizontal placement to the browser's
 *    static-position rules for abspos flex children. Chrome does centre them,
 *    but nothing in the layout said so, and the same trick is what forced the
 *    fixed height in (2).
 * 4. **Offsets are a percentage of the word's own height, not pixels.** The old
 *    ±150px was most of a line on a phone and a third of one on desktop, and
 *    the spring it rode on (stiffness 50, default damping) overshot far enough
 *    to bounce the word against the clip edge on the way in. See `TRAVEL` for
 *    why the distance is short rather than a full height.
 *
 * Direction is the same every time, wrap-around included: the word leaving goes
 * up, the next one rises from below, and they take turns rather than crossing —
 * see `HANDOFF`. Words that are neither are parked below at opacity 0 and reset
 * without animating, so nothing ever sweeps across the window.
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
        "grid grid-cols-1 grid-rows-1 justify-items-center overflow-hidden",
        // Paddingen är fönstret, marginalerna nollar den mot layouten — annars
        // skjuts ordet ner och de två rubrikraderna glider isär.
        "pt-[0.22em] pb-[0.12em] -mt-[0.22em] -mb-[0.12em]",
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
            initial={{ opacity: 0, y: reduce ? "0%" : TRAVEL }}
            animate={{
              opacity: active ? 1 : 0,
              y: reduce || active ? "0%" : leaving ? `-${TRAVEL}` : TRAVEL,
            }}
            // Opaciteten går fortare än rörelsen: fönstret ligger tätt inpå
            // rubriken ovanför, och ett ord som fortfarande är halvsynligt när
            // det passerar kanten läser som att två rubriker krockar.
            transition={
              active
                ? { duration: 0.5, ease: EASE, delay: HANDOFF }
                : leaving
                  ? { duration: HANDOFF, ease: "easeIn" }
                  : // Parkerade ord är osynliga, så deras återställning ska inte
                    // animeras — annars sveper de genom fönstret på väg tillbaka.
                    { duration: 0 }
            }
          >
            {word}
          </m.span>
        );
      })}
    </span>
  );
}
