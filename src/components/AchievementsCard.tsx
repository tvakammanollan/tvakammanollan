import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { fetchAchievements } from "@/lib/achievements.functions";
import type { AchievementState } from "@/lib/achievements";
import { Lock } from "lucide-react";
import { AchievementIcon } from "@/components/ui/AchievementIcon";
import { TIER_ACCENT } from "@/types";

/* =====================================================================
   ACHIEVEMENTS — badge-rutnät. `variant="full"` på /stats (alla, med
   progress), `variant="compact"` på dashboarden (bara upplåsta + räknare).
   ===================================================================== */

/** Ringen ärver tier-accenten i stället för att upprepa hex-värdena. */
function tierRing(tier: AchievementState["tier"]): string {
  return `${TIER_ACCENT[tier]}80`;
}

export function AchievementsCard({ variant = "full" }: { variant?: "full" | "compact" }) {
  const fetchFn = useServerFn(fetchAchievements);
  const [items, setItems] = useState<AchievementState[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchFn({});
        if (!cancelled) setItems((res as { achievements: AchievementState[] }).achievements);
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchFn]);

  if (error) return null;

  const unlockedCount = items?.filter((a) => a.unlocked).length ?? 0;
  const total = items?.length ?? 0;

  if (!items) {
    return <div className="skeleton-shimmer h-32 rounded-2xl" aria-busy="true" />;
  }

  // Dashboard: visa bara upplåsta (eller en hint om inga ännu)
  if (variant === "compact") {
    const unlocked = items.filter((a) => a.unlocked);
    if (unlocked.length === 0) {
      return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/45">
            Utmärkelser
          </p>
          <p className="mt-2 text-sm text-white/55">
            Spela din första match för att låsa upp din första utmärkelse.
          </p>
        </div>
      );
    }
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/45">
            Utmärkelser
          </p>
          <span className="text-xs tabular-nums text-white/45">
            {unlockedCount}/{total}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {unlocked.slice(0, 8).map((a) => (
            <span
              key={a.id}
              title={`${a.name}: ${a.description}`}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ae2f26]/10 ring-1"
              style={{ "--tw-ring-color": tierRing(a.tier) } as React.CSSProperties}
            >
              <AchievementIcon id={a.id} style={{ color: TIER_ACCENT[a.tier] }} />
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <h2
          className="relative pb-2 text-xl font-semibold after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-10 after:bg-[#ae2f26]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Utmärkelser
        </h2>
        <span className="text-xs tabular-nums text-muted-foreground">
          {unlockedCount} av {total} upplåsta
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((a) => (
          <div
            key={a.id}
            className={`relative overflow-hidden rounded-xl border p-3.5 transition-colors ${
              a.unlocked ? "border-[#ae2f26]/30 bg-[#ae2f26]/[0.06]" : "border-border bg-card"
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${
                  a.unlocked ? "bg-[#ae2f26]/10" : "bg-white/[0.03] ring-white/10"
                }`}
                style={
                  a.unlocked
                    ? ({ "--tw-ring-color": tierRing(a.tier) } as React.CSSProperties)
                    : undefined
                }
              >
                {a.unlocked ? (
                  <AchievementIcon id={a.id} style={{ color: TIER_ACCENT[a.tier] }} />
                ) : (
                  <Lock className="h-4 w-4 text-white/40" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-foreground">{a.name}</div>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                  {a.description}
                </p>
              </div>
            </div>
            {!a.unlocked && a.target > 1 && (
              <div className="mt-2.5">
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#ae2f26]/70"
                    style={{ width: `${a.progress}%` }}
                  />
                </div>
                <div className="mt-1 text-right text-[10px] tabular-nums text-muted-foreground">
                  {a.current}/{a.target}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
