/**
 * HpCountdown
 * ──────────────────────────────────────────────────────────────
 * Visar tid kvar till nästa Högskoleprov. Tickar varje sekund.
 * Stora siffror för dagar, mindre för HH:MM:SS. Slutar tikta
 * när provet är inom 0 sekunder och visar "Lycka till idag!".
 *
 * Två storlekar:
 *   - "card"    (default) — fullständigt kort med eyebrow, datum, ticker
 *   - "inline"  — kompakt rad för t.ex. dashboard-sidebar
 * ──────────────────────────────────────────────────────────────
 */
import { useEffect, useState } from "react";
import { m } from "framer-motion";
import { getNextHpDate, timeUntil } from "@/lib/hp-dates";
import { CalendarDays } from "lucide-react";
import { formatDateLong } from "@/lib/sv-format";

interface HpCountdownProps {
  size?: "card" | "inline";
}

export function HpCountdown({ size = "card" }: HpCountdownProps) {
  const [now, setNow] = useState(() => new Date());
  const [next, setNext] = useState(() => getNextHpDate());

  useEffect(() => {
    // "card" visar sekunder → ticka varje sekund. "inline" visar bara dagar
    // (dashboarden) → 60s räcker och sparar ~59 re-renders/min.
    const tickMs = size === "card" ? 1000 : 60_000;
    const tickId = setInterval(() => setNow(new Date()), tickMs);
    const recomputeId = setInterval(() => setNext(getNextHpDate()), 60_000);
    return () => {
      clearInterval(tickId);
      clearInterval(recomputeId);
    };
  }, [size]);

  if (!next) {
    return null;
  }

  const t = timeUntil(next.date, now);
  const formattedDate = formatDateLong(next.date);

  if (size === "inline") {
    return (
      <div className="inline-flex items-center gap-2 text-sm">
        <CalendarDays className="h-4 w-4" style={{ color: "var(--amber)" }} />
        <span style={{ color: "var(--text-secondary)" }}>{next.label}:</span>
        <span className="font-bold tabular-nums" style={{ color: "var(--amber)" }}>
          {t.days} dagar
        </span>
      </div>
    );
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border p-6 sm:p-7"
      style={{
        borderColor: "var(--line)",
        background: "var(--navy-2)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      {/* Decorative amber glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--amber), transparent 70%)" }}
      />

      <div className="relative">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" style={{ color: "var(--amber)" }} />
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: "var(--hp-muted)" }}
          >
            Nästa HP-prov
          </p>
        </div>

        <h3
          className="display mt-3 text-[20px] font-bold leading-tight sm:text-[24px]"
          style={{ color: "var(--cream)", fontFamily: "var(--font-display)" }}
        >
          {next.label}
        </h3>

        <div className="mt-5 flex items-baseline gap-3">
          <span
            className="display text-[56px] font-bold leading-none tabular-nums sm:text-[72px]"
            style={{
              color: "var(--amber)",
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.04em",
            }}
          >
            {t.days}
          </span>
          <span
            className="text-[15px] font-medium sm:text-[17px]"
            style={{ color: "var(--text-secondary)" }}
          >
            {t.days === 1 ? "dag kvar" : "dagar kvar"}
          </span>
        </div>

        <div
          className="mt-4 flex items-center gap-3 font-mono text-[13px] tabular-nums"
          style={{ color: "var(--text-tertiary)" }}
        >
          <TimeBlock value={t.hours} label="tim" />
          <span style={{ color: "var(--text-quiet)" }}>:</span>
          <TimeBlock value={t.minutes} label="min" />
          <span style={{ color: "var(--text-quiet)" }}>:</span>
          <TimeBlock value={t.seconds} label="sek" />
        </div>

        <p className="mt-5 text-[13px]" style={{ color: "var(--text-secondary)" }}>
          {formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
        </p>
      </div>
    </m.div>
  );
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span style={{ color: "var(--cream)" }} className="font-bold">
        {value.toString().padStart(2, "0")}
      </span>
      <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-quiet)" }}>
        {label}
      </span>
    </span>
  );
}
