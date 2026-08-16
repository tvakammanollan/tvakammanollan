import { Link } from "@tanstack/react-router";
import { ArrowRight, RotateCcw, Target, Trophy } from "lucide-react";
import { formatDecimal, formatPercentInt } from "@/lib/sv-format";
import { normeringFromRaw, HP_TOTAL_QUESTIONS } from "@/lib/normering";
import { isCorrect } from "@/lib/prov-data";
import { delprovShort, type ProvPass } from "@/types/gamla-prov";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m} min ${s} s` : `${s} s`;
}

/**
 * Resultatsidan efter ett inlämnat provpass.
 *
 * Poäng, tid, delprovsfördelning och en genomgång av varje fel. Normeringen
 * är en uppskattning av hela provet — den sägs rakt ut, i stället för att
 * presenteras som ett facit.
 */
export function ProvResult({
  data,
  answers,
  elapsedSeconds,
  onReview,
  onRestart,
  nextPass,
}: {
  data: ProvPass;
  answers: Record<number, string>;
  elapsedSeconds: number;
  onReview: (index: number) => void;
  onRestart: () => void;
  nextPass?: number;
}) {
  const total = data.questions.length;
  const score = data.questions.filter((q) => isCorrect(q, answers[q.nr])).length;
  const unanswered = data.questions.filter((q) => !answers[q.nr]).length;
  const ratio = total > 0 ? score / total : 0;
  const normering = normeringFromRaw(ratio * HP_TOTAL_QUESTIONS);

  const perSection = data.sections.map((section) => {
    const items = data.questions.filter((q) => q.delprov === section.code);
    const right = items.filter((q) => isCorrect(q, answers[q.nr])).length;
    return { code: section.code, right, total: items.length };
  });

  const wrong = data.questions
    .map((q, i) => ({ q, i }))
    .filter(({ q }) => !isCorrect(q, answers[q.nr]));

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-6 text-center backdrop-blur-sm">
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--amber)]/18">
          <Trophy className="h-6 w-6 text-[var(--amber)]" aria-hidden />
        </span>
        <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
          {data.label} · Provpass {data.pass}
        </p>
        <p
          className="mt-2 text-6xl font-bold tabular-nums text-[var(--amber)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {score}
          <span className="text-2xl font-normal text-[var(--text-secondary)]">/{total}</span>
        </p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {formatPercentInt(ratio)} rätt · {formatDuration(elapsedSeconds)}
          {unanswered > 0 && <> · {unanswered} obesvarade</>}
        </p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-sm">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--amber)]">
          <Target className="h-4 w-4" aria-hidden />
          Uppskattad normering
        </h2>
        <p
          className="mt-2 text-4xl font-bold tabular-nums text-[var(--cream)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {formatDecimal(normering, 2)}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--text-tertiary)]">
          Gäller om du fick lika stor andel rätt på hela provet ({HP_TOTAL_QUESTIONS} uppgifter).
          Ett provpass räcker inte för en riktig normering — UHR sätter gränserna först efter
          provdagen, och de skiljer sig mellan provtillfällen.
        </p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-sm">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          Per delprov
        </h2>
        <div className="space-y-3">
          {perSection.map((s) => {
            const pct = s.total > 0 ? s.right / s.total : 0;
            return (
              <div key={s.code}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-[var(--cream)]">
                    <strong className="mr-1.5 text-[var(--amber)]">{s.code}</strong>
                    {delprovShort(s.code)}
                  </span>
                  <span className="tabular-nums text-[var(--text-secondary)]">
                    {s.right}/{s.total} · {formatPercentInt(pct)}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct * 100}%`,
                      background:
                        pct >= 0.8
                          ? "var(--success)"
                          : pct >= 0.5
                            ? "var(--amber)"
                            : "var(--danger)",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {wrong.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-sm">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            Att gå igenom ({wrong.length})
          </h2>
          <ul className="space-y-2">
            {wrong.map(({ q, i }) => (
              <li key={q.nr}>
                <button
                  type="button"
                  onClick={() => onReview(i)}
                  className="flex w-full items-start gap-3 rounded-xl border border-white/10 px-3 py-2.5 text-left transition-colors hover:border-[var(--amber)]/50 hover:bg-white/[0.03]"
                >
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--danger-soft)] text-xs font-bold tabular-nums text-[var(--danger)]">
                    {q.nr}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-sm text-[var(--cream)]">
                      {q.text ?? `${q.delprov}-uppgift ${q.nr}`}
                    </span>
                    <span className="mt-0.5 block text-xs tabular-nums text-[var(--text-tertiary)]">
                      Du svarade {answers[q.nr] ?? "—"} · rätt svar {q.answer}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onReview(0)}
          className="flex items-center justify-center gap-2 rounded-full border border-white/12 px-4 py-2.5 text-sm font-medium text-[var(--cream)] transition-colors hover:border-[var(--amber)]/50"
        >
          Gå igenom alla uppgifter
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="flex items-center justify-center gap-2 rounded-full border border-white/12 px-4 py-2.5 text-sm font-medium text-[var(--cream)] transition-colors hover:border-[var(--amber)]/50"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Gör om provpasset
        </button>
      </div>

      {nextPass !== undefined && (
        <Link
          to="/gamla-prov/$term/$pass"
          params={{ term: data.term, pass: String(nextPass) }}
          className="flex items-center justify-center gap-2 rounded-full bg-[var(--amber)] px-5 py-3 text-sm font-semibold text-[var(--navy)] transition hover:brightness-110"
        >
          Fortsätt med provpass {nextPass}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}
