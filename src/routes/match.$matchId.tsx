import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { finalizeMatch, submitMatch } from "@/lib/match.functions";
import { trackEvent } from "@/lib/events";
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
import { m } from "framer-motion";
import { displayCategory, ordText } from "@/lib/sv-format";
import { LogOut, Trophy, Timer as TimerIcon } from "lucide-react";
import { CircularTimer, TimerSoundToggle } from "@/components/ui/CircularTimer";
import { MathText } from "@/components/MathTextLazy";
import { CropView, type Crop } from "@/components/question/CropView";
import { parseStem, parseOptionCrops, type ExamStem } from "@/components/question/examCrops";
import { sounds } from "@/lib/sounds";
import { updateStreak } from "@/lib/streak";
import { PassagePane } from "@/components/PassagePane";
import { getBotName } from "@/lib/bot";
import { displayName } from "@/lib/guest-name";
import { isImageQuestion, optionHasOwnText } from "@/lib/math-question";
import { parseQuestionText } from "@/lib/question-text";
import { WithdrawnBadge } from "@/components/ui/WithdrawnBadge";
import {
  MATCH_TOTAL_SECONDS,
  OPPONENT_GRACE_SECONDS,
  matchIsLive,
  matchStartKey,
  resolveMatchAnchor,
  secondsLeftFrom,
} from "@/lib/match-clock";

