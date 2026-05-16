import { useNavigate } from "@tanstack/react-router";
import { combinedHpScore, estimateHpScore } from "@/lib/hpScore";

interface HpScoreWidgetProps {
  eloVerbal: number;
  eloMath: number;
  size?: "compact" | "full";
}

export function HpScoreWidget({ eloVerbal, eloMath, size = "compact" }: HpScoreWidgetProps) {
  const navigate = useNavigate();
  const combined = combinedHpScore(eloVerbal, eloMath);

  if (size === "compact") {
    return (
      <button
        type="button"
        onClick={() => navigate({ to: "/stats" })}
        title="Uppskattad normerad HP-poäng baserad på din ELO."
        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs transition-colors"
        style={{
          borderColor: "var(--line)",
          background: "rgba(21,39,62,0.6)",
          color: "var(--cream)",
          fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
        }}
      >
        <span aria-hidden>📊</span>
        <span>HP {combined}</span>
      </button>
    );
  }

  const v = estimateHpScore(eloVerbal);
  const m = estimateHpScore(eloMath);

  return (
    <div
      className="rounded-2xl border p-6"
      style={{
        borderColor: "var(--line)",
        background: "var(--navy-2)",
      }}
    >
      {/* Label */}
      <p
        className="text-[11px] font-medium uppercase tracking-[0.14em]"
        style={{ color: "var(--hp-muted)" }}
      >
        Trolig HP-poäng
      </p>

      {/* Main score */}
      <div className="mt-2 flex items-baseline gap-2">
        <span
          className="text-[56px] font-bold leading-none tabular-nums"
          style={{ color: "var(--amber)", fontFamily: "var(--font-display)" }}
        >
          {combined}
        </span>
        <span className="text-lg" style={{ color: "var(--hp-muted)" }}>/ 2.0</span>
      </div>

      {/* Divider */}
      <div className="my-5 border-t" style={{ borderColor: "var(--line)" }} />

      {/* Verbal / Matte */}
      <div className="grid grid-cols-2 gap-4">
        <ScoreCol label="Verbal" score={v.score} elo={eloVerbal} accent="var(--teal)" />
        <ScoreCol label="Matte" score={m.score} elo={eloMath} accent="var(--amber)" />
      </div>
    </div>
  );
}

function ScoreCol({
  label,
  score,
  elo,
  accent,
}: {
  label: string;
  score: string;
  elo: number;
  accent: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.12em]" style={{ color: "var(--hp-muted)" }}>
        {label}
      </p>
      <p
        className="mt-1.5 text-[28px] font-bold leading-none tabular-nums"
        style={{ color: accent, fontFamily: "var(--font-display)" }}
      >
        {score}
      </p>
      <p className="mt-1 text-[11px] tabular-nums" style={{ color: "var(--text-tertiary)" }}>
        ELO {elo}
      </p>
    </div>
  );
}
