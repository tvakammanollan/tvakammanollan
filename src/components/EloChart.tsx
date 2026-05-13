import { lazy, Suspense } from "react";

/**
 * Lazy wrapper around the recharts-based ELO chart. Splits the
 * ~250 kB recharts bundle out of the initial dashboard chunk.
 */
const EloChartImpl = lazy(() =>
  import("./EloChartImpl").then((m) => ({ default: m.EloChartImpl })),
);

export function EloChart({ userId }: { userId: string }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
          Laddar graf…
        </div>
      }
    >
      <EloChartImpl userId={userId} />
    </Suspense>
  );
}
