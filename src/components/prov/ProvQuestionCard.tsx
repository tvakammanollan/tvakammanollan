import { Check, Flag, X } from "lucide-react";
import { ordText } from "@/lib/sv-format";
import { acceptedAnswers, altCount } from "@/lib/prov-data";
import { delprovShort, type ProvQuestion } from "@/types/gamla-prov";
import { ProvFigure } from "./ProvFigure";

const LETTERS = ["A", "B", "C", "D", "E"];

/**
 * En uppgift med sina svarsalternativ.
 *
 * Uppgifterna kommer i två former och ska ändå kännas likadana: ORD/MEK/LÄS
 * har text, XYZ/KVA är utsnitt ur provhäftet där alternativen syns i bilden.
 * I bildfallet blir knapparna bara bokstäver — samma knappar, samma lägen,
 * samma tangentbord.
 *
 * `revealed` styr om facit visas (direkt i övningsläge, efter inlämning i
 * provläge).
 */
export function ProvQuestionCard({
  question,
  index,
  total,
  answer,
  flagged,
  revealed,
  onAnswer,
  onToggleFlag,
}: {
  question: ProvQuestion;
  index: number;
  total: number;
  answer?: string;
  flagged: boolean;
  revealed: boolean;
  onAnswer: (letter: string) => void;
  onToggleFlag: () => void;
}) {
  const correct = acceptedAnswers(question);
  const isOrd = question.delprov === "ORD";
  const letters = LETTERS.slice(0, altCount(question));

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-sm sm:p-6">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--amber)]/15 text-xs font-bold tabular-nums text-[var(--amber)]">
            {question.nr}
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            {question.delprov} · {delprovShort(question.delprov)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs tabular-nums text-[var(--text-tertiary)]">
            {index + 1}/{total}
          </span>
          <button
            type="button"
            onClick={onToggleFlag}
            aria-pressed={flagged}
            title="Markera för genomgång (F)"
            className={`rounded-full p-1.5 transition-colors ${
              flagged
                ? "bg-[var(--amber)]/20 text-[var(--amber)]"
                : "text-[var(--text-tertiary)] hover:bg-white/5 hover:text-[var(--cream)]"
            }`}
          >
            <Flag className="h-4 w-4" aria-hidden />
            <span className="sr-only">Markera för genomgång</span>
          </button>
        </div>
      </header>

      {question.text && !question.image && (
        <p className="text-[15px] font-medium leading-relaxed text-[var(--cream)]">
          {isOrd ? ordText(question.text) : question.text}
        </p>
      )}

      {question.image && (
        <ProvFigure
          src={question.image}
          alt={`${question.delprov}-uppgift ${question.nr} ur provhäftet`}
          className="mb-1"
        />
      )}

      {/* Bilduppgifternas alternativ står i bilden — då behövs bara bokstaven,
          och knappraden får se ut som svarshäftets rutor i stället för fyra
          tomma textrader. */}
      <div
        className={
          question.alternatives ? "mt-4 grid gap-2" : "mt-4 grid grid-cols-4 gap-2 sm:max-w-md"
        }
      >
        {letters.map((letter, i) => {
          const text = question.alternatives?.[i];
          const picked = answer === letter;
          const isRight = revealed && correct.includes(letter);
          const isWrong = revealed && picked && !isRight;

          return (
            <button
              key={letter}
              type="button"
              onClick={() => onAnswer(letter)}
              aria-pressed={picked}
              className={[
                question.alternatives
                  ? "flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left text-sm transition-colors"
                  : "flex w-full items-center justify-center rounded-xl border py-3 text-sm transition-colors",
                isRight
                  ? "border-[var(--success-line)] bg-[var(--success-soft)] text-[var(--cream)]"
                  : isWrong
                    ? "border-[var(--danger-line)] bg-[var(--danger-soft)] text-[var(--cream)]"
                    : picked
                      ? "border-[var(--amber)]/60 bg-[var(--amber)]/12 text-[var(--cream)]"
                      : "border-white/10 text-[var(--text-secondary)] hover:border-white/25 hover:bg-white/[0.03]",
              ].join(" ")}
            >
              <span
                className={[
                  "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold",
                  isRight
                    ? "bg-[var(--success)] text-[var(--success-ink)]"
                    : isWrong
                      ? "bg-[var(--danger)] text-[var(--danger-ink)]"
                      : picked
                        ? "bg-[var(--amber)] text-[var(--navy)]"
                        : "bg-white/10 text-[var(--text-secondary)]",
                ].join(" ")}
              >
                {letter}
              </span>
              {text && <span className="leading-relaxed">{isOrd ? ordText(text) : text}</span>}
              {isRight && <Check className="ml-auto h-4 w-4 text-[var(--success)]" aria-hidden />}
              {isWrong && <X className="ml-auto h-4 w-4 text-[var(--danger)]" aria-hidden />}
            </button>
          );
        })}
      </div>

      {revealed && correct.length > 1 && (
        <p className="mt-3 text-xs text-[var(--text-tertiary)]">
          UHR har i efterhand godkänt flera svar på den här uppgiften ({correct.join(" och ")}).
        </p>
      )}

      {revealed && question.utgar && (
        <p className="mt-3 text-xs text-[var(--text-tertiary)]">
          UHR strök den här uppgiften efter provdagen — den räknades inte i resultatet på det
          riktiga provet.
        </p>
      )}
    </article>
  );
}
