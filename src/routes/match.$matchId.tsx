import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { submitMatch } from "@/lib/match.functions";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { Clock, LogOut } from "lucide-react";

export const Route = createFileRoute("/match/$matchId")({
  component: MatchPage,
});

const TOTAL_SECONDS = 8 * 60;

const FAKE_NAMES = [
  "linnea_92", "oskarH", "mattevurm", "noa.k", "elsa_w", "viktorL",
  "alicia.s", "hugo_b", "saga.m", "ebba.n", "leo_99", "moa_r",
  "wilmaP", "edvin.t", "felicia_k", "axel.j",
];

function pickFakeName(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return FAKE_NAMES[Math.abs(h) % FAKE_NAMES.length];
}

interface QuestionRow {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  category: string;
  passage_id: string | null;
  passage_text: string | null;
}

interface MatchRow {
  id: string;
  match_type: "verbal" | "math";
  player1_id: string;
  player2_id: string | null;
  is_bot_match: boolean;
  bot_elo: number | null;
  status: string;
  created_at: string;
}

function MatchPage() {
  const { matchId } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const submitFn = useServerFn(submitMatch);

  const [match, setMatch] = useState<MatchRow | null>(null);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [opponentName, setOpponentName] = useState<string>("");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [waitingForOpp, setWaitingForOpp] = useState(false);
  const [oppSecondsLeft, setOppSecondsLeft] = useState(30);
  const [oppProgress, setOppProgress] = useState(0);
  const [reconnecting, setReconnecting] = useState(false);
  const submittedRef = useRef(false);

  // Load match + questions
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    let cancelled = false;
    (async () => {
      const { data: m } = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .maybeSingle();
      if (cancelled) return;
      if (!m) {
        toast.error("Matchen kunde inte hittas");
        navigate({ to: "/" });
        return;
      }
      setMatch(m as MatchRow);

      // Opponent name (hide bot identity)
      if ((m as MatchRow).is_bot_match) {
        setOpponentName(pickFakeName((m as MatchRow).id));
      } else {
        const oppId =
          (m as MatchRow).player1_id === user.id
            ? (m as MatchRow).player2_id
            : (m as MatchRow).player1_id;
        if (oppId) {
          const { data: u } = await supabase
            .from("users")
            .select("username")
            .eq("id", oppId)
            .maybeSingle();
          setOpponentName(u?.username ?? "Motståndare");
        }
      }

      const { data: mq } = await supabase
        .from("match_questions")
        .select("question_order, question_id, questions(*)")
        .eq("match_id", matchId)
        .order("question_order", { ascending: true });

      const qs: QuestionRow[] = (mq ?? [])
        .map((row) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const q = (row as any).questions;
          if (!q) return null;
          const rawOpts = Array.isArray(q.options) ? q.options : [];
          const options: string[] = rawOpts.map((o: unknown) =>
            typeof o === "string"
              ? o
              : o && typeof o === "object" && "text" in (o as Record<string, unknown>)
              ? String((o as { text: unknown }).text)
              : String(o),
          );
          return {
            id: q.id,
            question_text: q.question_text,
            options,
            correct_answer: q.correct_answer,
            category: q.category,
            passage_id: q.passage_id,
            passage_text: q.passage_text,
          } as QuestionRow;
        })
        .filter(Boolean) as QuestionRow[];
      setQuestions(qs);
    })();
    return () => {
      cancelled = true;
    };
  }, [matchId, user, authLoading, navigate]);

  // Timer + fake opponent progress (timer is server-truth: created_at + 480s)
  useEffect(() => {
    if (!match) return;
    const start = new Date(match.created_at).getTime();
    // Deterministic fake opponent: 8 question-jumps with varied delays
    let h = 0;
    for (let i = 0; i < matchId.length; i++) h = (h * 31 + matchId.charCodeAt(i)) | 0;
    const rand = (i: number) => {
      const x = Math.sin(h + i * 9301) * 10000;
      return x - Math.floor(x);
    };
    const perQ = Array.from({ length: 8 }, (_, i) => 18 + Math.floor(rand(i) * 55));
    const cumulative = perQ.reduce<number[]>((acc, t) => {
      acc.push((acc[acc.length - 1] ?? 0) + t);
      return acc;
    }, []);
    const tick = () => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const left = Math.max(0, TOTAL_SECONDS - elapsed);
      setSecondsLeft(left);
      let answered = 0;
      for (const t of cumulative) if (elapsed >= t) answered++;
      setOppProgress(answered / 8);
      if (left === 0 && !submittedRef.current) {
        submittedRef.current = true;
        void doSubmit(true);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match, matchId]);

  const currentQ = questions[current];

  const selectAnswer = async (qId: string, choice: string) => {
    if (!user || !currentQ) return;
    setAnswers((m) => {
      const next = new Map(m);
      next.set(qId, choice);
      return next;
    });
  };

  const persistAnswer = async (qId: string, choice: string | null) => {
    if (!user) return;
    const q = questions.find((x) => x.id === qId);
    if (!q) return;
    const isCorrect = choice !== null && choice === q.correct_answer;
    await supabase
      .from("match_answers")
      .upsert(
        {
          match_id: matchId,
          user_id: user.id,
          question_id: qId,
          selected_answer: choice,
          is_correct: isCorrect,
        },
        { onConflict: "match_id,user_id,question_id" },
      )
      .then(({ error }) => {
        if (error) {
          console.error("answer save failed", error);
        }
      });
  };

  const goNext = async () => {
    if (!currentQ) return;
    const choice = answers.get(currentQ.id);
    if (!choice) return;
    await persistAnswer(currentQ.id, choice);
    setCurrent((i) => Math.min(questions.length - 1, i + 1));
  };

  const doSubmit = async (auto = false) => {
    if (!user) return;
    setSubmitting(true);
    try {
      // Persist current answer if any
      if (currentQ) {
        const c = answers.get(currentQ.id);
        if (c) await persistAnswer(currentQ.id, c);
      }
      // Insert NULL answers for any unanswered questions
      for (const q of questions) {
        if (!answers.has(q.id) && q.id !== currentQ?.id) {
          await persistAnswer(q.id, null);
        } else if (q.id === currentQ?.id && !answers.get(q.id)) {
          await persistAnswer(q.id, null);
        }
      }
      const res = await submitFn({ data: { matchId } });
      // If processed (bot match), go straight to result
      const r = res as { result?: { ok?: boolean; waiting?: boolean } };
      if (r.result?.ok) {
        navigate({ to: "/result/$matchId", params: { matchId } });
      } else {
        // Wait for opponent (private match)
        setWaitingForOpp(true);
      }
      if (auto) toast.info("Tiden är slut – matchen lämnades in automatiskt.");
    } catch (e) {
      console.error(e);
      toast.error("Kunde inte lämna in matchen");
    } finally {
      setSubmitting(false);
    }
  };

  // Wait for opponent (private) — with exponential-backoff reconnect
  useEffect(() => {
    if (!waitingForOpp) return;
    let opp = 30;
    setOppSecondsLeft(opp);

    let attempts = 0;
    let currentChannel: ReturnType<typeof supabase.channel> | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const handleUpdate = (payload: { new: { status?: string } }) => {
      if (payload.new?.status === "finished") {
        navigate({ to: "/result/$matchId", params: { matchId } });
      }
    };

    const connect = () => {
      if (cancelled) return;
      const ch = supabase
        .channel(`match-${matchId}-${attempts}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "matches", filter: `id=eq.${matchId}` },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (p) => handleUpdate(p as any),
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            attempts = 0;
            setReconnecting(false);
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            if (cancelled) return;
            setReconnecting(true);
            if (attempts < 5) {
              const delay = Math.min(16000, 1000 * Math.pow(2, attempts));
              attempts += 1;
              retryTimer = setTimeout(() => {
                void supabase.removeChannel(ch);
                connect();
              }, delay);
            }
          }
        });
      currentChannel = ch;
    };
    connect();

    const id = setInterval(() => {
      opp -= 1;
      setOppSecondsLeft(opp);
      if (opp <= 0) {
        clearInterval(id);
        navigate({ to: "/result/$matchId", params: { matchId } });
      }
    }, 1000);

    return () => {
      cancelled = true;
      clearInterval(id);
      if (retryTimer) clearTimeout(retryTimer);
      if (currentChannel) void supabase.removeChannel(currentChannel);
    };
  }, [waitingForOpp, matchId, navigate]);

  // Show passage above question if applicable, group consecutive same passage_id
  const showPassage = useMemo(() => {
    if (!currentQ?.passage_text) return false;
    const prev = questions[current - 1];
    return !prev || prev.passage_id !== currentQ.passage_id;
  }, [currentQ, current, questions]);

  if (!match || questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Laddar matchen…
      </div>
    );
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const timerLow = secondsLeft < 60;

  if (waitingForOpp) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
        {reconnecting && (
          <div
            className="w-full rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="status"
            aria-live="polite"
          >
            Anslutningen bröts – försöker återansluta…
          </div>
        )}
        <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          Du har lämnat in.
        </h1>
        <p className="text-muted-foreground">
          Motståndaren har {oppSecondsLeft} sekunder kvar att avsluta…
        </p>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${(oppSecondsLeft / 30) * 100}%` }}
          />
        </div>
      </div>
    );
  }

  const choice = answers.get(currentQ.id);
  const optionLetters = ["A", "B", "C", "D", "E"];

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
          <div className="text-sm font-semibold tabular-nums">
            Fråga {current + 1} av {questions.length}
          </div>
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold tabular-nums ${
              timerLow ? "animate-pulse-soft bg-[#c0392b]/15 text-[#c0392b]" : "bg-muted text-foreground"
            }`}
            style={{ fontFamily: "ui-monospace, 'DM Mono', monospace" }}
          >
            <Clock className="h-3.5 w-3.5" />
            {mm}:{ss}
          </div>
          <div className="hidden text-xs text-muted-foreground sm:block">
            Mot: <span className="font-medium text-foreground">{opponentName}</span>
          </div>
        </div>
        {/* Question progress bar */}
        <div className="h-[3px] w-full bg-[#f0ede8]">
          <div
            className="h-full bg-[#1a5c3a] transition-all duration-300 ease-out"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }}
          />
        </div>
        <div className="mx-auto max-w-3xl px-4 pt-2 pb-2">
          <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <span className="truncate">{opponentName || "Motståndare"}</span>
            <span className="tabular-nums">{Math.round(oppProgress * 8)}/8</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary/70 transition-all duration-700"
              style={{ width: `${oppProgress * 100}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto w-full max-w-[720px] flex-1 px-4 py-6">
        {showPassage && currentQ.passage_text && (
          currentQ.category === "DTK" ? (
            <section className="mb-6 rounded-xl border-2 border-secondary/40 bg-secondary/5 p-5 shadow-card">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
                Diagramdata:
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-foreground">
{currentQ.passage_text}
              </pre>
            </section>
          ) : (
            <section className="mb-6 rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Textpassage
              </div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {currentQ.passage_text}
              </div>
            </section>
          )
        )}

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {currentQ.category} · Fråga {current + 1}
          </div>
          <h2 className="mb-5 whitespace-pre-wrap text-lg font-medium leading-snug">
            {currentQ.question_text}
          </h2>
          <div className="grid gap-2" role="radiogroup" aria-label="Svarsalternativ">
            {currentQ.options.map((opt, i) => {
              const letter = optionLetters[i] ?? String(i + 1);
              const isSelected = choice === letter || choice === opt;
              return (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={`Alternativ ${letter}: ${opt}`}
                  onClick={() => selectAnswer(currentQ.id, letter)}
                  className={`flex min-h-[48px] items-start gap-3 rounded-xl border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    isSelected
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="text-sm leading-relaxed">{opt}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <Button
              variant="ghost"
              disabled={current === 0}
              onClick={() => setCurrent((i) => Math.max(0, i - 1))}
            >
              Föregående
            </Button>
            {current < questions.length - 1 ? (
              <Button disabled={!choice} onClick={goNext}>
                Nästa fråga
              </Button>
            ) : (
              <Button
                disabled={!choice || submitting}
                onClick={async () => {
                  if (choice) await persistAnswer(currentQ.id, choice);
                  setConfirmOpen(true);
                }}
              >
                Lämna in svar
              </Button>
            )}
          </div>
        </div>
      </main>

      {/* Bottom bar */}
      <footer className="sticky bottom-0 z-20 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" /> Avbryt
          </Link>
          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={submitting}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Lämna in svar
          </Button>
        </div>
      </footer>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lämna in nu?</AlertDialogTitle>
            <AlertDialogDescription>
              {match.is_bot_match
                ? "Resultatet räknas ut direkt."
                : "Motståndaren får 30 sekunder på sig att avsluta."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false);
                void doSubmit(false);
              }}
            >
              Lämna in
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
