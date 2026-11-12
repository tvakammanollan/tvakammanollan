import { useNavigate } from "@tanstack/react-router";
import { Gauge } from "lucide-react";
import { combinedHpScore, estimateHpScore, hpScoreLabel } from "@/lib/hpScore";
import { formatDecimal } from "@/lib/sv-format";

const VERBAL = "#06040e";
const MATH = "#10242f";
/** hpScore-modulen returnerar strängar med punkt; visa svenskt decimaltecken. */
// Två decimaler: normerad poäng skrivs 1,60, inte 1,6 — skalan går i steg om
// 0,05. Samma skrivsätt som poängräknaren, annars säger de två ytorna emot
// varandra om vad en HP-poäng ens är för slags tal.
const sv = (s: string) => formatDecimal(parseFloat(s), 2);

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
          background: "rgba(46, 30, 20, 0.06)",
          color: "var(--cream)",
          fontFamily: "var(--font-mono)",
        }}
      >
        <Gauge className="h-3.5 w-3.5 text-primary" aria-hidden />
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
      // Terracotta: siffran räknas ur duellens ELO och är därmed duellens
      // yta (`lib/produktzon.ts`), samma som spela-kortet på startsidan.
      // Allt som står på den är Ink eller Graphite; zonfärgen bär aldrig text.
      className="group block w-full rounded-3xl bg-terracotta p-6 text-left transition hover:brightness-[1.03] sm:p-7"
    >
      {/* Label */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-[var(--cream-3)]">Trolig HP-poäng</p>
        <span className="text-[11px] font-semibold text-primary">{label}</span>
      </div>

      {/* Main score */}
      <div className="mt-3 flex items-baseline gap-2">
        <span
          className="text-[60px] font-bold leading-none tabular-nums text-primary"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {sv(combined)}
        </span>
        <span className="text-lg text-[var(--cream-3)]">/ 2,00</span>
      </div>

      {/* HP-skala (gauge) */}
      <div className="mt-5">
        <div className="relative h-2.5 w-full rounded-full bg-card/60">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-primary"
            style={{ width: `${pct}%` }}
          />
          {/* marker */}
          <div
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-primary"
            style={{ left: `${pct}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] tabular-nums text-[var(--cream-3)]">
          <span>0,00</span>
          <span>1,00</span>
          <span>2,00</span>
        </div>
      </div>

      {/* Divider */}
      <div className="my-5 border-t border-black/10" />

      {/* Verbal / Matte */}
      <div className="grid grid-cols-2 gap-5">
        <ScoreCol
          label="Verbal"
          score={v.score}
          desc={v.description}
          elo={eloVerbal}
          accent={VERBAL}
        />
        <ScoreCol
          label="Kvantitativ"
          score={m.score}
          desc={m.description}
          elo={eloMath}
          accent={MATH}
        />
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-[var(--cream-3)]">
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
        <p className="text-xs font-medium text-[var(--cream-3)]">{label}</p>
        <p className="text-[11px] tabular-nums text-[var(--cream-3)]">ELO {elo}</p>
      </div>
      <p
        className="mt-1.5 text-[30px] font-bold leading-none tabular-nums"
        style={{ color: accent, fontFamily: "var(--font-display)" }}
      >
        {sv(score)}
      </p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-card/60">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: accent }} />
      </div>
      <p className="mt-1.5 text-[11px] text-[var(--cream-3)]">{desc}</p>
    </div>
  );
}
