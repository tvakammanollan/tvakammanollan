import type { Crop } from "./CropView";

/**
 * Beskärningsdata för matteuppgifter som kommer ur `questions`-tabellen.
 *
 * Arkivets XYZ- och KVA-uppgifter är bildutsnitt ur provhäftet där hela
 * uppgiften — nummer, stam och alternativ — ligger i bilden. Importen skriver
 * med var varje del sitter, som andelar av bilden, så att kortet kan visa
 * stammen för sig och ett alternativ i varje knapp i stället för att visa hela
 * utsnittet med fyra tomma bokstavsknappar under.
 *
 * Alternativens andelar ligger i `options` (`{id, text, crop}`), stammens och
 * bildens proportion i `image_caption` som JSON. Se
 * `scripts/import-prov-questions.ts` för varför de bor där.
 */
export interface ExamStem {
  stem: Crop;
  aspect: number;
}

function isCrop(v: unknown): v is Crop {
  return Array.isArray(v) && v.length === 4 && v.every((n) => typeof n === "number");
}

/** Stambeskärningen ur `image_caption`, eller null om raden inte har någon. */
export function parseStem(caption: unknown): ExamStem | null {
  if (typeof caption !== "string" || !caption.startsWith("{")) return null;
  try {
    const v = JSON.parse(caption) as { stem?: unknown; aspect?: unknown };
    if (isCrop(v.stem) && typeof v.aspect === "number" && v.aspect > 0) {
      return { stem: v.stem, aspect: v.aspect };
    }
  } catch {
    // Fältet är en fritextrubrik i grunden — en rad som inte bär JSON är inget fel.
  }
  return null;
}

/**
 * Alternativens beskärningar i samma ordning som `options`.
 *
 * Returnerar null när något alternativ saknar sin beskärning: halva
 * uppsättningar ska falla tillbaka på hela utsnittet, inte ge några knappar med
 * innehåll och några tomma.
 */
export function parseOptionCrops(options: unknown): Crop[] | null {
  if (!Array.isArray(options) || options.length === 0) return null;
  const out: Crop[] = [];
  for (const o of options) {
    const crop = (o as { crop?: unknown })?.crop;
    if (!isCrop(crop)) return null;
    out.push(crop);
  }
  return out;
}
