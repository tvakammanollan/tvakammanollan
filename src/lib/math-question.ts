/**
 * Hur en matteuppgift ska renderas.
 *
 * Matteuppgifter finns i två former i beståndet, och de kräver motsatt
 * behandling:
 *
 *  - **Utsnitt ur provhäftet** (de flesta XYZ och KVA, en del NOG). Hela
 *    uppgiften — text, bråkstreck, exponenter, rötter OCH svarsalternativen —
 *    ligger i bilden. Raden i `question_text` är PDF-extraktionen av samma sak
 *    och är obrukbar: `3 27 x 2 =` där häftet visar en kubikrot. Alternativen
 *    lagras som `{id:"A", text:"A"}`, alltså bara bokstaven.
 *  - **Löptext med figur** (DTK, och NOG-uppgifter med diagram). Där är
 *    `question_text` den riktiga frågan, alternativen har egna texter, och
 *    bilden är underlaget bredvid.
 *
 * Renderades båda likadant fick den första formen sin uppgift två gånger: en
 * gång som obegriplig radbruten text och en gång, korrekt, i bilden strax
 * under.
 *
 * Testet är **datadrivet och inte kategoribaserat**. En regel som "XYZ och KVA
 * döljer texten" hade varit fel för de 114 XYZ-uppgifter som inte har någon
 * bild alls, och för de NOG-uppgifter som har det. Det som faktiskt skiljer
 * formerna åt är att bildvarianten saknar alternativtexter — och det är
 * samma sak som att alternativen står i bilden.
 */

export interface RenderableQuestion {
  image_url?: string | null;
  /** Alternativen, som strängar eller `{id, text}`. */
  options?: unknown;
  /**
   * Sant när alternativen ligger i en EGEN bild, skild från `image_url`.
   *
   * DTK:s `image_url` är diagramuppslaget — det innehåller aldrig
   * alternativen, och den extraherade `question_text` är på DTK alltid riktig
   * (inte PDF-skräp). Utan flaggan läste `isImageQuestion` "alternativen
   * saknar egen text" som "hela uppgiften ligger i image_url" och dolde en
   * korrekt frågetext ovanför ett diagram som aldrig visade svaren — 77
   * uppgifter renderade då varken text eller alternativ. Se
   * `examCrops.ts`s `parseOptionsImage`.
   */
  hasOwnOptionsImage?: boolean;
}

function optionText(option: unknown, index: number): { id: string; text: string } {
  const letter = String.fromCharCode(65 + index);
  if (typeof option === "string") return { id: letter, text: option };
  if (option && typeof option === "object") {
    const o = option as { id?: unknown; text?: unknown };
    return {
      id: typeof o.id === "string" ? o.id : letter,
      text: o.text == null ? "" : String(o.text),
    };
  }
  return { id: letter, text: String(option ?? "") };
}

/**
 * Har alternativet en egen text, eller är det bara sin egen bokstav?
 *
 * `{id:"A", text:"A"}` betyder "alternativet står i bilden". Att rendera den
 * texten ger raden `A  A` — bokstavsbrickan följd av samma bokstav en gång
 * till — vilket ser ut som ett renderingsfel.
 */
export function optionHasOwnText(option: unknown, index: number): boolean {
  const { id, text } = optionText(option, index);
  const t = text.trim();
  return t !== "" && t !== id && t !== id.toLowerCase();
}

/**
 * Sant när bilden ÄR uppgiften: uppgiftstexten och alternativtexterna ska då
 * inte renderas, eftersom de bara är trasiga kopior av det bilden visar.
 */
export function isImageQuestion(q: RenderableQuestion): boolean {
  // Finns en egen bild för alternativen kan `image_url` omöjligen VARA
  // uppgiften — de är per definition två olika bilder.
  if (q.hasOwnOptionsImage) return false;
  if (!q.image_url) return false;
  const raw = Array.isArray(q.options) ? q.options : [];
  if (raw.length === 0) return true;
  // Alla alternativ är bara sin egen bokstav (eller tomma) → texterna finns i
  // bilden. Ett enda alternativ med riktig text räcker för att det ska vara
  // en textuppgift med figur.
  return raw.every((o, i) => !optionHasOwnText(o, i));
}

/** Sant när uppgiftstexten ska skrivas ut ovanför bilden. */
export function showQuestionText(
  q: RenderableQuestion & { question_text?: string | null },
): boolean {
  if (!q.question_text || !q.question_text.trim()) return false;
  return !isImageQuestion(q);
}
