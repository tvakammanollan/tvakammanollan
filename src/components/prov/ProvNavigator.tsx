import { Flag } from "lucide-react";
import { isCorrect } from "@/lib/prov-data";
import type { ProvQuestion, ProvSection } from "@/types/gamla-prov";

/**
 * Uppgiftsöversikt grupperad per delprov.
 *
 * Ersätter raden med fyrtio 10-pixelsprickar, som varken visade vilken uppgift
 * man var på väg till eller gick att träffa på en telefon. Här syns numret,
 * vilka som är besvarade och vilka som är markerade för genomgång.
 */
export function ProvNavigator({
  questions,
  sections,
  current,
  answers,
  flagged,
  revealed,
  onSelect,
}: {
  questions: ProvQuestion[];
  sections: ProvSection[];
  current: number;
  answers: Record<number, string>;
  flagged: number[];
  revealed: boolean;
  onSelect: (index: number) => void;
}) {
  return (
    <nav aria-label="Uppgifter" className="space-y-4">
      {sections.map((section) => {
        const items = questions
          .map((q, i) => ({ q, i }))
          .filter(({ q }) => q.delprov === section.code);
        if (items.length === 0) return null;
        const done = items.filter(({ q }) => answers[q.nr]).length;

        return (
          <div key={section.code}>
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                {section.code}
              </span>
              <span className="text-[11px] tabular-nums text-[var(--text-tertiary)]">
                {done}/{items.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {items.map(({ q, i }) => {
                const answer = answers[q.nr];
                const right = revealed && isCorrect(q, answer);
                const wrong = revealed && !!answer && !right;
                const missed = revealed && !answer;

                return (
                  <button
                    key={q.nr}
                    type="button"
                    onClick={() => onSelect(i)}
                    aria-current={i === current ? "true" : undefined}
                    title={`Uppgift ${q.nr}${flagged.includes(q.nr) ? " · markerad" : ""}`}
                    className={[
                      "relative h-9 w-9 rounded-lg text-xs font-semibold tabular-nums transition-colors",
                      right
                        ? "bg-[var(--success-soft)] text-[var(--success)]"
                        : wrong
                          ? "bg-[var(--danger-soft)] text-[var(--danger)]"
                          : missed
                            ? "bg-white/[0.04] text-[var(--text-tertiary)]"
                            : answer
                              ? "bg-[var(--amber)]/18 text-[var(--amber)]"
                              : "bg-white/[0.04] text-[var(--text-secondary)] hover:bg-white/10",
                      i === current ? "ring-2 ring-[var(--amber)] ring-offset-2" : "",
                    ].join(" ")}
                    style={
                      i === current
                        ? { ["--tw-ring-offset-color" as string]: "var(--navy)" }
                        : undefined
                    }
                  >
                    {q.nr}
                    {flagged.includes(q.nr) && (
                      <Flag
                        className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 fill-[var(--amber)] text-[var(--amber)]"
                        aria-hidden
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
