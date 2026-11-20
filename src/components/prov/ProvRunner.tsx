import { Link } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Grid3x3,
  Info,
  ListChecks,
  Pause,
  Play,
  Send,
  Loader2,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useSoundEnabled } from "@/hooks/useSoundEnabled";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CircularTimer } from "@/components/ui/CircularTimer";
import { logProvStart, logUsageEvent } from "@/lib/usage.functions";
import { fetchProvAttempt, saveProvAttempt } from "@/lib/prov-attempts.functions";
import { useAuth } from "@/hooks/useAuth";
import { updateStreak } from "@/lib/streak";
import { trackEvent } from "@/lib/events";
import { allExams, isCorrect } from "@/lib/prov-data";
import { sounds } from "@/lib/sounds";
import { isFreeExam } from "@/lib/prov-access";
import { usePremium, type PremiumState } from "@/hooks/usePremium";
import {
  clearProgress,
  loadProgress,
  saveProgress,
  type ProvMode,
  type ProvProgress,
} from "@/lib/prov-progress";
import { saveResult } from "@/lib/prov-results";
import { clockNow, pauseShift } from "@/lib/pause-clock";
import { formatDateLong, enhet } from "@/lib/sv-format";
import { highlightScope } from "@/lib/highlights";
import { useHighlighter } from "@/hooks/useHighlighter";
import { delprovFull, hasPassage, passKindLabel, type ProvPass } from "@/types/gamla-prov";
import { ProvNavigator } from "./ProvNavigator";
import { ProvPassagePanel } from "./ProvPassagePanel";
import { ProvQuestionCard } from "./ProvQuestionCard";
import type { ProvThreadLink } from "@/lib/forum-prov.functions";
import { ProvResult } from "./ProvResult";
import { ProvFigure } from "./ProvFigure";
import { ProvFacitList } from "./ProvFacitList";
import { ProvLocked } from "./ProvLocked";
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

type Phase = "intro" | "running" | "result";

const LETTERS = ["A", "B", "C", "D", "E"];

/**
 * Skriver ett helt provpass.
 *
 * Två lägen: provläge med originaltiden (55 minuter) och facit först vid
 * inlämning, och övningsläge utan klocka där rätt svar visas direkt. Allt som
 * pågår sparas lokalt, så en omladdning mitt i provet inte kostar fyrtio svar.
 */
