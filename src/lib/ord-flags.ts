/**
 * Besökarens egna flaggor på ord: fyra färger utan given betydelse, så att var
 * och en kan bygga sitt eget system ("skitlätta", "kör en gång till").
 *
 * Lagras lokalt (`tkn:ord-flaggor:v1`), som resultaten på gamla prov: det ska
 * fungera utan konto och kräver ingen tabell. Baksidan är att flaggorna inte
 * följer med till en annan enhet.
 */
export const FLAG_COLORS = ["bla", "gron", "rod", "gul"] as const;
export type FlagColor = (typeof FLAG_COLORS)[number];

export const FLAG_STORAGE_KEY = "tkn:ord-flaggor:v1";
export const FLAG_ENABLED_KEY = "tkn:ord-flaggor-pa";
export const FLAG_NAME_MAX = 24;

export const FLAG_DEFAULT_NAMES: Record<FlagColor, string> = {
  bla: "Blå",
  gron: "Grön",
  rod: "Röd",
  gul: "Gul",
};

/** Literala färger: flaggan ska se likadan ut oavsett palett, och vit text går på alla fyra. */
export const FLAG_HEX: Record<FlagColor, string> = {
  bla: "#2f6fb0",
  gron: "#2f6b3c",
  rod: "#b3362b",
  gul: "#8a6a00",
};

export type OrdFlags = {
  /** question-id -> färg. Ett ord har högst en flagga. */
  flags: Record<string, FlagColor>;
  /** Besökarens egna namn på färgerna. Saknas ett gäller färgens namn. */
  names: Partial<Record<FlagColor, string>>;
};

export const EMPTY_FLAGS: OrdFlags = { flags: {}, names: {} };

const isColor = (v: unknown): v is FlagColor =>
  typeof v === "string" && (FLAG_COLORS as readonly string[]).includes(v);

/** Läser lagrad text. Allt som inte håller kastas: filen är besökarens egen. */
export function parseOrdFlags(raw: string | null): OrdFlags {
  if (!raw) return EMPTY_FLAGS;
  try {
    const data = JSON.parse(raw) as { flags?: unknown; names?: unknown };
    const flags: Record<string, FlagColor> = {};
    if (data.flags && typeof data.flags === "object") {
      for (const [id, c] of Object.entries(data.flags as Record<string, unknown>)) {
        if (isColor(c)) flags[id] = c;
      }
    }
    const names: Partial<Record<FlagColor, string>> = {};
    if (data.names && typeof data.names === "object") {
      for (const [c, n] of Object.entries(data.names as Record<string, unknown>)) {
        if (isColor(c) && typeof n === "string" && n.trim()) {
          names[c] = n.trim().slice(0, FLAG_NAME_MAX);
        }
      }
    }
    return { flags, names };
  } catch {
    return EMPTY_FLAGS;
  }
}

/** Sätter flaggan, eller tar bort den om ordet redan har just den färgen. */
export function toggleFlag(state: OrdFlags, id: string, color: FlagColor): OrdFlags {
  const flags = { ...state.flags };
  if (flags[id] === color) delete flags[id];
  else flags[id] = color;
  return { ...state, flags };
}

export function renameFlag(state: OrdFlags, color: FlagColor, name: string): OrdFlags {
  const names = { ...state.names };
  const clean = name.trim().slice(0, FLAG_NAME_MAX);
  if (clean) names[color] = clean;
  else delete names[color];
  return { ...state, names };
}

export function flagName(state: OrdFlags, color: FlagColor): string {
  return state.names[color] ?? FLAG_DEFAULT_NAMES[color];
}

export function flagCounts(state: OrdFlags): Record<FlagColor, number> {
  const ut: Record<FlagColor, number> = { bla: 0, gron: 0, rod: 0, gul: 0 };
  for (const c of Object.values(state.flags)) ut[c]++;
  return ut;
}

/** Upp till `n` slumpade ord med färgen. `rand` går att byta i test. */
export function pickFlagged(
  state: OrdFlags,
  color: FlagColor,
  n: number,
  rand: () => number = Math.random,
): string[] {
  const ids = Object.keys(state.flags).filter((id) => state.flags[id] === color);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.slice(0, n);
}
