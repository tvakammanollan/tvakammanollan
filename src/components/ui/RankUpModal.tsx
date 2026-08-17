import { useEffect } from "react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { useDismissible } from "@/hooks/useDismissible";
import { RankIcon } from "@/components/ui/RankIcon";
import type { RankTier } from "@/types";

interface RankUpModalProps {
  open: boolean;
  rank: RankTier | null;
  onClose: () => void;
}

/**
 * Firar en ny rank. Delar yta, radius, backdrop och z-index med
 * `AchievementCelebration` — de två kunde tidigare visas samtidigt med olika
 * kortstil (vit vs. mörk) och olika z-index (50 vs. 100).
 */
export function RankUpModal({ open, rank, onClose }: RankUpModalProps) {
  useEffect(() => {
    if (!open || !rank) return;
    const fire = (particleRatio: number, opts: confetti.Options) => {
      confetti({
        origin: { y: 0.6 },
        colors: ["#7a5236", "#ae2f26", "#f5c089"],
        particleCount: Math.floor(200 * particleRatio),
        ...opts,
      });
    };
    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  }, [open, rank]);

  // Esc + scroll-lås; annars är enda vägen ut att pricka rätt på backdropen.
  useDismissible(open && !!rank, onClose);

  if (!open || !rank) return null;

  return (
    <div
      className="animate-fade-in fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(46,30,20,0.5)] p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Ny rank"
    >
      <div
        className="animate-scale-in w-full max-w-sm overflow-hidden rounded-3xl border border-[#ae2f26]/30 bg-[rgba(251, 246, 236, 0.98)] p-7 text-center shadow-[0_24px_70px_rgba(46,30,20,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ae2f26]">
          Ny rank
        </p>
        <h2
          className="mt-1 text-[26px] font-bold leading-tight text-[#2e1e14]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Grattis!
        </h2>
        <p className="mt-1 text-sm text-white/60">Du är nu rankad som</p>

        <div
          className="mx-auto mt-5 inline-flex items-center gap-2.5 rounded-full border px-4 py-2 text-[15px] font-semibold"
          style={{ backgroundColor: rank.soft, borderColor: rank.line, color: rank.accent }}
        >
          <RankIcon rank={rank} className="h-5 w-5" />
          <span>{rank.name}</span>
        </div>

        <Button
          onClick={onClose}
          className="mt-7 w-full bg-[#ae2f26] font-semibold text-[#fff8f5] hover:bg-[#ae2f26]/90"
        >
          Fortsätt
        </Button>
      </div>
    </div>
  );
}
