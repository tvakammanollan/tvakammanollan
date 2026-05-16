import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import examData from "@/data/exam-2026-spring.json";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Image as ImageIcon,
  Trophy,
  Target,
  RotateCcw,
  X,
} from "lucide-react";

export const Route = createFileRoute("/gamla-prov")({
  component: GamlaProvPage,
});

type Q = (typeof examData)[number] & { image?: string; passage?: string };

const PASSES = [
  { id: 2, label: "Provpass 2 – Verbal", desc: "ORD · LÄS · MEK · ELF" },
  { id: 3, label: "Provpass 3 – Kvantitativ", desc: "XYZ · KVA · NOG · DTK" },
  { id: 4, label: "Provpass 4 – Verbal", desc: "ORD · LÄS · MEK · ELF" },
  { id: 5, label: "Provpass 5 – Kvantitativ", desc: "XYZ · KVA · NOG · DTK" },
];

const ALT_KEYS = ["a", "b", "c", "d", "e"] as const;
const ALT_LABELS = ["A", "B", "C", "D", "E"];

// Typisk HP-normering – snittvärden från senaste 6 vårproven.
// Faktisk normering för VT2026 publiceras 27 maj 2026 av UHR.
// Input: råpoäng per provpass (0-40). Output: ungefärligt normerat 0.0-2.0
// utifrån antagandet att samma % rätt gäller i alla 4 provpass (totalt 160).
function approxNormering(rawOutOf40: number): number {
  const pct = rawOutOf40 / 40;
  const fullRaw = Math.round(pct * 160);
  // Approx table (raw 160 → normerat) baserat på historiska snitt
  const table: [number, number][] = [
    [0, 0.0], [10, 0.05], [20, 0.1], [30, 0.15], [40, 0.2],
    [50, 0.35], [55, 0.45], [60, 0.55], [65, 0.65], [70, 0.75],
    [75, 0.85], [80, 0.95], [85, 1.05], [90, 1.15], [95, 1.20],
    [100, 1.25], [105, 1.30], [110, 1.35], [115, 1.40], [120, 1.50],
    [125, 1.55], [130, 1.65], [135, 1.75], [140, 1.85], [145, 1.90],
    [150, 1.95], [155, 2.00], [160, 2.00],
  ];
  for (let i = 0; i < table.length - 1; i++) {
    const [a, va] = table[i];
    const [b, vb] = table[i + 1];
    if (fullRaw >= a && fullRaw <= b) {
      const t = (fullRaw - a) / (b - a || 1);
      return Math.round((va + (vb - va) * t) * 20) / 20;
    }
  }
  return 0;
}

function delProvLabel(code: string): string {
  const m: Record<string, string> = {
    ORD: "Ordförståelse",
    LÄS: "Läsförståelse",
    MEK: "Meningskompl.",
    ELF: "Engelsk läs.",
    XYZ: "Mat. problem",
    KVA: "Kvant. jämför.",
    NOG: "Kvant. resonem.",
    DTK: "Diagram/tabell",
  };
  return m[code] || code;
}

