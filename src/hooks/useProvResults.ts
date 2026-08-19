import { useEffect, useState } from "react";
import { loadResults, RESULTS_STORAGE_KEY, type ProvResults } from "@/lib/prov-results";

/**
 * Skrivna provpass ur localStorage.
 *
 * Returnerar `null` fram till första effekten, och det är hela poängen:
 * provlistan och provtillfällessidorna serverrenderas, och servern vet inte
 * — ska inte veta — vad besökaren har skrivit. Ett `null` renderar ingenting,
 * vilket är precis vad serverns HTML innehåller, så hydreringen stämmer.
 * Läser man i stället lagringen under första renderingen får man en
 * hydreringsmiss på varje kort som har ett resultat.
 *
 * `storage`-lyssnaren gäller *andra* flikar: skriver du ett provpass i en flik
 * uppdateras provlistan som ligger öppen i en annan. Den egna flikens
 * skrivningar syns ändå, eftersom sidan monteras om vid navigering.
 */
export function useProvResults(): ProvResults | null {
  const [results, setResults] = useState<ProvResults | null>(null);

  useEffect(() => {
    setResults(loadResults());

    function onStorage(event: StorageEvent) {
      // key === null betyder att hela lagringen tömts.
      if (event.key === null || event.key === RESULTS_STORAGE_KEY) setResults(loadResults());
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return results;
}
