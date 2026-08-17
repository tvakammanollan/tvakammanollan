import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { m } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/layout/PageHero";
import { GlassCard } from "@/components/layout/GlassCard";
import { NextStep } from "@/components/layout/NextStep";

import {
  ArrowRight,
  Check,
  X,
  RotateCcw,
  GraduationCap,
  Trophy,
  BookOpen,
  Swords,
  Target,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import { ordText, ordDefinition, hasOrdDefinition, formatInt, formatDate } from "@/lib/sv-format";
import { sounds } from "@/lib/sounds";
import {
  fetchWordBatch,
  fetchFailedWordBatch,
  countOrdQuestions,
  recordOrdAnswer,
  getWordProgress,
  getOrdFilterCounts,
  getFailedWordCount,
  getFailedWordsList,
  type WordQuestion,
  type FailedWordEntry,
} from "@/lib/word-practice.functions";

export const Route = createFileRoute("/ord")({
  component: OrdPracticePage,
  head: () => ({
    meta: pageMeta({
      path: "/ord",
      title: "Öva ord · 8 000+ HP-ord · HP Kampen",
      description:
        "Träna ordförståelse för Högskoleprovet med 8 000+ riktiga ORD-frågor från tidigare HP. Spaced repetition, ingen tidspress, helt gratis.",
      ogTitle: "Öva ord · 8 000+ HP-ord",
      ogDescription: "Lär dig orden som dyker upp på HP. Solo, lugn takt, gratis.",
    }),
    links: pageLinks("/ord"),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Öva ord", path: "/ord" },
      ]),
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "LearningResource",
        name: "Öva HP-ord · 8 000+ riktiga ORD-frågor",
        description:
          "Träna ordförståelse för Högskoleprovet med 8 000+ riktiga ORD-frågor från tidigare HP. Spaced repetition, ingen tidspress.",
        url: "https://hpkampen.se/ord",
        inLanguage: "sv-SE",
        learningResourceType: "Övning",
        educationalLevel: "Gymnasium",
        isAccessibleForFree: true,
        teaches: "Ordförståelse (ORD)",
      }),
    ],
  }),
  errorComponent: OrdErrorComponent,
  notFoundComponent: () => <div>404</div>,
});

function OrdErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
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
}

const COUNT_OPTIONS = [5, 10, 20] as const;
type SessionLength = (typeof COUNT_OPTIONS)[number];
type Phase = "setup" | "playing" | "summary";

interface AnsweredItem {
  question: WordQuestion;
  picked: string;
  isCorrect: boolean;
}

function definitionSourceLabel(s?: string | null): string {
  if (!s) return "Förklaring";
  if (s.startsWith("SO idiom")) return "SO · idiom (svenska.se)";
  if (s.startsWith("SO")) return "SO · Svensk ordbok (svenska.se)";
  if (s.startsWith("SAOL")) return "SAOL (svenska.se)";
  if (s.startsWith("SAOB")) return "SAOB (svenska.se)";
  if (s.startsWith("Wikipedia")) return "Wikipedia";
  if (s.startsWith("Wiktionary")) return "Wiktionary";
  if (s.startsWith("HP-facit")) return "Synonym (HP-facit)";
  return "Förklaring";
}