function GamlaProvPage() {
  const [selectedPass, setSelectedPass] = useState<number | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showPassage, setShowPassage] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);

  const questions: Q[] = selectedPass
    ? (examData as Q[]).filter((qq) => qq.provpass === selectedPass)
    : [];

  const q = questions[currentIdx];
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
    setShowResults(false);
  }

  function handleSubmit() {
    setSubmitted(true);
    setShowResults(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    setAnswers({});
    setSubmitted(false);
    setShowResults(false);
    setSelectedPass(null);
    setCurrentIdx(0);
    setShowPassage(true);
  }

  function startPass(id: number) {
    setSelectedPass(id);
    setCurrentIdx(0);
    setAnswers({});
    setSubmitted(false);
    setShowResults(false);
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
  if (showResults && submitted) {
    const byDelProv = questions.reduce<Record<string, { correct: number; total: number }>>((acc, qq) => {
      const k = qq.delProv;
      if (!acc[k]) acc[k] = { correct: 0, total: 0 };
      acc[k].total++;
      if (answers[qq.nr] === qq.svar) acc[k].correct++;
      return acc;
    }, {});

    const norm = approxNormering(score);
    const pct = Math.round((score / total) * 100);
    const wrongQs = questions.filter((qq) => answers[qq.nr] !== qq.svar);
    const unanswered = questions.filter((qq) => !answers[qq.nr]).length;

    return (
      <div className="min-h-screen" style={{ background: "var(--navy)", color: "var(--cream)" }}>
        <div className="mx-auto max-w-2xl px-4 py-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-1 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              <ChevronLeft className="h-4 w-4" />
              Provpass
            </button>
            <span className="text-xs uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
              Resultat · Provpass {selectedPass}
            </span>
            <span className="w-20" />
          </div>

          {/* Hero score card */}
          <div
            className="mb-5 overflow-hidden rounded-3xl border p-6 text-center"
            style={{
              borderColor: "var(--line)",
              background: "linear-gradient(135deg, var(--navy-2) 0%, rgba(99,102,241,0.08) 100%)",
            }}
          >
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "rgba(234,179,8,0.18)" }}>
              <Trophy className="h-6 w-6" style={{ color: "var(--amber)" }} />
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
              Slutresultat
            </p>
            <p
              className="mt-3 text-6xl font-bold tabular-nums"
              style={{ color: "var(--amber)", fontFamily: "var(--font-display)" }}
            >
              {score}
              <span className="text-2xl font-normal" style={{ color: "var(--text-secondary)" }}>
                /{total}
              </span>
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              {pct}% rätt
              {unanswered > 0 && (
                <> · {unanswered} obesvarade</>
              )}
            </p>
          </div>

          {/* Normering card */}
          <div className="mb-5 rounded-2xl border p-5" style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" style={{ color: "#a5b4fc" }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#a5b4fc" }}>
                Ungefärlig normering
              </span>
            </div>
            <p
              className="mt-2 text-4xl font-bold tabular-nums"
              style={{ color: "var(--cream)", fontFamily: "var(--font-display)" }}
            >
              {norm.toFixed(2)}
            </p>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
              Baserat på antagandet att du fick samma % rätt på hela provet (160 uppgifter).
              Officiell normering för VT2026 publiceras 27 maj av UHR.
            </p>
          </div>

          {/* Per delprov breakdown */}
          <div className="mb-5 rounded-2xl border p-5" style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
              Per delprov
            </p>
            <div className="space-y-2.5">
              {Object.entries(byDelProv).map(([code, s]) => {
                const p = Math.round((s.correct / s.total) * 100);
                return (
                  <div key={code}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span style={{ color: "var(--cream)" }}>
                        <strong className="mr-1.5" style={{ color: "#a5b4fc" }}>{code}</strong>
                        {delProvLabel(code)}
                      </span>
                      <span className="tabular-nums" style={{ color: "var(--text-secondary)" }}>
                        {s.correct}/{s.total} · {p}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${p}%`,
                          background:
                            p >= 80 ? "rgb(52,211,153)" :
                            p >= 50 ? "rgb(234,179,8)" :
                            "rgb(239,68,68)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Wrong answers list */}
          {wrongQs.length > 0 && (
            <div className="mb-5 rounded-2xl border p-5" style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                Felaktiga svar ({wrongQs.length})
              </p>
              <div className="space-y-2">
                {wrongQs.map((qq) => {
                  const idx = questions.findIndex((x) => x.nr === qq.nr);
                  const ans = answers[qq.nr];
                  return (
                    <button
                      key={qq.nr}
                      type="button"
                      onClick={() => goTo(idx)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-xs transition-all hover:border-indigo-400"
                      style={{ borderColor: "var(--line)" }}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span
                          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-bold tabular-nums"
                          style={{ background: "rgba(239,68,68,0.15)", color: "rgb(239,68,68)" }}
                        >
                          {qq.nr}
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#a5b4fc" }}>
                          {qq.delProv}
                        </span>
                      </span>
                      <span className="text-xs tabular-nums" style={{ color: "var(--text-tertiary)" }}>
                        Du: <strong style={{ color: "rgb(239,68,68)" }}>{ans || "—"}</strong>
                        {" · "}
                        Rätt: <strong style={{ color: "rgb(52,211,153)" }}>{qq.svar}</strong>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* CTA buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setShowResults(false); setCurrentIdx(0); }}
              className="flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all hover:border-indigo-400"
              style={{ borderColor: "var(--line)", color: "var(--cream)" }}
            >
              <BookOpen className="h-4 w-4" />
              Granska alla
            </button>
            <button
              type="button"
              onClick={reset}
              className="flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all hover:opacity-90"
              style={{
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                color: "white",
                boxShadow: "0 0 20px rgba(99,102,241,0.35)",
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Nytt provpass
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Question Screen ────────────────────────────────────────────
  if (!q) return null;

  const userAns = answers[q.nr];
  const alts = ALT_KEYS
    .map((k, i) => ({ letter: ALT_LABELS[i], text: (q as unknown as Record<string, string>)[k] }))
    .filter(({ text }) => text && !text.startsWith("["));
  const passage = q.passage;
  const hasPassage = !!passage;
  const hasImage = !!q.image;
  const isELF = q.delProv === "ELF";

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
          <div className="w-20 text-right">
            {submitted && (
              <button
                type="button"
                onClick={() => setShowResults(true)}
                className="text-xs font-semibold underline-offset-2 hover:underline"
                style={{ color: "var(--amber)" }}
              >
                {score}/{total} rätt
              </button>
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

        {/* ELF copyright notice */}
        {isELF && !passage && (
          <div
            className="mb-4 rounded-2xl border p-4 text-xs leading-relaxed"
            style={{ borderColor: "rgba(234,179,8,0.3)", background: "rgba(234,179,8,0.05)", color: "var(--text-secondary)" }}
          >
            <strong style={{ color: "var(--amber)" }}>Engelska texten är inte tillgänglig</strong> — Studera.nu tar bort
            ELF-texterna en vecka efter provdagen pga upphovsrätt. Du kan se rätt svar nedan, men frågan kan inte besvaras utan originaltexten.
          </div>
        )}

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
                {isELF ? "Engelska texten" : "Läspassage"}
              </span>
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                {showPassage ? "Dölj" : "Visa"}
              </span>
            </button>
            {showPassage && passage && (
              <div
                className="rounded-b-2xl px-4 pb-4 text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {passage.split(/\n\n+/).map((para, i) => {
                  const trimmed = para.trim();
                  const isHeading = /^(INLÄGG\s*\d+|Två inlägg.*|En afrikansk vår\??|Vilse|Omvårdnadsforskning|Fiskodling.*)$/i.test(trimmed);
                  if (isHeading) {
                    return (
                      <p
                        key={i}
                        className="mt-4 mb-2 text-xs font-bold uppercase tracking-wider first:mt-0"
                        style={{ color: "#a5b4fc" }}
                      >
                        {trimmed}
                      </p>
                    );
                  }
                  return (
                    <p key={i} className="mb-3 last:mb-0">
                      {trimmed}
                    </p>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Image / figure card */}
        {hasImage && (
          <div className="mb-4 overflow-hidden rounded-2xl border" style={{ borderColor: "var(--line)", background: "var(--navy-2)" }}>
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#a5b4fc" }}>
                <ImageIcon className="h-3.5 w-3.5" />
                Figur ur provhäftet
              </span>
              <button
                type="button"
                onClick={() => setShowImageModal(true)}
                className="text-xs underline-offset-2 hover:underline"
                style={{ color: "var(--text-tertiary)" }}
              >
                Förstora
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowImageModal(true)}
              className="block w-full"
            >
              <img
                src={q.image}
                alt={`Figur till uppgift ${q.nr}`}
                className="w-full bg-white"
                style={{ maxHeight: "60vh", objectFit: "contain" }}
              />
            </button>
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
                {q.fraga && !q.fraga.startsWith("[") ? q.fraga : "[Se figur eller provhäfte]"}
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

          {/* Fallback: no alternatives */}
          {alts.length === 0 && (
            <p className="ml-9 text-sm" style={{ color: submitted ? "rgb(52,211,153)" : "var(--text-tertiary)" }}>
              {submitted
                ? <>Rätt svar: <strong>{q.svar}</strong></>
                : isELF
                  ? "Texten saknas — se rätt svar efter inlämning."
                  : "Se figuren ovan eller provhäftet."}
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
              onClick={() => setShowResults(true)}
              className="rounded-full px-5 py-2 text-sm font-semibold transition-all hover:opacity-90"
              style={{
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                color: "white",
              }}
            >
              Tillbaka till resultat
            </button>
          )}
        </div>

        {/* Dot navigation */}
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

      {/* Image fullscreen modal */}
      {showImageModal && q.image && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setShowImageModal(false)}
        >
          <button
            type="button"
            onClick={() => setShowImageModal(false)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white backdrop-blur transition-all hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={q.image}
            alt={`Figur till uppgift ${q.nr}`}
            className="max-h-full max-w-full bg-white"
            style={{ objectFit: "contain" }}
          />
        </div>
      )}
    </div>
  );
}
