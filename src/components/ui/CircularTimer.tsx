import { useEffect, useRef, useState } from "react";

interface CircularTimerProps {
  totalSeconds: number;
  remainingSeconds: number;
  onExpire?: () => void;
}

const RADIUS = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SOUND_KEY = "timer_sound";

function playTick() {
  try {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SOUND_KEY) === "off") return;
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.type = "sine";
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
    setTimeout(() => void ctx.close(), 200);
  } catch {
    /* ignore */
  }
}

export function CircularTimer({
  totalSeconds,
  remainingSeconds,
  onExpire,
}: CircularTimerProps) {
  const expiredRef = useRef(false);
  const lastTickRef = useRef<number>(-1);

  useEffect(() => {
    if (remainingSeconds <= 0 && !expiredRef.current) {
      expiredRef.current = true;
      onExpire?.();
    }
  }, [remainingSeconds, onExpire]);

  // Tick sound: every 5 seconds when < 30s
  useEffect(() => {
    if (remainingSeconds > 30 || remainingSeconds <= 0) return;
    if (remainingSeconds % 5 !== 0) return;
    if (lastTickRef.current === remainingSeconds) return;
    lastTickRef.current = remainingSeconds;
    playTick();
  }, [remainingSeconds]);

  const progress = Math.max(
    0,
    Math.min(1, remainingSeconds / Math.max(1, totalSeconds)),
  );
  const offset = CIRCUMFERENCE * (1 - progress);

  let color = "#6fb3b8";
  if (remainingSeconds < 60) color = "#c0392b";
  else if (remainingSeconds <= 120) color = "#F2A65A";

  const mm = String(Math.floor(Math.max(0, remainingSeconds) / 60)).padStart(2, "0");
  const ss = String(Math.max(0, remainingSeconds) % 60).padStart(2, "0");

  const pulsing = remainingSeconds < 60 && remainingSeconds > 0;

  return (
    <div
      className={pulsing ? "timer-pulse" : ""}
      style={{ width: 48, height: 48, position: "relative" }}
      aria-live="polite"
      aria-label={`${mm}:${ss} kvar`}
    >
      <svg width="48" height="48" viewBox="0 0 48 48">
        <circle
          cx="24"
          cy="24"
          r={RADIUS}
          fill="none"
          stroke="#e2e0db"
          strokeWidth="4"
        />
        <circle
          cx="24"
          cy="24"
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform="rotate(-90 24 24)"
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s ease" }}
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center text-[11px] font-bold tabular-nums"
        style={{
          fontFamily: "ui-monospace, 'JetBrains Mono', 'DM Mono', monospace",
          color,
        }}
      >
        {mm}:{ss}
      </div>
    </div>
  );
}

export function TimerSoundToggle() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return sessionStorage.getItem(SOUND_KEY) !== "off";
  });
  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    try {
      sessionStorage.setItem(SOUND_KEY, next ? "on" : "off");
    } catch {
      /* ignore */
    }
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={enabled ? "Stäng av timer-ljud" : "Slå på timer-ljud"}
      title={enabled ? "Stäng av timer-ljud" : "Slå på timer-ljud"}
      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-base text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      {enabled ? "🔔" : "🔕"}
    </button>
  );
}
