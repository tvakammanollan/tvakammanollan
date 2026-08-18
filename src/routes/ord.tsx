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
import { PrimaryCTA } from "@/components/layout/CTAButtons";

import {
  ArrowRight,
  Check,
  X,
  RotateCcw,
  Trophy,
  BookOpen,
  Swords,
  Target,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import { ordText, ordDefinition, hasOrdDefinition, formatInt } from "@/lib/sv-format";
import { sounds } from "@/lib/sounds";
import { trackEvent } from "@/lib/events";
import {
  fetchWordBatch,
  fetchFailedWordBatch,
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
      title: "Öva ord · 10 000+ HP-ord · HP Kampen",
      description:
        "Träna ordförståelse för Högskoleprovet med 10 000+ riktiga ORD-frågor från tidigare HP. Spaced repetition, ingen tidspress, helt gratis.",
      ogTitle: "Öva ord · 10 000+ HP-ord",
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
        name: "Öva HP-ord · 10 000+ riktiga ORD-frågor",
        description:
          "Träna ordförståelse för Högskoleprovet med 10 000+ riktiga ORD-frågor från tidigare HP. Spaced repetition, ingen tidspress.",
        url: "https://tvakommanollan.se/ord",
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
              className="whitespace-pre-wrap text-[var(--cream)]"
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
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{
    correctCount: number;
    totalCount: number;
    userId: string;
  } | null>(null);
  const [excludeCorrect, setExcludeCorrect] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<"all" | "hp" | "list">("all");
  const [failedCount, setFailedCount] = useState<number | null>(null);
  const [failedWords, setFailedWords] = useState<FailedWordEntry[]>([]);
  const [difficulties, setDifficulties] = useState<number[]>([]);
  // Setupen visar ett förval och en knapp; allt annat ligger bakom Anpassa.
  // Samma mönster som /train.
  const [customising, setCustomising] = useState(false);
  // Vilket läge det pågående passet startades i. `failed_mode` rapporteras
  // både vid start och vid slut, och slut-eventet ligger utanför startSession.
  const [sessionMode, setSessionMode] = useState<"normal" | "repetition">("normal");
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
    void fetchFilterCounts({})
      .then((c) => setFilterCounts(c))
      .catch(() => setFilterCounts(null));
    void fetchFailedCount({})
      .then((r) => setFailedCount(r.count))
      .catch(() => setFailedCount(null));
    void fetchFailedList({})
      .then((r) => setFailedWords(r.words ?? []))
      .catch(() => setFailedWords([]));
    loadProgress();
  }, [fetchFilterCounts, fetchFailedCount, fetchFailedList, loadProgress]);

  const toggleDifficulty = (d: number) => {
    setDifficulties((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const startSession = useCallback(
    async (n: SessionLength, mode: "normal" | "repetition" = "normal") => {
      setTarget(n);
      setSessionMode(mode);
      setLoading(true);
      try {
        let questions: WordQuestion[];
        if (mode === "repetition") {
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
        trackEvent("ord_session_started", {
          count: questions.length,
          failed_mode: mode === "repetition",
          source_filter: sourceFilter,
          difficulty_count: difficulties.length,
        });
      } catch (err) {
        console.error("startSession failed", err);
        alert("Kunde inte ladda frågor – försök igen om en stund.");
      } finally {
        setLoading(false);
      }
    },
    [fetchBatch, fetchFailedBatch, excludeCorrect, progress, sourceFilter, difficulties],
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
      // `answered` fylldes på i onPick, ett klick tidigare — staten har hunnit
      // flushas och listan är komplett här.
      const right = answered.filter((a) => a.isCorrect).length;
      trackEvent("ord_session_completed", {
        answered: answered.length,
        correct: right,
        pct: answered.length > 0 ? Math.round((right / answered.length) * 100) : 0,
        failed_mode: sessionMode === "repetition",
      });
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

  // Läsbar rad som ersätter filterpanelerna när de är hopfällda, så valen syns
  // utan att behöva öppna dem. Motsvarar configSummary i train.tsx.
  const configSummary = (() => {
    const source =
      sourceFilter === "all" ? "alla källor" : sourceFilter === "hp" ? "gamla HP" : "ordlistan";
    const diffNames: Record<number, string> = { 1: "lätt", 2: "medel", 3: "svår" };
    const diff =
      difficulties.length === 0 || difficulties.length === 3
        ? "alla nivåer"
        : difficulties
            .slice()
            .sort()
            .map((d) => diffNames[d])
            .join(", ");
    const filtered = excludeCorrect ? " · utan ord du redan kan" : "";
    return `${target} ord · ${source} · ${diff}${filtered}`;
  })();

  // Ord som är mogna för repetition just nu. Körs vid varje render, till
  // skillnad från listan den ersätter som låg bakom `failedCount > 0` —
  // serverfunktionen svarar 401 för utloggade och kan då ge ett svar utan
  // `words`, så defaulten måste sitta här också.
  const dueCount = (failedWords ?? []).filter(
    (w) => new Date(w.next_review_at) <= new Date(),
  ).length;

  const correctCount = answered.filter((a) => a.isCorrect).length;
  const pct = answered.length > 0 ? Math.round((correctCount / answered.length) * 100) : 0;

  return (
    <>
      <PageHero
        eyebrowTone="leaf"
        eyebrow="10 000+ ord"
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
            {/* Förvalet (10 ord, alla källor, alla nivåer) är redan det de flesta
                vill ha. Framför första ordet låg tidigare tre längdknappar, tre
                källfilter, tre svårighetsknappar, en kryssruta, en lägestoggle
                och hela listan över felade ord. Starta direkt — den som vill
                styra öppnar Anpassa, precis som på /train. */}
            <GlassCard className="p-6 sm:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                Ditt pass
              </p>
              <p className="mt-1.5 text-[15px] text-[var(--cream)]">{configSummary}</p>

              <PrimaryCTA
                onClick={() => void startSession(target)}
                disabled={loading}
                className="mt-4 w-full"
                icon={<ArrowRight className="h-4 w-4" />}
              >
                {loading ? "Förbereder…" : `Öva ${target} ord`}
              </PrimaryCTA>

              <button
                type="button"
                onClick={() => setCustomising((v) => !v)}
                aria-expanded={customising}
                className="mx-auto mt-3 flex items-center gap-1.5 text-sm text-white/55 transition-colors hover:text-[var(--cream)]"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {customising ? "Dölj inställningar" : "Anpassa"}
              </button>
            </GlassCard>

            {/* Repetition — en rad. Var en panel med varje felat ord, dess
                progressbar, nästa repetitionsdatum och felräknare: en
                studiedagbok mitt på en startskärm. */}
            {failedCount != null && failedCount > 0 && (
              <div
                className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 sm:p-5"
                style={{
                  borderColor: "var(--danger-line)",
                  background: "var(--danger-soft)",
                }}
              >
                <p className="text-sm text-[var(--cream)]">
                  <strong className="font-semibold">{formatInt(failedCount)} ord</strong> att
                  repetera
                  {dueCount > 0 && <> — {formatInt(dueCount)} är klara nu</>}
                </p>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void startSession(target, "repetition")}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold transition hover:brightness-110 disabled:opacity-50"
                  style={{ borderColor: "var(--danger-line)", color: "var(--danger)" }}
                >
                  Repetera
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            )}

            {/* ANPASSA — allt som förut låg framme */}
            <div className={`mt-3 ${customising ? "" : "hidden"}`}>
              <GlassCard className="p-5 sm:p-6">
                <SetupRow title="Antal ord">
                  <div className="grid grid-cols-3 gap-2">
                    {COUNT_OPTIONS.map((n) => (
                      <OptionButton key={n} active={target === n} onClick={() => setTarget(n)}>
                        {n} ord
                      </OptionButton>
                    ))}
                  </div>
                </SetupRow>

                <SetupRow title="Källa">
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { v: "all", label: "Alla", c: filterCounts?.all },
                        { v: "list", label: "Ordlistan", c: filterCounts?.list },
                        { v: "hp", label: "Gamla HP", c: filterCounts?.hp },
                      ] as const
                    ).map((o) => (
                      <OptionButton
                        key={o.v}
                        active={sourceFilter === o.v}
                        onClick={() => setSourceFilter(o.v)}
                        hint={o.c != null ? `${formatInt(o.c)} ord` : undefined}
                      >
                        {o.label}
                      </OptionButton>
                    ))}
                  </div>
                </SetupRow>

                <SetupRow title="Svårighetsgrad" hint="Inget valt = alla nivåer">
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { d: 1, label: "Lätt", c: filterCounts?.easy },
                        { d: 2, label: "Medel", c: filterCounts?.medium },
                        { d: 3, label: "Svår", c: filterCounts?.hard },
                      ] as const
                    ).map((o) => (
                      <OptionButton
                        key={o.d}
                        active={difficulties.includes(o.d)}
                        disabled={!o.c}
                        onClick={() => toggleDifficulty(o.d)}
                        hint={`${formatInt(o.c ?? 0)} ord`}
                      >
                        {o.label}
                      </OptionButton>
                    ))}
                  </div>
                </SetupRow>

                {progress && progress.totalCount > 0 && (
                  <SetupRow title="Din ord-bank">
                    <div className="flex items-baseline gap-2">
                      <span
                        className="text-2xl font-bold tabular-nums text-[#ae2f26]"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {formatInt(progress.correctCount)}
                      </span>
                      <span className="text-sm tabular-nums text-white/55">
                        / {formatInt(progress.totalCount)} ord rätt besvarade
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
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
                    <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-lg bg-white/5 px-3 py-2.5">
                      <span className="text-sm font-medium">Filtrera bort ord jag redan kan</span>
                      <input
                        type="checkbox"
                        checked={excludeCorrect}
                        onChange={(e) => setExcludeCorrect(e.target.checked)}
                        disabled={
                          progress.correctCount >= progress.totalCount ||
                          progress.correctCount === 0
                        }
                        className="h-5 w-5 rounded border-border accent-[#ae2f26] disabled:opacity-40"
                      />
                    </label>
                  </SetupRow>
                )}
              </GlassCard>
            </div>
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

/* =====================================================================
   SETUP-HJÄLPARE — en rad per inställning bakom Anpassa.

   Filtren låg tidigare som fristående block med tre olika knappstilar:
   fylld apple för källa, färgkodad bakgrund för svårighet, ram för antal.
   Samma sorts val ska se likadana ut.
   ===================================================================== */
function SetupRow({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5 first:mt-0">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-[var(--cream)]">{title}</span>
        {hint && <span className="text-xs text-white/45">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function OptionButton({
  active,
  disabled,
  onClick,
  hint,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-lg border px-3 py-2 text-center text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "border-[#ae2f26] bg-[#ae2f26]/15 text-[#ae2f26]"
          : "border-white/10 bg-white/[0.02] text-white/80 hover:border-[#ae2f26]/60 hover:text-[var(--cream)]"
      }`}
    >
      <div>{children}</div>
      {hint && <div className="text-xs opacity-70">{hint}</div>}
    </button>
  );
}
