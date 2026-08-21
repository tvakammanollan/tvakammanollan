import { useEffect, useRef, useState } from "react";
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
 * Fem saker här är medvetna och lätta att råka göra ogjorda:
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
 * 3. **Rutan är en `inline-block` med `position: relative`, och orden ligger
 *    ovanpå varandra genom att alla utom det synliga är absolutpositionerade.**
 *    Två tidigare varianter är förkastade, båda av skäl som står kvar:
 *      - *Absolutpositionerade barn i en FLEX-container* lämnar den vågräta
 *        placeringen åt webbläsarens regler för statisk position. Chrome
 *        centrerar dem, men ingenting i layouten sa det. Här är containern en
 *        vanlig blockbox, så `left: 0` betyder `left: 0`.
 *      - *En `inline-grid` där alla ord låg i samma cell* placerade rätt, men
 *        gjorde varje ord till ett grid-item — alltså en blocknivåbox. Kopierar
 *        man rubriken lägger webbläsaren en RADBRYTNING vid varje sådan gräns
 *        OCH tar med alla ord: "Bemästra Ord." blev fem rader, varav fyra ord
 *        aldrig hade synts på skärmen. Mätt i Chrome 2026-08-21: `inline-grid`
 *        ger `"Bemästra \nOrd.\nLäsning."`, `inline-block` ger `"Bemästra
 *        Ord."`. `user-select: none` tar bort de osynliga orden men INTE
 *        radbrytningen — det är boxtypen som avgör den. Byt inte tillbaka.
 *    Paddingen ligger på rutan, och de absolutpositionerade orden bär samma
 *    padding-top: en absolutpositionerad box hänger på PADDINGKANTEN, medan
 *    det inflödande ordet börjar vid innehållskanten, så utan den skulle det
 *    utgående ordet ligga 0,22em för högt.
 * 4. **Offsets are a percentage of the word's own height, not pixels.** The old
 *    ±150px was most of a line on a phone and a third of one on desktop, and
 *    the spring it rode on (stiffness 50, default damping) overshot far enough
 *    to bounce the word against the clip edge on the way in. See `TRAVEL` for
 *    why the distance is short rather than a full height.
 * 5. **Rutan står inline, på samma rad som rubriken, och följer ordets
 *    bredd.** Ordet är sista ordet i en mening ("Träna ORD.", "Se vem som är
 *    bäst.") — låg den som ett eget block bröts meningen mitt itu och det som
 *    skulle vara ett mellanslag blev en radbrytning. Två följder av att stå
 *    inline: bredden måste mätas (se `bredd` nedan), annars är rutan alltid så
 *    bred som det längsta ordet och mellanrummet efter rubriken hoppar; och
 *    masken måste klippa i höjdled **men inte i sidled** — därav `clip-path`
 *    i stället för `overflow-hidden`, som klipper i båda riktningarna och
 *    kapade det inkommande ordet så länge rutan ännu inte hunnit växa.
 *    `overflow: visible` är dessutom vad som håller baslinjen i texten i
 *    stället för i bottenmarginalkanten — se (1) och `SplitText`.
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
  const wordRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [bredd, setBredd] = useState<number | null>(null);

  useEffect(() => {
    if (words.length < 2) return;
    const id = setTimeout(() => {
      setStep((step) => ({ index: (step.index + 1) % words.length, previous: step.index }));
    }, intervalMs);
    return () => clearTimeout(id);
  }, [index, intervalMs, words.length]);

  // Bredden går inte att räkna fram, den måste mätas: orden är olika långa,
  // rubriken står före på samma rad, och rutan ska vara exakt så bred som
  // ordet som visas just nu. Det inaktiva ordet ligger utanför flödet (se
  // nedan), så serverns HTML har redan rätt bredd — mätningen finns bara för
  // att kunna ANIMERA bytet, som en intrinsisk bredd aldrig går att göra.
  useEffect(() => {
    const mät = () => {
      const el = wordRefs.current[index];
      if (el) setBredd(el.offsetWidth);
    };
    mät();
    window.addEventListener("resize", mät);
    // Typsnittet laddas asynkront och Young Serif är bredare än fallbacken —
    // mäts bara en gång före det fastnar rutan på systemsnittets bredd.
    void document.fonts?.ready.then(mät).catch(() => {});
    return () => window.removeEventListener("resize", mät);
  }, [index, words]);

  return (
    <m.span
      className={cn(
        "relative inline-block align-baseline",
        // Paddingen är fönstret, marginalerna nollar den mot layouten — annars
        // skjuts ordet ner och de två rubrikraderna glider isär.
        "pt-[0.22em] pb-[0.12em] -mt-[0.22em] -mb-[0.12em]",
        className,
      )}
      // Masken klipper bara i höjdled. Negativa insättningar i sidled låter
      // ordet sticka ut medan rutan växer ikapp; `overflow-hidden` hade kapat
      // det på mitten under just de bildrutor då det syns som mest.
      style={{ clipPath: "inset(0 -100%)" }}
      initial={false}
      animate={bredd != null ? { width: bredd } : {}}
      transition={reduce ? { duration: 0 } : { duration: 0.5, ease: EASE, delay: HANDOFF }}
    >
      {words.map((word, i) => {
        const active = i === index;
        const leaving = i === previous;
        return (
          <m.span
            key={i}
            ref={(el: HTMLSpanElement | null) => {
              wordRefs.current[i] = el;
            }}
            aria-hidden={!active}
            className={cn(
              "whitespace-nowrap text-[var(--amber)]",
              // Bara det synliga ordet ligger i flödet — det ger rutan sin
              // höjd och sin bredd. Resten hänger ovanpå det, utanför flödet,
              // och är dessutom `select-none`: de ska varken synas, mätas
              // eller följa med när någon kopierar rubriken.
              active ? "inline-block" : "absolute left-0 select-none",
            )}
            // En absolutpositionerad box hänger på paddingkanten, det inflödande
            // ordet börjar vid innehållskanten. Samma padding-top här lägger
            // dem på samma rad. Se punkt 3 i doc-kommentaren.
            style={active ? undefined : { top: 0, paddingTop: "0.22em" }}
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
    </m.span>
  );
}
