import { useState } from "react";
import { ChevronDown, Lightbulb } from "lucide-react";
import { MathText } from "@/components/MathTextLazy";

interface Props {
  explanation: string | null | undefined;
  /**
   * Öppen från start. Standard är öppen: blocket visas först när svaret redan
   * är avslöjat, och då är förklaringen hela poängen — att kräva ett extra klick
   * är bara friktion. Låg tidigare på false, medan /train skickade in true, så
   * samma ruta betedde sig olika på olika sidor.
   */
  defaultOpen?: boolean;
}

/**
 * Rutan visar bara en RIKTIG förklaring. Vad du svarade och vad som var rätt
 * hör hemma i `AnswerContext`, som ligger direkt ovanför och kan klippa ut
 * alternativen ur uppgiftsbilden — den här rutan hade bara kunnat upprepa en
 * bokstav.
 *
 * `explanation` är i skrivande stund NULL på hela beståndet (12 338 rader), så
 * blocket renderar oftast ingenting. Se scripts/generate-math-explanations.ts.
 *
 * Ingen `math`-flagga: `MathText` renderar bara det som står mellan $…$ och
 * lämnar all annan text i fred, så en verbal förklaring går oförändrad igenom.
 */
export function ExplanationBlock({ explanation, defaultOpen = true }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  if (!explanation || !explanation.trim()) return null;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        {open ? "Dölj förklaring" : "Visa förklaring"}
      </button>
      <div
        className="grid transition-all duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div
            className="mt-2 rounded-lg border-l-4 border-primary bg-secondary p-3"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            <div className="mb-1 flex items-center gap-1.5 text-xs font-bold tracking-wide text-primary">
              <Lightbulb className="h-3.5 w-3.5" /> Förklaring
            </div>
            {/* Matteförklaringar bär LaTeX i $…$ — utan MathText stod de rått
                i texten, mitt i den enda mening som skulle förklara svaret. */}
            <p
              className="whitespace-pre-wrap text-foreground"
              style={{ fontSize: 14, lineHeight: 1.7 }}
            >
              <MathText>{explanation}</MathText>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
