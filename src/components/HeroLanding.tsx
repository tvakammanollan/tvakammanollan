import type { DemoQuestion, LandingStats } from "@/lib/landing.functions";
import { getNextHpDate, hpDateShort } from "@/lib/hp-dates";
import { LandingHero } from "@/components/landing/LandingHero";
import {
  Arkivet,
  BevisRemsan,
  BorjaHar,
  Omdomen,
  Priset,
  Produktytorna,
  Resurser,
  SlutCta,
  Topplistan,
} from "@/components/landing/LandingSections";

/**
 * Landningssidan (utloggad).
 *
 * Ombyggd 2026-10-26 till Podia-systemet. Hjälten är fortfarande en riktig
 * uppgift man kan svara på, men sidan öppnar nu med de fyra produktytorna
 * i sina egna färger (`Produktytorna`), så att kopplingen mellan färg och
 * yta lärs ut redan här och gäller sedan resten av sajten.
 *
 * Allt innehåll SSR:as. Statistiken och demofrågorna hämtas i route-loadern
 * (`index.tsx`) och inte i en effekt, så att en crawler ser hela sidan
 * inklusive topplistan och en riktig uppgift.
 *
 * **Tre omdömeskort ligger före priset sedan 2026-11-15** (`Omdomen`,
 * datan i `@/data/omdomen`). ELO-skalan ("Se var du ligger efter varje
 * match") togs bort samma dag på Niklas begäran. Korten har ingen JSON-LD:
 * `aggregateRating`/`review` i `index.tsx` är fortfarande borttagna och ska
 * förbli det, eftersom två av de tre har byggt sajten och Google inte
 * godtar att en organisation recenserar sig själv. Studieuppläggets
 * säljsektion är borta sedan 2026-10-26.
 *
 * `CoachingModal` lever kvar i navbaren och på startsidan. Den är inte en
 * del av den här sidan och rördes inte.
 */
export function HeroLanding({
  fragor = [],
  stats = null,
}: {
  fragor?: DemoQuestion[];
  stats?: LandingStats | null;
}) {
  const next = getNextHpDate();
  const dagarKvar = next
    ? Math.max(0, Math.ceil((next.date.getTime() - Date.now()) / 86_400_000))
    : null;

  return (
    <div className="w-full">
      <LandingHero fragor={fragor} stats={stats} />
      <BorjaHar />
      <Produktytorna />
      <BevisRemsan />
      <Arkivet />
      {/* Priset före matcherna: ELO-skalan och topplistan handlar om det
          som är gratis och låg tidigare mellan besökaren och priset. */}
      <Omdomen />
      <Priset />
      <Topplistan stats={stats} />
      <Resurser />
      <SlutCta dagarKvar={dagarKvar} datum={next ? hpDateShort(next.entry.date) : null} />
    </div>
  );
}
