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
  /**
   * Reservtext när ingen förklaring finns: rätt svar i KLARTEXT, inte bara
   * bokstaven. `answerLetter` + `answerText`.
   *
   * Skälet: 0 av 12 338 frågor i beståndet har en `explanation` (kontrollerat
   * 2026-08-19), så blocket renderade ingenting alls — och på mattefrågor blev
   * hela rättningen "rätt svar: C". En bokstav lär ingen någonting. Så länge
   * förklaringarna inte är genererade (se scripts/generate-math-explanations.ts)
   * är det minsta rimliga att skriva ut vilket alternativ som var rätt.
   */
  answerLetter?: string | null;
  answerText?: string | null;
  /** Renderar reservtexten med KaTeX. Sätts för XYZ, KVA, NOG och DTK. */
  math?: boolean;
}

export function ExplanationBlock({
  explanation,
  defaultOpen = true,
  answerLetter,
  answerText,
  math = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const harForklaring = !!explanation && !!explanation.trim();
  // Reserven är bara meningsfull när alternativet har en egen text. För
  // bilduppgifter (XYZ/KVA ligger som utsnitt ur provhäftet) står alternativen
  // i bilden, och att skriva "Rätt svar: C — C" hjälper ingen.
  const harReserv =
    !!answerLetter && !!answerText && answerText.trim() !== "" && answerText !== answerLetter;
  if (!harForklaring && !harReserv) return null;

  if (!harForklaring) {
    return (
      <div className="mt-3 rounded-lg border-l-4 border-[#2f6b3c] bg-[#f0ede8] p-3">
        <div className="mb-1 flex items-center gap-1.5 text-xs font-bold tracking-wide text-[#2f6b3c]">
          <Lightbulb className="h-3.5 w-3.5" /> Rätt svar
        </div>
        <p className="text-foreground" style={{ fontSize: 14, lineHeight: 1.7 }}>
          <strong>{answerLetter}</strong>
          {" — "}
          {math ? <MathText autoDetect>{answerText!}</MathText> : answerText}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-xs font-medium text-[#ae2f26] hover:underline"
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
            className="mt-2 rounded-lg border-l-4 border-[#ae2f26] bg-[#f0ede8] p-3"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            <div className="mb-1 flex items-center gap-1.5 text-xs font-bold tracking-wide text-[#ae2f26]">
              <Lightbulb className="h-3.5 w-3.5" /> Förklaring
            </div>
            <div
              className="whitespace-pre-wrap text-foreground"
              style={{ fontSize: 14, lineHeight: 1.7 }}
            >
              {math ? <MathText autoDetect>{explanation!}</MathText> : explanation}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
