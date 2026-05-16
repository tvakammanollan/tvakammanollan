import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Check, X as XIcon, ChevronDown, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ExplanationBlock } from "@/components/ExplanationBlock";
import { ReportQuestionButton } from "@/components/ui/ReportQuestionButton";

export const Route = createFileRoute("/gamla-prov")({
  component: GamlaProvPage,
});

/* ─── Types ────────────────────────────────────────────────────── */

interface ExamEntry {
  exam_term: string;
  provpass_num: number;
}

interface ExamQuestion {
  id: string;
  q_num: number;
  category: string;
  question_text: string;
  passage_text: string | null;
  passage_id: string | null;
  options: string[];
  correct_answer: string | null;
}

type Phase = "pick" | "loading" | "disclaimer" | "quiz" | "result";

/* ─── Helpers ───────────────────────────────────────────────────── */

function termToLabel(term: string): string {
  const m = term.match(/^(\d{4})(ht|vt[ab]?)$/);
  if (!m) return term;
  const year = m[1];
  const season = m[2].startsWith("ht") ? "Höst" : "Vår";
  return `${season} ${year}`;
}

function termSortKey(term: string): string {
  // "2025vt" → "2025a", "2025ht" → "2025b", "2025vta" → "2025a"
  const m = term.match(/^(\d{4})(ht|vt)/);
  if (!m) return term;
  return m[1] + (m[2] === "ht" ? "b" : "a");
}

function groupByTerm(entries: ExamEntry[]): Map<string, number[]> {
  const map = new Map<string, number[]>();
  for (const e of entries) {
    if (!map.has(e.exam_term)) map.set(e.exam_term, []);
    map.get(e.exam_term)!.push(e.provpass_num);
  }
  // Sort map keys newest first
  return new Map(
    [...map.entries()].sort((a, b) => termSortKey(b[0]).localeCompare(termSortKey(a[0])))
  );
}

const OPTION_LETTERS = ["A", "B", "C", "D", "E"];

/* ─── Page ──────────────────────────────────────────────────────── */

function GamlaProvPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>("pick");
  const [exams, setExams] = useState<Map<string, number[]>>(new Map());
  const [loadingExams, setLoadingExams] = useState(true);
  const [importing, setImporting] = useState(false);

  // Selection state
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [selectedPP, setSelectedPP] = useState<number | null>(null);

  // Quiz state
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<{ correct: boolean; answer: string | null }[]>([]);
  const [startedAt, setStartedAt] = useState(0);
  const [endedAt, setEndedAt] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    loadExamList();
  }, [authLoading, user]);

  async function loadExamList() {
    setLoadingExams(true);
    const { data, error } = await supabase
      .from("questions")
      .select("exam_term, provpass_num")
      .not("exam_term", "is", null)
      .order("exam_term", { ascending: false });

    if (error) { toast.error("Kunde inte ladda prov"); setLoadingExams(false); return; }

    // Deduplicate
    const seen = new Set<string>();
    const unique: ExamEntry[] = [];
    for (const row of data ?? []) {
      const key = `${row.exam_term}:${row.provpass_num}`;
      if (!seen.has(key)) { seen.add(key); unique.push(row as ExamEntry); }
    }
    if (unique.length === 0) {
      // No exams in DB yet — auto-import via edge function
      await runAutoImport();
      return;
    }
    setExams(groupByTerm(unique));
    setLoadingExams(false);
  }

  async function runAutoImport() {
    setImporting(true);
    try {
      const res = await fetch(
        "https://dqhgnioniarhiugxdgla.supabase.co/functions/v1/import-gamla-prov",
        { method: "POST", headers: { "Content-Type": "application/json" } }
      );
      const json = await res.json();
      if (json.inserted > 0) {
        // Reload exam list now that data is in
        await loadExamList();
        return;
      }
      toast.error("Import misslyckades: " + (json.errors?.[0] ?? "okänt fel"));
    } catch (e) {
      toast.error("Kunde inte nå importfunktionen");
    }
    setImporting(false);
    setLoadingExams(false);
  }

  async function startExam() {
    if (!selectedTerm || selectedPP === null) return;
    setPhase("loading");
    const { data, error } = await supabase
      .from("questions")
      .select("id, q_num, category, question_text, passage_text, passage_id, options, correct_answer")
      .eq("exam_term", selectedTerm)
      .eq("provpass_num", selectedPP)
      .order("q_num", { ascending: true });

    if (error || !data || data.length === 0) {
      toast.error("Inga frågor hittades");
      setPhase("pick");
      return;
    }

    const mapped: ExamQuestion[] = data.map((q) => ({
      id: q.id,
      q_num: q.q_num ?? 0,
      category: q.category,
      question_text: q.question_text,
      passage_text: q.passage_text ?? null,
      passage_id: q.passage_id ?? null,
      options: Array.isArray(q.options) ? (q.options as string[]) : [],
      correct_answer: q.correct_answer ?? null,
    }));

    setQuestions(mapped);
    setCurrent(0);
    setSelected(null);
    setRevealed(false);
    setResults([]);

    // If none of the questions have a correct answer, show disclaimer first
    const hasFacit = mapped.some((q) => !!q.correct_answer);
    if (!hasFacit) {
      setPhase("disclaimer");
    } else {
      setStartedAt(Date.now());
      setPhase("quiz");
    }
  }

  const currentQ = questions[current];

  const showPassage = useMemo(() => {
    if (!currentQ?.passage_text) return false;
    const prev = questions[current - 1];
    return !prev || prev.passage_id !== currentQ.passage_id;
  }, [currentQ, current, questions]);

  function handleSelect(letter: string) {
    if (revealed || !currentQ) return;
    const isCorrect = currentQ.correct_answer
      ? letter === currentQ.correct_answer
      : null;
    setSelected(letter);
    setRevealed(true);
    setResults((r) => [...r, { correct: isCorrect === true, answer: letter }]);
  }

  function goNext() {
    if (!revealed) return;
    if (current >= questions.length - 1) {
      setEndedAt(Date.now());
      setPhase("result");
      return;
    }
    setCurrent((i) => i + 1);
    setSelected(null);
    setRevealed(false);
  }

  /* ── PICK ───────────────────────────────────────────────────── */
  if (phase === "pick") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <motion.header
          initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 text-center"
        >
          <p className="eyebrow text-[#6366f1]">Gamla prov</p>
          <h1
            className="mt-2 text-[32px] font-bold leading-tight text-[#050507] sm:text-[44px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Välj ett{" "}
            <span className="display-italic font-medium text-[#6366f1]">gammalt HP</span>
          </h1>
          <p className="mt-2 text-[14px] text-[#737373]">
            Välj provtillfälle och provpass — sedan kör vi!
          </p>
        </motion.header>

        {loadingExams || importing ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="h-10 w-10 rounded-full border-4 border-[#6366f1] border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground">
              {importing ? "Laddar in gamla prov… (första gången tar ~15 sek)" : "Hämtar prov…"}
            </p>
          </div>
        ) : exams.size === 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
            <p className="text-amber-800 font-medium mb-3">Kunde inte ladda proven</p>
            <button
              onClick={() => { setLoadingExams(true); void loadExamList(); }}
              className="text-sm text-[#6366f1] underline"
            >
              Försök igen
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...exams.entries()].map(([term, ppNums]) => {
              const isSelected = selectedTerm === term;
              return (
                <motion.div
                  key={term}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className={`cursor-pointer rounded-2xl border p-5 transition-all ${
                    isSelected
                      ? "border-2 border-[#6366f1] bg-[#e0e7ff]/60"
                      : "border-border bg-white hover:border-[#6366f1] hover:shadow-md"
                  }`}
                  onClick={() => {
                    setSelectedTerm(term);
                    setSelectedPP(ppNums[0] ?? null);
                  }}
                >
                  <div className="text-lg font-semibold text-[#050507]">
                    {termToLabel(term)}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {ppNums.length === 1
                      ? `Provpass ${ppNums[0]}`
                      : `Provpass ${ppNums.join(", ")}`}
                  </div>

                  {isSelected && (
                    <div className="mt-4">
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">
                        Välj provpass
                      </label>
                      <div className="relative">
                        <select
                          className="w-full appearance-none rounded-lg border border-[#6366f1] bg-white py-2 pl-3 pr-8 text-sm font-medium text-[#050507] focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                          value={selectedPP ?? ""}
                          onChange={(e) => setSelectedPP(parseInt(e.target.value))}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {ppNums.map((pp) => (
                            <option key={pp} value={pp}>
                              Provpass {pp}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      </div>
                      <Button
                        className="mt-3 w-full bg-[#6366f1] py-5 text-sm font-semibold text-white hover:bg-[#5048e5]"
                        onClick={(e) => {
                          e.stopPropagation();
                          void startExam();
                        }}
                      >
                        Starta provpass →
                      </Button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        <Link
          to="/"
          className="mt-8 flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Tillbaka till hem
        </Link>
      </div>
    );
  }

  /* ── LOADING ────────────────────────────────────────────────── */
  if (phase === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Laddar frågor…
      </div>
    );
  }

  /* ── DISCLAIMER (no facit) ─────────────────────────────────── */
  if (phase === "disclaimer") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-md w-full rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center shadow-lg"
        >
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-amber-900 mb-2" style={{ fontFamily: "var(--font-display)" }}>
            Facit saknas
          </h2>
          <p className="text-sm text-amber-800 leading-relaxed mb-1">
            <strong>{termToLabel(selectedTerm ?? "")} — Provpass {selectedPP}</strong> ingår i en
            provtermins vars facit kräver VIP-åtkomst på hpguiden.se.
          </p>
          <p className="text-sm text-amber-700 mt-2 mb-6">
            Du kan fortfarande gå igenom frågorna och träna på att läsa och förstå dem — men rätt svar visas inte.
          </p>
          <div className="grid gap-2">
            <Button
              className="w-full bg-amber-600 py-5 text-white hover:bg-amber-700"
              onClick={() => {
                setStartedAt(Date.now());
                setPhase("quiz");
              }}
            >
              Kör ändå — utan facit →
            </Button>
            <Button
              variant="ghost"
              className="w-full py-4 text-amber-700 hover:bg-amber-100"
              onClick={() => setPhase("pick")}
            >
              ← Välj ett annat prov
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ── QUIZ ───────────────────────────────────────────────────── */
  if (phase === "quiz" && currentQ) {
    const hasAnswer = !!currentQ.correct_answer;
    return (
      <div className="flex min-h-screen flex-col bg-background">
        {/* Top bar */}
        <header
          className="sticky top-0 z-20 border-b border-border"
          style={{
            background: "rgba(249,247,244,0.92)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 pt-3 pb-2">
            <div className="text-sm text-muted-foreground" style={{ fontFamily: "var(--font-display)" }}>
              {termToLabel(selectedTerm ?? "")} — Provpass {selectedPP}
            </div>
            <div className="text-sm font-semibold tabular-nums">
              {current + 1} / {questions.length}
            </div>
            <button
              type="button"
              onClick={() => { setPhase("pick"); }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Avsluta"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="mx-auto max-w-3xl px-4 pb-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-[#6366f1] transition-all duration-500 ease-out"
                style={{ width: `${((current + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[720px] flex-1 px-4 py-6">
          {/* Passage */}
          {showPassage && currentQ.passage_text && (
            <section className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Textpassage
              </div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {currentQ.passage_text}
              </div>
            </section>
          )}

          {/* Question card */}
          <div
            key={currentQ.id}
            className="animate-slide-in rounded-2xl border border-border bg-white p-5 sm:p-6"
            style={{ boxShadow: "var(--shadow-md)" }}
          >
            <div className="mb-2 text-xs font-semibold tracking-wide text-[#6366f1]">
              {currentQ.category} · Fråga {currentQ.q_num}
            </div>
            <h2
              className="mb-5 whitespace-pre-wrap text-lg font-semibold leading-relaxed sm:text-xl"
              style={{ fontFamily: "var(--font-display)", lineHeight: 1.5 }}
            >
              {currentQ.question_text}
            </h2>

            {!hasAnswer && revealed && (
              <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-xs text-amber-700">
                Facit saknas för detta prov — du ser alla svarsalternativ men inte rätt svar.
              </div>
            )}

            <div className="grid gap-2" role="radiogroup">
              {currentQ.options.map((opt, i) => {
                const letter = OPTION_LETTERS[i] ?? String(i + 1);
                const isSelected = selected === letter;
                const isCorrect = revealed && letter === currentQ.correct_answer;
                const isWrong = revealed && isSelected && letter !== currentQ.correct_answer;

                let cls = "border border-border bg-white hover:border-[#6366f1] hover:bg-[#e0e7ff]/50";
                if (isCorrect) cls = "border-2 border-[#6366f1] bg-[#6366f1] text-white";
                else if (isWrong) cls = "border-2 border-[#c0392b] bg-[#c0392b] text-white";
                else if (isSelected && !hasAnswer) cls = "border-2 border-[#6366f1] bg-[#e0e7ff]";

                return (
                  <button
                    key={i}
                    type="button"
                    disabled={revealed}
                    onClick={() => handleSelect(letter)}
                    className={`flex min-h-[52px] items-start gap-3 rounded-xl px-4 py-3 text-left transition-all duration-150 ease-out focus:outline-none disabled:cursor-default ${cls}`}
                  >
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${
                        isCorrect || isWrong
                          ? "bg-white/20 text-white"
                          : isSelected
                            ? "bg-[#6366f1] text-white"
                            : "bg-[#f0ede8] text-foreground"
                      }`}
                    >
                      {isCorrect ? <Check className="h-3.5 w-3.5" /> : isWrong ? <XIcon className="h-3.5 w-3.5" /> : letter}
                    </span>
                    <span className="text-sm leading-relaxed">{opt}</span>
                  </button>
                );
              })}
            </div>

            {revealed && (
              <>
                <ExplanationBlock explanation={null} defaultOpen={false} />
                {user && (
                  <div className="mt-3 flex items-center justify-end gap-1 text-xs text-muted-foreground">
                    <span>Felaktig fråga?</span>
                    <ReportQuestionButton
                      questionId={currentQ.id}
                      userId={user.id}
                      questionText={currentQ.question_text}
                    />
                  </div>
                )}
              </>
            )}

            <div className="mt-5">
              {revealed ? (
                <Button
                  onClick={goNext}
                  className="w-full bg-[#6366f1] py-5 text-base text-white hover:bg-[#5048e5]"
                >
                  {current >= questions.length - 1 ? "Visa resultat →" : "Nästa fråga →"}
                </Button>
              ) : (
                <p className="text-center text-xs text-muted-foreground">
                  Välj ett svarsalternativ för att fortsätta
                </p>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ── RESULT ─────────────────────────────────────────────────── */
  if (phase === "result") {
    const withAnswer = results.filter((_, i) => !!questions[i]?.correct_answer);
    const correct = withAnswer.filter((r) => r.correct).length;
    const total = withAnswer.length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const seconds = Math.max(0, Math.round((endedAt - startedAt) / 1000));
    const mm = Math.floor(seconds / 60);
    const ss = seconds % 60;

    const byCat = results.reduce<Record<string, { c: number; t: number }>>((acc, r, i) => {
      const cat = questions[i]?.category ?? "?";
      const hasAns = !!questions[i]?.correct_answer;
      if (!hasAns) return acc;
      acc[cat] = acc[cat] ?? { c: 0, t: 0 };
      acc[cat].t += 1;
      if (r.correct) acc[cat].c += 1;
      return acc;
    }, {});

    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <header className="text-center">
          <h1 className="text-3xl font-semibold sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
            Prov klart! 🎉
          </h1>
          <p className="mt-2 text-muted-foreground">
            {termToLabel(selectedTerm ?? "")} — Provpass {selectedPP}
          </p>
        </header>

        <section className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="text-center">
            <div
              className="text-6xl font-semibold tabular-nums text-[#6366f1]"
              style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}
            >
              {correct}
              <span className="text-3xl text-muted-foreground">/{total}</span>
            </div>
            <div className="mt-2 text-lg font-medium">{pct}% rätt</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {mm} min {ss} sek
            </div>
            {total < questions.length && (
              <div className="mt-2 text-xs text-amber-600">
                {questions.length - total} frågor utan facit räknas inte
              </div>
            )}
          </div>

          {Object.keys(byCat).length > 1 && (
            <div className="mt-6 border-t border-border pt-4">
              <div className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground">
                Per delprov
              </div>
              <div className="grid gap-2">
                {Object.entries(byCat).map(([cat, v]) => (
                  <div key={cat} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                    <span className="font-medium">{cat}</span>
                    <span className="tabular-nums">
                      {v.c}/{v.t}{" "}
                      {v.c === v.t ? "✅" : v.c === 0 ? "❌" : "⚠️"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <div className="mt-6 grid gap-2">
          <Button
            onClick={() => {
              setPhase("pick");
              setSelectedTerm(null);
              setSelectedPP(null);
            }}
            className="w-full bg-[#6366f1] py-5 text-white hover:bg-[#5048e5]"
          >
            📚 Välj ett annat prov
          </Button>
          <Button
            onClick={() => void startExam()}
            variant="outline"
            className="w-full border-[#6366f1] py-5 text-[#6366f1] hover:bg-[#e0e7ff]"
          >
            🔄 Gör om samma provpass
          </Button>
          <Button onClick={() => navigate({ to: "/" })} variant="ghost" className="w-full py-5 text-muted-foreground">
            🏠 Hem
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
