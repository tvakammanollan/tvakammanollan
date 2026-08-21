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

// Samma gräns som `option-crop.ts`s `isCrop` och `question-validity.ts`s
// `cropIsSane`: koordinaterna är andelar av bilden, så allt utanför 0–1 eller
// icke-ändligt pekar utanför bilden och renderas som ett fel skuret utsnitt
// i stället för att döljas.
function isCrop(v: unknown): v is Crop {
  return (
    Array.isArray(v) &&
    v.length === 4 &&
    v.every((n) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1)
  );
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
 * En bild som bär alternativen men INTE är `image_url`.
 *
 * DTK:s `image_url` är avsiktligt diagramuppslaget (se CLAUDE.md) — det delas
 * av flera uppgifter i samma provpass och innehåller aldrig svarsalternativen.
 * 77 DTK-uppgifter hade ändå bara sin egen bokstav som alternativtext, alltså
 * exakt mönstret "alternativen står i bilden" — fast i en bild som aldrig
 * sparades. Arkivets EGNA utsnitt (`29.webp`, skilt från `diagram-1.webp`)
 * har den, och `image_caption` bär nu båda: `{optionsImage, optionsAspect}`
 * vid sidan av (aldrig samtidigt som) XYZ/KVA:s `{stem, aspect}`.
 *
 * `aspect` är `null` för de 18 uppgifter (av 77) där själva PDF-extraktionen
 * aldrig fångade var varje bokstav sitter — bara att bilden finns. De visar
 * hela `optionsImage` i stället för ett utsnitt per alternativ; se
 * `question-validity.ts`s `alternativ_endast_i_delad_bild` för hur den
 * skillnaden kontrolleras maskinellt.
 */
export interface OptionsImage {
  src: string;
  aspect: number | null;
}

export function parseOptionsImage(caption: unknown): OptionsImage | null {
  if (typeof caption !== "string" || !caption.startsWith("{")) return null;
  try {
    const v = JSON.parse(caption) as { optionsImage?: unknown; optionsAspect?: unknown };
    if (typeof v.optionsImage === "string" && v.optionsImage) {
      const aspect =
        typeof v.optionsAspect === "number" && v.optionsAspect > 0 ? v.optionsAspect : null;
      return { src: v.optionsImage, aspect };
    }
  } catch {
    // Fältet är en fritextrubrik i grunden — en rad som inte bär JSON är inget fel.
  }
  return null;
}

/**
 * Var alternativens beskärningar ska klippas ifrån, och den bildens
 * proportion. Två källor:
 *  - XYZ/KVA-bildutsnitt: alternativen ligger i SAMMA bild som stammen
 *    (`image_url`); proportionen kommer ur `stem.aspect`.
 *  - DTK med egen bild: alternativen ligger i `optionsImage.src`, en bild
 *    skild från `image_url` (diagrammet); proportionen är `optionsImage.aspect`.
 * `null` när ingen av de två finns, ELLER när `optionsImage` finns men saknar
 * `aspect` (de 18 utan per-bokstav-koordinater — se ovan; de får sin egna
 * rendering, inte beskärningsmatte).
 */
export function optionCropSource(
  imageUrl: string | null | undefined,
  stem: ExamStem | null,
  optionsImage: OptionsImage | null,
): { src: string; aspect: number } | null {
  if (optionsImage?.aspect) return { src: optionsImage.src, aspect: optionsImage.aspect };
  if (stem && imageUrl) return { src: imageUrl, aspect: stem.aspect };
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
