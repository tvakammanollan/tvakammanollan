import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { ArrowRight, Check, X, RotateCcw, GraduationCap } from "lucide-react";
import { sounds } from "@/lib/sounds";
import {
  fetchWordBatch,
  countOrdQuestions,
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

const BATCH_SIZE = 20;

function OrdPracticePage() {
  const fetchBatch = useServerFn(fetchWordBatch);
  const fetchCount = useServerFn(countOrdQuestions);

  const [batch, setBatch] = useState<WordQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [seen, setSeen] = useState<string[]>([]);
  const [poolSize, setPoolSize] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMore = useCallback(
    async (excludeIds: string[]) => {
      setLoading(true);
      const res = await fetchBatch({
        data: { count: BATCH_SIZE, exclude: excludeIds.slice(-200) },
      });
      setBatch(res.questions);
      setIdx(0);
      setPicked(null);
      setLoading(false);
    },
    [fetchBatch],
  );

  useEffect(() => {
    void fetchCount({}).then((c) => setPoolSize(c.count));
    void loadMore([]);
  }, [fetchCount, loadMore]);

  const current = batch[idx];

  const onPick = (letter: string) => {
    if (picked || !current) return;
    setPicked(letter);
    const isCorrect = letter === current.correct_answer;
    setStats((s) => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      total: s.total + 1,
    }));
    setSeen((s) => [...s, current.id]);
    if (isCorrect) sounds.correct();
    else sounds.wrong();
  };

  const next = () => {
    sounds.click();
    if (idx + 1 >= batch.length) {
      void loadMore(seen);
    } else {
      setIdx((i) => i + 1);
      setPicked(null);
    }
  };

  const restart = () => {
    sounds.click();
    setStats({ correct: 0, total: 0 });
    setSeen([]);
    void loadMore([]);
  };

  return (
    <>
      <Navbar />
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

        {/* Stats bar */}
        <div className="mb-5 flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-4 text-sm">
            <span>
              <strong className="tabular-nums">{stats.correct}</strong>
              <span className="text-muted-foreground"> / {stats.total} rätt</span>
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="tabular-nums">
              {stats.total > 0
                ? `${Math.round((stats.correct / stats.total) * 100)}%`
                : "—"}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={restart} className="gap-1">
            <RotateCcw className="h-3.5 w-3.5" /> Börja om
          </Button>
        </div>

        {/* Question card */}
        {loading || !current ? (
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
              <div className="mt-6 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {current.source ? `Källa: ${current.source.split(":")[0]}` : ""}
                </span>
                <Button onClick={next} className="gap-2">
                  Nästa <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </article>
        )}
      </main>
    </>
  );
}
