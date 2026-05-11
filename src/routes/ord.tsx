import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";

import {
  ArrowRight,
  Check,
  X,
  RotateCcw,
  GraduationCap,
  Trophy,
} from "lucide-react";
import { sounds } from "@/lib/sounds";
import {
  fetchWordBatch,
  countOrdQuestions,
  recordOrdAnswer,
  getWordProgress,
  type WordQuestion,
} from "@/lib/word-practice.functions";

export const Route = createFileRoute("/ord")({
  component: OrdPracticePage,
  head: () => ({
    meta: [
      { title: "Öva ord · HP Kampen" },
      {
        name: "description",
        content:
          "Träna högskoleprovets ordförståelse solo. Över 1000 riktiga ORD-frågor från tidigare högskoleprov.",
      },
    ],
  }),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <h1 className="text-xl font-semibold">Något gick fel</h1>
        <p className="mt-2 text-muted-foreground">{error.message}</p>
        <Button
          className="mt-4"
          onClick={() => {
            router.invalidate();
            reset();
          }}
        >
          Försök igen
        </Button>
      </div>
    );
  },
  notFoundComponent: () => <div>404</div>,
});

const COUNT_OPTIONS = [5, 10, 20] as const;
type SessionLength = (typeof COUNT_OPTIONS)[number];
type Phase = "setup" | "playing" | "summary";

interface AnsweredItem {
  question: WordQuestion;
  picked: string;
  isCorrect: boolean;
}

