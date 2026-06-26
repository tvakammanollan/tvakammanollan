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
import { motion } from "framer-motion";
import { displayCategory } from "@/lib/sv-format";
import { LogOut, Trophy } from "lucide-react";
import { CircularTimer, TimerSoundToggle } from "@/components/ui/CircularTimer";
import { MathText } from "@/components/MathTextLazy";
import { sounds } from "@/lib/sounds";
import { updateStreak } from "@/lib/streak";
import { PassagePane } from "@/components/PassagePane";
import { getBotName } from "@/lib/bot";

export const Route = createFileRoute("/match/$matchId")({
  component: MatchPage,
  head: () => ({
    meta: [
      { title: "Match · HP Kampen" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});


const TOTAL_SECONDS = 5 * 60;

const FAKE_NAMES = [
  "linnea_92",
  "oskarH",
  "mattevurm",
  "noa.k",
  "elsa_w",
  "viktorL",
  "alicia.s",
  "hugo_b",
  "saga.m",
  "ebba.n",
  "leo_99",
  "moa_r",
  "wilmaP",
  "edvin.t",
  "felicia_k",
  "axel.j",
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
  category: string;
  passage_id: string | null;
  passage_text: string | null;
  image_url: string | null;
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
  // Tracks the real game-start time. For invite matches this is when player2
  // accepts (not when the match was created), so the 5-min clock is fair.
  const [matchStartedAt, setMatchStartedAt] = useState<Date | null>(null);
  // Incremented when a waiting match becomes active (invite accepted) to trigger
  // a full re-fetch of match + questions without requiring a page refresh.
  const [reloadTick, setReloadTick] = useState(0);
  // Ref so the channel listener doesn't need oppForceCountdown in its deps.
  const oppForceStartedRef = useRef(false);
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [waitingForOpp, setWaitingForOpp] = useState(false);
  const [oppSecondsLeft, setOppSecondsLeft] = useState(30);
  const [oppProgress, setOppProgress] = useState(0);
  const [reconnecting, setReconnecting] = useState(false);
  const submittedRef = useRef(false);
  const [questionStartTime, setQuestionStartTime] = useState<Date>(new Date());
  const answerTimesRef = useRef<Record<string, number>>({});
  // En enda delad progress-kanal (undvik dubbla prenumerationer + om-prenumeration per fråga).
  const progressChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const questionsCountRef = useRef(0);
  useEffect(() => {
    questionsCountRef.current = questions.length;
  }, [questions.length]);

  // Reset question timer when current changes
  useEffect(() => {
    setQuestionStartTime(new Date());
  }, [current]);

  // Persist active match progress to sessionStorage so we can resume after reload.
  useEffect(() => {
    if (!match || questions.length === 0) return;
    try {
      sessionStorage.setItem(
        "active_match",
        JSON.stringify({
          matchId,
          currentQuestionIndex: current,
          answers: Object.fromEntries(answers),
          matchType: match.match_type,
          createdAt: match.created_at,
          savedAt: new Date().toISOString(),
        }),
      );
    } catch {
      /* ignore quota errors */
    }
  }, [matchId, current, answers, match, questions.length]);

  // Warn before unload during an active, unsubmitted match
  useEffect(() => {
    if (!match || submittedRef.current || waitingForOpp) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [match, waitingForOpp]);

  // Load match + questions
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    let cancelled = false;
    (async () => {
      console.log("[match] loading", matchId, "user", user.id);
      const { data: m, error: mErr } = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .maybeSingle();
      if (cancelled) return;
      if (mErr) console.error("[match] match load error", mErr);
      if (!m) {
        console.warn("[match] match not found", matchId);
        toast.error("Matchen kunde inte hittas");
        navigate({ to: "/" });
        return;
      }
      console.log("[match] match loaded", m);
      setMatch(m as MatchRow);

      // Opponent name (hide bot identity)
      if ((m as MatchRow).is_bot_match) {
        setOpponentName(getBotName((m as MatchRow).bot_elo ?? 1000));
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

      const { data: mq, error: mqErr } = await supabase
        .from("match_questions")
        .select("question_order, question_id")
        .eq("match_id", matchId)
        .order("question_order", { ascending: true });
      if (mqErr) console.error("[match] match_questions load failed", mqErr);
      console.log("[match] match_questions rows:", mq?.length ?? 0);

      const qIds = (mq ?? []).map((r) => r.question_id);
      if (qIds.length === 0) {
        console.warn("[match] no question ids — RLS or empty mapping");
      }
      const { data: qRows, error: qErr } = qIds.length
        ? await supabase
            .from("questions")
            .select(
              "id, category, question_text, options, passage_id, passage_text, image_url, difficulty, cleaned_question_text, cleaned_options, clean_status",
            )
            .in("id", qIds)
        : { data: [], error: null };
      if (qErr) console.error("[match] questions load failed", qErr);
      console.log("[match] questions rows:", qRows?.length ?? 0);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const qById = new Map<string, any>((qRows ?? []).map((q: any) => [q.id, q]));

      const qs: QuestionRow[] = (mq ?? [])
        .map((row) => {
          const q = qById.get(row.question_id);
          if (!q) return null;
          const isMath = ["XYZ", "KVA", "NOG", "DTK"].includes(q.category);
          const useCleaned = isMath && q.clean_status === "ok" && q.cleaned_question_text;
          const rawOpts = useCleaned
            ? Array.isArray(q.cleaned_options)
              ? q.cleaned_options
              : []
            : Array.isArray(q.options)
              ? q.options
              : [];
          const options: string[] = rawOpts.map((o: unknown) =>
            typeof o === "string"
              ? o
              : o && typeof o === "object" && "text" in (o as Record<string, unknown>)
                ? String((o as { text: unknown }).text)
                : String(o),
          );
          return {
            id: q.id,
            question_text: useCleaned ? q.cleaned_question_text : q.question_text,
            options,
            category: q.category,
            passage_id: q.passage_id,
            passage_text: q.passage_text,
            image_url: q.image_url ?? null,
          } as QuestionRow;
        })
        .filter(Boolean) as QuestionRow[];
      console.log("[match] final questions:", qs.length);
      setQuestions(qs);
      // For invite matches that were "waiting" and just became active, record
      // game start as now (not match.created_at which includes the waiting period).
      if (reloadTick > 0) {
        setMatchStartedAt(new Date());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [matchId, user, authLoading, navigate, reloadTick]);

  // Timer + opponent progress
  // - Bot match: deterministic fake progress
  // - Real match: Supabase Realtime broadcast for live opponent progress
  //               + postgres_changes to detect when opponent submitted -> 30s countdown
  const [oppForceCountdown, setOppForceCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (!match || questions.length === 0) return;
    // Use matchStartedAt (set when questions first load) so that invite matches
    // don't eat into the 5-minute clock while waiting for the opponent to accept.
    const start = (matchStartedAt ?? new Date(match.created_at)).getTime();
    const tick = () => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const left = Math.max(0, TOTAL_SECONDS - elapsed);
      setSecondsLeft(left);
      if (left === 0 && !submittedRef.current) {
        submittedRef.current = true;
        void doSubmit(true);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match, matchStartedAt, questions.length]);

  // When match is "waiting" (invite sent, no player2 yet), listen for it to become active.
  // This lets the invite sender start playing without having to refresh.
  useEffect(() => {
    if (!match || match.status !== "waiting") return;
    const channel = supabase
      .channel(`match-waiting-${matchId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches", filter: `id=eq.${matchId}` },
        (payload) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const row = payload.new as any;
          if (row.status === "active" && row.player2_id) {
            // Trigger a full reload of match + questions
            setReloadTick((t) => t + 1);
          }
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [match, matchId]);

  // Bot match: deterministic fake opponent progress
  useEffect(() => {
    if (!match || !match.is_bot_match) return;
    const start = new Date(match.created_at).getTime();
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
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      let answered = 0;
      for (const t of cumulative) if (elapsed >= t) answered++;
      setOppProgress(answered / 8);
    }, 1000);
    return () => clearInterval(id);
  }, [match, matchId]);

  // Real match: EN delad realtidskanal — tar emot motståndarens progress + upptäcker
  // inlämning. Skapas en gång per match (inte per fråga). Broadcast sker via ref nedan.
  useEffect(() => {
    if (!match || match.is_bot_match || !user) return;
    const oppId = match.player1_id === user.id ? match.player2_id : match.player1_id;
    const channel = supabase
      .channel(`match-progress-${matchId}`, {
        config: { broadcast: { self: false } },
      })
      .on("broadcast", { event: "progress" }, (payload) => {
        const p = payload.payload as { user_id: string; index: number; total: number };
        if (p.user_id === oppId) {
          setOppProgress(Math.min(1, (p.index + 1) / Math.max(1, p.total)));
        }
      })
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches", filter: `id=eq.${matchId}` },
        (payload) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const row = payload.new as any;
          const oppSubmitted =
            match.player1_id === user.id ? row.player2_submitted_at : row.player1_submitted_at;
          // Starta INTE force-nedräkningen innan frågorna laddats (annars riskerar en
          // inbjuden spelare en orättvis 0-inlämning). Ref för att slippa deps.
          if (
            oppSubmitted &&
            !submittedRef.current &&
            !oppForceStartedRef.current &&
            questionsCountRef.current > 0
          ) {
            oppForceStartedRef.current = true;
            setOppForceCountdown(30);
            sounds.invite();
            toast.info("Motståndaren är klar – du har 30 sekunder kvar!");
          }
        },
      )
      .subscribe();
    progressChannelRef.current = channel;
    return () => {
      progressChannelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [match, matchId, user]);

  // Broadcasta egen progress när frågan ändras — via den delade kanalen (ingen ny prenumeration).
  useEffect(() => {
    if (!match || match.is_bot_match || !user || questions.length === 0) return;
    void progressChannelRef.current?.send({
      type: "broadcast",
      event: "progress",
      payload: { user_id: user.id, index: current, total: questions.length },
    });
  }, [match, user, current, questions.length]);

  // 30s forced countdown when opponent submitted
  useEffect(() => {
    if (oppForceCountdown === null) return;
    if (oppForceCountdown <= 0) {
      if (!submittedRef.current) {
        submittedRef.current = true;
        void doSubmit(true);
      }
      return;
    }
    const id = setTimeout(() => {
      setOppForceCountdown((s) => (s === null ? null : s - 1));
      if (oppForceCountdown <= 5) sounds.tick();
    }, 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oppForceCountdown]);

  const currentQ = questions[current];

  const selectAnswer = async (qId: string, choice: string) => {
    if (!user || !currentQ) return;
    sounds.ping();
    // Record time spent on first selection if not already recorded
    if (answerTimesRef.current[qId] == null) {
      const spent = Math.max(1, Math.round((Date.now() - questionStartTime.getTime()) / 1000));
      answerTimesRef.current[qId] = spent;
    }
    setAnswers((m) => {
      const next = new Map(m);
      next.set(qId, choice);
      return next;
    });
  };

  const persistAnswer = async (qId: string, choice: string | null) => {
    if (!user) return;
    const time_spent_seconds = answerTimesRef.current[qId] ?? null;
    await supabase
      .from("match_answers")
      .upsert(
        {
          match_id: matchId,
          user_id: user.id,
          question_id: qId,
          selected_answer: choice,
          is_correct: false, // server recomputes on submit; never trust client
          time_spent_seconds,
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
    if (submittedRef.current && !auto) return; // redan inlämnad
    submittedRef.current = true; // synkron guard mot dubbel-inlämning (timer/force/manuell)
    setSubmitting(true);
    try {
      try {
        sessionStorage.removeItem("active_match");
      } catch {
        /* ignore */
      }
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
        if (user) void updateStreak(user.id);
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
        if (user) void updateStreak(user.id);
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

  // Invite sender waits here while the invited player hasn't accepted yet
  if (match && match.status === "waiting" && !match.player2_id) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
        <motion.span
          className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#f2a65a] to-[#c97b41] text-white shadow-[var(--shadow-glow-green)]"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Trophy className="h-7 w-7" />
        </motion.span>
        <div>
          <p className="eyebrow text-[#f2a65a]">Väntar</p>
          <h1
            className="mt-1 text-[30px] font-bold leading-tight text-[#e8e4da]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Inbjudan skickad.
          </h1>
        </div>
        <p className="text-white/65">
          Matchen startar automatiskt när din vän accepterar inbjudan.
        </p>
        <motion.div
          className="flex gap-1.5"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        >
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-2 w-2 rounded-full bg-[#f2a65a]" />
          ))}
        </motion.div>
      </div>
    );
  }

  if (!match || questions.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <motion.span
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#f2a65a] to-[#c97b41] text-white shadow-[var(--shadow-glow-green)]"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Trophy className="h-7 w-7" />
        </motion.span>
        <p className="text-sm text-white/65">Förbereder arenan…</p>
      </div>
    );
  }

  // mm/ss + low styling are handled inside <CircularTimer />.

  if (waitingForOpp) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
        {reconnecting && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="status"
            aria-live="polite"
          >
            Anslutningen bröts – försöker återansluta…
          </motion.div>
        )}
        <motion.span
          className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#f2a65a] to-[#c97b41] text-white shadow-[var(--shadow-glow-green)]"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Trophy className="h-7 w-7" />
        </motion.span>
        <div>
          <p className="eyebrow text-[#f2a65a]">Klart</p>
          <h1
            className="mt-1 text-[34px] font-bold leading-tight text-[#e8e4da]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Du har lämnat in.
          </h1>
        </div>
        <p className="text-white/65">
          Motståndaren har{" "}
          <span className="font-semibold text-[#e8e4da] tabular-nums">{oppSecondsLeft}s</span> kvar
          att avsluta…
        </p>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full bg-gradient-to-r from-[#f2a65a] to-[#f5c089]"
            animate={{ width: `${(oppSecondsLeft / 30) * 100}%` }}
            transition={{ duration: 0.5, ease: "linear" }}
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
        className="sticky top-0 z-20"
        style={{
          background: "rgba(7,17,30,0.85)",
          borderBottom: "1px solid var(--line)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 pt-3 pb-2">
          <div className="text-sm font-semibold tabular-nums">
            Fråga {current + 1} av {questions.length}
          </div>
          <div className="flex items-center gap-2">
            <CircularTimer totalSeconds={TOTAL_SECONDS} remainingSeconds={secondsLeft} />
            <TimerSoundToggle />
          </div>
          <div className="hidden text-xs text-muted-foreground sm:block">
            Mot: <span className="font-medium text-foreground">{opponentName}</span>
          </div>
        </div>
        {/* Dual progress bars: own + opponent (proportional, jumps per question) */}
        <div className="mx-auto max-w-3xl px-4 pt-2 pb-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-foreground">Du</span>
                <span className="tabular-nums text-muted-foreground">
                  {current + 1}/{questions.length}
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-[#f2a65a] transition-all duration-500 ease-out"
                  style={{ width: `${((current + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="truncate font-medium text-foreground">
                  {opponentName || "Motståndare"}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {Math.round(oppProgress * questions.length)}/{questions.length}
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-[#6fb3b8] transition-all duration-700 ease-out"
                  style={{ width: `${oppProgress * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        {oppForceCountdown !== null && (
          <div className="border-t border-[#c0392b]/30 bg-[#c0392b]/10 px-4 py-2 text-center text-xs font-semibold text-[#c0392b]">
            ⏱ Motståndaren är klar! Auto-inlämning om {oppForceCountdown}s
          </div>
        )}
      </header>

      {/* Main */}
      {currentQ.passage_text ? (
        <main className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-0 md:grid-cols-2">
          <PassagePane
            matchId={matchId}
            passageId={currentQ.passage_id}
            passageText={currentQ.passage_text}
            category={currentQ.category}
          />
          <div className="px-4 py-6 md:px-6">
            <PassagePane
              matchId={matchId}
              passageId={currentQ.passage_id}
              passageText={currentQ.passage_text}
              category={currentQ.category}
              mobileAccordion
            />
            <QuestionCard
              currentQ={currentQ}
              current={current}
              total={questions.length}
              choice={answers.get(currentQ.id)}
              selectAnswer={selectAnswer}
              setCurrent={setCurrent}
              goNext={goNext}
              persistAnswer={persistAnswer}
              setConfirmOpen={setConfirmOpen}
              submitting={submitting}
            />
          </div>
        </main>
      ) : (
        <main className="mx-auto w-full max-w-[720px] flex-1 px-4 py-6">
          <QuestionCard
            currentQ={currentQ}
            current={current}
            total={questions.length}
            choice={answers.get(currentQ.id)}
            selectAnswer={selectAnswer}
            setCurrent={setCurrent}
            goNext={goNext}
            persistAnswer={persistAnswer}
            setConfirmOpen={setConfirmOpen}
            submitting={submitting}
          />
        </main>
      )}

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

interface QuestionCardProps {
  currentQ: QuestionRow;
  current: number;
  total: number;
  choice: string | undefined;
  selectAnswer: (qId: string, choice: string) => void | Promise<void>;
  setCurrent: React.Dispatch<React.SetStateAction<number>>;
  goNext: () => void | Promise<void>;
  persistAnswer: (qId: string, choice: string | null) => Promise<void>;
  setConfirmOpen: React.Dispatch<React.SetStateAction<boolean>>;
  submitting: boolean;
}

function QuestionCard({
  currentQ,
  current,
  total,
  choice,
  selectAnswer,
  setCurrent,
  goNext,
  persistAnswer,
  setConfirmOpen,
  submitting,
}: QuestionCardProps) {
  const optionLetters = ["A", "B", "C", "D", "E"];
  const isMath = ["XYZ", "KVA", "NOG", "DTK"].includes(currentQ.category);
  return (
    <div
      key={currentQ.id}
      className="animate-slide-in rounded-2xl border border-border bg-white p-5 sm:p-6"
      style={{ boxShadow: "var(--shadow-md)" }}
    >
      <div className="mb-2 text-xs font-semibold tracking-wide text-[#f2a65a]">
        {displayCategory(currentQ.category)} · Fråga {current + 1}
      </div>
      <h2
        className="mb-5 whitespace-pre-wrap text-lg font-semibold leading-relaxed sm:text-xl"
        style={{ fontFamily: "var(--font-display)", lineHeight: 1.5 }}
      >
        {isMath ? <MathText>{currentQ.question_text}</MathText> : currentQ.question_text}
      </h2>
      {currentQ.image_url && (
        <div className="mb-5 overflow-hidden rounded-xl border border-border">
          <img
            src={currentQ.image_url}
            alt="Figur till frågan"
            className="w-full object-contain"
          />
        </div>
      )}
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
              className={`flex min-h-[52px] items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f2a65a] focus-visible:ring-offset-2 ${
                isSelected
                  ? "border-2 border-[#f2a65a] bg-[#f2a65a]/15 text-foreground"
                  : "border border-border bg-white hover:border-[#f2a65a] hover:bg-[#f2a65a]/10"
              }`}
            >
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold transition-colors ${
                  isSelected ? "bg-[#f2a65a] text-[#1a0d04]" : "bg-[#f0ede8] text-foreground"
                }`}
              >
                {letter}
              </span>
              <span className={`leading-relaxed ${isMath ? "text-base" : "text-sm"}`}>
                {isMath ? <MathText>{opt}</MathText> : opt}
              </span>
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
        {current < total - 1 ? (
          <Button disabled={!choice} onClick={() => void goNext()}>
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
  );
}
