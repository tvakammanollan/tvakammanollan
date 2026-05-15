import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import examData from "@/data/exam-2026-spring.json";

export const Route = createFileRoute("/gamla-prov")({
  component: GamlaProvPage,
});

type Q = (typeof examData)[number];

const PASSES = [
  { id: 2, label: "Provpass 2 – Verbal", desc: "ORD · LÄS · MEK · ELF" },
  { id: 3, label: "Provpass 3 – Kvantitativ", desc: "XYZ · KVA · NOG · DTK" },
  { id: 4, label: "Provpass 4 – Verbal", desc: "ORD · LÄS · MEK · ELF" },
  { id: 5, label: "Provpass 5 – Kvantitativ", desc: "XYZ · KVA · NOG · DTK" },
];

const ALT_KEYS = ["a", "b", "c", "d", "e"] as const;
const ALT_LABELS = ["A", "B", "C", "D", "E"];

export default function GamlaProvPage() {
  const [selectedPass, setSelectedPass] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const questions: Q[] = selectedPass
    ? (examData as Q[]).filter((q) => q.provpass === selectedPass)
    : [];

  function pickAnswer(nr: number, letter: string) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [nr]: letter }));
  }

  function handleSubmit() {
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    setAnswers({});
    setSubmitted(false);
    setSelectedPass(null);
  }

  const score = submitted
    ? questions.filter((q) => answers[q.nr] === q.svar).length
    : 0;

  const answered = Object.keys(answers).length;

  return (
    <div className="min-h-screen" style={{ background: "var(--navy)", color: "var(--cream)" }}>
      <div className="mx-auto max-w-3xl px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
            Vårprovet 2026 · 18 april
          </p>
          <h1
            className="text-3xl font-bold"
            style={{ fontFamily: "var(--font-display)", color: "var(--cream)" }}
          >
            Gamla prov
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            Välj ett provpass, svara på uppgifterna och få facit direkt.
          </p>
        </div>

        {/* Pass selector */}
        {!selectedPass && (
          <div className="space-y-3">
            {PASSES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPass(p.id)}
                className="group w-full rounded-2xl border p-5 text-left transition-all hover:border-indigo-500/50 hover:shadow-[0_0_16px_rgba(99,102,241,0.12)]"
                style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
              >
                <div className="text-base font-semibold" style={{ color: "var(--cream)" }}>
                  {p.label}
                </div>
                <div className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {p.desc} · 40 uppgifter · 55 min
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Results banner */}
        {submitted && selectedPass && (
          <div
            className="mb-8 rounded-2xl border p-6 text-center"
            style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
              Resultat
            </p>
            <p
              className="mt-2 text-6xl font-bold tabular-nums"
              style={{ color: "var(--amber)", fontFamily: "var(--font-display)" }}
            >
              {score}
              <span className="text-2xl font-normal" style={{ color: "var(--text-secondary)" }}>
                &nbsp;/ {questions.length}
              </span>
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              {Math.round((score / questions.length) * 100)}% rätt
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-5 rounded-full border px-5 py-2 text-sm font-medium transition-colors hover:border-indigo-400"
              style={{ borderColor: "var(--line)", color: "var(--cream)" }}
            >
              ← Välj ett annat provpass
            </button>
          </div>
        )}

        {/* Questions */}
        {selectedPass && (
          <div>
            {!submitted && (
              <button
                type="button"
                onClick={reset}
                className="mb-6 text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                ← Tillbaka
              </button>
            )}

            <div className="space-y-5">
              {questions.map((q) => {
                const userAns = answers[q.nr];
                const alts = ALT_KEYS
                  .map((k, i) => ({ letter: ALT_LABELS[i], text: q[k] }))
                  .filter(({ text }) => text && !text.startsWith("["));

                const isAnswered = !!userAns;
                const isCorrect = userAns === q.svar;

                let cardBorder = "var(--line)";
                if (submitted) {
                  if (isCorrect) cardBorder = "rgba(52,211,153,0.35)";
                  else if (isAnswered) cardBorder = "rgba(239,68,68,0.35)";
                }

                return (
                  <div
                    key={`${q.provpass}-${q.nr}`}
                    className="rounded-2xl border p-5 transition-all"
                    style={{ borderColor: cardBorder, background: "var(--navy-2)" }}
                  >
                    {/* Q header */}
                    <div className="mb-3 flex items-start gap-3">
                      <span
                        className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums"
                        style={{ background: "rgba(99,102,241,0.18)", color: "#a5b4fc" }}
                      >
                        {q.nr}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span
                          className="mb-1.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                          style={{ background: "rgba(99,102,241,0.1)", color: "#a5b4fc" }}
                        >
                          {q.delProv}
                        </span>
                        <p className="text-sm font-medium leading-snug" style={{ color: "var(--cream)" }}>
                          {q.fraga || "[Se provhäfte]"}
                        </p>
                      </div>
                    </div>

                    {/* Alternatives */}
                    {alts.length > 0 && (
                      <div className="ml-9 space-y-2">
                        {alts.map(({ letter, text }) => {
                          const sel = userAns === letter;
                          const corr = q.svar === letter;

                          let bg = "transparent";
                          let border = "var(--line)";
                          let color = "var(--text-secondary)";

                          if (submitted) {
                            if (corr) { bg = "rgba(52,211,153,0.12)"; border = "rgba(52,211,153,0.5)"; color = "rgb(52,211,153)"; }
                            else if (sel) { bg = "rgba(239,68,68,0.12)"; border = "rgba(239,68,68,0.5)"; color = "rgb(239,68,68)"; }
                          } else if (sel) {
                            bg = "rgba(99,102,241,0.18)"; border = "rgba(99,102,241,0.6)"; color = "var(--cream)";
                          }

                          return (
                            <button
                              key={letter}
                              type="button"
                              onClick={() => pickAnswer(q.nr, letter)}
                              className="flex w-full items-start gap-2.5 rounded-xl border px-3 py-2 text-left text-sm transition-all"
                              style={{ background: bg, borderColor: border, color }}
                            >
                              <span className="mt-0.5 shrink-0 font-bold">{letter}</span>
                              <span>{text}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Facit for figure/ELF questions */}
                    {alts.length === 0 && submitted && (
                      <p className="ml-9 text-sm" style={{ color: "rgb(52,211,153)" }}>
                        Rätt svar: <strong>{q.svar}</strong>
                        {q.fraga?.startsWith("[ELF") && (
                          <span style={{ color: "var(--text-tertiary)" }}> (ELF-uppgift – se provhäfte)</span>
                        )}
                      </p>
                    )}
                    {alts.length === 0 && !submitted && (
                      <p className="ml-9 text-xs" style={{ color: "var(--text-tertiary)" }}>
                        Skrivbordsuppgift – anteckna ditt svar och lämna in för facit
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Submit */}
            {!submitted && (
              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="rounded-full px-8 py-3 text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    color: "white",
                    boxShadow: "0 0 24px rgba(99,102,241,0.35)",
                  }}
                >
                  Visa facit{answered > 0 ? ` (${answered}/${questions.length} besvarade)` : ""}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
