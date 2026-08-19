import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/layout/PageHero";
import { GlassCard } from "@/components/layout/GlassCard";
import { PrimaryCTA } from "@/components/layout/CTAButtons";
import { NextStep } from "@/components/layout/NextStep";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MathText } from "@/components/MathTextLazy";
import { CropView, type Crop } from "@/components/question/CropView";
import { parseStem, parseOptionCrops, type ExamStem } from "@/components/question/examCrops";
import { HighlightableText, HighlighterToggle } from "@/components/HighlightableText";
import { useHighlighter } from "@/hooks/useHighlighter";
import { highlightScope } from "@/lib/highlights";
import { normalizePassageText } from "@/lib/passage-text";
import { sounds } from "@/lib/sounds";
import {
  ArrowRight,
  Check,
  X as XIcon,
  AlertTriangle,
  X,
  BookOpen,
  Sigma,
  Swords,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { ExplanationBlock } from "@/components/ExplanationBlock";
import { ReportQuestionButton } from "@/components/ui/ReportQuestionButton";
import { updateStreak } from "@/lib/streak";
import { trackEvent } from "@/lib/events";
import { displayCategory, ordText } from "@/lib/sv-format";
import { Spinner } from "@/components/ui/Spinner";

export const Route = createFileRoute("/train")({
  component: TrainPage,
  head: () => ({
    meta: pageMeta({
      path: "/train",
      title: "Träna HP · alla 8 delprov utan tidspress · HP Kampen",
      description:
        "Träna inför Högskoleprovet i lugn takt. Välj delprov (ORD, MEK, LÄS, ELF, XYZ, KVA, NOG, DTK), svårighet och antal frågor. Gratis.",
      ogTitle: "Träna HP utan tidspress · HP Kampen",
      ogDescription:
        "Solo-träning för Högskoleprovet. Välj delprov, svårighet och antal frågor. Ingen klocka, gratis.",
    }),
    links: pageLinks("/train"),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Träna HP", path: "/train" },
      ]),
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "Course",
        name: "Träna Högskoleprovet · alla 8 delprov",
        description:
          "Gratis solo-träning inför Högskoleprovet med riktiga frågor i alla åtta delprov: ORD, MEK, LÄS, ELF, XYZ, KVA, NOG och DTK.",
        url: "https://tvakommanollan.se/train",
        inLanguage: "sv-SE",
        isAccessibleForFree: true,
        educationalLevel: "Gymnasium / högskolesökande",
        teaches: [
          "Ordkunskap (ORD)",
          "Meningskomplettering (MEK)",
          "Läsförståelse (LÄS)",
          "Engelsk läsförståelse (ELF)",
          "Matematisk problemlösning (XYZ)",
          "Kvantitativa jämförelser (KVA)",
          "Kvantitativa resonemang (NOG)",
          "Diagram, tabeller och kartor (DTK)",
        ],
        provider: { "@type": "Organization", name: "HP Kampen", url: "https://tvakommanollan.se" },
        offers: { "@type": "Offer", price: "0", priceCurrency: "SEK", category: "Free" },
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "Online",
          courseWorkload: "PT15M",
        },
      }),
    ],
  }),
});

type Track = "verbal" | "math";
// IMPORTANT: keep ASCII "LAS" — matches the DB CHECK constraint på questions.category
// (CHECK (category IN ('ORD','MEK','LAS','ELF','XYZ','KVA','NOG','DTK'))).
// Visa "LÄS" till användaren via displayCategory() (shared helper i sv-format).
const VERBAL_SUBS = ["ORD", "MEK", "LAS", "ELF"] as const;
const MATH_SUBS = ["XYZ", "KVA", "NOG", "DTK"] as const;

interface TrainQuestion {
  id: string;
  question_text: string;
  options: string[];
  category: string;
  passage_id: string | null;
  passage_text: string | null;
  image_url: string | null;
  correct_answer: string;
  explanation: string | null;
  difficulty: number | null;
  /** Bilduppgifter ur arkivet: var stammen och alternativen sitter i bilden. */
  stem: ExamStem | null;
  optionCrops: Crop[] | null;
}

interface TrainConfig {
  track: Track;
  subs: string[];
  difficulty: number | null; // null = all
  count: number;
}

