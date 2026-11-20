// Lightweight sound effects via Web Audio API synthesis.
// No external assets, no copyright issues. Classy + minimal.

let audioCtx: AudioContext | null = null;

/**
 * Av/på sparas i `tkn:ljud`. Den gamla nyckeln `sfx_enabled` läses en gång
 * och flyttas över, så den som redan stängt av ljudet slipper göra om det.
 */
const STORAGE_KEY = "tkn:ljud";
const LEGACY_KEY = "sfx_enabled";

function readEnabled(): boolean {
  try {
    if (typeof localStorage === "undefined") return true;
    const v = localStorage.getItem(STORAGE_KEY);
    if (v !== null) return v !== "av";
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy !== null) {
      localStorage.setItem(STORAGE_KEY, legacy === "false" ? "av" : "på");
      localStorage.removeItem(LEGACY_KEY);
      return legacy !== "false";
    }
  } catch {
    /* privat läge: ljudet är på och valet lever bara i minnet */
  }
  return true;
}

let enabled = typeof window !== "undefined" ? readEnabled() : true;
const listeners = new Set<() => void>();

export function isSoundEnabled(): boolean {
  return enabled;
}

export function setSoundEnabled(on: boolean) {
  enabled = on;
  try {
    localStorage.setItem(STORAGE_KEY, on ? "på" : "av");
  } catch {
    /* privat läge */
  }
  listeners.forEach((l) => l());
}

export function subscribeSoundEnabled(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const masterVol = 0.7;

type Win = Window & { webkitAudioContext?: typeof AudioContext };

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as Win).webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  // Some browsers suspend until user gesture
  if (audioCtx.state === "suspended") {
    void audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType = "sine",
  gain = 0.08,
  whenOffset = 0,
) {
  if (!enabled) return;
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime + whenOffset;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain * masterVol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function sweep(
  fromFreq: number,
  toFreq: number,
  dur: number,
  type: OscillatorType = "sine",
  gain = 0.07,
  whenOffset = 0,
) {
  if (!enabled) return;
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime + whenOffset;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(fromFreq, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(40, toFreq), t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain * masterVol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

export const sounds = {
  // Subtle UI tick for buttons
  click: () => tone(1100, 0.04, "triangle", 0.03),
  // Soft ping for selection / nav
  ping: () => {
    tone(1320, 0.1, "sine", 0.05);
    tone(1980, 0.09, "sine", 0.025, 0.04);
  },
  // Right answer feedback (rising third)
  correct: () => {
    tone(880, 0.09, "sine", 0.06);
    tone(1320, 0.18, "sine", 0.06, 0.07);
  },
  // Wrong answer (low descending)
  wrong: () => {
    sweep(280, 140, 0.28, "sawtooth", 0.05);
  },
  // Match found — friendly arpeggio
  matchFound: () => {
    [659, 880, 1175].forEach((f, i) => tone(f, 0.16, "sine", 0.06, i * 0.09));
  },
  // Submit / confirm
  submit: () => {
    tone(880, 0.08, "sine", 0.06);
    tone(1320, 0.12, "sine", 0.05, 0.05);
  },
  // Victory fanfare
  victory: () => {
    [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.28, "triangle", 0.07, i * 0.11));
  },
  // Defeat
  defeat: () => {
    [523, 466, 392, 311].forEach((f, i) => tone(f, 0.32, "sine", 0.06, i * 0.14));
  },
  // Friend invite / notification
  invite: () => {
    tone(1568, 0.08, "triangle", 0.05);
    tone(2093, 0.09, "triangle", 0.04, 0.07);
  },
  // Tick for countdown
  tick: () => tone(1500, 0.04, "square", 0.025),
  // Open modal
  open: () => sweep(660, 1100, 0.12, "sine", 0.04),
  // Klockan: 30 sekunder kvar. Två lugna toner nedåt, en påminnelse och inget larm.
  warning: () => {
    tone(988, 0.12, "triangle", 0.05);
    tone(740, 0.18, "triangle", 0.05, 0.14);
  },
  // Utmärkelse: ett ljust klockspel, kortare än vinstfanfaren
  achievement: () => {
    [1046, 1318, 1568, 2093].forEach((f, i) => tone(f, 0.22, "sine", 0.05, i * 0.07));
    tone(2637, 0.35, "sine", 0.025, 0.3);
  },
};

// Install global click sound on real buttons. Idempotent.
let installed = false;
export function installGlobalClickSound() {
  if (installed || typeof document === "undefined") return;
  installed = true;
  document.addEventListener(
    "pointerdown",
    (e) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const btn = target.closest('button, [role="button"], a[data-sfx], [data-sfx="click"]');
      if (!btn) return;
      // Skip if explicitly muted
      if ((btn as HTMLElement).dataset.sfx === "off") return;
      // Skip native disabled
      if ((btn as HTMLButtonElement).disabled) return;
      sounds.click();
    },
    { passive: true },
  );
}
