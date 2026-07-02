import { useState } from "react";
import { ChevronDown, Lightbulb } from "lucide-react";

interface Props {
  explanation: string | null | undefined;
  defaultOpen?: boolean;
}

export function ExplanationBlock({ explanation, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  if (!explanation || !explanation.trim()) return null;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-xs font-medium text-[#f2a65a] hover:underline"
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
            className="mt-2 rounded-lg border-l-4 border-[#f2a65a] bg-[#f0ede8] p-3"
            style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
          >
            <div className="mb-1 flex items-center gap-1.5 text-xs font-bold tracking-wide text-[#f2a65a]">
              <Lightbulb className="h-3.5 w-3.5" /> Förklaring
            </div>
            <p
              className="whitespace-pre-wrap text-foreground"
              style={{ fontSize: 14, lineHeight: 1.7 }}
            >
              {explanation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
