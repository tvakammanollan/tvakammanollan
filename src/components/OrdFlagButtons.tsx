import { FLAG_COLORS, FLAG_HEX, flagName, type FlagColor, type OrdFlags } from "@/lib/ord-flags";

/**
 * De fyra flaggknapparna på ett ord. Färgen har ingen given betydelse: den
 * aktiva är fylld, de andra bara en ram i sin färg. Namnet (besökarens eget
 * eller färgens) står som aria-label och title, så valet går att läsa utan färg.
 */
export function OrdFlagButtons({
  state,
  current,
  onToggle,
}: {
  state: OrdFlags;
  current: FlagColor | undefined;
  onToggle: (c: FlagColor) => void;
}) {
  return (
    <div className="flex shrink-0 gap-1" role="group" aria-label="Flagga ordet">
      {FLAG_COLORS.map((c) => {
        const active = current === c;
        const name = flagName(state, c);
        return (
          <button
            key={c}
            type="button"
            onClick={() => onToggle(c)}
            aria-pressed={active}
            aria-label={active ? `Ta bort flaggan ${name}` : `Flagga som ${name}`}
            title={name}
            className="flex h-11 w-9 items-center justify-center"
          >
            <span
              className="block h-6 w-6 rounded-md border-2"
              style={{
                borderColor: FLAG_HEX[c],
                background: active ? FLAG_HEX[c] : "transparent",
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
