import { ChevronDown, Maximize2, X, ZoomIn, ZoomOut } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useDismissible } from "@/hooks/useDismissible";

/**
 * Bild ur provhäftet: uppgiftsutsnitt (XYZ/KVA) eller DTK-diagram.
 *
 * Diagrammen är täta och behöver kunna förstoras — på provdagen har man dem i
 * A4 framför sig. Lightboxen zoomar därför i steg och tillåter panorering,
 * i stället för att bara visa samma bild lite större.
 *
 * `collapsible` är till för mobilen. Diagrampanelen ligger före uppgiften i
 * DOM:en så att den hamnar bredvid den på skrivbordet, men på en telefon
 * betyder samma ordning att ett helt A4-uppslag skjuts in ovanför frågan och
 * måste skrollas förbi varje gång. Hopfällt läge ger samma lösning som
 * lästexterna redan har i `ProvPassagePanel`.
 */
export function ProvFigure({
  src,
  alt,
  label,
  className,
  collapsible = false,
}: {
  src: string;
  alt: string;
  label?: string;
  className?: string;
  collapsible?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [shown, setShown] = useState(!collapsible);

  useDismissible(open, () => setOpen(false));

  function show() {
    setZoom(1);
    setOpen(true);
  }

  return (
    <>
      <figure
        className={`overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm ${className ?? ""}`}
      >
        {(label || collapsible) && (
          <figcaption className="flex items-center justify-between gap-3 px-4 py-2.5">
            <button
              type="button"
              onClick={() => collapsible && setShown((v) => !v)}
              aria-expanded={collapsible ? shown : undefined}
              className={`flex min-w-0 items-center gap-2 text-left ${
                collapsible ? "transition-colors hover:text-[var(--cream)]" : "cursor-default"
              }`}
            >
              <span className="truncate text-[11px] font-semibold uppercase tracking-wider text-[var(--amber)]">
                {label ?? "Diagram ur provhäftet"}
              </span>
              {collapsible && (
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-[var(--text-tertiary)] transition-transform ${
                    shown ? "rotate-180" : ""
                  }`}
                  aria-hidden
                />
              )}
            </button>
            {shown && (
              <button
                type="button"
                onClick={show}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-xs text-[var(--text-tertiary)] transition-colors hover:bg-white/5 hover:text-[var(--cream)]"
              >
                <Maximize2 className="h-3.5 w-3.5" aria-hidden />
                Förstora
              </button>
            )}
          </figcaption>
        )}
        {shown && (
          <button type="button" onClick={show} className="block w-full cursor-zoom-in">
            <img
              src={src}
              alt={alt}
              loading="lazy"
              decoding="async"
              className="exam-figure w-full"
            />
          </button>
        )}
      </figure>

      {/* Lightboxen renderas i en PORTAL till <body>, inte där den står.
          `position: fixed` mäts mot närmaste förfader med `transform`,
          `filter`, `backdrop-filter` eller `perspective` — inte mot fönstret —
          och frågekorten i duellen och träningen har `backdrop-blur-sm`.
          Utan portalen blev "helskärm" alltså kortets storlek: mätt till
          341×550 px i ett fönster på 375×812, med kontrollerna inne i kortet
          och diagrammet lika litet som förut. */}
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex flex-col bg-black/90"
            role="dialog"
            aria-modal="true"
            aria-label={alt}
          >
            {/* En LJUS-PÅ-MÖRK ö (se CLAUDE.md): `bg-black/90` är avsiktligt
                mörk även i det ljusa temat, för att inskannad linjekonst ska
                synas. `white/N` och `text-white` går annars genom remap-lagret
                som vänder dem till bläckfärgade toner för den ljusa botten —
                mätt i webbläsaren: `bg-white/10` blev `rgba(46,30,20,0.1)`
                (en mörk ruta på svart botten) och `text-white` blev
                `rgb(46,30,20)` (en nästan osynlig ikon). De tre
                kontrollknapparna skriver därför explicit vitt, som regeln
                säger — annars gick zoom- och stängknapparna inte att se. */}
            <div className="flex items-center justify-end gap-2 p-3">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
                disabled={zoom <= 1}
                aria-label="Zooma ut"
                className="rounded-full bg-[rgba(255,255,255,0.10)] p-2 text-[#fff8f5] backdrop-blur transition-colors hover:bg-[rgba(255,255,255,0.20)] disabled:opacity-40"
              >
                <ZoomOut className="h-5 w-5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(4, z + 0.5))}
                disabled={zoom >= 4}
                aria-label="Zooma in"
                className="rounded-full bg-[rgba(255,255,255,0.10)] p-2 text-[#fff8f5] backdrop-blur transition-colors hover:bg-[rgba(255,255,255,0.20)] disabled:opacity-40"
              >
                <ZoomIn className="h-5 w-5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Stäng figuren"
                className="rounded-full bg-[rgba(255,255,255,0.10)] p-2 text-[#fff8f5] backdrop-blur transition-colors hover:bg-[rgba(255,255,255,0.20)]"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            {/* Ytan runt bilden stänger; bilden själv gör det inte, så att man
              kan panorera i inzoomat läge utan att tappa bort sig. */}
            <div className="flex-1 overflow-auto p-4" onClick={() => setOpen(false)}>
              <img
                src={src}
                alt={alt}
                onClick={(e) => e.stopPropagation()}
                className="exam-figure mx-auto"
                style={{
                  width: `${zoom * 100}%`,
                  maxWidth: zoom === 1 ? "min(100%, 900px)" : "none",
                }}
              />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
