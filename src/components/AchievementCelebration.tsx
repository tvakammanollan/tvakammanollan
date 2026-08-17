import { useEffect } from "react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { useDismissible } from "@/hooks/useDismissible";
import { AchievementIcon } from "@/components/ui/AchievementIcon";
import { TIER_ACCENT } from "@/types";
import type { AchievementState } from "@/lib/achievements";

/**
 * Pop-up som firar nyligen upplåsta utmärkelser. Visar alla på en gång
 * (t.ex. flera intjänade sedan förra besöket) med konfetti för dopaminkick.
 */
export function AchievementCelebration({
  items,
  onClose,
}: {
  items: AchievementState[];
  onClose: () => void;
}) {
  useEffect(() => {
    if (items.length === 0) return;
    const fire = (particleRatio: number, opts: confetti.Options) => {
      confetti({
        origin: { y: 0.55 },
        colors: ["#ae2f26", "#7a5236", "#f5c089", "#ffffff"],
        particleCount: Math.floor(220 * particleRatio),
        ...opts,
      });
    };
    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.9 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  }, [items]);

  // Esc + scroll-lås; annars är enda vägen ut att pricka rätt på backdropen.
  useDismissible(items.length > 0, onClose);

  if (items.length === 0) return null;

  const many = items.length > 1;

  return (
    <div
      className="animate-fade-in fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(46,30,20,0.5)] p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Ny utmärkelse"
    >
      <div
        className="animate-scale-in w-full max-w-sm overflow-hidden rounded-3xl border border-[#ae2f26]/30 bg-[rgba(251, 246, 236, 0.98)] p-7 text-center shadow-[0_24px_70px_rgba(46,30,20,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ae2f26]">
          {many ? `${items.length} nya utmärkelser` : "Ny utmärkelse"}
        </p>
        <h2
          className="mt-1 text-[26px] font-bold leading-tight text-[var(--cream)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {many ? "Grymt jobbat!" : "Grattis!"}
        </h2>

        <ul className={`mt-5 grid gap-2.5 ${many ? "max-h-[46vh] overflow-y-auto pr-1" : ""}`}>
          {items.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-3 rounded-2xl border border-[#ae2f26]/20 bg-[#ae2f26]/[0.07] p-3 text-left"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#ae2f26]/12 ring-1 ring-[#ae2f26]/40">
                <AchievementIcon
                  id={a.id}
                  className="h-6 w-6"
                  style={{ color: TIER_ACCENT[a.tier] }}
                />
              </span>
              <div className="min-w-0">
                <div className="truncate text-[15px] font-bold text-[var(--cream)]">{a.name}</div>
                <div className="text-xs text-white/60">{a.description}</div>
              </div>
            </li>
          ))}
        </ul>

        <Button
          onClick={onClose}
          className="mt-6 w-full bg-[#ae2f26] font-semibold text-[#fff8f5] hover:bg-[#ae2f26]/90"
        >
          Fortsätt
        </Button>
      </div>
    </div>
  );
}
