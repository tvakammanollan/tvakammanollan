import { ordText } from "@/lib/sv-format";
import { acceptedAnswers, altCount } from "@/lib/prov-data";
import { delprovFull, type ProvPass, type ProvQuestion } from "@/types/gamla-prov";

const LETTERS = ["A", "B", "C", "D", "E"];

/**
 * Hela provpasset som en läslista med facit.
 *
 * Finns dels för att många vill läsa igenom uppgifterna utan att skriva provet,
 * dels för att uppgifterna då finns i serverrenderad HTML — provläget bygger
 * upp sig i webbläsaren och syns inte för en sökmotor.
 */
export function ProvFacitList({ data }: { data: ProvPass }) {
  return (
    <div className="space-y-10">
      {data.sections.map((section) => {
        const items = data.questions.filter((q) => q.delprov === section.code);
        if (items.length === 0) return null;

        return (
          <section key={section.code}>
            <h3
              className="text-[18px] font-bold text-[var(--cream)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {delprovFull(section.code)} ({section.code})
            </h3>
            <p className="mt-0.5 text-sm text-[var(--text-tertiary)]">
              Uppgift {section.first}–{section.last} · {section.minutes} minuter
            </p>

            <ol className="mt-4 space-y-4">
              {items.map((q, i) => {
                const previous = items[i - 1];
                const showPassage =
                  q.passage !== undefined && q.passage !== previous?.passage
                    ? data.passages[q.passage]
                    : undefined;

                return (
                  <li key={q.nr}>
                    {showPassage && (
                      <div className="mb-3 rounded-xl border border-white/8 bg-white/[0.015] p-4">
                        {showPassage.title && (
                          <p className="mb-2 font-semibold text-[var(--cream)]">
                            {showPassage.title}
                          </p>
                        )}
                        {showPassage.paragraphs.map((para, pi) => (
                          <p
                            key={pi}
                            className="mb-2 text-sm leading-relaxed text-white/70 last:mb-0"
                          >
                            {para}
                          </p>
                        ))}
                      </div>
                    )}
                    <QuestionEntry question={q} />
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

function QuestionEntry({ question }: { question: ProvQuestion }) {
  const correct = acceptedAnswers(question);
  const isOrd = question.delprov === "ORD";

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-sm">
      <p className="text-[13px] font-semibold tracking-wide text-[var(--amber)]">
        Uppgift {question.nr}
      </p>
      {question.text && !question.image && (
        <p className="mt-1 text-[15px] font-medium leading-relaxed text-[var(--cream)]">
          {isOrd ? ordText(question.text) : question.text}
        </p>
      )}
      {question.image && (
        <img
          src={question.image}
          alt={`${question.delprov}-uppgift ${question.nr} ur provhäftet`}
          loading="lazy"
          decoding="async"
          className="exam-figure mt-3 w-full rounded-lg border border-white/10"
        />
      )}
      {question.alternatives ? (
        <ul className="mt-3 grid gap-1.5">
          {question.alternatives.map((text, i) => {
            const right = correct.includes(LETTERS[i]);
            return (
              <li
                key={i}
                className={`flex items-start gap-2.5 rounded-lg border px-3 py-1.5 text-sm ${
                  right
                    ? "border-[var(--success-line)] bg-[var(--success-soft)] text-[var(--cream)]"
                    : "border-transparent text-white/65"
                }`}
              >
                <span
                  className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-bold ${
                    right
                      ? "bg-[var(--success)] text-[var(--success-ink)]"
                      : "bg-white/10 text-white/60"
                  }`}
                >
                  {LETTERS[i]}
                </span>
                <span className="leading-relaxed">{isOrd ? ordText(text) : text}</span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-[var(--text-tertiary)]">
          Svarsalternativ A–{LETTERS[altCount(question) - 1]} står i bilden ovan.
        </p>
      )}
      <p className="mt-2.5 text-xs font-semibold text-[var(--teal)]">
        Rätt svar: {correct.join(" eller ")}
      </p>
    </div>
  );
}
