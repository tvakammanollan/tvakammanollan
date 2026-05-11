import { useEffect } from "react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import type { RankTier } from "@/types";

interface RankUpModalProps {
  open: boolean;
  rank: RankTier | null;
  onClose: () => void;
}

export function RankUpModal({ open, rank, onClose }: RankUpModalProps) {
  useEffect(() => {
    if (!open || !rank) return;
    const fire = (particleRatio: number, opts: confetti.Options) => {
      confetti({
        origin: { y: 0.6 },
        colors: ["#1a5c3a", "#d4a017"],
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

  if (!open || !rank) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-6xl leading-none" aria-hidden>
          {rank.icon}
        </div>
        <h2
          className="mt-4 text-[28px] font-bold leading-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Grattis!
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Du är nu rankad som</p>
        <div
          className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-lg font-semibold"
          style={{
            backgroundColor: rank.bgColor,
            color: rank.textColor,
            border: `2px solid ${rank.borderColor}`,
          }}
        >
          <span aria-hidden>{rank.icon}</span>
          <span>{rank.name}</span>
        </div>
        <Button onClick={onClose} className="mt-6 w-full">
          Fortsätt
        </Button>
      </div>
    </div>
  );
}