type Phase = "setup" | "loading" | "session" | "result";

function TrainPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("setup");
  const [config, setConfig] = useState<TrainConfig>({
    track: "verbal",
    subs: [...VERBAL_SUBS],
    difficulty: null,
    count: 10,
  });
  const [customising, setCustomising] = useState(false);
  const [questions, setQuestions] = useState<TrainQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  // Tid per fråga → time_spent_seconds på tränings-svar (aktiv tid-statistik).
  const questionShownAtRef = useRef(Date.now());
  useEffect(() => {
    questionShownAtRef.current = Date.now();
  }, [current, questions]);
  const questionSeconds = () =>
    Math.min(1800, Math.max(0, Math.round((Date.now() - questionShownAtRef.current) / 1000)));
  const [results, setResults] = useState<
    {
      qId: string;
      category: string;
      selected: string | null;
      correct: string;
      isCorrect: boolean;
    }[]
  >([]);
  const [startedAt, setStartedAt] = useState<number>(0);
  const [endedAt, setEndedAt] = useState<number>(0);
  const [exitOpen, setExitOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  // Reset when track changes
  const setTrack = (t: Track) => {
    setConfig((c) => ({
      ...c,
      track: t,
      subs: t === "verbal" ? [...VERBAL_SUBS] : [...MATH_SUBS],
    }));
  };

  const toggleSub = (sub: string) => {
    setConfig((c) => {
      const has = c.subs.includes(sub);
      const next = has ? c.subs.filter((s) => s !== sub) : [...c.subs, sub];
      return { ...c, subs: next };
    });
  };

  const startTraining = async () => {
    if (config.subs.length === 0) {
      toast.error("Välj minst ett delprov");
      return;
    }
    setPhase("loading");
    let q = supabase
      .from("questions")
      .select(
        "id, category, question_text, options, passage_id, passage_text, image_url, image_caption, correct_answer, explanation, difficulty, cleaned_question_text, cleaned_options, clean_status",
      )
      .in("category", config.subs);
    // Matte hämtas bara i städat skick, precis som i match.server.ts. Utan den
    // här raden serverade Träna de råaste uppgifterna av alla: en tredjedel av
    // de skrapade matteraderna bär nästa uppgifts text i sista alternativet.
    if (config.track === "math") {
      q = q.eq("clean_status", "ok");
    }
    if (config.difficulty !== null) {
      q = q.eq("difficulty", config.difficulty);
    }
    // Pull a wider pool then shuffle client-side.
    // try/catch: en kastad nätverksexception (inte bara {error}) får inte
    // lämna kvar "loading"-fasen som en evig spinner.
    let data: Awaited<ReturnType<typeof q.limit>>["data"];
    let error: Awaited<ReturnType<typeof q.limit>>["error"];
    try {
      ({ data, error } = await q.limit(300));
    } catch (e) {
      console.error("[train] question fetch threw", e);
      toast.error("Kunde inte hämta frågor", {
        description: "Kontrollera din uppkoppling och försök igen.",
      });
      setPhase("setup");
      return;
    }
    if (error) {
      toast.error("Kunde inte hämta frågor", {
        description: "Försök igen om en stund eller ladda om sidan.",
      });
      setPhase("setup");
      return;
    }
    if (!data || data.length === 0) {
      // Mer hjälpsam feedback — användaren har troligen filtrerat för hårt
      toast.error("Inga frågor matchade dina filter", {
        description:
          config.difficulty !== null
            ? "Prova att välja 'Alla' svårighetsgrader, eller välj fler delprov."
            : "Prova att välja fler delprov eller en annan match-typ.",
      });
      setPhase("setup");
      return;
    }
    // Shuffle
    const pool = [...data].sort(() => Math.random() - 0.5).slice(0, config.count);
    // Visa varning om vi inte fick så många som användaren bad om
    if (pool.length < config.count) {
      toast.warning(
        `Bara ${pool.length} frågor matchade — kör med dem istället för ${config.count}`,
      );
    }
    const mapped: TrainQuestion[] = pool.map((q) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row = q as any;
      const isMath = MATH_SUBS.includes(row.category);
      const useCleaned = isMath && row.clean_status === "ok" && row.cleaned_question_text;
      const rawOpts = useCleaned
        ? Array.isArray(row.cleaned_options)
          ? row.cleaned_options
          : []
        : Array.isArray(row.options)
          ? row.options
          : [];
      const options: string[] = rawOpts.map((o: unknown) =>
        typeof o === "string"
          ? o
          : o && typeof o === "object" && "text" in (o as Record<string, unknown>)
            ? String((o as { text: unknown }).text)
            : String(o),
      );
      return {
        id: row.id,
        question_text: useCleaned ? row.cleaned_question_text : row.question_text,
        options,
        category: row.category,
        passage_id: row.passage_id,
        passage_text: row.passage_text,
        image_url: row.image_url ?? null,
        // Beskärningarna gäller uppgiftens eget utsnitt. Den städade texten är
        // en annan uppgift än den bilden visar, så de två får aldrig blandas.
        stem: useCleaned ? null : parseStem(row.image_caption),
        optionCrops: useCleaned ? null : parseOptionCrops(row.options),
        correct_answer: row.correct_answer,
        explanation: row.explanation,
        difficulty: row.difficulty,
      };
    });
    setQuestions(mapped);
    setCurrent(0);
    setSelected(null);
    setRevealed(false);
    setResults([]);
    setStartedAt(Date.now());
    setPhase("session");
    // Först här — allt ovanför kan falla tillbaka till setup, och ett pass som
    // aldrig startade ska inte räknas som startat.
    trackEvent("training_started", {
      track: config.track,
      subs: [...config.subs].sort().join(","),
      sub_count: config.subs.length,
      count: mapped.length,
      difficulty: config.difficulty,
    });
  };

  const restartSame = () => {
    void startTraining();
  };

  // Läsbar rad som ersätter de fyra stegkorten när de är ihopvikta, så
  // valen syns utan att behöva öppna dem.
  const configSummary = (() => {
    const all = config.track === "verbal" ? VERBAL_SUBS : MATH_SUBS;
    const subs =
      config.subs.length === 0
        ? "inget delprov valt"
        : config.subs.length === all.length
          ? "alla delprov"
          : config.subs.map((s) => displayCategory(s)).join(", ");
    const diff = config.difficulty === null ? "alla nivåer" : `nivå ${config.difficulty}`;
    return `${config.track === "verbal" ? "Svenska" : "Matte"} · ${subs} · ${diff} · ${config.count} frågor`;
  })();

  const currentQ = questions[current];
  const optionLetters = ["A", "B", "C", "D", "E"];

  const handleSelect = (letter: string) => {
    if (revealed || !currentQ) return;
    const isCorrect = letter === currentQ.correct_answer;
    sounds.ping();
    setSelected(letter);
    setRevealed(true);
    setResults((r) => [
      ...r,
      {
        qId: currentQ.id,
        category: currentQ.category,
        selected: letter,
        correct: currentQ.correct_answer,
        isCorrect,
      },
    ]);
    // Persist (best-effort, don't block UI)
    if (user) {
      void supabase.from("match_answers").insert({
        match_id: null,
        user_id: user.id,
        question_id: currentQ.id,
        selected_answer: letter,
        is_correct: isCorrect,
        is_training: true,
        difficulty: currentQ.difficulty,
        time_spent_seconds: questionSeconds(),
      });
    }
  };

  const handleSkip = () => {
    if (!currentQ) return;
    setResults((r) => [
      ...r,
      {
        qId: currentQ.id,
        category: currentQ.category,
        selected: null,
        correct: currentQ.correct_answer,
        isCorrect: false,
      },
    ]);
    if (user) {
      void supabase.from("match_answers").insert({
        match_id: null,
        user_id: user.id,
        question_id: currentQ.id,
        selected_answer: null,
        is_correct: false,
        is_training: true,
        difficulty: currentQ.difficulty,
        time_spent_seconds: questionSeconds(),
      });
    }
    goNext(true);
  };

  const goNext = (skipping = false) => {
    if (!skipping && !revealed) return;
    if (current >= questions.length - 1) {
      const at = Date.now();
      setEndedAt(at);
      setPhase("result");
      // handleSkip anropar setResults och goNext i samma händelse, så `results`
      // saknar då sista raden. Efter ett besvarat svar har staten hunnit
      // flushas och listan är komplett. Ett överhoppat svar är aldrig rätt.
      const answered = results.length + (skipping ? 1 : 0);
      const correct = results.filter((r) => r.isCorrect).length;
      trackEvent("training_completed", {
        track: config.track,
        answered,
        correct,
        pct: answered > 0 ? Math.round((correct / answered) * 100) : 0,
        duration_s: Math.max(0, Math.round((at - startedAt) / 1000)),
      });
      if (user) void updateStreak(user.id);
      return;
    }
    setCurrent((i) => i + 1);
    setSelected(null);
    setRevealed(false);
  };

  const showPassage = useMemo(() => {
    if (!currentQ?.passage_text) return false;
    const prev = questions[current - 1];
    return !prev || prev.passage_id !== currentQ.passage_id;
  }, [currentQ, current, questions]);

  // Lästexten kommer som ett fält med radbrytningar; styckena blir egna
  // element så att en överstrykning alltid hör till en känd textbit. Samtidigt
  // städas de brutna orden och spaltbrytningarna ur PDF:en — lib/passage-text.ts.
  const passageParagraphs = useMemo(
    () => normalizePassageText(currentQ?.passage_text),
    [currentQ?.passage_text],
  );

  // Markeringarna följer lästexten, inte frågan — samma text ska visa samma
  // streck oavsett vilken av dess frågor man står på.
  const passageHighlighter = useHighlighter(
    highlightScope("train", currentQ?.passage_id ?? currentQ?.id ?? "ingen"),
  );

  // ============ SETUP ============
  if (phase === "setup") {
    return (
      <div className="min-h-screen">
        <PageHero
          eyebrow="Lugn takt"
          title="Träna"
          cycleWords={["ORD.", "MEK.", "LÄS.", "ELF.", "XYZ.", "KVA.", "NOG.", "DTK."]}
          subtitle="Ingen timer, inga motståndare. Bara du och frågorna."
          align="center"
          variant="compact"
        />

        <div className="mx-auto max-w-2xl px-4 pb-20 sm:px-6">
          {/* Defaultkonfigurationen (svenska, alla delprov, alla nivåer, 10
              frågor) är redan den de flesta vill ha, så fyra obligatoriska
              stegkort innan första frågan var ren friktion. Starta direkt —
              den som vill styra öppnar Anpassa. */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-sm sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
              Ditt pass
            </p>
            <p className="mt-1.5 text-[15px] text-[var(--cream)]">{configSummary}</p>

            <PrimaryCTA
              onClick={startTraining}
              disabled={config.subs.length === 0}
              className="mt-4 w-full"
              icon={<ArrowRight className="h-4 w-4" />}
            >
              Starta träning
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
          </div>

          <div className={`space-y-5 ${customising ? "mt-5" : "hidden"}`}>
            <SetupCard step="1" title="Välj ämne">
              <div className="grid grid-cols-2 gap-3">
                <TrackCard
                  active={config.track === "verbal"}
                  onClick={() => setTrack("verbal")}
                  icon={BookOpen}
                  label="Svenska"
                  hint="Ord · Mek · Läs · Elf"
                />
                <TrackCard
                  active={config.track === "math"}
                  onClick={() => setTrack("math")}
                  icon={Sigma}
                  label="Matte"
                  hint="Xyz · Kva · Nog · Dtk"
                />
              </div>
            </SetupCard>

            <SetupCard step="2" title="Välj delprov">
              <div className="flex flex-wrap gap-2">
                {(config.track === "verbal" ? VERBAL_SUBS : MATH_SUBS).map((sub) => {
                  const active = config.subs.includes(sub);
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => toggleSub(sub)}
                      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                        active
                          ? "border-[#ae2f26] bg-[#ae2f26] text-[#fff8f5]"
                          : "border-white/15 bg-white/[0.03] text-white/80 hover:border-[#ae2f26]/60 hover:text-white"
                      }`}
                    >
                      {displayCategory(sub)}
                    </button>
                  );
                })}
              </div>
              {config.subs.length === 0 && (
                <p className="mt-2 text-xs text-[#8c1d18]">Välj minst ett delprov</p>
              )}
            </SetupCard>

            <SetupCard step="3" title="Välj svårighetsgrad">
              <div className="flex flex-wrap gap-2">
                <DifficultyBtn
                  active={config.difficulty === null}
                  label="Alla"
                  onClick={() => setConfig((c) => ({ ...c, difficulty: null }))}
                />
                {[1, 2, 3, 4, 5].map((d) => (
                  <DifficultyBtn
                    key={d}
                    active={config.difficulty === d}
                    label={String(d)}
                    onClick={() => setConfig((c) => ({ ...c, difficulty: d }))}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-white/50">
                {config.difficulty === null
                  ? "Alla nivåer"
                  : config.difficulty === 1
                    ? "Lätt"
                    : config.difficulty === 5
                      ? "Avancerat"
                      : `Nivå ${config.difficulty}`}
              </p>
            </SetupCard>

            <SetupCard step="4" title="Antal frågor">
              <div className="grid grid-cols-3 gap-2">
                {[5, 10, 20].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setConfig((c) => ({ ...c, count: n }))}
                    className={`rounded-xl border px-3 py-3 text-center font-medium transition ${
                      config.count === n
                        ? "border-[#ae2f26] bg-[#ae2f26]/10 text-[#ae2f26]"
                        : "border-white/15 bg-white/[0.03] text-white/80 hover:border-[#ae2f26]/60"
                    }`}
                  >
                    {n} frågor
                  </button>
                ))}
              </div>
            </SetupCard>
          </div>
        </div>
      </div>
    );
  }

  // ============ LOADING ============
  if (phase === "loading") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12" aria-busy="true">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm sm:p-10">
          <div className="flex flex-col items-center text-center">
            <Spinner size="lg" />
            <p className="mt-4 text-base font-medium text-foreground">Laddar frågor…</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Plockar fram en uppsättning som matchar dina inställningar.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============ SESSION ============
  if (phase === "session" && currentQ) {
    const isMath = MATH_SUBS.includes(currentQ.category as (typeof MATH_SUBS)[number]);
    return (
      <div className="flex min-h-screen flex-col bg-background">
        {/* Top bar */}
        <header
          className="sticky top-0 z-20 border-b border-border"
          style={{
            background: "rgba(251, 246, 236,0.85)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 pt-3 pb-2">
            <div
              className="text-sm text-muted-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Träning
            </div>
            <div className="text-sm font-semibold tabular-nums">
              Fråga {current + 1} av {questions.length}
            </div>
            <button
              type="button"
              onClick={() => setExitOpen(true)}
              aria-label="Avsluta träning"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mx-auto max-w-3xl px-4 pb-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-[#ae2f26] transition-all duration-500 ease-out"
                style={{ width: `${((current + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[720px] flex-1 px-4 py-6">
          {showPassage && currentQ.passage_text && (
            <section className="mb-6 rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="text-xs font-semibold tracking-wide text-muted-foreground">
                  Textpassage
                </div>
                <HighlighterToggle highlighter={passageHighlighter} />
              </div>
              <HighlightableText
                paragraphs={passageParagraphs}
                highlighter={passageHighlighter}
                className="space-y-3"
                paragraphClassName="whitespace-pre-wrap text-sm leading-relaxed text-foreground"
              />
            </section>
          )}

          <div
            key={currentQ.id}
            className="animate-slide-in rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm sm:p-6"
            style={{ boxShadow: "var(--shadow-md)" }}
          >
            <div className="mb-2 text-xs font-semibold tracking-wide text-[#ae2f26]">
              {displayCategory(currentQ.category)} · Fråga {current + 1}
            </div>
            <h2
              className="mb-5 whitespace-pre-wrap text-lg font-semibold leading-relaxed sm:text-xl"
              style={{ fontFamily: "var(--font-display)", lineHeight: 1.5 }}
            >
              {isMath ? (
                <MathText>{currentQ.question_text}</MathText>
              ) : currentQ.category === "ORD" ? (
                ordText(currentQ.question_text)
              ) : (
                currentQ.question_text
              )}
            </h2>
            {currentQ.image_url && (
              <div className="mb-5 overflow-hidden rounded-xl border border-border">
                {currentQ.stem ? (
                  <CropView
                    src={currentQ.image_url}
                    crop={currentQ.stem.stem}
                    imageAspect={currentQ.stem.aspect}
                    alt="Uppgiften ur provhäftet"
                    className="w-full"
                  />
                ) : (
                  <img
                    src={currentQ.image_url}
                    alt="Figur till frågan"
                    decoding="async"
                    className="w-full object-contain"
                  />
                )}
              </div>
            )}
            <div className="grid gap-2" role="radiogroup">
              {currentQ.options.map((opt, i) => {
                const letter = optionLetters[i] ?? String(i + 1);
                const isSelected = selected === letter;
                const isCorrectOpt = revealed && letter === currentQ.correct_answer;
                const isWrongPick = revealed && isSelected && letter !== currentQ.correct_answer;
                // Rätt = grönt, fel = rött, valt = amber. Tidigare färgades
                // rätt svar solid amber — exakt samma ton som "valt", så efter
                // rättning gick de två lägena inte att skilja åt.
                let cls =
                  "border border-white/10 bg-white/[0.02] hover:border-[#ae2f26]/60 hover:bg-[#ae2f26]/10";
                if (isCorrectOpt) {
                  cls =
                    "border-2 border-[var(--success-line)] bg-[var(--success-soft)] text-foreground";
                } else if (isWrongPick) {
                  cls =
                    "border-2 border-[var(--danger-line)] bg-[var(--danger-soft)] text-foreground";
                } else if (isSelected) {
                  cls = "border-2 border-[#ae2f26] bg-[#ae2f26]/15";
                }
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={revealed}
                    onClick={() => handleSelect(letter)}
                    className={`flex min-h-[52px] items-start gap-3 rounded-xl px-4 py-3 text-left transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ae2f26] focus-visible:ring-offset-2 disabled:cursor-default ${cls}`}
                  >
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${
                        isCorrectOpt
                          ? "bg-[var(--success)] text-[var(--success-ink)]"
                          : isWrongPick
                            ? "bg-[var(--danger)] text-[#fff1f0]"
                            : isSelected
                              ? "bg-[#ae2f26] text-[#fff8f5]"
                              : "bg-white/10 text-foreground"
                      }`}
                    >
                      {isCorrectOpt ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : isWrongPick ? (
                        <XIcon className="h-3.5 w-3.5" />
                      ) : (
                        letter
                      )}
                    </span>
                    <span
                      className={`min-w-0 flex-1 leading-relaxed ${isMath ? "text-base" : "text-sm"}`}
                    >
                      {currentQ.optionCrops && currentQ.image_url ? (
                        <CropView
                          src={currentQ.image_url}
                          crop={currentQ.optionCrops[i]}
                          imageAspect={currentQ.stem?.aspect ?? 1}
                          alt={`Svarsalternativ ${letter}`}
                        />
                      ) : isMath ? (
                        <MathText>{opt}</MathText>
                      ) : currentQ.category === "ORD" ? (
                        ordText(opt)
                      ) : (
                        opt
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            {revealed && (
              <>
                <ExplanationBlock explanation={currentQ.explanation} />
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

            {/* Action */}
            <div className="mt-5 flex flex-col gap-3">
              {revealed ? (
                <Button
                  onClick={() => goNext(false)}
                  className="w-full bg-[#ae2f26] py-5 text-base text-[#fff8f5] hover:bg-[#8f2620]"
                >
                  {current >= questions.length - 1 ? "Visa resultat" : "Nästa fråga"}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              ) : (
                <button
                  type="button"
                  onClick={handleSkip}
                  className="self-center text-xs text-muted-foreground hover:text-foreground"
                >
                  Hoppa över denna fråga
                </button>
              )}
            </div>
          </div>
        </main>

        <AlertDialog open={exitOpen} onOpenChange={setExitOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Avsluta träningen?</AlertDialogTitle>
              <AlertDialogDescription>
                Dina svar hittills sparas, men du avbryter passet.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Fortsätt träna</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setExitOpen(false);
                  trackEvent("training_abandoned", {
                    track: config.track,
                    answered: results.length,
                    total: questions.length,
                  });
                  navigate({ to: "/" });
                }}
              >
                Avsluta
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // ============ RESULT ============
  if (phase === "result") {
    const total = results.length;
    const correct = results.filter((r) => r.isCorrect).length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const seconds = Math.max(0, Math.round((endedAt - startedAt) / 1000));
    const mm = Math.floor(seconds / 60);
    const ss = seconds % 60;

    // Breakdown per category
    const byCat = results.reduce<Record<string, { c: number; t: number }>>((acc, r) => {
      acc[r.category] = acc[r.category] ?? { c: 0, t: 0 };
      acc[r.category].t += 1;
      if (r.isCorrect) acc[r.category].c += 1;
      return acc;
    }, {});

    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:py-20">
        <header className="text-center">
          <h1
            className="text-[36px] font-bold leading-tight text-white sm:text-[44px]"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.025em" }}
          >
            Träningspass klart
          </h1>
        </header>

        <GlassCard className="mt-8 p-8">
          <div className="text-center">
            <div
              className="text-6xl font-bold tabular-nums text-[#ae2f26]"
              style={{ fontFamily: "var(--font-mono, 'DM Mono', monospace)" }}
            >
              {correct}
              <span className="text-3xl text-white/45">/{total}</span>
            </div>
            <div className="mt-2 text-lg font-medium text-white">{pct}% rätt</div>
            <div className="mt-1 text-sm text-white/55">
              Tid: {mm} min {ss} sek
            </div>
          </div>

          {Object.keys(byCat).length > 1 && (
            <div className="mt-6 border-t border-white/10 pt-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/45">
                Per delprov
              </div>
              <div className="grid gap-2">
                {Object.entries(byCat).map(([cat, v]) => (
                  <div
                    key={cat}
                    className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2"
                  >
                    <span className="font-medium text-white">{displayCategory(cat)}</span>
                    <span className="tabular-nums text-white/85">
                      {v.c}/{v.t}{" "}
                      {v.c === v.t ? (
                        <Check className="ml-1 inline h-4 w-4 text-[#ae2f26]" />
                      ) : v.c === 0 ? (
                        <XIcon className="ml-1 inline h-4 w-4 text-[#8c1d18]" />
                      ) : (
                        <AlertTriangle className="ml-1 inline h-4 w-4 text-[#ae2f26]/70" />
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </GlassCard>

        <NextStep
          primaryLabel="Träna igen"
          onPrimary={restartSame}
          forward={[
            { label: "Spela en match", icon: Swords, to: "/matchmaking" },
            { label: "Plugga ord", icon: BookOpen, to: "/ord" },
            {
              label: "Ändra inställningar",
              icon: SlidersHorizontal,
              onClick: () => {
                setPhase("setup");
                setCustomising(true);
                setQuestions([]);
                setResults([]);
              },
            },
          ]}
        />
      </div>
    );
  }

  return null;
}

function SetupCard({
  step,
  title,
  children,
}: {
  step: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <GlassCard className="p-5">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ae2f26]/15 text-[12px] font-bold text-[#ae2f26]">
          {step}
        </span>
        <h2 className="text-[15px] font-semibold text-white">{title}</h2>
      </div>
      {children}
    </GlassCard>
  );
}

function TrackCard({
  active,
  onClick,
  icon: Icon,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        active
          ? "border-[#ae2f26] bg-[#ae2f26]/10"
          : "border-white/12 bg-white/[0.02] hover:border-[#ae2f26]/50"
      }`}
    >
      <Icon className="h-7 w-7 text-[#ae2f26]" strokeWidth={1.5} aria-hidden />
      <div className="mt-2 text-lg font-semibold text-white">{label}</div>
      <div className="text-xs text-white/55">{hint}</div>
    </button>
  );
}

function DifficultyBtn({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-[48px] rounded-lg border px-3 py-2 text-sm font-medium transition ${
        active
          ? "border-[#ae2f26] bg-[#ae2f26] text-[#fff8f5]"
          : "border-white/15 bg-white/[0.03] text-white/80 hover:border-[#ae2f26]/60"
      }`}
    >
      {label}
    </button>
  );
}
