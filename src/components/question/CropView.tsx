/**
 * En utklippt del av ett provhäftesutsnitt.
 *
 * XYZ och KVA lagras som bilder därför att matematiken inte går att få ut som
 * text ur UHR:s PDF:er (se `scripts/hp-import/kvant.py`). Bilden innehåller hela
 * uppgiften — stam *och* svarsalternativ — vilket förr gav ett kort med fyra
 * tomma bokstavsknappar under en bild där alternativen redan stod, plus
 * uppgiftsnumret två gånger.
 *
 * Importen skriver därför ut var varje del sitter, som andelar av bilden, och
 * den här komponenten visar en av dem. Samma fil används till alla utsnitt —
 * webbläsaren laddar den en gång — i stället för en egen bildfil per alternativ,
 * vilket hade femdubblat antalet filer i `public/`.
 *
 * Matematiken: ligger utsnittet på `x0…x1` av bredden ska bilden skalas till
 * `100/(x1-x0)` procent av rutan och förskjutas `-x0/(x1-x0)` — och andelen
 * räknat på rutans egen höjd blir på samma sätt `-y0/(y1-y0)`, oavsett hur hög
 * bilden är. Rutans proportion kommer ur `imageAspect`, så höjden är rätt redan
 * innan bilden har laddats och inget hoppar till.
 */
export type Crop = [number, number, number, number];

export function CropView({
  src,
  crop,
  imageAspect,
  alt,
  className,
}: {
  src: string;
  crop: Crop;
  /** Hela bildens bredd/höjd. */
  imageAspect: number;
  alt: string;
  className?: string;
}) {
  const [x0, y0, x1, y1] = crop;
  const dx = x1 - x0;
  const dy = y1 - y0;
  // Ett utsnitt utan yta går inte att visa; hellre ingenting än en kollapsad
  // ruta som ser ut som en trasig bild.
  if (dx <= 0 || dy <= 0 || !Number.isFinite(imageAspect) || imageAspect <= 0) return null;

  return (
    <span
      className={`relative block overflow-hidden ${className ?? ""}`}
      style={{ aspectRatio: `${(dx / dy) * imageAspect}` }}
    >
      {/* Ingen `loading="lazy"` här. Bilden är avsiktligt förskjuten utanför
          sin klippruta — det är så utsnittet blir till — och webbläsaren
          bedömer synlighet på elementets egen position, inte på rutans. Med
          lazy laddades den därför aldrig: rutan hade rätt höjd, men innehållet
          kom aldrig fram. Samma fil delas dessutom av uppgiftens alla utsnitt,
          så det blir ändå bara en hämtning. */}
      <img
        src={src}
        alt={alt}
        decoding="async"
        className="exam-figure absolute max-w-none"
        style={{
          width: `${100 / dx}%`,
          left: `${(-x0 / dx) * 100}%`,
          top: `${(-y0 / dy) * 100}%`,
        }}
      />
    </span>
  );
}
