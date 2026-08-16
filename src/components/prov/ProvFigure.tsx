import { Maximize2, X, ZoomIn, ZoomOut } from "lucide-react";
import { useState } from "react";
import { useDismissible } from "@/hooks/useDismissible";

/**
 * Bild ur provhäftet: uppgiftsutsnitt (XYZ/KVA) eller DTK-diagram.
 *
 * Diagrammen är täta och behöver kunna förstoras — på provdagen har man dem i
 * A4 framför sig. Lightboxen zoomar därför i steg och tillåter panorering,
 * i stället för att bara visa samma bild lite större.
 */
export function ProvFigure({
  src,
  alt,
  label,
  className,
}: {
  src: string;
  alt: string;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

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
        {label && (
          <figcaption className="flex items-center justify-between gap-3 px-4 py-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--amber)]">
              {label}
            </span>
            <button
              type="button"
              onClick={show}
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs text-[var(--text-tertiary)] transition-colors hover:bg-white/5 hover:text-[var(--cream)]"
            >
              <Maximize2 className="h-3.5 w-3.5" aria-hidden />
              Förstora
            </button>
          </figcaption>
        )}
        <button type="button" onClick={show} className="block w-full cursor-zoom-in">
          <img src={src} alt={alt} loading="lazy" decoding="async" className="exam-figure w-full" />
        </button>
      </figure>

      {open && (
        // Lightboxen förblir mörk även när resten av sajten är ljus: en
        // inskannad figur ska poppa mot svart. Knapparna använder därför
        // explicita vita alfa-hex i stället för white/N — remap-lagret
        // vänder white/N till mörkbrunt, vilket blir osynligt här.
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/90"
          role="dialog"
          aria-modal="true"
          aria-label={alt}
        >
          <div className="flex items-center justify-end gap-2 p-3">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
              disabled={zoom <= 1}
              aria-label="Zooma ut"
              className="rounded-full bg-[#ffffff1a] p-2 text-white backdrop-blur transition-colors hover:bg-[#ffffff33] disabled:opacity-40"
            >
              <ZoomOut className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(4, z + 0.5))}
              disabled={zoom >= 4}
              aria-label="Zooma in"
              className="rounded-full bg-[#ffffff1a] p-2 text-white backdrop-blur transition-colors hover:bg-[#ffffff33] disabled:opacity-40"
            >
              <ZoomIn className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Stäng figuren"
              className="rounded-full bg-[#ffffff1a] p-2 text-white backdrop-blur transition-colors hover:bg-[#ffffff33]"
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
        </div>
      )}
    </>
  );
}
