export type EloTier = "gold" | "silver" | "bronze";

export function eloTier(elo: number): EloTier {
  if (elo >= 1500) return "gold";
  if (elo >= 1200) return "silver";
  return "bronze";
}

export function eloTierLabel(tier: EloTier): string {
  return tier === "gold" ? "Guld" : tier === "silver" ? "Silver" : "Brons";
}

const PALETTE = [
  "oklch(0.55 0.13 155)", // green
  "oklch(0.55 0.14 30)",  // warm red
  "oklch(0.55 0.13 250)", // blue
  "oklch(0.60 0.14 80)",  // gold
  "oklch(0.50 0.13 320)", // magenta
  "oklch(0.55 0.13 200)", // teal
  "oklch(0.55 0.13 110)", // olive
  "oklch(0.50 0.13 15)",  // brick
];

export function avatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function initials(name: string): string {
  const clean = name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2).toUpperCase();
  return clean || "??";
}