function DefinitionBlock({
  word,
  definition,
  source,
  defaultOpen = true,
}: {
  word: string;
  // Nullbar: anropssidan grindar på hasOrdDefinition(), och ordDefinition()
  // hanterar tomt värde — så typen behöver inte snävas av på anropssidan.
  definition: string | null | undefined;
  source?: string | null;
  /**
   * Öppen från start, precis som ExplanationBlock. Öppnades tidigare bara när
   * svaret var fel, så samma ruta betedde sig olika beroende på hur det gick —
   * och en tur-gissning är just när man bäst behöver läsa definitionen.
   */
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-xs font-medium text-[#7a5236] underline-offset-4 transition-colors hover:text-[#8ec9ce] hover:underline"
      >
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        {open ? "Dölj förklaring" : `Vad betyder "${ordText(word)}"?`}
      </button>
      <div
        className="grid transition-all duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-2 rounded-lg border-l-4 border-[#ae2f26]/60 bg-[#ae2f26]/[0.07] p-3">
            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#ae2f26]">
              <BookOpen className="h-3.5 w-3.5" />
              {definitionSourceLabel(source)}
            </div>
            <p
              className="whitespace-pre-wrap text-[#2e1e14]"
              style={{ fontSize: 14, lineHeight: 1.7 }}
            >
              {ordDefinition(definition)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrdPracticePage() {
  const fetchBatch = useServerFn(fetchWordBatch);
  const fetchFailedBatch = useServerFn(fetchFailedWordBatch);
  const fetchCount = useServerFn(countOrdQuestions);
  const fetchProgress = useServerFn(getWordProgress);
  const fetchFilterCounts = useServerFn(getOrdFilterCounts);
  const fetchFailedCount = useServerFn(getFailedWordCount);
  const fetchFailedList = useServerFn(getFailedWordsList);
  const recordAnswer = useServerFn(recordOrdAnswer);
  // Varna bara en gång per session om svars-sparandet strular.
  const recordWarnedRef = useRef(false);

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
  const [sourceFilter, setSourceFilter] = useState<"all" | "hp" | "list">("all");
  const [failedMode, setFailedMode] = useState(false);
  const [failedCount, setFailedCount] = useState<number | null>(null);
  const [failedWords, setFailedWords] = useState<FailedWordEntry[]>([]);
  const [failedListOpen, setFailedListOpen] = useState(false);
  const [difficulties, setDifficulties] = useState<number[]>([]);
  const [filterCounts, setFilterCounts] = useState<{
    all: number;
    hp: number;
    list: number;
    easy: number;
    medium: number;
    hard: number;
  } | null>(null);

  const loadProgress = useCallback(() => {
    void fetchProgress({})
      .then((p) => setProgress(p))
      .catch(() => setProgress(null));
  }, [fetchProgress]);

  useEffect(() => {
    void fetchCount({})
      .then((c) => setPoolSize(c.count))
      .catch(() => setPoolSize(0));
    void fetchFilterCounts({})
      .then((c) => setFilterCounts(c))
      .catch(() => setFilterCounts(null));
    void fetchFailedCount({})
      .then((r) => setFailedCount(r.count))
      .catch(() => setFailedCount(null));
    void fetchFailedList({})
      .then((r) => setFailedWords(r.words))
      .catch(() => setFailedWords([]));
    loadProgress();
  }, [fetchCount, fetchFilterCounts, fetchFailedCount, fetchFailedList, loadProgress]);

  const toggleDifficulty = (d: number) => {
    setDifficulties((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const startSession = useCallback(
    async (n: SessionLength) => {
      setTarget(n);
      setLoading(true);
      try {
        let questions: WordQuestion[];
        if (failedMode) {
          const res = await fetchFailedBatch({ data: { count: n } });
          questions = res.questions;
        } else {
          const res = await fetchBatch({
            data: {
              count: n,
              exclude: [],
              excludeCorrectForUserId: excludeCorrect && progress ? progress.userId : undefined,
              sourceFilter,
              difficulties,
            },
          });
          questions = res.questions;
        }
        setBatch(questions);
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
    [
      fetchBatch,
      fetchFailedBatch,
      failedMode,
      excludeCorrect,
      progress,
      sourceFilter,
      difficulties,
    ],
  );

  const current = batch[idx];

  const onPick = (letter: string) => {
    if (picked || !current) return;
    setPicked(letter);
    const isCorrect = letter === current.correct_answer;
    setAnswered((a) => [...a, { question: current, picked: letter, isCorrect }]);
    if (isCorrect) sounds.correct();
    else sounds.wrong();
    // Persist to leaderboard (fire-and-forget, men berätta EN gång per session
    // om sparandet strular — tidigare helt tyst dataförlust).
    void recordAnswer({
      data: { correct: isCorrect, questionId: current.id },
    }).catch(() => {
      if (!recordWarnedRef.current) {
        recordWarnedRef.current = true;
        toast.warning("Kunde inte spara ditt svar till topplistan", {
          description: "Du kan fortsätta öva som vanligt — vi försöker igen på nästa svar.",
        });
      }
    });
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
  const pct = answered.length > 0 ? Math.round((correctCount / answered.length) * 100) : 0;

  return (
    <>
      <PageHero
        eyebrowTone="leaf"
        eyebrow="8 000+ ord"
        title="Öva"
        cycleWords={["ord.", "synonymer.", "betydelser.", "rötter."]}
        subtitle="Spaced repetition. Ingen tidspress. Helt gratis."
        align="center"
        variant="compact"
      />
      <main className="mx-auto max-w-2xl px-4 pb-20 sm:px-6">
        {/* SETUP */}
        {phase === "setup" && (
          <m.div
            initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <GlassCard className="p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ae2f26]/15 text-[#ae2f26]">
                  <GraduationCap className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[12px] font-semibold uppercase italic tracking-[0.14em] text-[#7a5236]">
                    Steg 1
                  </p>
                  <h2
                    className="text-[22px] font-bold leading-tight text-white sm:text-[26px]"
                    style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
                  >
                    Hur många ord vill du öva?
                  </h2>
                </div>
              </div>
              <p className="mt-3 text-sm text-white/55">
                Välj längd på passet. Du får en sammanställning efteråt.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-3">
                {COUNT_OPTIONS.map((n, i) => (
                  <m.button
                    key={n}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 + i * 0.05 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => void startSession(n)}
                    disabled={loading}
                    className="group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/12 bg-white/[0.02] py-7 transition-all hover:border-[#ae2f26]/50 hover:bg-white/[0.04] disabled:opacity-60"
                  >
                    <span
                      className="text-[36px] font-bold leading-none tabular-nums text-[#ae2f26]"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {n}
                    </span>
                    <span className="mt-2 text-xs font-semibold uppercase tracking-wider text-white/45">
                      ord
                    </span>
                  </m.button>
                ))}
              </div>
              {loading && (
                <p className="mt-4 text-center text-sm text-muted-foreground">Förbereder pass…</p>
              )}

              {progress && progress.totalCount > 0 && (
                <div className="mt-6 rounded-2xl border border-[#ae2f26]/20 bg-[#ae2f26]/[0.06] p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold tracking-wide text-[#ae2f26]">
                      Din ord-bank
                    </span>
                    <span className="text-xs font-medium tabular-nums text-muted-foreground">
                      {Math.round((progress.correctCount / progress.totalCount) * 100)}%
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span
                      className="text-4xl font-bold tabular-nums text-[#ae2f26] sm:text-5xl"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {formatInt(progress.correctCount)}
                    </span>
                    <span className="text-xl font-medium tabular-nums text-muted-foreground sm:text-2xl">
                      / {formatInt(progress.totalCount)}
                    </span>
                    <span className="ml-1 text-xs text-muted-foreground">ord rätt besvarade</span>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10 ring-1 ring-[#ae2f26]/20">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#ae2f26] to-[#7a5236] transition-all duration-700"
                      style={{
                        width: `${Math.min(
                          100,
                          (progress.correctCount / progress.totalCount) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                  <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 rounded-lg bg-white/5 px-3 py-2.5">
                    <span className="text-sm font-medium">Filtrera bort ord jag redan kan</span>
                    <input
                      type="checkbox"
                      checked={excludeCorrect}
                      onChange={(e) => setExcludeCorrect(e.target.checked)}
                      disabled={
                        progress.correctCount >= progress.totalCount || progress.correctCount === 0
                      }
                      className="h-5 w-5 rounded border-border accent-[#ae2f26] disabled:opacity-40"
                    />
                  </label>
                  {excludeCorrect && progress.totalCount - progress.correctCount < 10 && (
                    <p className="mt-2 text-xs text-[#ae2f26]">
                      Endast {progress.totalCount - progress.correctCount} ord kvar med detta
                      filter.
                    </p>
                  )}
                </div>
              )}

              {/* Source filter */}
              <div
                className={`mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm ${failedMode ? "opacity-40 pointer-events-none" : ""}`}
              >
                <div className="mb-3 text-sm font-semibold">Vilka ord vill du öva på?</div>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { v: "all", label: "Alla", c: filterCounts?.all },
                      { v: "list", label: "Ordlistan", c: filterCounts?.list },
                      { v: "hp", label: "Gamla HP", c: filterCounts?.hp },
                    ] as const
                  ).map((o) => (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => setSourceFilter(o.v)}
                      className={`rounded-lg border px-3 py-2 text-center text-sm font-medium transition ${
                        sourceFilter === o.v
                          ? "border-[#ae2f26] bg-[#ae2f26] text-[#fff8f5]"
                          : "border-white/10 bg-white/[0.02] hover:bg-white/[0.06]"
                      }`}
                    >
                      <div>{o.label}</div>
                      {o.c != null && (
                        <div className="text-xs opacity-70">{formatInt(o.c)} ord</div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-4 mb-2 text-sm font-semibold">Svårighetsgrad</div>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { d: 1, label: "Lätt", c: filterCounts?.easy, color: "#2d7a52" },
                      { d: 2, label: "Medel", c: filterCounts?.medium, color: "#b88500" },
                      { d: 3, label: "Svår", c: filterCounts?.hard, color: "#a02020" },
                    ] as const
                  ).map((o) => {
                    const active = difficulties.includes(o.d);
                    const disabled = !o.c;
                    return (
                      <button
                        key={o.d}
                        type="button"
                        disabled={disabled}
                        onClick={() => toggleDifficulty(o.d)}
                        className={`rounded-lg border px-3 py-2 text-center text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                          active
                            ? "text-white"
                            : "border-white/10 bg-white/[0.02] hover:bg-white/[0.06]"
                        }`}
                        style={active ? { background: o.color, borderColor: o.color } : undefined}
                      >
                        <div>{o.label}</div>
                        <div className="text-xs opacity-70">{formatInt(o.c ?? 0)} ord</div>
                      </button>
                    );
                  })}
                </div>
                {difficulties.length === 0 &&
                  (filterCounts?.easy ?? 0) +
                    (filterCounts?.medium ?? 0) +
                    (filterCounts?.hard ?? 0) >
                    0 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Inget valt = alla svårighetsgrader
                    </p>
                  )}
              </div>

              {/* Felaktiga ord — spaced repetition */}
              {failedCount != null && failedCount > 0 && (
                <div className="mt-5 overflow-hidden rounded-xl border border-red-500/30 bg-red-500/10">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-red-300">Felaktiga ord</span>
                      <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-bold text-red-200">
                        {failedCount}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFailedMode((v) => !v)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
                        failedMode
                          ? "bg-red-600 text-white"
                          : "border border-red-500/40 bg-transparent text-red-300 hover:bg-red-500/10"
                      }`}
                    >
                      {failedMode ? (
                        <>
                          <Check className="h-3.5 w-3.5" aria-hidden />
                          Aktivt
                        </>
                      ) : (
                        "Öva dessa"
                      )}
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto border-t border-red-500/20">
                    {failedWords.map((w) => {
                      const isDue = new Date(w.next_review_at) <= new Date();
                      return (
                        <div
                          key={w.question_id}
                          className="flex items-center justify-between border-b border-red-500/15 px-4 py-2.5 last:border-0"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-sm font-medium tracking-tight text-[#2e1e14]">
                              {ordText(w.question_text)}
                            </span>
                            <div className="mt-1 flex items-center gap-2">
                              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-red-200">
                                <div
                                  className="h-full rounded-full bg-red-500 transition-all"
                                  style={{ width: `${Math.round((w.review_streak / 5) * 100)}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-muted-foreground tabular-nums">
                                {w.review_streak}/5
                              </span>
                            </div>
                          </div>
                          <div className="ml-3 shrink-0 text-right">
                            {isDue ? (
                              <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                                Klar nu
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">
                                {formatDate(w.next_review_at)}
                              </span>
                            )}
                            <div className="mt-0.5 text-[10px] text-red-400">
                              {w.fail_count}× fel
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-5 border-t border-border pt-4 text-center">
                <Link
                  to="/leaderboard"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  <Trophy className="h-4 w-4" aria-hidden />
                  Se ord-topplistan
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
                <span className="mx-3 text-muted-foreground">·</span>
                <Link
                  to="/guider/ord"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  <BookOpen className="h-4 w-4" aria-hidden />
                  Läs ORD-strategiguiden
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
            </GlassCard>
          </m.div>
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
                className="h-full bg-[#ae2f26] transition-all duration-300"
                style={{ width: `${((idx + (picked ? 1 : 0)) / target) * 100}%` }}
              />
            </div>

            {!current ? (
              <div className="skeleton-shimmer h-80 rounded-2xl" />
            ) : (
              <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm sm:p-8">
                <div className="text-[11px] tracking-wide text-muted-foreground">Synonym till</div>
                <h2
                  className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {ordText(current.question_text)}
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
                        " border-white/10 bg-white/[0.02] hover:border-[#ae2f26]/60 hover:bg-[#ae2f26]/10 cursor-pointer";
                    } else if (isCorrect) {
                      cls += " border-green-500/50 bg-green-500/10 text-green-100";
                    } else if (isPicked) {
                      cls += " border-red-500/50 bg-red-500/10 text-red-100";
                    } else {
                      cls += " border-white/10 bg-white/[0.02] opacity-60";
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
                          <span>{ordText(opt.text)}</span>
                        </span>
                        {showState && isCorrect && <Check className="h-5 w-5 text-green-400" />}
                        {showState && isPicked && !isCorrect && (
                          <X className="h-5 w-5 text-red-400" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {picked && hasOrdDefinition(current.definition) && (
                  <DefinitionBlock
                    word={current.question_text}
                    definition={current.definition}
                    source={current.definition_source}
                  />
                )}

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
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ae2f26]/15 text-[#ae2f26]">
                <Trophy className="h-8 w-8" />
              </div>
              <h2
                className="mt-3 text-3xl font-semibold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {correctCount} av {answered.length} rätt
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{pct}% rätt på passet</p>
            </div>

            <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
              <h3 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground">
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
                          ? "border-green-500/30 bg-green-500/10"
                          : "border-red-500/30 bg-red-500/10"
                      }`}
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-semibold tabular-nums text-muted-foreground">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <div className="font-semibold">{ordText(a.question.question_text)}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          Rätt svar: <strong>{correctOpt ? ordText(correctOpt.text) : "—"}</strong>
                        </div>
                      </div>
                      {a.isCorrect ? (
                        <Check className="h-4 w-4 shrink-0 text-green-400" />
                      ) : (
                        <X className="h-4 w-4 shrink-0 text-red-400" />
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>

            {answered.some((a) => !a.isCorrect) && (
              <p className="mt-4 rounded-lg bg-red-500/10 px-4 py-2.5 text-center text-xs text-red-300">
                {answered.filter((a) => !a.isCorrect).length} ord sparade till "Felaktiga ord" — öva
                dem igen nästa gång
              </p>
            )}

            <NextStep
              primaryLabel={`Kör ${target} till`}
              onPrimary={() => void startSession(target)}
              primaryIcon={<RotateCcw className="h-4 w-4" />}
              forward={[
                { label: "Spela en match", icon: Swords, to: "/matchmaking" },
                { label: "Träna delprov", icon: Target, to: "/train" },
                { label: "Välj annan längd", icon: SlidersHorizontal, onClick: backToSetup },
              ]}
            />
          </section>
        )}
      </main>
    </>
  );
}
