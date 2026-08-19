/**
 * Väntetid i ord en människa läser utan att räkna om den i huvudet.
 *
 * Limitern räknar i millisekunder och skrev tidigare ut dem rakt av som
 * sekunder: "Försök igen om 3501 sekunder" är rätt tal men fel enhet, och
 * läser som ett buggigt gränssnitt snarare än som en gräns. Den som blockeras
 * en timme ska få veta att det är en timme.
 *
 * Alltid uppåtavrundat. Säger vi "om 1 minut" när det återstår 61 sekunder
 * försöker användaren igen för tidigt, får samma fel, och tappar förtroendet
 * för siffran.
 */
export function formatWaitTime(ms: number): string {
  const sekunder = Math.max(1, Math.ceil(ms / 1000));

  if (sekunder < 60) {
    return sekunder === 1 ? "1 sekund" : `${sekunder} sekunder`;
  }

  const minuter = Math.ceil(sekunder / 60);
  if (minuter < 60) {
    return minuter === 1 ? "1 minut" : `${minuter} minuter`;
  }

  const timmar = Math.ceil(minuter / 60);
  return timmar === 1 ? "1 timme" : `${timmar} timmar`;
}
