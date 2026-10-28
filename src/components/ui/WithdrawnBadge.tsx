/**
 * "Struken uppgift" — UHR tog bort uppgiften ur provet i efterhand.
 *
 * Markören låg tidigare som `[utgången] ` först i uppgiftstexten och
 * renderades rakt av, så frågan inleddes med en hakparentes. Den bär riktig
 * information och kastas därför inte bort: en struken uppgift är ofta struken
 * för att den var tvetydig, vilket är precis vad den som fastnar på den
 * behöver veta. Rätt svar gäller ändå — det var poängen som inte räknades.
 */
export function WithdrawnBadge() {
  return (
    <span
      className="text-[11px] font-semibold"
      style={{ color: "var(--destructive)" }}
      title="Uppgiften ströks ur det riktiga provet i efterhand. Rätt svar gäller, men poängen räknades inte."
    >
      Struken uppgift
    </span>
  );
}
