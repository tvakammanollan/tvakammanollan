/**
 * Går den här uppgiften att spela?
 *
 * Reglerna är rena och testade här, och körs mot hela frågebanken av
 * `scripts/validate-questions.ts`. Skälet till uppdelningen är den vanliga i
 * det här repot: databasdelen går inte att enhetstesta, men *reglerna* måste
 * gå att pinna — det är de som ska hindra att en trasig uppgift kommer in
 * igen.
 *
 * Bakgrunden är matteduellerna. En matteuppgift ur arkivet är ofta ett
 * bildutsnitt ur provhäftet där hela uppgiften — stam OCH alternativ — ligger
 * i bilden, och alternativen bär sina egna koordinater (`crop`) i stället för
 * text. Det gör att en uppgift kan se komplett ut i databasen (fem rader i
 * `options`, facit ifyllt) och ändå rendera fem tomma knappar, eftersom
 * ingenting i raden går att visa. `optionRenderable` är den kontrollen.
 */

export type Crop = [number, number, number, number];

export interface ValidatableOption {
  id?: unknown;
  text?: unknown;
  crop?: unknown;
}

export interface ValidatableQuestion {
  id: string;
  category: string;
  exam_term?: string | null;
  /** Frågenumret är unikt PER PASS, inte per termin — 1–40 upprepas i varje
      kvantitativt pass. Krävs för att slå upp rätt arkivrad. */
  provpass_num?: number | null;
  q_num?: number | null;
  question_text?: string | null;
  options?: unknown;
  correct_answer?: string | null;
  image_url?: string | null;
  image_caption?: unknown;
}

/** Felkoder. Strängar och inte enum: de skrivs ut i rapporten och i tester. */
export type QuestionFault =
  | "saknar_facit"
  | "facit_utanför_alternativen"
  | "för_få_alternativ"
  | "alternativ_utan_innehåll"
  | "alternativ_endast_i_delad_bild"
  | "delvis_beskurna_alternativ"
  | "ogiltig_beskärning"
  | "bilduppgift_utan_bild"
  | "beskärning_utan_bildproportion";

/** Minsta antal svarsalternativ. XYZ, KVA och DTK har fyra, NOG har fem. */
export const MIN_OPTIONS = 4;

export function isCrop(v: unknown): v is Crop {
  return Array.isArray(v) && v.length === 4 && v.every((n) => typeof n === "number");
}

/**
 * Ligger beskärningen inom bilden och har den någon yta?
 *
 * Koordinaterna är andelar av bilden, så allt utanför 0–1 pekar utanför
 * bilden och ett tomt intervall ger en ruta utan yta. `CropView` returnerar
 * `null` för det senare, alltså ett alternativ utan innehåll.
 */
export function cropIsSane(c: Crop): boolean {
  const [x0, y0, x1, y1] = c;
  if (![x0, y0, x1, y1].every((n) => Number.isFinite(n))) return false;
  if (x0 < 0 || y0 < 0 || x1 > 1 || y1 > 1) return false;
  return x1 > x0 && y1 > y0;
}

function optionId(o: unknown, i: number): string {
  const letter = String.fromCharCode(65 + i);
  if (o && typeof o === "object" && typeof (o as { id?: unknown }).id === "string") {
    return (o as { id: string }).id;
  }
  return letter;
}

function optionText(o: unknown, i: number): string {
  if (typeof o === "string") return o;
  if (o && typeof o === "object") {
    const t = (o as { text?: unknown }).text;
    return t == null ? "" : String(t);
  }
  return String(o ?? "");
}

/**
 * Har alternativet något som faktiskt går att visa?
 *
 * Antingen en egen text som är mer än sin egen bokstav, eller en beskärning
 * ur uppgiftsbilden. `{id:"A", text:"A"}` utan `crop` är varken det ena eller
 * det andra — det är ett alternativ som bara finns i provhäftet.
 */
export function optionRenderable(o: unknown, i: number, hasImage: boolean): boolean {
  const id = optionId(o, i);
  const t = optionText(o, i).trim();
  if (t !== "" && t !== id && t !== id.toLowerCase()) return true;
  const crop = (o as { crop?: unknown } | null)?.crop;
  return hasImage && isCrop(crop) && cropIsSane(crop);
}

/** Bär `image_caption` en giltig stam-beskärning med bildproportion? */
export function hasStemAspect(caption: unknown): boolean {
  if (typeof caption !== "string" || !caption.startsWith("{")) return false;
  try {
    const v = JSON.parse(caption) as { stem?: unknown; aspect?: unknown };
    return isCrop(v.stem) && typeof v.aspect === "number" && v.aspect > 0;
  } catch {
    return false;
  }
}

/**
 * Bär `image_caption` en EGEN bild för alternativen, skild från `image_url`?
 *
 * DTK:s `image_url` är diagramuppslaget och innehåller aldrig alternativen
 * (se CLAUDE.md). 77 uppgifter hade ändå bara sin egen bokstav som
 * alternativtext — mönstret `alternativ_endast_i_delad_bild` nedan — trots
 * att arkivet HAR en egen bild med alternativen, sparad separat. `aspect`
 * saknas för 18 av dem (PDF-extraktionen fångade aldrig var varje bokstav
 * sitter) och de visar då hela bilden i stället för ett utsnitt per
 * alternativ — se `examCrops.ts`s `parseOptionsImage`.
 */
