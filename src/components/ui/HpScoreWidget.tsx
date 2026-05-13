import { useNavigate } from "@tanstack/react-router";
import { combinedHpScore, estimateHpScore } from "@/lib/hpScore";

interface HpScoreWidgetProps {
  eloVerbal: number;
  eloMath: number;
  size?: "compact" | "full";
}

export function HpScoreWidget({ eloVerbal, eloMath, size = "compact" }: HpScoreWidgetProps) {
  const navigate = useNavigate();

  if (size === "compact") {
    const combined = combinedHpScore(eloVerbal, eloMath);
    return (
      <button
        type="button"
        onClick={() => navigate({ to: "/stats" })}
        title="Uppskattad normerad HP-poäng baserad på din ELO. Ej officiell normering."
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-xs text-foreground/80 hover:bg-muted transition-colors"
        style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}
      >
        <span aria-hidden>📊</span>
        <span>~ HP {combined}</span>
      </button>
    );
  }

  const v = estimateHpScore(eloVerbal);
  const m = estimateHpScore(eloMath);
  const combined = combinedHpScore(eloVerbal, eloMath);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <h2
        className="relative pb-2 text-xl font-semibold after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-10 after:bg-[#0E1B2C]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        📊 Uppskattad HP-poäng
      </h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <HpRow label="Verbal" elo={eloVerbal} est={v} />
        <HpRow label="Matte" elo={eloMath} est={m} />
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
        <span className="text-sm text-muted-foreground">Kombinerat</span>
        <span
          className="text-2xl font-semibold tabular-nums text-[#0E1B2C]"
          style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}
        >
          ~ {combined}
        </span>
      </div>

      <p className="mt-4 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        ⚠️ Baserat på ELO-progression, ej officiell normering från Universitetens antagning.
      </p>
    </div>
  );
}

function HpRow({
  label,
  elo,
  est,
}: {
  label: string;
  elo: number;
  est: ReturnType<typeof estimateHpScore>;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="text-[11px] tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span
          className="text-2xl font-semibold tabular-nums text-foreground"
          style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}
        >
          ~ {est.score}
        </span>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        ELO {elo} → rang {est.range}
      </div>
    </div>
  );
}
