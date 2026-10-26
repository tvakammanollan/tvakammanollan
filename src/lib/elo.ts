/* `eloTier`/`eloTierLabel` togs bort: de definierade en andra, motstridig
   rang-skala (brons <1200 / silver <1500 / guld) parallellt med RANK_TIERS i
   `src/types`. Samma ELO kunde därför visas som två olika rangar samtidigt.
   RANK_TIERS är nu enda källan — se `getRankForElo`. */

// Systemets egna mörka toner: Plum, Deep Teal, Graphite och Ink, alla med
// vit text över 12:1. Här låg en regnbåge på åtta toner (grön, röd, blå,
// guld, magenta, turkos, oliv, tegel), vilket gav varje konto en slumpad
// färg bredvid ELO-pillen. En grön bricka bredvid ett tal läste som en
// statusprick, och sajten har en bestämd palett som slumpen inte ska
// kringgå. Fyra toner räcker för att två konton intill varandra oftast
// ska skilja sig åt, och bokstäverna gör resten.
const PALETTE = [
  "#1f1738", // Plum
  "#10242f", // Deep Teal
  "#452623", // Graphite
  "#06040e", // Ink
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
  // Gästens visningsnamn är exakt "Gäst". Två tecken ur det blev "GÄ", som
  // läses som ett par bokstäver i ett namn och inte som en gäst.
  if (name.trim() === "Gäst") return "G";
  const clean = name
    .replace(/[^\p{L}\p{N}]/gu, "")
    .slice(0, 2)
    .toUpperCase();
  return clean || "??";
}

/** Det `displayElo` behöver ur profilen — se `Profile` i `useAuth`. */
export interface EloStanding {
  elo_verbal: number;
  elo_math: number;
  /** Antal rankade matcher per gren. `undefined` = räkningen kom inte med. */
  matches_verbal?: number;
  matches_math?: number;
}

export interface EloHeadline {
  elo: number;
  /** Grenen talet kommer från. `null` när båda ligger lika — då säger en etikett inget. */
  track: "verbal" | "math" | null;
}

/**
 * Ett enda ELO till navbaren, plus vilken gren det kommer från.
 *
 * Navbaren visade båda grenarna bredvid varandra ("V 1000  M 963"), vilket
 * var ärligt men blev två tal att tolka på en yta som ska gå att läsa i
 * förbifarten. Ett tal räcker: den högsta av de grenar man faktiskt spelat.
 *
 * Poängen med "faktiskt spelat" är den orörda 1000:an. Den som spelat en enda
 * verbal match och förlorat står på 963 verbalt och 1000 i matte, och ett rakt
 * `Math.max` visade 1000 — ett golv som inte finns i datan (samma fel som
 * rättades på dashboarden). En gren utan matcher räknas därför inte med alls.
 *
 * Räkningen, inte ELO:t, avgör om en gren är spelad: oavgjort mot lika
 * motstånd ger ±0, så `elo === 1000` betyder inte "aldrig spelat". Saknas
 * räkningen faller den tillbaka på högsta av de två.
 */
export function displayElo(s: EloStanding): EloHeadline {
  const { matches_verbal: verbal, matches_math: math } = s;
  const played = (n: number | undefined) => n === undefined || n > 0;

  // En gren räknas med om den är spelad — eller om räkningen saknas, för då
  // vet vi inget och får inte gissa bort ett tal spelaren har.
  const useVerbal = played(verbal);
  const useMath = played(math);

  if (useVerbal && !useMath) return { elo: s.elo_verbal, track: "verbal" };
  if (useMath && !useVerbal) return { elo: s.elo_math, track: "math" };

  // Båda spelade (eller ingen alls — då står de båda på ingångs-ELO ändå).
  if (s.elo_verbal > s.elo_math) return { elo: s.elo_verbal, track: "verbal" };
  if (s.elo_math > s.elo_verbal) return { elo: s.elo_math, track: "math" };
  return { elo: s.elo_verbal, track: null };
}
