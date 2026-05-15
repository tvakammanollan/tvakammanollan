import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import examData from "@/data/exam-2026-spring.json";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";

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
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showPassage, setShowPassage] = useState(true);

  const questions: Q[] = selectedPass
    ? (examData as Q[]).filter((q) => q.provpass === selectedPass)
    : [];

  const q = questions[currentIdx] as (Q & { passage?: string }) | undefined;
  const total = questions.length;
  const answered = Object.keys(answers).length;
  const score = submitted
    ? questions.filter((qq) => answers[qq.nr] === qq.svar).length
    : 0;

  function pickAnswer(letter: string) {
    if (submitted || !q) return;
    setAnswers((prev) => ({ ...prev, [q.nr]: letter }));
  }

  function goTo(idx: number) {
    setCurrentIdx(Math.max(0, Math.min(total - 1, idx)));
  }

  function handleSubmit() {
    setSubmitted(true);
    setCurrentIdx(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    setAnswers({});
    setSubmitted(false);
    setSelectedPass(null);
    setCurrentIdx(0);
    setShowPassage(true);
  }

  function startPass(id: number) {
    setSelectedPass(id);
    setCurrentIdx(0);
    setAnswers({});
    setSubmitted(false);
    setShowPassage(true);
  }

  // ── Pass Selector ─────────────────────────────────────────────
  if (!selectedPass) {
    return (
      <div className="min-h-screen" style={{ background: "var(--navy)", color: "var(--cream)" }}>
        <div className="mx-auto max-w-2xl px-4 py-10">
          <div className="mb-8">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
              Vårprovet 2026 · 18 april
            </p>
            <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--cream)" }}>
              Gamla prov
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              Välj ett provpass, svara på uppgifterna och få facit direkt.
            </p>
          </div>
          <div className="space-y-3">
            {PASSES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => startPass(p.id)}
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
        </div>
      </div>
    );
  }

  // ── Results Screen ─────────────────────────────────────────────
  if (submitted && currentIdx === 0 && !q) {
    // shouldn't happen, but guard
  }

  // ── Question Screen ────────────────────────────────────────────
  if (!q) return null;

  const userAns = answers[q.nr];
  const alts = ALT_KEYS
    .map((k, i) => ({ letter: ALT_LABELS[i], text: (q as unknown as Record<string, string>)[k] }))
    .filter(({ text }) => text && !text.startsWith("["));
  const passage = (q as Q & { passage?: string }).passage;
  const hasPassage = !!passage;

  const progressPct = Math.round(((currentIdx + 1) / total) * 100);

  return (
    <div className="min-h-screen" style={{ background: "var(--navy)", color: "var(--cream)" }}>
      <div className="mx-auto max-w-2xl px-4 py-6">

        {/* Top bar */}
        <div className="mb-5 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1 text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            <ChevronLeft className="h-4 w-4" />
            Provpass
          </button>
          <div className="flex-1 text-center">
            <span className="text-xs tabular-nums" style={{ color: "var(--text-tertiary)" }}>
              {currentIdx + 1} / {total}
            </span>
          </div>
          {/* Spacer */}
          <div className="w-20 text-right">
            {submitted && (
              <span className="text-xs font-semibold" style={{ color: "var(--amber)" }}>
                {score}/{total} rätt
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6 h-1 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%`, background: "linear-gradient(90deg,#6366f1,#8b5cf6)" }}
          />
        </div>

        {/* Passage card */}
        {hasPassage && (
          <div className="mb-4 rounded-2xl border" style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}>
            <button
              type="button"
              onClick={() => setShowPassage((v) => !v)}
              className="flex w-full items-center justify-between gap-2 rounded-2xl px-4 py-3 text-left"
            >
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#a5b4fc" }}>
                <BookOpen className="h-3.5 w-3.5" />
                {q.delProv === "ELF" ? "Engelska texten" : "Läspassage"}
              </span>
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                {showPassage ? "Dölj" : "Visa"}
              </span>
            </button>
            {showPassage && (
              <div
                className="max-h-72 overflow-y-auto rounded-b-2xl px-4 pb-4 text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {passage}
              </div>
            )}
          </div>
        )}

        {/* Question card */}
        <div
          className="rounded-2xl border p-5 transition-all"
          style={{
            borderColor: submitted
              ? userAns === q.svar
                ? "rgba(52,211,153,0.4)"
                : userAns
                  ? "rgba(239,68,68,0.4)"
                  : "var(--line)"
              : "var(--line)",
            background: "var(--navy-2)",
          }}
        >
          {/* Q header */}
          <div className="mb-4 flex items-start gap-3">
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
                    onClick={() => pickAnswer(letter)}
                    disabled={submitted}
                    className="flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition-all disabled:cursor-default"
                    style={{ background: bg, borderColor: border, color }}
                  >
                    <span className="mt-0.5 shrink-0 font-bold">{letter}</span>
                    <span>{text}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* ELF / figure-only questions */}
          {alts.length === 0 && (
            <p className="ml-9 text-sm" style={{ color: submitted ? "rgb(52,211,153)" : "var(--text-tertiary)" }}>
              {submitted
                ? <>Rätt svar: <strong>{q.svar}</strong></>
                : "Se provhäfte för svarsmöjligheter"}
            </p>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => goTo(currentIdx - 1)}
            disabled={currentIdx === 0}
            className="flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all disabled:opacity-30"
            style={{ borderColor: "var(--line)", color: "var(--cream)" }}
          >
            <ChevronLeft className="h-4 w-4" />
            Föregående
          </button>

          {currentIdx < total - 1 ? (
            <button
              type="button"
              onClick={() => goTo(currentIdx + 1)}
              className="flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all hover:border-indigo-400"
              style={{ borderColor: "var(--line)", color: "var(--cream)" }}
            >
              Nästa
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : !submitted ? (
            <button
              type="button"
              onClick={handleSubmit}
              className="rounded-full px-5 py-2 text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
              style={{
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                color: "white",
                boxShadow: "0 0 20px rgba(99,102,241,0.35)",
              }}
            >
              Visa facit{answered > 0 ? ` (${answered}/${total})` : ""}
            </button>
          ) : (
            <button
              type="button"
              onClick={reset}
              className="rounded-full border px-5 py-2 text-sm font-medium transition-all hover:border-indigo-400"
              style={{ borderColor: "var(--line)", color: "var(--cream)" }}
            >
              Nytt provpass
            </button>
          )}
        </div>

        {/* Score summary (shown after submit) */}
        {submitted && currentIdx === total - 1 && (
          <div
            className="mt-6 rounded-2xl border p-5 text-center"
            style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
              Slutresultat
            </p>
            <p
              className="mt-2 text-5xl font-bold tabular-nums"
              style={{ color: "var(--amber)", fontFamily: "var(--font-display)" }}
            >
              {score}
              <span className="text-xl font-normal" style={{ color: "var(--text-secondary)" }}>
                &nbsp;/ {total}
              </span>
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              {Math.round((score / total) * 100)}% rätt
            </p>
          </div>
        )}

        {/* Dot navigation (minimap) */}
        {total <= 40 && (
          <div className="mt-6 flex flex-wrap justify-center gap-1.5">
            {questions.map((qq, i) => {
              const ans = answers[qq.nr];
              let dotColor = "rgba(255,255,255,0.12)";
              if (submitted) {
                dotColor = ans === qq.svar ? "rgba(52,211,153,0.7)" : ans ? "rgba(239,68,68,0.7)" : "rgba(255,255,255,0.12)";
              } else if (ans) {
                dotColor = "rgba(99,102,241,0.7)";
              }
              const isActive = i === currentIdx;
              return (
                <button
                  key={qq.nr}
                  type="button"
                  onClick={() => goTo(i)}
                  className="h-2.5 w-2.5 rounded-full transition-all"
                  style={{
                    background: dotColor,
                    transform: isActive ? "scale(1.6)" : "scale(1)",
                    outline: isActive ? "2px solid rgba(99,102,241,0.6)" : "none",
                    outlineOffset: "1px",
                  }}
                  title={`Fråga ${qq.nr}`}
                />
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
