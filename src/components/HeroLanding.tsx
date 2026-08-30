import { useState } from "react";
import type { DemoQuestion, LandingStats } from "@/lib/landing.functions";
import { getNextHpDate, hpDateShort } from "@/lib/hp-dates";
import { LandingHero } from "@/components/landing/LandingHero";
import {
  Arkivet,
  BevisRemsan,
  Coachningen,
  Delproven,
  EloSkalan,
  Omdomen,
  SlutCta,
  Topplistan,
} from "@/components/landing/LandingSections";
import { CoachingModal } from "@/components/CoachingModal";
import { useCoachingOffer, coachingPriceLabel, coachingTermsLabel } from "@/hooks/useCoachingOffer";
import { useImpression } from "@/hooks/useImpression";
import { trackEvent } from "@/lib/events";

/**
 * Landningssidan (utloggad).
 *
 * Ombyggd 2026-08-30. Den gamla följde en klassisk konverterande SaaS-mall
 * (hjälte, förtroenderad, tre feature-kort, siffror i kort, omdömeskarusell)
 * vilket är exakt den form AI-genererad design hamnar i. Den nya öppnar med
 * produkten körd live och bygger vidare på det som faktiskt är unikt: att en
 * siffra rör sig när du svarar, och att den går att läsa av på provets skala.
 *
 * Allt innehåll SSR:as. Statistiken och demofrågorna hämtas i route-loadern
 * (`index.tsx`) och inte i en effekt, så att en crawler ser hela sidan
 * inklusive topplistan och en riktig uppgift.
 *
 * Tre kopplingar ut ur filen som inte får gå sönder:
 *  - `OMDOMEN`/`SNITTBETYG` bor i `@/data/omdomen` och driver JSON-LD:s
 *    aggregateRating i `index.tsx`. Ändras listan ändras betyget med.
 *  - `coaching_card_viewed` är nämnaren i coachningstratten. Utan den går det
 *    inte att skilja "ingen vill" från "ingen skrollade dit".
 *  - `CoachingModal` med `source="landing"` är enda vägen till Stripe
 *    härifrån, och den ska förbli det.
 */
export function HeroLanding({
  fragor = [],
  stats = null,
}: {
  fragor?: DemoQuestion[];
  stats?: LandingStats | null;
}) {
  const [coachingOpen, setCoachingOpen] = useState(false);
  const erbjudande = useCoachingOffer().offer;

  // Blocket ligger långt ner på en lång sida och de flesta ser det aldrig.
  // Skillnaden mellan "vill inte" och "kom inte dit" är hela mätningen.
  const coachningSedd = useImpression<HTMLElement>(() =>
    trackEvent("coaching_card_viewed", { source: "landing" }),
  );

  const next = getNextHpDate();
  const dagarKvar = next
    ? Math.max(0, Math.ceil((next.date.getTime() - Date.now()) / 86_400_000))
    : null;

  return (
    <div className="w-full">
      <LandingHero fragor={fragor} stats={stats} />
      <BevisRemsan />
      <EloSkalan />
      <Delproven />
      <Arkivet />
      <Topplistan stats={stats} />
      <Omdomen />
      <Coachningen
        pris={coachingPriceLabel(erbjudande)}
        villkor={coachingTermsLabel(erbjudande)}
        onOppna={() => setCoachingOpen(true)}
        sektionRef={coachningSedd}
      />
      <SlutCta dagarKvar={dagarKvar} datum={next ? hpDateShort(next.entry.date) : null} />

      {/* Köpet kräver inget konto — besökaren som vill ha ett upplägg ska inte
          först tvingas registrera sig. Stripe samlar in mejl och telefon. */}
      <CoachingModal open={coachingOpen} onOpenChange={setCoachingOpen} source="landing" />
    </div>
  );
}