export function ProvRunner({
  data,
  nextPass,
  threads = {},
}: {
  data: ProvPass;
  nextPass?: number;
  /** Uppgiftsnummer → genomgångstråd i forumet. */
  threads?: Record<number, ProvThreadLink>;
}) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [mode, setMode] = useState<ProvMode>("prov");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<number[]>([]);
  const [startedAt, setStartedAt] = useState(0);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [submittedAt, setSubmittedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  // Pausen är en tidpunkt, inte en summa: se `pause-clock.ts`. Den sparas med
  // progressen, så ett pausat pass är fortfarande pausat efter en omladdning.
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [showNavigator, setShowNavigator] = useState(false);
  const [resumable, setResumable] = useState<ProvProgress | null>(null);
  // Inlämningen är oåterkallelig — provet rättas och klockan stannar. En
  // felklickad "Lämna in" på uppgift 12 av 40 kostar hela passet.
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Fokusläget döljer sajtens navbar och sidfot medan passet pågår. Valet
  // minns i webbläsaren, så den som vill skriva utan meny slipper välja om
  // för varje pass.
  const [fokus, setFokus] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const questionRef = useRef<HTMLElement>(null);

  const logUsage = useServerFn(logUsageEvent);
  const logStart = useServerFn(logProvStart);
  const saveAttempt = useServerFn(saveProvAttempt);
  const loadAttempt = useServerFn(fetchProvAttempt);
  const loggedRef = useRef(false);
  /** Ett tidigare inlämnat försök ur databasen — genomgången i efterhand. */
  const [savedAttempt, setSavedAttempt] = useState<{
    answers: Record<number, string>;
    mode: ProvMode;
    submittedAt: string;
  } | null>(null);
  // Provpasset ska räknas som dagens aktivitet. Gamla prov fungerar utan
  // konto, så användaren är ofta null — då finns ingen streak att uppdatera.
  const { user } = useAuth();

  // Bara de senaste proven går att skriva utan köp (`prov-access.ts`).
  // Gratisproven frågar aldrig servern.
  const free = isFreeExam(data.term, allExams());
  const premium = usePremium(!free);
  const access: PremiumState = free ? "owned" : premium;

  const questions = data.questions;
  const question = questions[current];
  const total = questions.length;
  const answeredCount = Object.keys(answers).length;
  const revealed = submittedAt !== null || (mode === "ova" && !!answers[question?.nr ?? -1]);

  // Överstrykningarna hör till en enskild lästext, inte till uppgiften — flera
  // uppgifter delar samma text och ska visa samma streck. Hooken ligger här
  // uppe för att panelen renderas i två varianter (mobil/skrivbord) som måste
  // dela tillstånd, och för att hooks inte får ligga efter en tidig retur.
  const highlighter = useHighlighter(
    highlightScope("gamla-prov", data.term, data.pass, question?.passage ?? "ingen"),
    "local",
  );

  /* ── Sparat läge ─────────────────────────────────────────────── */

  useEffect(() => {
    const saved = loadProgress(data.term, data.pass);
    if (saved) setResumable(saved);
  }, [data.term, data.pass]);

  // Ett tidigare inlämnat försök, för den som är inloggad. Progressen i
  // localStorage städas efter en vecka, så utan det här fanns bara poängen
  // kvar när man kom tillbaka till ett prov man skrivit — ingen genomgång.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await loadAttempt({ data: { term: data.term, pass: data.pass } });
        if (cancelled || !res) return;
        const svar: Record<number, string> = {};
        for (const [nr, letter] of Object.entries(res.answers)) svar[Number(nr)] = letter;
        setSavedAttempt({ answers: svar, mode: res.mode, submittedAt: res.submittedAt });
      } catch {
        /* Ett saknat försök är det normala — inget att visa. */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, data.term, data.pass, loadAttempt]);

  const persist = useCallback(
    (next: Partial<ProvProgress>) => {
      if (phase === "intro") return;
      saveProgress(data.term, data.pass, {
        mode,
        answers,
        flagged,
        startedAt,
        endsAt,
        submittedAt,
        pausedAt,
        ...next,
      });
    },
    [data.term, data.pass, phase, mode, answers, flagged, startedAt, endsAt, submittedAt, pausedAt],
  );

  useEffect(() => {
    if (phase !== "intro") persist({});
  }, [phase, persist]);

  /* ── Fokusläge och scroll ─────────────────────────────────────── */

  useEffect(() => {
    try {
      setFokus(window.localStorage.getItem(FOKUS_KEY) === "1");
    } catch {
      /* Blockerad lagring: fokusläget börjar avslaget. */
    }
  }, []);

  const [ljud, setLjud] = useSoundEnabled();

  function toggleFokus() {
    setFokus((on) => {
      const next = !on;
      try {
        window.localStorage.setItem(FOKUS_KEY, next ? "1" : "0");
      } catch {
        /* Valet gäller då bara den här sidvisningen. */
      }
      return next;
    });
  }

  // Bara medan uppgifterna visas. Startvyn och resultatet ska ha menyn kvar,
  // och attributet tas alltid bort när komponenten försvinner.
  useEffect(() => {
    if (phase !== "running" || !fokus) return;
    const root = document.documentElement;
    root.setAttribute("data-fokus", "");
    return () => root.removeAttribute("data-fokus");
  }, [phase, fokus]);

  // Passet startas längst ner i startvyn, och utan det här låg sidan kvar där:
  // på mobil syntes svarsalternativen men inte ordet uppgiften gällde.
  useEffect(() => {
    if (phase === "running") window.scrollTo({ top: 0 });
  }, [phase]);

  // Byte av uppgift med knapparna under kortet: har man skrollat förbi
  // uppgiftens början (lång lästext, långt alternativ) flyttas den upp under
  // passets list igen. Står den redan i bild rör sig ingenting.
  useEffect(() => {
    const card = questionRef.current;
    if (!card) return;
    const listBottom = headerRef.current?.getBoundingClientRect().bottom ?? 0;
    const top = card.getBoundingClientRect().top;
    if (top < listBottom) window.scrollTo({ top: window.scrollY + top - listBottom - 12 });
  }, [current]);

  /* ── Klocka ──────────────────────────────────────────────────── */

  useEffect(() => {
    if (phase !== "running" || pausedAt !== null || submittedAt !== null) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [phase, pausedAt, submittedAt]);

  // Pausat räknas tiden mot pausens början, så klockan står still och passet
  // kan inte lämnas in av sig självt medan det är pausat. Inlämnat står den
  // på inlämningen: genomgången efteråt kör i "running", och en klocka som
  // gick vidare där lämnade in passet en gång till när den nådde noll.
  const remaining = endsAt
    ? Math.max(0, Math.round((endsAt - (submittedAt ?? clockNow(pausedAt, now))) / 1000))
    : null;
  const paused = pausedAt !== null && submittedAt === null;

  function pause() {
    if (submittedAt) return;
    const at = Date.now();
    setNow(at);
    setPausedAt(at);
    setShowNavigator(false);
  }

  function unpause() {
    const at = Date.now();
    const shift = pauseShift(pausedAt, at);
    setStartedAt((s) => s + shift);
    setEndsAt((e) => (e === null ? e : e + shift));
    setPausedAt(null);
    setNow(at);
  }

  const submit = useCallback(() => {
    const at = Date.now();
    sounds.submit();
    setSubmittedAt(at);
    setPhase("result");
    persist({ submittedAt: at });
    window.scrollTo({ top: 0, behavior: "smooth" });

    const score = questions.filter((q) => isCorrect(q, answers[q.nr])).length;
    // Resultatet sparas för sig, inte i progressen: progressen städas efter en
    // vecka, och det som ska stå kvar på provlistan är just det här.
    saveResult(data.term, data.pass, { score, total, kind: data.kind, mode, at });

    if (loggedRef.current) return;
    loggedRef.current = true;
    const meta = {
      term: data.term,
      provpass: data.pass,
      mode,
      score,
      total,
      duration_s: Math.min(6 * 3600, Math.round((at - startedAt) / 1000)),
    };
    void logUsage({ data: { event: "gamla_prov_submit", meta } }).catch(() => {});
    if (user) {
      void updateStreak(user.id);
      // Svaren sparas så att passet går att gå igenom i efterhand, inte bara
      // så länge localStorage råkar finnas kvar. Poängen räknas om på servern
      // — det som skickas är bara vilka bokstäver som valdes.
      const svar: Record<string, string> = {};
      for (const [nr, letter] of Object.entries(answers)) svar[String(nr)] = letter;
      void saveAttempt({
        data: {
          term: data.term,
          pass: data.pass,
          mode,
          answers: svar,
          durationS: meta.duration_s,
        },
      }).catch((e) => console.error("[prov] kunde inte spara försöket:", e));
    }
    // Samma händelse till PostHog, för funnel och retention. Skickas bara om
    // besökaren samtyckt — bryggan i telemetry.ts är en no-op annars.
    trackEvent("gamla_prov_submit", meta);
  }, [
    answers,
    data.kind,
    data.pass,
    data.term,
    logUsage,
    mode,
    persist,
    questions,
    startedAt,
    total,
    user,
    saveAttempt,
  ]);

  useEffect(() => {
    if (phase === "running" && remaining === 0 && submittedAt === null) submit();
  }, [phase, remaining, submit, submittedAt]);

  /* ── Styrning ────────────────────────────────────────────────── */

  const goTo = useCallback(
    (index: number) => {
      setCurrent(Math.max(0, Math.min(total - 1, index)));
      setShowNavigator(false);
    },
    [total],
  );

  const answer = useCallback(
    (letter: string) => {
      if (submittedAt || pausedAt !== null) return;
      // I övningsläge visas facit direkt, så svaret låses när det väl är lagt.
      if (mode === "ova" && answers[questions[current].nr]) return;
      // Ljud för rätt/fel bara i övningsläget. I provläget hade det avslöjat
      // facit innan inlämningen.
      if (mode === "ova") {
        if (isCorrect(questions[current], letter)) sounds.correct();
        else sounds.wrong();
      }
      setAnswers((prev) => {
        const next = { ...prev, [questions[current].nr]: letter };
        saveProgress(data.term, data.pass, {
          mode,
          answers: next,
          flagged,
          startedAt,
          endsAt,
          submittedAt,
          pausedAt: null,
        });
        return next;
      });
    },
    [
      answers,
      current,
      data.pass,
      data.term,
      endsAt,
      flagged,
      mode,
      pausedAt,
      questions,
      startedAt,
      submittedAt,
    ],
  );

  const toggleFlag = useCallback(() => {
    const nr = questions[current].nr;
    setFlagged((prev) => (prev.includes(nr) ? prev.filter((n) => n !== nr) : [...prev, nr]));
  }, [current, questions]);

  useEffect(() => {
    // Pausat är uppgifterna dolda, och då ska tangenterna inte kunna svara.
    if (phase !== "running" || pausedAt !== null) return;
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      // Enter ska aktivera en fokuserad knapp/länk, inte byta uppgift.
      if (e.key === "Enter" && target && ["BUTTON", "A"].includes(target.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();
      const letterIndex = LETTERS.findIndex((l) => l.toLowerCase() === key);
      const digit = Number(key);

      if (letterIndex >= 0) {
        answer(LETTERS[letterIndex]);
      } else if (digit >= 1 && digit <= 5) {
        answer(LETTERS[digit - 1]);
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        goTo(current + 1);
      } else if (e.key === "ArrowLeft") {
        goTo(current - 1);
      } else if (key === "f") {
        toggleFlag();
      } else {
        return;
      }
      e.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer, current, goTo, phase, pausedAt, toggleFlag]);

  /* ── Start ───────────────────────────────────────────────────── */

  function start(nextMode: ProvMode) {
    const at = Date.now();
    setMode(nextMode);
    setAnswers({});
    setFlagged([]);
    setCurrent(0);
    setSubmittedAt(null);
    setStartedAt(at);
    setEndsAt(nextMode === "prov" ? at + data.minutes * 60_000 : null);
    setNow(at);
    setPausedAt(null);
    setResumable(null);
    loggedRef.current = false;
    setPhase("running");
    // Startade pass mot inlämnade pass är avhoppsfrekvensen för gamla prov —
    // tidigare loggades bara inlämningarna, alltså bara de som klarade sig.
    trackEvent("gamla_prov_started", {
      term: data.term,
      provpass: data.pass,
      mode: nextMode,
      resumed: false,
    });
    // Serverspåret. PostHog-händelsen ovan finns bara för den som sagt ja till
    // analys, och gamla prov fungerar utan konto — utan det här vet servern
    // ingenting om sajtens mest använda yta. Aldrig inväntad: ett fel får inte
    // stå mellan någon och ett provpass.
    void logStart({ data: { term: data.term, provpass: data.pass, mode: nextMode } }).catch(
      () => {},
    );
  }

  function resume(saved: ProvProgress) {
    setMode(saved.mode);
    setAnswers(saved.answers);
    setFlagged(saved.flagged);
    setStartedAt(saved.startedAt);
    setEndsAt(saved.endsAt);
    setSubmittedAt(saved.submittedAt);
    setPausedAt(saved.submittedAt ? null : (saved.pausedAt ?? null));
    setNow(Date.now());
    setResumable(null);
    setPhase(saved.submittedAt ? "result" : "running");
    if (!saved.submittedAt) {
      trackEvent("gamla_prov_started", {
        term: data.term,
        provpass: data.pass,
        mode: saved.mode,
        resumed: true,
      });
    }
  }

  /**
   * Öppnar genomgången av ett tidigare inlämnat pass, hämtat ur databasen.
   *
   * Ingen ny inlämning görs och `saveResult` rörs inte — resultatet finns
   * redan. Det som händer är att svaren läggs tillbaka i vyn så att facit kan
   * visas mot dem, precis som direkt efter inlämningen.
   */
  function reviewSaved() {
    if (!savedAttempt) return;
    setMode(savedAttempt.mode);
    setAnswers(savedAttempt.answers);
    setFlagged([]);
    const at = new Date(savedAttempt.submittedAt).getTime();
    setStartedAt(at);
    setEndsAt(null);
    setSubmittedAt(at);
    setPausedAt(null);
    setNow(Date.now());
    setResumable(null);
    setCurrent(0);
    setPhase("result");
  }

  function restart() {
    clearProgress(data.term, data.pass);
    setPhase("intro");
    setResumable(null);
  }

  /* ── Vyer ────────────────────────────────────────────────────── */

  // Ett låst prov visar bara startvyn, vad som än ligger sparat i webbläsaren.
  if (phase === "intro" || access !== "owned") {
    return (
      <ProvIntro
        data={data}
        access={access}
        threads={threads}
        resumable={resumable}
        savedAttempt={savedAttempt}
        onStart={start}
        onResume={resume}
        onReviewSaved={reviewSaved}
        onDiscard={() => {
          clearProgress(data.term, data.pass);
          setResumable(null);
        }}
      />
    );
  }

  if (phase === "result" && submittedAt) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-6 sm:px-6">
        <ProvResult
          data={data}
          answers={answers}
          elapsedSeconds={Math.round((submittedAt - startedAt) / 1000)}
          onReview={(index) => {
            setCurrent(index);
            setPhase("running");
            window.scrollTo({ top: 0 });
          }}
          onRestart={restart}
          nextPass={nextPass}
        />
      </div>
    );
  }

  const passage = question.passage !== undefined ? data.passages[question.passage] : undefined;
  const figure = question.figure !== undefined ? data.figures[question.figure] : undefined;
  const hasPane = !!passage || !!figure;

  return (
    <div className="min-h-screen pb-28">
      {/* Fastnar under sajtens egen navbar (--nav-h, sticky top-0 z-50).
          Täckande botten: halvgenomskinlig syntes uppgiften igenom bakom
          knapparna när man skrollade. */}
      <header
        ref={headerRef}
        className="sticky top-[var(--nav-h)] z-30 border-b border-white/10 bg-[var(--navy)]"
      >
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:px-6">
          <Link
            to="/gamla-prov/$term"
            params={{ term: data.term }}
            aria-label={`Tillbaka till ${data.label.toLowerCase()}`}
            className="-ml-2 inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-1 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--cream)] sm:ml-0 sm:min-w-0 sm:justify-start"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            {/* Under sm bara pilen: listen har fyra knappar till, och på
                320 px trängdes räknaren ihop med dem. */}
            <span className="hidden sm:inline">{data.label}</span>
          </Link>

          <div className="min-w-0 flex-1 text-center">
            {/* Under sm ryms inte rubriken bredvid fyra knappar; den blev
                "Provpa…". Passet står redan i startvyn och i Tillbaka-länkens
                mål, så på telefon räcker räknaren. */}
            <p className="hidden truncate text-xs text-[var(--text-tertiary)] sm:block">
              Provpass {data.pass}: {passKindLabel(data.kind)}
            </p>
            <p className="whitespace-nowrap text-xs tabular-nums text-[var(--cream)]">
              <span className="sm:hidden" aria-hidden="true">
                {answeredCount}/{total}
              </span>
              <span className="sr-only sm:not-sr-only">
                {answeredCount} av {total} besvarade
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleFokus}
              aria-pressed={fokus}
              aria-label={fokus ? "Visa sajtens meny" : "Dölj sajtens meny"}
              title={fokus ? "Visa menyn" : "Dölj menyn"}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:text-[var(--cream)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)] focus-visible:ring-offset-2"
            >
              {fokus ? (
                <Minimize2 className="h-4 w-4" aria-hidden />
              ) : (
                <Maximize2 className="h-4 w-4" aria-hidden />
              )}
            </button>
            {/* Ljudet för rätt och fel finns bara i övningsläget, och utloggade
                har ingen meny att stänga av det i. */}
            {mode === "ova" && (
              <button
                type="button"
                data-sfx="off"
                onClick={() => {
                  setLjud(!ljud);
                  if (!ljud) sounds.ping();
                }}
                aria-pressed={ljud}
                aria-label={ljud ? "Stäng av ljudet" : "Slå på ljudet"}
                title={ljud ? "Stäng av ljudet" : "Slå på ljudet"}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:text-[var(--cream)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)] focus-visible:ring-offset-2"
              >
                {ljud ? (
                  <Volume2 className="h-4 w-4" aria-hidden />
                ) : (
                  <VolumeX className="h-4 w-4" aria-hidden />
                )}
              </button>
            )}
            {remaining !== null ? (
              <CircularTimer totalSeconds={data.minutes * 60} remainingSeconds={remaining} />
            ) : (
              <span className="hidden items-center gap-1.5 text-xs text-[var(--text-tertiary)] sm:inline-flex">
                <Clock className="h-3.5 w-3.5" aria-hidden />
                Övningsläge
              </span>
            )}
            {!submittedAt && (
              <button
                type="button"
                onClick={paused ? unpause : pause}
                aria-label={paused ? "Fortsätt provpasset" : "Pausa provpasset"}
                title={paused ? "Fortsätt" : "Pausa"}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/12 text-[var(--cream)] transition-colors hover:border-[var(--amber)]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)] focus-visible:ring-offset-2"
              >
                {paused ? (
                  <Play className="h-4 w-4" aria-hidden />
                ) : (
                  <Pause className="h-4 w-4" aria-hidden />
                )}
              </button>
            )}
            {!submittedAt && (
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                disabled={paused}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--amber)] px-3.5 py-2 text-xs font-semibold text-[var(--navy)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)] focus-visible:ring-offset-2 disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" aria-hidden />
                Lämna in
              </button>
            )}
            {submittedAt && (
              <button
                type="button"
                onClick={() => setPhase("result")}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3.5 py-2 text-xs font-semibold text-[var(--cream)] transition-colors hover:border-[var(--amber)]/50"
              >
                Resultat
              </button>
            )}
          </div>
        </div>
        <div className="h-0.5 w-full bg-white/[0.06]">
          <div
            className="h-full bg-[var(--amber)]"
            style={{ width: `${((current + 1) / total) * 100}%` }}
          />
        </div>
      </header>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lämna in provpasset?</AlertDialogTitle>
            <AlertDialogDescription>
              {answeredCount < total
                ? `Du har svarat på ${answeredCount} av ${total} uppgifter. De obesvarade räknas som fel.`
                : `Alla ${enhet(total, "uppgift")} är besvarade.`}{" "}
              Efter inlämning rättas passet och det går inte att ändra svaren.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Fortsätt skriva</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false);
                submit();
              }}
            >
              Lämna in
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pausat visas varken uppgift eller lästext. Annars vore pausen
          obegränsad betänketid på uppgiften man står på. */}
      {paused && (
        <div className="mx-auto max-w-md px-4 pt-16 text-center sm:px-6">
          <h2
            className="text-[24px] font-bold text-[var(--cream)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Provpasset är pausat
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
            {remaining !== null
              ? `Klockan står still på ${formatClock(remaining)}. `
              : "Tiden räknas inte. "}
            Uppgifterna är dolda tills du fortsätter, och dina svar är sparade.
          </p>
          <button
            type="button"
            onClick={unpause}
            autoFocus
            className="mt-6 inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full bg-[var(--amber)] px-6 py-2 text-sm font-semibold text-[var(--navy)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)] focus-visible:ring-offset-2"
          >
            Fortsätt
          </button>
        </div>
      )}

      <div className={`mx-auto max-w-6xl px-4 pt-5 sm:px-6 ${paused ? "hidden" : ""}`}>
        <div className={hasPane ? "grid gap-5 lg:grid-cols-12" : ""}>
          {hasPane && (
            <aside className="lg:col-span-5">
              <div className="lg:sticky lg:top-[calc(var(--nav-h)+71px)] lg:max-h-[calc(100vh-var(--nav-h)-89px)] lg:overflow-y-auto">
                {passage && (
                  <>
                    <div className="lg:hidden">
                      <ProvPassagePanel
                        passage={passage}
                        gapNumber={question.cloze ? question.nr : undefined}
                        collapsible
                        highlighter={highlighter}
                      />
                    </div>
                    <div className="hidden lg:block">
                      <ProvPassagePanel
                        passage={passage}
                        gapNumber={question.cloze ? question.nr : undefined}
                        highlighter={highlighter}
                      />
                    </div>
                  </>
                )}
                {figure && (
                  <>
                    <div className="lg:hidden">
                      <ProvFigure
                        src={figure.src}
                        alt={`Diagramunderlag till uppgift ${question.nr}`}
                        label="Diagram ur provhäftet"
                        collapsible
                      />
                    </div>
                    <div className="hidden lg:block">
                      <ProvFigure
                        src={figure.src}
                        alt={`Diagramunderlag till uppgift ${question.nr}`}
                        label="Diagram ur provhäftet"
                      />
                    </div>
                  </>
                )}
              </div>
            </aside>
          )}

          <main
            ref={questionRef}
            className={hasPane ? "min-w-0 lg:col-span-7" : "mx-auto min-w-0 max-w-2xl"}
          >
            <ProvQuestionCard
              question={question}
              index={current}
              total={total}
              answer={answers[question.nr]}
              flagged={flagged.includes(question.nr)}
              revealed={revealed}
              onAnswer={answer}
              onToggleFlag={toggleFlag}
              thread={threads[question.nr]}
            />

            {/* Raden fick inte plats på en telefon: tre knappar med text
                var ~420 px och "Nästa" låg an mot skärmkanten. Under sm är
                Föregående bara en pil och Nästa tar resten av raden, så den
                ryms ned till 320 px utan att något krymper under 44 px. */}
            <div className="mt-4 flex items-center gap-2 sm:justify-between sm:gap-3">
              <button
                type="button"
                onClick={() => goTo(current - 1)}
                disabled={current === 0}
                aria-label="Föregående uppgift"
                className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-1.5 rounded-full border border-white/12 px-3 py-2 text-sm font-medium text-[var(--cream)] transition-colors hover:border-[var(--amber)]/50 disabled:opacity-30 sm:px-4"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Föregående</span>
              </button>
              <button
                type="button"
                onClick={() => setShowNavigator((v) => !v)}
                aria-expanded={showNavigator}
                className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full border border-white/12 px-4 py-2 text-sm font-medium text-[var(--cream)] transition-colors hover:border-[var(--amber)]/50 lg:hidden"
              >
                <Grid3x3 className="h-4 w-4" aria-hidden />
                Översikt
              </button>
              {/* Nästa och Lämna in delar EN plats. Knappen är primär hela
                  vägen: den är det man gör 39 gånger av 40, och en
                  outline-knapp bredvid "Föregående" gav ingen ledtråd om
                  vilken av dem som förde provet framåt. Från sm fast bredd så
                  att raden inte hoppar när texten byts på sista uppgiften;
                  under sm tar den resten av raden, som inte heller ändras. */}
              <div className="flex min-w-0 flex-1 justify-end sm:w-[9.5rem] sm:flex-none">
                {current < total - 1 ? (
                  <button
                    type="button"
                    onClick={() => goTo(current + 1)}
                    className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-full bg-[var(--amber)] px-4 py-2 text-sm font-semibold text-[var(--navy)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)] focus-visible:ring-offset-2 disabled:opacity-40"
                  >
                    Nästa
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={submittedAt ? () => setPhase("result") : () => setConfirmOpen(true)}
                    className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-full bg-[var(--amber)] px-4 py-2 text-sm font-semibold text-[var(--navy)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)] focus-visible:ring-offset-2"
                  >
                    {submittedAt ? "Till resultatet" : "Lämna in"}
                  </button>
                )}
              </div>
            </div>

            <section
              className={`mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5 ${
                showNavigator ? "" : "hidden lg:block"
              }`}
            >
              <ProvNavigator
                questions={questions}
                sections={data.sections}
                current={current}
                answers={answers}
                flagged={flagged}
                revealed={submittedAt !== null}
                onSelect={goTo}
              />
              <p className="mt-4 hidden text-[11px] leading-relaxed text-[var(--text-tertiary)] lg:block">
                Tangentbord: <strong className="text-[var(--text-secondary)]">A–E</strong> svarar,{" "}
                <strong className="text-[var(--text-secondary)]">←/→</strong> byter uppgift,{" "}
                <strong className="text-[var(--text-secondary)]">F</strong> markerar för genomgång.
              </p>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

