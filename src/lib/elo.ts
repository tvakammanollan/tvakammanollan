/* `eloTier`/`eloTierLabel` togs bort: de definierade en andra, motstridig
   rang-skala (brons <1200 / silver <1500 / guld) parallellt med RANK_TIERS i
   `src/types`. Samma ELO kunde därför visas som två olika rangar samtidigt.
   RANK_TIERS är nu enda källan — se `getRankForElo`. */

const PALETTE = [
  "oklch(0.55 0.13 155)", // green
  "oklch(0.55 0.14 30)", // warm red
  "oklch(0.55 0.13 250)", // blue
  "oklch(0.60 0.14 80)", // gold
  "oklch(0.50 0.13 320)", // magenta
  "oklch(0.55 0.13 200)", // teal
  "oklch(0.55 0.13 110)", // olive
  "oklch(0.50 0.13 15)", // brick
];

export function avatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

/**
 * Två tecken ur namnet till avatarbrickan.
 *
 * `\p{L}` och inte `a-zA-Z`: den gamla klassen strök å, ä och ö helt, så
 * "Åke" blev **KE** och "Öberg" blev **BE** — på en sajt där varannat namn
 * har en av dem. Siffror är med eftersom användarnamn får innehålla dem.
 */
export function initials(name: string): string {
  const clean = name
    .replace(/[^\p{L}\p{N}]/gu, "")
    .slice(0, 2)
    .toUpperCase();
  return clean || "??";
}
