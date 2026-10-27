import type { DemoQuestion, LandingStats } from "@/lib/landing.functions";
import { getNextHpDate, hpDateShort } from "@/lib/hp-dates";
import { LandingHero } from "@/components/landing/LandingHero";
import {
  Arkivet,
  BevisRemsan,
  EloSkalan,
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
 * **Omdömena och studieuppläggets säljsektion är borta (2026-10-26).**
 * Studieupplägget plockades ur landningen när sajten pivoterade från det,
 * och omdömena togs bort med det. Tre saker hänger ihop och måste röras
 * tillsammans om omdömena någonsin kommer tillbaka:
 *  - `OMDOMEN`/`SNITTBETYG` i `@/data/omdomen` ligger kvar som ren data.
 *  - JSON-LD:s `aggregateRating`/`review` i `index.tsx` är BORTTAGNA. De
 *    deklarerar recensioner, och Google kräver att de syns på just den
 *    sidan. Att låta dem ligga kvar utan sektionen vore ogiltig markup.
 *  - Stjärnbetyget i hjälten är borta av samma skäl.
 * Läggs sektionen tillbaka: lägg tillbaka alla tre i samma commit.
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
      <Produktytorna />
      <BevisRemsan />
      <EloSkalan />
      <Arkivet />
      <Topplistan stats={stats} />
      <Priset />
      <Resurser />
      <SlutCta dagarKvar={dagarKvar} datum={next ? hpDateShort(next.entry.date) : null} />
    </div>
  );
}
