import { useCallback, useEffect, useRef } from "react";

/**
 * "Den här ytan syntes faktiskt på skärmen" — en gång per montering.
 *
 * Skillnaden mot en sidvisning är hela poängen: coachningsblocket ligger långt
 * ner på landningssidan, och utan en visningshändelse går det inte att skilja
 * "ingen vill köpa" från "ingen skrollade dit". Den är nämnaren till
 * `coaching_offer_opened`.
 *
 * Returnerar en **callback-ref**, inte ett ref-objekt, och det är avsiktligt:
 * `useInView` i framer-motion (som `Reveal` och resten av MotionFX använder)
 * läser `ref.current` i en effekt vars beroenden inte innehåller elementet. Är
 * elementet inte monterat vid första körningen kopplas observern aldrig, och
 * inget kör igen — vilket är precis fallet här, eftersom HomeDashboard renderar
 * skelett tills profilen landat. En callback-ref anropas när noden faktiskt
 * dyker upp.
 *
 * Tröskeln är 0 (vilken pixel som helst i bild) och det finns ingen `margin`,
 * till skillnad från `Reveal` som börjar animera 200 px innan elementet syns:
 * rätt för en animation, men det hade räknat som sett något som fortfarande
 * ligger under kanten. Att mäta mot en *andel* av elementet vore fel av samma
 * skäl som noten i MotionFX beskriver — ett block högre än fönstret kan aldrig
 * nå andelen, och händelsen hade tystnat helt.
 */
export function useImpression<T extends HTMLElement = HTMLElement>(onSeen: () => void) {
  // Callbacken byter identitet vid varje render hos anroparen; observern ska
  // ändå bara kopplas om när elementet byts.
  const senaste = useRef(onSeen);
  senaste.current = onSeen;
  const rapporterad = useRef(false);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(
    () => () => {
      observer.current?.disconnect();
      observer.current = null;
    },
    [],
  );

  return useCallback((node: T | null) => {
    observer.current?.disconnect();
    observer.current = null;
    if (!node || rapporterad.current) return;
    // Äldre webbläsare och SSR-nära miljöer: hellre ingen mätning än ett kast
    // som tar ner sidan.
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      rapporterad.current = true;
      io.disconnect();
      observer.current = null;
      senaste.current();
    });
    io.observe(node);
    observer.current = io;
  }, []);
}
