import { useEffect, useRef, useState } from "react";
import { Bell, BellOff } from "lucide-react";

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
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
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

export function CircularTimer({ totalSeconds, remainingSeconds, onExpire }: CircularTimerProps) {
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

  const progress = Math.max(0, Math.min(1, remainingSeconds / Math.max(1, totalSeconds)));
  const offset = CIRCUMFERENCE * (1 - progress);

  // Samma tre nivåer som resten av appen: neutral (teal) → varning (amber)
  // → kritisk (röd). Var tidigare #c0392b, en fjärde röd nyans som inte fanns
  // någon annanstans i paletten; nu samma värde som --danger/--destructive.
  //
  // Literal hex, inte var(--danger): färgen sätts som SVG-presentationsattribut
  // (`stroke`), och var() är inte pålitligt stödd där i alla webbläsare.
  let color = "#7a5236";
  if (remainingSeconds < 60) color = "#8c1d18";
  else if (remainingSeconds <= 120) color = "#ae2f26";

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
        {/* Spårringen var #e2e0db — nästan vit, och lyste starkare än
            själva nedräkningen på den mörka ytan. */}
        <circle
          cx="24"
          cy="24"
          r={RADIUS}
          fill="none"
          stroke="rgba(46, 30, 20, 0.12)"
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
          fontFamily: "var(--font-mono)",
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
      aria-pressed={enabled}
      // 44×44 är minsta tryckyta på telefon; knappen var 36×36 och sitter i
      // matchens topplist, mellan klockan och skärmkanten.
      className="inline-flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
    >
      {enabled ? (
        <Bell className="h-4 w-4" aria-hidden />
      ) : (
        <BellOff className="h-4 w-4" aria-hidden />
      )}
    </button>
  );
}
