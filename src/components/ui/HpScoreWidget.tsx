import { useNavigate } from "@tanstack/react-router";
import { combinedHpScore, estimateHpScore } from "@/lib/hpScore";

interface HpScoreWidgetProps {
  eloVerbal: number;
  eloMath: number;
  size?: "compact" | "full";
}

/**
 * HP Score widget — exact estimate from current ELO. No intervals,
 * no "ungefär"/"~"-prefixes. Two columns (verbal, matte) over a
 * combined total.
 */
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
        boxShadow: "var(--shadow-md)",
      }}
    >
      <div className="flex items-baseline justify-between">
        <h2
          className="text-[15px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: "var(--hp-muted)", fontFamily: "var(--font-display)" }}
        >
          Trolig HP-poäng
        </h2>
        <span
          className="tabular-nums text-[44px] font-bold leading-none"
          style={{
            color: "var(--amber)",
            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
          }}
        >
          {combined}
        </span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <HpRow label="Verbal" elo={eloVerbal} score={v.score} accent="var(--teal)" />
        <HpRow label="Matte" elo={eloMath} score={m.score} accent="var(--amber)" />
      </div>
    </div>
  );
}

function HpRow({
  label,
  elo,
  score,
  accent,
}: {
  label: string;
  elo: number;
  score: string;
  accent: string;
}) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{
        borderColor: "var(--line)",
        background: "rgba(7,17,30,0.55)",
      }}
    >
      <div className="flex items-baseline justify-between">
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: "var(--hp-muted)" }}
        >
          {label}
        </span>
        <span className="text-[11px] tabular-nums" style={{ color: "var(--text-tertiary)" }}>
          ELO {elo}
        </span>
      </div>
      <div
        className="mt-2 text-[36px] font-bold leading-none tabular-nums"
        style={{
          color: accent,
          fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
        }}
      >
        {score}
      </div>
    </div>
  );
}