export function hasOwnOptionsImage(caption: unknown): boolean {
  if (typeof caption !== "string" || !caption.startsWith("{")) return false;
  try {
    const v = JSON.parse(caption) as { optionsImage?: unknown };
    return typeof v.optionsImage === "string" && v.optionsImage.length > 0;
  } catch {
    return false;
  }
}

/**
 * Bär `image_caption` en giltig proportion för `optionsImage`?
 *
 * Skild från `hasOwnOptionsImage`: 18 av de 77 DTK-uppgifterna HAR en egen
 * bild men saknar `optionsAspect` (PDF-extraktionen fångade aldrig var varje
 * bokstav sitter) — de visar hela bilden i stället för ett utsnitt, och då
 * finns det ingen beskärningsmatte att räcka en proportion till. Den skillnaden
 * är avsiktlig, inte ett fel — se `parseOptionsImage`.
 */
export function hasOwnOptionsAspect(caption: unknown): boolean {
  if (typeof caption !== "string" || !caption.startsWith("{")) return false;
  try {
    const v = JSON.parse(caption) as { optionsAspect?: unknown };
    return typeof v.optionsAspect === "number" && v.optionsAspect > 0;
  } catch {
    return false;
  }
}

/**
 * Alla fel på uppgiften. Tom lista = spelbar.
 *
 * Returnerar ALLA fel och inte bara det första: rapporten ska kunna säga hur
 * många uppgifter som saknar facit respektive alternativ var för sig, inte
 * bara "trasig".
 */
export function questionFaults(q: ValidatableQuestion): QuestionFault[] {
  const fel: QuestionFault[] = [];
  const raw = Array.isArray(q.options) ? q.options : [];
  // En egen bild för alternativen (DTK) räknas som "det finns en bild att
  // klippa ur" precis som `image_url` gör för XYZ/KVA — se
  // `hasOwnOptionsImage` ovan.
  const hasImage = !!q.image_url || hasOwnOptionsImage(q.image_caption);

  if (!q.correct_answer || !String(q.correct_answer).trim()) {
    fel.push("saknar_facit");
  } else if (raw.length > 0) {
    const ids = raw.map((o, i) => optionId(o, i));
    if (!ids.includes(String(q.correct_answer))) fel.push("facit_utanför_alternativen");
  }

  if (raw.length < MIN_OPTIONS) fel.push("för_få_alternativ");

  const crops = raw.map((o) => (o as { crop?: unknown } | null)?.crop);
  const medCrop = crops.filter((c) => c !== undefined && c !== null);
  if (medCrop.length > 0 && medCrop.length !== raw.length) {
    // `parseOptionCrops` faller tillbaka på hela utsnittet vid halva
    // uppsättningar, alltså en bild med tomma bokstavsknappar under.
    fel.push("delvis_beskurna_alternativ");
  }
  if (medCrop.some((c) => !isCrop(c) || !cropIsSane(c as Crop))) fel.push("ogiltig_beskärning");

  // Alternativ utan egen text OCH utan beskärning är det dokumenterade
  // reservläget: hela uppgiftsbilden visas, och alternativen står i den, med
  // en bokstavsrad under. Det är spelbart — 76 av arkivets 1 594 bilduppgifter
  // saknar beskärningar och renderas så med flit.
  //
  // Det gäller dock BARA om bilden är uppgiftens egen. DTK:s `image_url` är
  // diagramuppslaget, som delas av flera uppgifter i samma pass; där visar
  // reservläget ett diagram utan alternativ, och uppgiften går inte att
  // besvara. Skillnaden går inte att se på raden själv — den kräver arkivet,
  // och kontrolleras av `scripts/validate-questions.ts`.
  if (raw.length > 0 && !raw.every((o, i) => optionRenderable(o, i, hasImage))) {
    fel.push(hasImage ? "alternativ_endast_i_delad_bild" : "alternativ_utan_innehåll");
  }

  // Alternativ utan egen text betyder "de står i bilden" — då måste det finnas
  // en bild att peka på.
  const ingenEgenText =
    raw.length > 0 &&
    raw.every((o, i) => {
      const id = optionId(o, i);
      const t = optionText(o, i).trim();
      return t === "" || t === id || t === id.toLowerCase();
    });
  if (ingenEgenText && !hasImage) fel.push("bilduppgift_utan_bild");

  // Utan bildproportion faller `CropView` tillbaka på 1:1, och varje utsnitt
  // ur en bild som inte är kvadratisk blir då fel beskuret. Två giltiga
  // källor till proportionen: `stem.aspect` (XYZ/KVA) eller
  // `optionsImage.optionsAspect` (DTK) — aldrig båda på samma rad.
  if (
    medCrop.length > 0 &&
    !hasStemAspect(q.image_caption) &&
    !hasOwnOptionsAspect(q.image_caption)
  ) {
    fel.push("beskärning_utan_bildproportion");
  }

  return fel;
}

/** Kortform: går uppgiften att spela? */
export function questionIsPlayable(q: ValidatableQuestion): boolean {
  return questionFaults(q).length === 0;
}
