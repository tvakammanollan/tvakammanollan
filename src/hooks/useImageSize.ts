import { useEffect, useState } from "react";
import type { ImageSize } from "@/lib/option-crop";

/**
 * Källbildens naturliga mått.
 *
 * Behövs för att beskära ett svarsalternativ ur uppgiftsbilden: utsnittet
 * anges i andelar, och en andel säger ingenting om form förrän man vet vad
 * den är en andel av. Ett utsnitt på 73 % av bredden och 9 % av höjden är en
 * textrad i en bild som är 459×406 och något helt annat i en som är 900×300.
 *
 * Måtten cachas per URL i en modulkarta: en genomgång visar samma
 * uppgiftsbild i upp till tre rutor (frågan, ditt svar, rätt svar), och alla
 * ska inte utlösa var sin mätning. Webbläsaren cachar visserligen själva
 * bilden, men inte `naturalWidth`-avläsningen.
 */
const cache = new Map<string, ImageSize>();

export function useImageSize(url: string | null | undefined): ImageSize | null {
  const [size, setSize] = useState<ImageSize | null>(() => (url ? (cache.get(url) ?? null) : null));

  useEffect(() => {
    if (!url) {
      setSize(null);
      return;
    }
    const cached = cache.get(url);
    if (cached) {
      setSize(cached);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      const mått = { width: img.naturalWidth, height: img.naturalHeight };
      if (mått.width > 0 && mått.height > 0) cache.set(url, mått);
      if (!cancelled) setSize(mått);
    };
    // En bild som inte går att ladda ska inte lämna komponenten i ett
    // laddningsläge för evigt — utan mått ritas rutan med minimihöjd.
    img.onerror = () => !cancelled && setSize(null);
    img.src = url;
    return () => {
      cancelled = true;
    };
  }, [url]);

  return size;
}