const FOKUS_KEY = "tkn:prov-fokus";

function formatClock(seconds: number): string {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

/* ── Startvy ───────────────────────────────────────────────────── */

function ProvIntro({
  data,
  access,
  threads,
  resumable,
  savedAttempt,
  onStart,
  onResume,
  onReviewSaved,
  onDiscard,
}: {
  data: ProvPass;
  access: PremiumState;
  threads: Record<number, ProvThreadLink>;
  resumable: ProvProgress | null;
  savedAttempt: { answers: Record<number, string>; mode: ProvMode; submittedAt: string } | null;
  onStart: (mode: ProvMode) => void;
  onResume: (saved: ProvProgress) => void;
  onReviewSaved: () => void;
  onDiscard: () => void;
}) {
  const answered = resumable ? Object.keys(resumable.answers).length : 0;
  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-8 sm:px-6">
      <Link
        to="/gamla-prov/$term"
        params={{ term: data.term }}
        className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--cream)]"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        {data.label}
      </Link>

      <h1
        className="mt-4 text-[32px] font-bold leading-tight text-[var(--cream)] sm:text-[40px]"
        style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
      >
        Provpass {data.pass}
      </h1>
      <p className="mt-2 text-[15px] text-[var(--text-secondary)]">
        {passKindLabel(data.kind)}, {enhet(data.questions.length, "uppgift")}, {data.minutes}{" "}
        minuter
      </p>

      {/* En vanlig lista, inte kort: med ram och bakgrund såg delproven ut
          som knappar, men de går inte att trycka på. Det man trycker på är
          lägesknapparna längre ner. */}
      <dl className="mt-6 grid border-t border-white/10 sm:grid-cols-2 sm:gap-x-6">
        {data.sections.map((s) => (
          <div key={s.code} className="border-b border-white/10 py-3">
            <dt className="text-sm font-semibold text-[var(--cream)]">
              <span className="mr-2 text-[var(--amber)]">{s.code}</span>
              {delprovFull(s.code)}
            </dt>
            <dd className="mt-0.5 text-xs text-[var(--text-tertiary)]">
              {enhet(s.count, "uppgift")}, rekommenderad tid {s.minutes} min
              {hasPassage(s.code) ? ", med lästext" : ""}
            </dd>
          </div>
        ))}
      </dl>

      {data.missing.length > 0 && (
        <p className="mt-4 flex items-start gap-2 rounded-2xl border border-[var(--amber)]/30 bg-[var(--amber)]/[0.06] px-4 py-3 text-xs leading-relaxed text-[var(--text-secondary)]">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--amber)]" aria-hidden />
          <span>
            {data.missing.join(", ")} ingår inte. UHR plockar bort den engelska texten ur provhäftet
            en vecka efter provdagen av upphovsrättsskäl, så uppgifterna finns inte att tillgå.
          </span>
        </p>
      )}

      {access === "loading" ? (
        <div className="mt-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" aria-hidden />
        </div>
      ) : access === "none" ? (
        <ProvLocked label={data.label} />
      ) : (
        <>
          {/* Ett tidigare inlämnat pass. Visas bara när det INTE finns ett
          påbörjat försök i webbläsaren — det senare är färskare och ska
          erbjudas först. */}
          {!resumable && savedAttempt && (
            <section className="mt-6 rounded-2xl border border-[var(--success-line)] bg-[var(--success-soft)] p-5">
              <h2 className="text-sm font-semibold text-[var(--cream)]">
                Du har redan skrivit det här passet
              </h2>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Inlämnat {formatDateLong(savedAttempt.submittedAt)}
                {savedAttempt.mode === "ova" ? " i övningsläge" : ""}. Dina svar finns kvar, så
                genomgången visar vad du svarade och vad som var rätt.
              </p>
              <button
                type="button"
                onClick={onReviewSaved}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--success)] px-4 py-2 text-sm font-semibold text-[var(--success-ink)] transition hover:brightness-110"
              >
                <ListChecks className="h-4 w-4" aria-hidden />
                Se din rättning
              </button>
            </section>
          )}

          {resumable && (
            <section className="mt-6 rounded-2xl border border-[var(--amber)]/40 bg-[var(--amber)]/[0.07] p-5">
              <h2 className="text-sm font-semibold text-[var(--cream)]">
                Du har ett påbörjat försök
              </h2>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                {answered} av {data.questions.length} uppgifter besvarade
                {resumable.submittedAt ? ", redan inlämnat" : resumable.pausedAt ? ", pausat" : ""}.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onResume(resumable)}
                  className="min-h-[44px] rounded-full bg-[var(--amber)] px-4 py-2 text-sm font-semibold text-[var(--navy)] transition hover:brightness-110"
                >
                  {resumable.submittedAt ? "Visa resultatet" : "Fortsätt"}
                </button>
                <button
                  type="button"
                  onClick={onDiscard}
                  className="min-h-[44px] rounded-full border border-white/12 px-4 py-2 text-sm font-medium text-[var(--cream)] transition-colors hover:border-[var(--amber)]/50"
                >
                  Börja om
                </button>
              </div>
            </section>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onStart("prov")}
              className="rounded-2xl border border-[var(--amber)]/40 bg-[var(--amber)]/[0.08] p-5 text-left transition hover:border-[var(--amber)] hover:bg-[var(--amber)]/[0.12]"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-[var(--cream)]">
                <Play className="h-4 w-4 text-[var(--amber)]" aria-hidden />
                Provläge
              </span>
              <span className="mt-1.5 block text-xs leading-relaxed text-[var(--text-secondary)]">
                {data.minutes} minuter, som på provdagen. Facit visas när du lämnar in.
              </span>
            </button>
            <button
              type="button"
              onClick={() => onStart("ova")}
              className="rounded-2xl border border-white/12 bg-white/[0.02] p-5 text-left transition hover:border-[var(--amber)]/50 hover:bg-white/[0.04]"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-[var(--cream)]">
                <ListChecks className="h-4 w-4 text-[var(--teal)]" aria-hidden />
                Övningsläge
              </span>
              <span className="mt-1.5 block text-xs leading-relaxed text-[var(--text-secondary)]">
                Ingen klocka. Rätt svar visas direkt när du svarat, en uppgift i taget.
              </span>
            </button>
          </div>
        </>
      )}

      <p className="mt-6 text-xs text-[var(--text-tertiary)]">
        Uppgifterna kommer från UHR:s publicerade provhäfte.
        {/* Vårprovet 2012 byggdes ur lokala filer, och `source` är då en
            sökväg på importmaskinen. Länken visas bara när den är en adress. */}
        {/^https?:\/\//.test(data.source) && (
          <>
            {" "}
            <a
              href={data.source}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--amber)] underline-offset-2 hover:underline"
            >
              Öppna original-PDF:en
            </a>
          </>
        )}
      </p>

      {/* Innehållet ligger i serverrenderad HTML även hopfällt, så uppgifterna
          är läsbara för sökmotorer utan att begrava startvyn. Listan visas
          också på låsta prov: det är provvyn med klocka och rättning som
          kräver Premium, uppgifterna är UHR:s och finns öppet ändå. */}
      <details className="group mt-10 border-t border-white/8 pt-8">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
          <h2
            className="text-[20px] font-bold text-[var(--cream)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Alla uppgifter med facit
          </h2>
          <ChevronDown
            className="h-5 w-5 shrink-0 text-[var(--text-tertiary)] transition-transform group-open:rotate-180"
            aria-hidden
          />
        </summary>
        <p className="mt-1 text-sm text-[var(--text-tertiary)]">
          Rätt svar är markerat.
          {access === "owned" && " Vill du rätta dig själv i stället, börja med provläge ovan."}
        </p>
        <div className="mt-6">
          <ProvFacitList data={data} threads={threads} />
        </div>
      </details>
    </div>
  );
}
