import { useNavigate } from "@tanstack/react-router";
import { Gauge } from "lucide-react";
import { combinedHpScore, estimateHpScore, hpScoreLabel } from "@/lib/hpScore";
import { formatDecimal } from "@/lib/sv-format";

const VERBAL = "#ae2f26";
const MATH = "#7a5236";
/** hpScore-modulen returnerar strängar med punkt; visa svenskt decimaltecken. */
const sv = (s: string) => formatDecimal(parseFloat(s), 1);

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
        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs transition-colors hover:bg-white/[0.06]"
        style={{
          borderColor: "var(--line)",
          background: "rgba(42, 28, 16, 0.6)",
          color: "var(--cream)",
          fontFamily: "var(--font-mono)",
        }}
      >
        <Gauge className="h-3.5 w-3.5 text-[#ae2f26]" aria-hidden />
        <span className="tabular-nums">HP {sv(combined)}</span>
      </button>
    );
  }

  const v = estimateHpScore(eloVerbal);
  const m = estimateHpScore(eloMath);
  const combinedNum = parseFloat(combined);
  const pct = Math.max(2, Math.min(100, (combinedNum / 2) * 100));
  const label = hpScoreLabel(combinedNum);

  return (
    <button
      type="button"
      onClick={() => navigate({ to: "/stats" })}
      className="group block w-full rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-left backdrop-blur-sm transition-colors hover:border-white/15 hover:bg-white/[0.03]"
    >
      {/* Label */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">
          Trolig HP-poäng
        </p>
        <span className="rounded-full border border-[#ae2f26]/25 bg-[#ae2f26]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#ae2f26]">
          {label}
        </span>
      </div>

      {/* Main score */}
      <div className="mt-3 flex items-baseline gap-2">
        <span
          className="text-[60px] font-bold leading-none tabular-nums text-[#ae2f26]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {sv(combined)}
        </span>
        <span className="text-lg text-white/40">/ 2,0</span>
      </div>

      {/* HP-skala (gauge) */}
      <div className="mt-5">
        <div className="relative h-2.5 w-full rounded-full bg-white/8">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#8f2620] to-[#ae2f26]"
            style={{ width: `${pct}%` }}
          />
          {/* marker */}
          <div
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#fbf6ec] bg-[#f5c089] shadow"
            style={{ left: `${pct}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] tabular-nums text-white/35">
          <span>0,0</span>
          <span>1,0</span>
          <span>2,0</span>
        </div>
      </div>

      {/* Divider */}
      <div className="my-5 border-t border-white/8" />

      {/* Verbal / Matte */}
      <div className="grid grid-cols-2 gap-5">
        <ScoreCol
          label="Verbal"
          score={v.score}
          desc={v.description}
          elo={eloVerbal}
          accent={VERBAL}
        />
        <ScoreCol label="Matte" score={m.score} desc={m.description} elo={eloMath} accent={MATH} />
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-white/35">
        Uppskattat från din ELO. Riktig normering varierar med provets svårighet.
      </p>
    </button>
  );
}

function ScoreCol({
  label,
  score,
  desc,
  elo,
  accent,
}: {
  label: string;
  score: string;
  desc: string;
  elo: number;
  accent: string;
}) {
  const pct = Math.max(3, Math.min(100, (parseFloat(score) / 2) * 100));
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/45">{label}</p>
        <p className="text-[11px] tabular-nums text-white/35">ELO {elo}</p>
      </div>
      <p
        className="mt-1.5 text-[30px] font-bold leading-none tabular-nums"
        style={{ color: accent, fontFamily: "var(--font-display)" }}
      >
        {sv(score)}
      </p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: accent }} />
      </div>
      <p className="mt-1.5 text-[11px] text-white/40">{desc}</p>
    </div>
  );
}
