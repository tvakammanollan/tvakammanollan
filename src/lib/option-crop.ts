/**
 * Svarsalternativ som ligger som utsnitt i provhäftets bild.
 *
 * De flesta KVA-uppgifter (och en del XYZ) lagras som en bild av hela
 * uppgiften. Alternativen har då ingen egen text — de står i bilden — och
 * sparas som `{ id: "A", text: "A", crop: [x0, y0, x1, y1] }`, där talen är
 * andelar av bildens bredd och höjd.
 *
 * Utan de här koordinaterna kan rättningen bara säga "rätt svar: C". Med dem
 * går det att visa vad C FAKTISKT var, klippt ur samma bild som redan laddats.
 * Ingen extra hämtning, ingen ny data, ingen kostnad.
 *
 * Utsnittet renderas som en bakgrundsbild i stället för en `<img>` med
 * overflow: en `<img>` hade krävt en wrapper med `position: relative` och
 * absolut positionerat barn för att kunna beskäras, och den konstruktionen
 * går sönder så fort någon sätter en höjd på föräldern.
 */

/** `[x0, y0, x1, y1]` som andelar 0–1 av bildens bredd respektive höjd. */
export type Crop = [number, number, number, number];

export function isCrop(value: unknown): value is Crop {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    value.every((n) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1)
  );
}

export interface CropStyle {
  backgroundImage: string;
  backgroundSize: string;
  backgroundPosition: string;
  backgroundRepeat: string;
  /**
   * Utsnittets proportion, så rutan får rätt höjd.
   *
   * Kräver källbildens egna mått: ett utsnitt som är 73 % av bredden och 9 %
   * av höjden har helt olika form beroende på om bilden är 459×406 eller
   * 900×300. Utan måtten blir rutan tiogånger för hög och alternativet ligger
   * som en rad text i ett stort tomt fält. Måtten mäts i webbläsaren (se
   * `useImageSize`); innan de landat utelämnas proportionen och rutan får en
   * minimihöjd i stället.
   */
  aspectRatio?: string;
}

/**
 * CSS för att visa exakt utsnittet, utskalat till hela rutan.
 *
 * Formeln är standardknepet för sprite-beskärning: bilden förstoras med
 * 1/bredden respektive 1/höjden, och positioneras med andelen av det som
 * blir kvar utanför rutan. Ett utsnitt som täcker hela bredden har inget kvar
 * att flytta på, och då är nämnaren noll — därav klämningen.
 */
export function cropStyle(imageUrl: string, crop: Crop, size?: ImageSize | null): CropStyle {
  const [x0, y0, x1, y1] = crop;
  const bredd = Math.max(0.0001, x1 - x0);
  const höjd = Math.max(0.0001, y1 - y0);
  const pos = (start: number, storlek: number) => {
    const kvar = 1 - storlek;
    return kvar <= 0.0001 ? 0 : (start / kvar) * 100;
  };
  return {
    backgroundImage: `url(${JSON.stringify(imageUrl)})`,
    backgroundSize: `${(1 / bredd) * 100}% ${(1 / höjd) * 100}%`,
    backgroundPosition: `${pos(x0, bredd)}% ${pos(y0, höjd)}%`,
    backgroundRepeat: "no-repeat",
    ...(size && size.width > 0 && size.height > 0
      ? { aspectRatio: `${bredd * size.width} / ${höjd * size.height}` }
      : {}),
  };
}

export interface ImageSize {
  width: number;
  height: number;
}

/** Utsnittet för ett alternativ, eller null om det inte finns något. */
export function optionCrop(option: unknown): Crop | null {
  if (!option || typeof option !== "object") return null;
  const c = (option as { crop?: unknown }).crop;
  return isCrop(c) ? c : null;
}