function OrdPracticePage() {
  const fetchBatch = useServerFn(fetchWordBatch);
  const fetchCount = useServerFn(countOrdQuestions);
  const fetchProgress = useServerFn(getWordProgress);
  const recordAnswer = useServerFn(recordOrdAnswer);

  const [phase, setPhase] = useState<Phase>("setup");
  const [target, setTarget] = useState<SessionLength>(10);
  const [batch, setBatch] = useState<WordQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [answered, setAnswered] = useState<AnsweredItem[]>([]);
  const [poolSize, setPoolSize] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{
    correctCount: number;
    totalCount: number;
    userId: string;
  } | null>(null);
  const [excludeCorrect, setExcludeCorrect] = useState(false);

  const loadProgress = useCallback(() => {
    void fetchProgress({})
      .then((p) => setProgress(p))
      .catch(() => setProgress(null));
  }, [fetchProgress]);

  useEffect(() => {
    void fetchCount({})
      .then((c) => setPoolSize(c.count))
      .catch(() => setPoolSize(0));
    loadProgress();
  }, [fetchCount, loadProgress]);

  const startSession = useCallback(
    async (n: SessionLength) => {
      setTarget(n);
      setLoading(true);
      try {
        const res = await fetchBatch({
          data: {
            count: n,
            exclude: [],
            excludeCorrectForUserId:
              excludeCorrect && progress ? progress.userId : undefined,
          },
        });
        setBatch(res.questions);
        setIdx(0);
        setPicked(null);
        setAnswered([]);
        setPhase("playing");
      } catch (err) {
        console.error("startSession failed", err);
        alert("Kunde inte ladda frågor – försök igen om en stund.");
      } finally {
        setLoading(false);
      }
    },
    [fetchBatch, excludeCorrect, progress],
  );

  const current = batch[idx];

  const onPick = (letter: string) => {
    if (picked || !current) return;
    setPicked(letter);
    const isCorrect = letter === current.correct_answer;
    setAnswered((a) => [...a, { question: current, picked: letter, isCorrect }]);
    if (isCorrect) sounds.correct();
    else sounds.wrong();
    // Persist to leaderboard (fire-and-forget; ignore failures e.g. for guests)
    void recordAnswer({
      data: { correct: isCorrect, questionId: current.id },
    }).catch(() => {});
  };

  const next = () => {
    sounds.click();
    if (idx + 1 >= batch.length) {
      setPhase("summary");
      loadProgress();
    } else {
      setIdx((i) => i + 1);
      setPicked(null);
    }
  };

  const backToSetup = () => {
    sounds.click();
    setPhase("setup");
    setBatch([]);
    setAnswered([]);
    setIdx(0);
    setPicked(null);
    loadProgress();
  };

  const correctCount = answered.filter((a) => a.isCorrect).length;
  const pct =
    answered.length > 0 ? Math.round((correctCount / answered.length) * 100) : 0;

  return (
    <>
      <main className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8f2ec] text-[#1a5c3a]">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1
                className="text-2xl font-semibold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Öva ord
              </h1>
              <p className="text-xs text-muted-foreground">
                {poolSize !== null
                  ? "1000+ riktiga ORD-frågor från tidigare HP"
                  : "Laddar bank…"}
              </p>
            </div>
          </div>
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Hem
          </Link>
        </header>

        {/* SETUP */}
        {phase === "setup" && (
          <section className="rounded-2xl border border-border bg-white p-6 shadow-card sm:p-8">
            <h2
              className="text-xl font-semibold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Hur många ord vill du öva?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Välj längd på passet — du får en sammanställning efteråt.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2.5">
              {COUNT_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => void startSession(n)}
                  disabled={loading}
                  className="group flex flex-col items-center justify-center rounded-xl border border-border bg-white py-6 transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary-soft disabled:opacity-60"
                >
                  <span className="text-3xl font-semibold tabular-nums text-[#1a5c3a]">
                    {n}
                  </span>
                  <span className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                    ord
                  </span>
                </button>
              ))}
            </div>
            {loading && (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Förbereder pass…
              </p>
            )}

            {progress && progress.totalCount > 0 && (
              <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Dina rätt besvarade ord
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-[#1a5c3a]">
                    {progress.correctCount.toLocaleString("sv-SE")} /{" "}
                    {progress.totalCount.toLocaleString("sv-SE")}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-[#1a5c3a] transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        (progress.correctCount / progress.totalCount) * 100,
                      )}%`,
                    }}
                  />
                </div>
                <label className="mt-4 flex cursor-pointer items-center justify-between gap-3">
                  <span className="text-sm">
                    Filtrera bort ord jag redan svarat rätt på
                  </span>
                  <input
                    type="checkbox"
                    checked={excludeCorrect}
                    onChange={(e) => setExcludeCorrect(e.target.checked)}
                    disabled={
                      progress.correctCount >= progress.totalCount ||
                      progress.correctCount === 0
                    }
                    className="h-5 w-5 rounded border-border accent-[#1a5c3a] disabled:opacity-40"
                  />
                </label>
                {excludeCorrect &&
                  progress.totalCount - progress.correctCount < 10 && (
                    <p className="mt-2 text-xs text-amber-700">
                      Endast{" "}
                      {progress.totalCount - progress.correctCount} ord kvar
                      med detta filter.
                    </p>
                  )}
              </div>
            )}

            <div className="mt-5 border-t border-border pt-4 text-center">
              <Link
                to="/leaderboard"
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                🏆 Se ord-topplistan →
              </Link>
            </div>
          </section>
        )}

        {/* PLAYING */}
        {phase === "playing" && (
          <>
            {/* Progress bar */}
            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="font-medium tabular-nums">
                Fråga {idx + 1} / {target}
              </span>
              <span className="text-muted-foreground tabular-nums">
                {correctCount} rätt hittills
              </span>
            </div>
            <div className="mb-5 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-[#1a5c3a] transition-all duration-300"
                style={{ width: `${((idx + (picked ? 1 : 0)) / target) * 100}%` }}
              />
            </div>

            {!current ? (
              <div className="skeleton-shimmer h-80 rounded-2xl" />
            ) : (
              <article className="rounded-2xl border border-border bg-white p-6 shadow-card sm:p-8">
                <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Synonym till
                </div>
                <h2
                  className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {current.question_text.toLowerCase()}
                </h2>

                <div className="mt-6 grid gap-2.5">
                  {current.options.map((opt) => {
                    const isPicked = picked === opt.id;
                    const isCorrect = opt.id === current.correct_answer;
                    const showState = picked !== null;
                    let cls =
                      "flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all";
                    if (!showState) {
                      cls +=
                        " border-border bg-white hover:border-primary/50 hover:bg-primary-soft cursor-pointer";
                    } else if (isCorrect) {
                      cls += " border-green-600/60 bg-green-50 text-green-900";
                    } else if (isPicked) {
                      cls += " border-red-600/60 bg-red-50 text-red-900";
                    } else {
                      cls += " border-border bg-white opacity-60";
                    }
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={showState}
                        onClick={() => onPick(opt.id)}
                        className={cls}
                      >
                        <span className="flex items-center gap-3">
                          <span className="flex h-6 w-6 items-center justify-center rounded-md border border-border text-xs font-semibold tabular-nums text-muted-foreground">
                            {opt.id}
                          </span>
                          <span>{opt.text}</span>
                        </span>
                        {showState && isCorrect && (
                          <Check className="h-5 w-5 text-green-600" />
                        )}
                        {showState && isPicked && !isCorrect && (
                          <X className="h-5 w-5 text-red-600" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {picked && (
                  <div className="mt-6 flex items-center justify-end">
                    <Button onClick={next} className="gap-2">
                      {idx + 1 >= target ? "Visa resultat" : "Nästa"}{" "}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </article>
            )}

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={backToSetup}
                className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Avbryt pass
              </button>
            </div>
          </>
        )}

        {/* SUMMARY */}
        {phase === "summary" && (
          <section className="rounded-2xl border border-border bg-white p-6 shadow-card sm:p-8">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f2ec] text-[#1a5c3a]">
                <Trophy className="h-8 w-8" />
              </div>
              <h2
                className="mt-3 text-3xl font-semibold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {correctCount} av {answered.length} rätt
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {pct}% rätt på passet
              </p>
            </div>

            <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Genomgång
              </h3>
              <ol className="grid gap-2">
                {answered.map((a, i) => {
                  const correctOpt = a.question.options.find(
                    (o) => o.id === a.question.correct_answer,
                  );
                  return (
                    <li
                      key={a.question.id}
                      className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${
                        a.isCorrect
                          ? "border-green-200 bg-green-50/60"
                          : "border-red-200 bg-red-50/60"
                      }`}
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-semibold tabular-nums text-muted-foreground">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <div className="font-semibold">
                          {a.question.question_text.toLowerCase()}
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          Rätt svar: <strong>{correctOpt?.text ?? "—"}</strong>
                        </div>
                      </div>
                      {a.isCorrect ? (
                        <Check className="h-4 w-4 shrink-0 text-green-700" />
                      ) : (
                        <X className="h-4 w-4 shrink-0 text-red-700" />
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button onClick={() => void startSession(target)} className="gap-2">
                <RotateCcw className="h-4 w-4" /> Kör {target} till
              </Button>
              <Button variant="outline" onClick={backToSetup}>
                Välj annan längd
              </Button>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
