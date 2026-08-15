import { useEffect, useRef } from "react";

/**
 * Escape-stängning + scroll-lås för de overlayer som INTE går genom Radix
 * `Dialog` (rank-up, utmärkelser, onboarding, bild-lightboxen i gamla prov).
 *
 * Radix ger det här gratis, men de fyra handrullade overlayerna hade var sin
 * uppsättning beteenden: ingen av dem låste bakgrundsscrollen, och bara två
 * gick att stänga med Escape. Att scrolla "förbi" en öppen modal är en av de
 * tydligaste signalerna på att ett gränssnitt är ihopsatt i efterhand.
 */
export function useDismissible(open: boolean, onDismiss?: () => void) {
  // Hålls färsk i en ref så att en inline-pil (`() => setOpen(false)`) inte
  // river och sätter upp lyssnaren vid varje omrendering — och så att
  // callbacken aldrig blir inaktuell.
  const dismissRef = useRef(onDismiss);
  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismissRef.current?.();
    };
    window.addEventListener("keydown", onKey);

    // Scroll-lås. Sparar det tidigare värdet i stället för att nolla till ""
    // vid städning, så att två samtidiga overlayer inte låser upp åt varandra.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);
}