export const Route = createFileRoute("/match/$matchId")({
  component: MatchPage,
  head: () => ({
    meta: [{ title: "Match · Tvåkommanollan" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

const TOTAL_SECONDS = MATCH_TOTAL_SECONDS;

interface QuestionRow {
  id: string;
  question_text: string;
  /** Struken ur provet i efterhand — rätt svar gäller, poängen räknades inte. */
  withdrawn: boolean;
  options: string[];
  category: string;
  passage_id: string | null;
  passage_text: string | null;
  image_url: string | null;
  /** Bilduppgifter ur arkivet: var stammen och alternativen sitter i bilden. */
  stem: ExamStem | null;
  optionCrops: Crop[] | null;
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
  /** När matchen blev spelbar. Null på matcher skapade före 2026-08-19. */
  started_at: string | null;
}

function MatchPage() {
  const { matchId } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const submitFn = useServerFn(submitMatch);
  // Ref: väntan-effekten nedan får inte prenumerera om varje gång
  // useServerFn returnerar en ny funktionsidentitet.
  const finalizeFn = useServerFn(finalizeMatch);
  const finalizeRef = useRef(finalizeFn);
  useEffect(() => {
    finalizeRef.current = finalizeFn;
  }, [finalizeFn]);

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
  // Antal frågor motståndaren BESVARAT — inte en andel och inte en position.
  // Låg tidigare som `oppProgress` (0–1) och räknades tillbaka till ett antal
  // vid rendering, vilket är hur "8 frågor" kunde stå bredvid ett enda svar.
  const [oppAnswered, setOppAnswered] = useState(0);
  const [reconnecting, setReconnecting] = useState(false);
  // Alla reconnect-försök uttömda — visa explicit läge i stället för tyst väntan.
  const [connectionLost, setConnectionLost] = useState(false);
  const submittedRef = useRef(false);
  // Färsk user-referens för realtime-callbacks (utan att vara effect-dep).
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);
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

  // En avslutad match har ingen speltid kvar att räkna ned. Utan den här
  // vägen renderades den som ett spelbart bräde med noll sekunder på klockan,
  // vilket lämnade in den på nytt vid varje besök — `submitMatch` svarar
  // `alreadyFinished`, som saknar `ok`, så sidan fastnade i "Du har lämnat in"
  // i stället för att visa resultatet.
  useEffect(() => {
    if (!match || match.status !== "finished" || waitingForOpp) return;
    navigate({ to: "/result/$matchId", params: { matchId } });
  }, [match, matchId, navigate, waitingForOpp]);

  // Persist active match progress to sessionStorage so we can resume after reload.
  // Samma grind som klockan: en match som inte är spelbar ska inte heller
  // erbjudas som "pågående match" i banderollen.
  useEffect(() => {
    if (!match || !matchIsLive(match.status) || questions.length === 0) return;
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
      setMatch(m as MatchRow);

      // Opponent name (hide bot identity)
      if ((m as MatchRow).is_bot_match) {
        setOpponentName(getBotName((m as MatchRow).bot_elo ?? 1000, (m as MatchRow).id));
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
          // Namnet, inte ordet "Motståndare". `displayName` ger gästkonton
          // sitt lundnamn i stället för user_c8a56e2c — ett id är inte ett
          // namn att möta i en match. Finns ingen rad kvar är kontot raderat,
          // och då sägs det rakt ut.
          setOpponentName(u ? displayName(u.username, oppId) : "Okänd spelare");
        }
      }

      const { data: mq, error: mqErr } = await supabase
        .from("match_questions")
        .select("question_order, question_id")
        .eq("match_id", matchId)
        .order("question_order", { ascending: true });
      if (mqErr) console.error("[match] match_questions load failed", mqErr);

      const qIds = (mq ?? []).map((r) => r.question_id);
      if (qIds.length === 0) {
        console.warn("[match] no question ids — RLS or empty mapping");
      }
      const { data: qRows, error: qErr } = qIds.length
        ? await supabase
            .from("questions")
            .select(
              "id, category, question_text, options, passage_id, passage_text, image_url, image_caption, difficulty, cleaned_question_text, cleaned_options, clean_status",
            )
            .in("id", qIds)
        : { data: [], error: null };
      if (qErr) console.error("[match] questions load failed", qErr);
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
          const parsed = parseQuestionText(useCleaned ? q.cleaned_question_text : q.question_text);
          return {
            id: q.id,
            question_text: parsed.text,
            withdrawn: parsed.withdrawn,
            options,
            category: q.category,
            passage_id: q.passage_id,
            passage_text: q.passage_text,
            image_url: q.image_url ?? null,
            // Beskärningarna gäller uppgiftens eget utsnitt; den städade texten
            // beskriver en annan uppgift än den bilden visar.
            stem: useCleaned ? null : parseStem(q.image_caption),
            optionCrops: useCleaned ? null : parseOptionCrops(q.options),
          } as QuestionRow;
        })
        .filter(Boolean) as QuestionRow[];
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
    // Klockan kräver TVÅ saker: att frågorna finns OCH att servern säger att
    // matchen är spelbar. Bara frågorna räckte förut, och det var buggen:
    // `acceptMatchInvite`/`joinMatch` skriver `match_questions` före
    // statusuppdateringen, så inbjudarens flik hittade åtta frågor på en match
    // som ännu stod som `waiting` och började räkna ned där. Se `matchIsLive`.
    if (!match || !matchIsLive(match.status) || questions.length === 0) return;
    // Klockan startar när spelaren faktiskt får se första frågan, inte när
    // matchraden skapades. Mellan de två ligger gästinloggning, onboarding och
    // laddning av frågorna — tid som spelaren aldrig kunde använda men som åt
    // av de fem minuterna. Ankaret sparas per match, så en omladdning inte ger
    // ny tid; serverns tidsgolv (`isImplausiblyFast`) står kvar oavsett.
    //
    // Att mäta mot klientens egen klocka är också det enda som är robust: går
    // webbläsarens klocka fel mot databasens blir `created_at` godtyckligt
    // långt bort, och en match kunde lämnas in automatiskt i samma sekund den
    // öppnades. Här jämförs alltid Date.now() med ett tidigare Date.now().
    // Serverns `started_at` går först: den är samma för båda spelarna, och
    // det är den resultatsidan, botens tid och tidsgolvet räknar ifrån. Utan
    // den kunde min klocka och min redovisade tid skilja sig åt med minuter.
    // Det lokala ankaret finns kvar som reserv för äldre matcher (started_at
    // är NULL där) och för de sekunder som går innan raden är läst.
    // Reglerna är rena och testade i `match-clock.ts` — de låg tidigare inline
    // här, i en komponent på 1 100 rader, och gick alltså inte att pröva.
    const anchorKey = matchStartKey(matchId);
    let stored: string | null = null;
    try {
      stored = sessionStorage.getItem(anchorKey);
    } catch {
      /* private mode */
    }
    const { anchor, persist } = resolveMatchAnchor({
      startedAt: match.started_at ?? matchStartedAt?.toISOString() ?? null,
      stored,
      now: Date.now(),
    });
    if (persist) {
      try {
        sessionStorage.setItem(anchorKey, String(anchor));
      } catch {
        /* private mode — klockan lever då bara i minnet */
      }
    }
    const tick = () => {
      const left = secondsLeftFrom(anchor);
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
  }, [match, matchStartedAt, questions.length, matchId]);

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
    const start = new Date(match.started_at ?? match.created_at).getTime();
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
      setOppAnswered(answered);
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
        // `answered` är antalet BESVARADE frågor. Fältet hette `index` och bar
        // motståndarens position i häftet, som räknades upp med ett och
        // visades som "1/8" innan hen svarat på något alls — och som "8/8" så
        // fort hen bläddrat till sista frågan, oavsett hur många svar som
        // lagts. `index` läses fortfarande som reserv för en motpart som kör
        // en äldre flik: en position är fel siffra, men den är inte noll.
        const p = payload.payload as {
          user_id: string;
          answered?: number;
          index?: number;
          total: number;
        };
        if (p.user_id !== oppId) return;
        const answered = p.answered ?? (p.index != null ? p.index + 1 : 0);
        setOppAnswered(Math.max(0, Math.min(p.total, answered)));
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
            setOppForceCountdown(OPPONENT_GRACE_SECONDS);
            sounds.invite();
            toast.info(`Motståndaren är klar – du har ${OPPONENT_GRACE_SECONDS} sekunder kvar!`);
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

  // Broadcasta egen progress när ett svar läggs — via den delade kanalen (ingen
  // ny prenumeration). Beroendet är `answers.size`, inte `current`: det som
  // ska visas är hur många frågor som är besvarade, och att bläddra fram och
  // tillbaka i häftet besvarar ingenting.
  useEffect(() => {
    if (!match || match.is_bot_match || !user || questions.length === 0) return;
    void progressChannelRef.current?.send({
      type: "broadcast",
      event: "progress",
      payload: { user_id: user.id, answered: answers.size, total: questions.length },
    });
  }, [match, user, answers.size, questions.length]);

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
      // Hela svarsbilden går med inlämningen. Den skrivs löpande under matchen
      // också, men den vägen kan misslyckas tyst (RLS, tappat nät, sövd flik)
      // och då blev resultatet "0/8" bredvid åtta besvarade frågor. Servern
      // skriver om raderna med service role och rättar dem i samma anrop.
      const payload = questions.map((q) => ({
        question_id: q.id,
        selected_answer: answers.get(q.id) ?? null,
        time_spent_seconds: answerTimesRef.current[q.id] ?? null,
      }));
      // Behåll den löpande skrivningen som första försök — den gör svaren
      // synliga för motståndarens vy direkt, innan inlämningen.
      for (const a of payload) {
        if (!a.selected_answer) continue;
        await persistAnswer(a.question_id, a.selected_answer);
      }
      const res = await submitFn({ data: { matchId, answers: payload } });
      // Produkthändelse för funnel/retention. No-op utan samtycke, och den
      // ligger efter submitFn med flit — bara matcher som faktiskt gick igenom
      // ska räknas.
      trackEvent("match_submitted", {
        match_type: match?.match_type as "verbal" | "math" | undefined,
        is_bot_match: match?.is_bot_match ?? undefined,
        auto_submitted: auto,
        answered: answers.size,
        total_questions: questions.length,
        seconds_used: TOTAL_SECONDS - secondsLeft,
      });
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
    let opp = OPPONENT_GRACE_SECONDS;
    setOppSecondsLeft(opp);

    let attempts = 0;
    let currentChannel: ReturnType<typeof supabase.channel> | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const handleUpdate = (payload: { new: { status?: string } }) => {
      if (payload.new?.status === "finished") {
        // Läs user via ref — att lägga `user` i deps skulle re-subscriba
        // realtime-kanalen vid varje auth-uppdatering (samma buggklass som
        // login-kraschen). Refen synkas i en egen effekt nedan.
        const u = userRef.current;
        if (u) void updateStreak(u.id);
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
            } else {
              // Ge upp tyst omanslutning — berätta för användaren och erbjud
              // manuell väg till resultatet (30s-nedräkningen tar oss dit ändå).
              setConnectionLost(true);
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
        // Motståndaren dök aldrig upp. Avsluta matchen på servern INNAN vi går
        // till resultatet — annars står matchen kvar som `active`, och då ger
        // varken ELO eller facit något: `get_match_review` svarar bara för
        // avslutade matcher, vilket är hela orsaken till "Genomgång av alla
        // 0 frågor". Går anropet fel visar resultatsidan sitt väntläge.
        void finalizeRef
          .current({ data: { matchId } })
          .catch((e) => console.error("[match] finalize failed", e))
          .finally(() => navigate({ to: "/result/$matchId", params: { matchId } }));
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

  // Invite sender waits here while the invited player hasn't accepted yet.
  // Villkoret var `!match.player2_id`, vilket släppte igenom en halvskriven
  // rad (player2 satt, status ännu `waiting`) till det spelbara brädet — med
  // en klocka som räknade ned på en match som inte hade börjat.
  if (match && !matchIsLive(match.status) && match.status !== "finished") {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
        <m.span
          className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#ae2f26] to-[#8f2620] text-[var(--cream)] shadow-[var(--shadow-glow-gold)]"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Trophy className="h-7 w-7" />
        </m.span>
        <div>
          <p className="eyebrow text-[#ae2f26]">Väntar</p>
          <h1
            className="mt-1 text-[30px] font-bold leading-tight text-[var(--cream)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Inbjudan skickad.
          </h1>
        </div>
        <p className="text-white/65">
          Matchen startar automatiskt när din vän accepterar inbjudan.
        </p>
        <m.div
          className="flex gap-1.5"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        >
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-2 w-2 rounded-full bg-[#ae2f26]" />
          ))}
        </m.div>
      </div>
    );
  }

  if (!match || questions.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <m.span
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#ae2f26] to-[#8f2620] text-[var(--cream)] shadow-[var(--shadow-glow-gold)]"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Trophy className="h-7 w-7" />
        </m.span>
        <p className="text-sm text-white/65">Förbereder arenan…</p>
      </div>
    );
  }

  // mm/ss + low styling are handled inside <CircularTimer />.

  if (waitingForOpp) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
        {connectionLost ? (
          <m.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-3 text-sm text-destructive"
            role="status"
            aria-live="polite"
          >
            <p>Kunde inte återansluta. Matchstatusen kan inte bekräftas live.</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => navigate({ to: "/result/$matchId", params: { matchId } })}
            >
              Visa resultat nu
            </Button>
          </m.div>
        ) : reconnecting ? (
          <m.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="status"
            aria-live="polite"
          >
            Anslutningen bröts – försöker återansluta…
          </m.div>
        ) : null}
        <m.span
          className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#ae2f26] to-[#8f2620] text-[var(--cream)] shadow-[var(--shadow-glow-gold)]"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Trophy className="h-7 w-7" />
        </m.span>
        <div>
          <p className="eyebrow text-[#ae2f26]">Klart</p>
          <h1
            className="mt-1 text-[34px] font-bold leading-tight text-[var(--cream)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Du har lämnat in.
          </h1>
        </div>
        <p className="text-white/65">
          Motståndaren har{" "}
          <span className="font-semibold text-[var(--cream)] tabular-nums">
            {Math.max(0, oppSecondsLeft)}s
          </span>{" "}
          kvar att avsluta…
        </p>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <m.div
            className="h-full bg-gradient-to-r from-[#ae2f26] to-[#f5c089]"
            animate={{
              width: `${Math.max(0, oppSecondsLeft / OPPONENT_GRACE_SECONDS) * 100}%`,
            }}
            transition={{ duration: 0.95, ease: "linear" }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <header
        className="sticky top-0 z-20"
        style={{
          // Var rgba(251, 246, 236, 0.92) — det gamla blå-navyt. Matchskärmen är den mest
          // besökta i appen och hade alltså en blå glasremsa mot brun bakgrund.
          background: "rgba(251, 246, 236, 0.92)",
          borderBottom: "1px solid var(--line)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        {/* Bara klockan. Raden bar tidigare också "Fråga 3 av 8" och
            "Mot: {namn}" — båda står ordagrant i progressbarerna direkt
            under, så frågepositionen syntes tre gånger på skärmen och
            motståndarens namn två. */}
        <div className="mx-auto flex max-w-3xl items-center justify-center gap-2 px-4 pt-3 pb-2">
          <CircularTimer totalSeconds={TOTAL_SECONDS} remainingSeconds={secondsLeft} />
          <TimerSoundToggle />
        </div>
        {/* Två staplar, EN betydelse: antal besvarade frågor. Den vänstra visade
            tidigare vilken fråga man stod på och den högra motståndarens
            besvarade — alltså två olika tal bredvid varandra, där "Du 4/8" mot
            "Motst. 1/8" kunde betyda att man låg efter. Frågenumret står i
            stället på kortet nedanför, där det hör hemma. */}
        <div className="mx-auto max-w-3xl px-4 pt-2 pb-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-foreground">Du</span>
                <span className="tabular-nums text-muted-foreground">
                  {answers.size}/{questions.length}
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-[#ae2f26] transition-all duration-500 ease-out"
                  style={{ width: `${(answers.size / Math.max(1, questions.length)) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="truncate font-medium text-foreground">
                  {opponentName || "Okänd spelare"}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {Math.min(oppAnswered, questions.length)}/{questions.length}
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-[#7a5236] transition-all duration-700 ease-out"
                  style={{
                    width: `${(Math.min(oppAnswered, questions.length) / Math.max(1, questions.length)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        {oppForceCountdown !== null && (
          <div
            className="flex items-center justify-center gap-2 border-t px-4 py-2 text-center text-xs font-semibold"
            style={{
              borderColor: "var(--danger-line)",
              background: "var(--danger-soft)",
              color: "var(--danger)",
            }}
            role="status"
            aria-live="polite"
          >
            <TimerIcon className="h-3.5 w-3.5" aria-hidden />
            Motståndaren är klar. Automatisk inlämning om{" "}
            <span className="tabular-nums">{oppForceCountdown} s</span>
          </div>
        )}
      </header>

      {/* Main */}
      {currentQ.passage_text ? (
        <main className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-0 lg:grid-cols-2">
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
              onSubmit={() => setConfirmOpen(true)}
              submitting={submitting}
            />
          </div>
        </main>
      ) : (
        // max-w-3xl matchar topp- och bottenlisten. Var max-w-[720px], så
        // frågekortet låg 24 px innanför progressbarerna rakt ovanför.
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
          <QuestionCard
            currentQ={currentQ}
            current={current}
            total={questions.length}
            choice={answers.get(currentQ.id)}
            selectAnswer={selectAnswer}
            setCurrent={setCurrent}
            goNext={goNext}
            onSubmit={() => setConfirmOpen(true)}
            submitting={submitting}
          />
        </main>
      )}

      {/* Bottom bar */}
      {/* `pb-safe` i stället för `pb-3`: knappen är appens mest tryckta, och
          utan den låg den i hemindikatorns gestområde. */}
      <footer className="sticky bottom-0 z-20 border-t border-border bg-background/95 px-4 pt-3 pb-safe backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          {/* Tryckytorna i bottenlisten är minst 44×44. "Avbryt" var 55×16 px
              — mindre än en fingertopp, och granne med den knapp som avslutar
              matchen. Höjden kommer från padding, inte från en fast höjd, så
              texten fortfarande styr bredden. */}
          <Link
            to="/"
            className="-ml-2 inline-flex min-h-[44px] items-center gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" /> Avbryt
          </Link>
          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={submitting}
            className="min-h-[44px] bg-primary text-primary-foreground hover:bg-primary/90"
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
              {/* Antalet obesvarade står först och med flit: inlämningen går
                  inte att ångra, och en felklickad knapp på fråga 3 av 8
                  kostade hela matchen utan att något sa till. Gamla prov-
                  runnern säger redan samma sak. */}
              {questions.length - answers.size > 0 &&
                `${questions.length - answers.size} av ${questions.length} frågor är obesvarade. `}
              {match.is_bot_match
                ? "Resultatet räknas ut direkt."
                : `Motståndaren får ${OPPONENT_GRACE_SECONDS} sekunder på sig att avsluta.`}
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
  onSubmit: () => void;
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
  onSubmit,
  submitting,
}: QuestionCardProps) {
  const optionLetters = ["A", "B", "C", "D", "E"];
  const isMath = ["XYZ", "KVA", "NOG", "DTK"].includes(currentQ.category);
  // ORD-ord har blandad casing i datan — normalisera alltid vid visning.
  const isOrd = currentQ.category === "ORD";
  const displayQ = isOrd ? ordText(currentQ.question_text) : currentQ.question_text;
  const bildUppgift = isImageQuestion({
    image_url: currentQ.image_url,
    options: currentQ.options,
  });
  return (
    <div
      key={currentQ.id}
      className="animate-slide-in rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm sm:p-6"
      style={{ boxShadow: "var(--shadow-md)" }}
    >
      {/* Frågenumret står här, inte i stapeln ovanför — den mäter besvarade
          frågor, inte var i häftet man befinner sig. */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold tracking-wide text-[#ae2f26]">
          {displayCategory(currentQ.category)}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          Fråga {current + 1} av {total}
        </span>
        {currentQ.withdrawn && <WithdrawnBadge />}
      </div>
      {/* Bilduppgifter (utsnitt ur provhäftet) bär hela frågan i bilden.
          Texten är då PDF-extraktionen av samma sak — "3 27 x 2 =" där häftet
          visar en kubikrot — och renderades tidigare ovanför bilden, så
          uppgiften stod två gånger. Se `math-question.ts`. */}
      {!bildUppgift && (
        <h2
          className="mb-5 whitespace-pre-wrap text-lg font-semibold leading-relaxed sm:text-xl"
          style={{ fontFamily: "var(--font-display)", lineHeight: 1.5 }}
        >
          {isMath ? <MathText>{currentQ.question_text}</MathText> : displayQ}
        </h2>
      )}
      {currentQ.image_url && (
        <div className="mb-5 overflow-hidden rounded-xl border border-border">
          {currentQ.stem ? (
            <CropView
              src={currentQ.image_url}
              crop={currentQ.stem.stem}
              imageAspect={currentQ.stem.aspect}
              alt={`Uppgift ${current + 1} ur provhäftet`}
              className="w-full"
            />
          ) : (
            <img
              src={currentQ.image_url}
              alt={bildUppgift ? `Uppgift ${current + 1} ur provhäftet` : "Figur till frågan"}
              decoding="async"
              className="mx-auto max-h-[55vh] w-auto max-w-full object-contain"
            />
          )}
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
              className={`flex min-h-[52px] items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ae2f26] focus-visible:ring-offset-2 ${
                isSelected
                  ? "border-2 border-[#ae2f26] bg-[#ae2f26]/15 text-foreground"
                  : "border border-white/10 bg-white/[0.02] hover:border-[#ae2f26]/60 hover:bg-[#ae2f26]/10"
              }`}
            >
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold transition-colors ${
                  isSelected ? "bg-[#ae2f26] text-[#fff8f5]" : "bg-white/10 text-foreground"
                }`}
              >
                {letter}
              </span>
              {/* Alternativen sitter i bilden på arkivets matteuppgifter och
                  klipps då ut ur den. Annars är det text — och en
                  alternativtext som bara är sin egen bokstav skrivs inte ut,
                  den står redan i brickan till vänster. */}
              {currentQ.optionCrops && currentQ.image_url ? (
                <span className={`leading-relaxed ${isMath ? "text-base" : "text-sm"}`}>
                  <CropView
                    src={currentQ.image_url}
                    crop={currentQ.optionCrops[i]}
                    imageAspect={currentQ.stem?.aspect ?? 1}
                    alt={`Svarsalternativ ${letter}`}
                  />
                </span>
              ) : (
                optionHasOwnText(opt, i) && (
                  <span className={`leading-relaxed ${isMath ? "text-base" : "text-sm"}`}>
                    {isMath ? <MathText>{opt}</MathText> : isOrd ? ordText(opt) : opt}
                  </span>
                )
              )}
            </button>
          );
        })}
      </div>

      {/* Framåtknappen står stilla hela matchen. Sju gånger heter den
          "Nästa fråga", på den åttonde "Lämna in svar" — samma plats, samma
          tumme. Bottenlisten behåller sin knapp för den som vill lämna in
          tidigare, men den som svarat klart ska inte behöva leta efter
          vägen ut. */}
      {/* `min-h-[44px]` på alla tre: knapparna trycks en gång per fråga på en
          telefon, och `Button`s standardhöjd är 36 px. */}
      <div className="mt-5 flex items-center justify-between">
        <Button
          variant="ghost"
          className="min-h-[44px]"
          disabled={current === 0}
          onClick={() => setCurrent((i) => Math.max(0, i - 1))}
        >
          Föregående
        </Button>
        {current < total - 1 ? (
          <Button className="min-h-[44px]" disabled={!choice} onClick={() => void goNext()}>
            Nästa fråga
          </Button>
        ) : (
          <Button
            disabled={submitting}
            onClick={onSubmit}
            className="min-h-[44px] bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Lämna in svar
          </Button>
        )}
      </div>
    </div>
  );
}
