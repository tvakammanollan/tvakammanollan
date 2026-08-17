import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { m } from "framer-motion";
import confetti from "canvas-confetti";
import { Reveal } from "@/components/landing/MotionFX";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { createMatch } from "@/lib/match.functions";
import { requestRematch } from "@/lib/friends.functions";
import { Button } from "@/components/ui/button";
import { NextStep } from "@/components/layout/NextStep";
import { displayCategory, ordText } from "@/lib/sv-format";
import { UserAvatar } from "@/components/UserAvatar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Trophy,
  Frown,
  Minus,
  Check,
  X,
  ChevronDown,
  RotateCcw,
  BarChart3,
  BookOpen,
  Home,
  Clock,
  AlertTriangle,
  Share2,
  Flame,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { track } from "@/lib/telemetry";
import { MathText } from "@/components/MathTextLazy";
import { ExplanationBlock } from "@/components/ExplanationBlock";
import { ReportQuestionButton } from "@/components/ui/ReportQuestionButton";
import { RankUpModal } from "@/components/ui/RankUpModal";
import { getRankForElo, type RankTier } from "@/types";
import { getBotName } from "@/lib/bot";

export const Route = createFileRoute("/result/$matchId")({
  component: ResultPage,
  head: () => ({
    meta: [{ title: "Resultat · HP Kampen" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

interface MatchRow {
  id: string;
  match_type: "verbal" | "math";
  player1_id: string;
  player2_id: string | null;
  player1_score: number | null;
  player2_score: number | null;
  player1_submitted_at: string | null;
  player2_submitted_at: string | null;
  winner_id: string | null;
  is_bot_match: boolean;
  bot_elo: number | null;
  status: string;
  created_at: string;
}

interface AnswerRow {
  user_id: string;
  question_id: string;
  selected_answer: string | null;
  is_correct: boolean;
  time_spent_seconds: number | null;
}

interface QuestionOpt {
  id: string;
  text: string;
}

interface QuestionRow {
  id: string;
  question_text: string;
  category: string;
  options: QuestionOpt[];
  correct_answer: string;
  passage_id: string | null;
  passage_text: string | null;
  explanation: string | null;
}

function formatDuration(startIso: string, endIso: string | null): string {
  if (!endIso) return "—";
  const ms = Math.max(0, new Date(endIso).getTime() - new Date(startIso).getTime());
  const s = Math.floor(ms / 1000);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function ResultPage() {
  const { matchId } = Route.useParams();
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const createMatchFn = useServerFn(createMatch);
  const rematchFn = useServerFn(requestRematch);

  const [match, setMatch] = useState<MatchRow | null>(null);
  const [opponentName, setOpponentName] = useState("");
  const [opponentSeed, setOpponentSeed] = useState("");
  const [eloBefore, setEloBefore] = useState<number | null>(null);
  const [eloAfter, setEloAfter] = useState<number | null>(null);
  const [eloChange, setEloChange] = useState<number | null>(null);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [myAnswers, setMyAnswers] = useState<AnswerRow[]>([]);
  const [oppAnswers, setOppAnswers] = useState<AnswerRow[]>([]);
  const [showPassageMap, setShowPassageMap] = useState<Record<string, boolean>>({});
  const [creatingRematch, setCreatingRematch] = useState(false);
  const [rankUp, setRankUp] = useState<RankTier | null>(null);
  const confettiFiredRef = useRef(false);

  useEffect(() => {
    if (loading) return;
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
      if (cancelled || !m) return;
      const mr = m as MatchRow;
      setMatch(mr);

      // Nyss avslutad match kan ha låst upp utmärkelser — be watchern kolla
      // direkt (förbi 20s-throttlen) så firandet sker här och inte senare.
      window.dispatchEvent(new Event("hpk:achievements:check"));

      // Opponent display
      if (mr.is_bot_match) {
        setOpponentSeed(mr.id);
        setOpponentName(getBotName(mr.bot_elo ?? 1000));
      } else {
        const oppId = mr.player1_id === user.id ? mr.player2_id : mr.player1_id;
        if (oppId) {
          setOpponentSeed(oppId);
          const { data: u } = await supabase
            .from("users")
            .select("username")
            .eq("id", oppId)
            .maybeSingle();
          setOpponentName(u?.username ?? "Motståndare");
        }
      }

      const { data: hist } = await supabase
        .from("elo_history")
        .select("elo_before, elo_after, elo_change")
        .eq("match_id", matchId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (hist) {
        setEloBefore(hist.elo_before);
        setEloAfter(hist.elo_after);
        setEloChange(hist.elo_change);
        const oldRank = getRankForElo(hist.elo_before);
        const newRank = getRankForElo(hist.elo_after);
        if (oldRank.tier !== newRank.tier && hist.elo_after > hist.elo_before) {
          setRankUp(newRank);
        }
      }

      const { data: mq } = await supabase.rpc("get_match_review", {
        _match_id: matchId,
      });
      const qs: QuestionRow[] = (mq ?? [])
        .map((q: Record<string, unknown>) => {
          if (!q) return null;
          const rawOpts = Array.isArray(q.options) ? (q.options as unknown[]) : [];
          const options: QuestionOpt[] = rawOpts.map((o: unknown, i: number) => {
            if (o && typeof o === "object" && "text" in (o as Record<string, unknown>)) {
              const obj = o as { id?: string; text: unknown };
              return { id: obj.id ?? String.fromCharCode(65 + i), text: String(obj.text) };
            }
            return { id: String.fromCharCode(65 + i), text: String(o) };
          });
          return {
            id: q.question_id as string,
            question_text: q.question_text as string,
            category: q.category as string,
            options,
            correct_answer: q.correct_answer as string,
            passage_id: (q.passage_id as string) ?? null,
            passage_text: (q.passage_text as string) ?? null,
            explanation: (q.explanation as string) ?? null,
          } as QuestionRow;
        })
        .filter(Boolean) as QuestionRow[];
      setQuestions(qs);

      const { data: mine } = await supabase
        .from("match_answers")
        .select("user_id, question_id, selected_answer, is_correct, time_spent_seconds")
        .eq("match_id", matchId)
        .eq("user_id", user.id);
      setMyAnswers((mine ?? []) as AnswerRow[]);

      if (!mr.is_bot_match) {
        const oppId = mr.player1_id === user.id ? mr.player2_id : mr.player1_id;
        if (oppId) {
          const { data: opp } = await supabase
            .from("match_answers")
            .select("user_id, question_id, selected_answer, is_correct, time_spent_seconds")
            .eq("match_id", matchId)
            .eq("user_id", oppId);
          setOppAnswers((opp ?? []) as AnswerRow[]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [matchId, user, loading, navigate]);

  // Confetti for winner
  useEffect(() => {
    if (!match || !user || confettiFiredRef.current) return;
    if (match.winner_id !== user.id) return;
    confettiFiredRef.current = true;
    const fire = (origin: { x: number; y: number }) =>
      confetti({
        particleCount: 90,
        spread: 70,
        startVelocity: 45,
        origin,
        colors: ["#eab308", "#e8c468", "#ae2f26", "#ffffff"],
      });
    fire({ x: 0.2, y: 0.3 });
    fire({ x: 0.8, y: 0.3 });
    setTimeout(() => fire({ x: 0.5, y: 0.25 }), 280);
  }, [match, user]);

  const myCorrectByQ = useMemo(() => {
    const m = new Map<string, AnswerRow>();
    for (const a of myAnswers) m.set(a.question_id, a);
    return m;
  }, [myAnswers]);

  if (!match || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Laddar resultat…
      </div>
    );
  }

  const isP1 = match.player1_id === user!.id;
  const myScore = isP1 ? (match.player1_score ?? 0) : (match.player2_score ?? 0);
  const oppScore = isP1 ? (match.player2_score ?? 0) : (match.player1_score ?? 0);
  const mySubmittedAt = isP1 ? match.player1_submitted_at : match.player2_submitted_at;
  const oppSubmittedAt = isP1 ? match.player2_submitted_at : match.player1_submitted_at;
  const myDuration = formatDuration(match.created_at, mySubmittedAt);
  const oppDuration = formatDuration(match.created_at, oppSubmittedAt);

  const scoreDelta = myScore - oppScore;
  const won = scoreDelta > 0;
  const draw = scoreDelta === 0;

  // Banner styles
  const bannerClass = draw
    ? "bg-white/[0.04] text-[var(--cream)] border-white/12"
    : won
      ? "bg-gradient-to-br from-[#f3e9d8] via-[#fbf6ec] to-[#ffffff] text-[var(--cream)] border-[#ae2f26]/40 shadow-[0_20px_60px_-15px_rgba(174, 47, 38,0.4)]"
      : "bg-white/[0.03] text-[var(--cream)] border-white/12";
  const verdict = draw ? "Oavgjort!" : won ? "Du vann!" : "Du förlorade";
  const Icon = draw ? Minus : won ? Trophy : Frown;
  const subtext = draw
    ? "Tätt och jämnt."
    : won
      ? "Snyggt jobbat. Spela igen och fortsätt klättra."
      : "Bra kämpa! Varje match gör dig bättre.";

  const isPvp = !match.is_bot_match && !!match.player2_id;

  const playAgain = async () => {
    if (creatingRematch) return;
    setCreatingRematch(true);
    track({
      type: "metric",
      message: "rematch_clicked",
      context: { pvp: isPvp, matchType: match.match_type },
    });
    try {
      if (isPvp) {
        // Revansch mot samma motståndare via inbjudan.
        const r = await rematchFn({ data: { match_id: match.id } });
        const r2 = r as { match_id: string; already?: boolean };
        toast.success(
          r2.already
            ? "Du har redan en revansch på väg till motståndaren."
            : `Revansch skickad – väntar på ${opponentName}.`,
        );
        navigate({ to: "/match/$matchId", params: { matchId: r2.match_id } });
      } else {
        const r = await createMatchFn({ data: { match_type: match.match_type, mode: "bot" } });
        const nextId = (r as { match_id: string }).match_id;
        navigate({ to: "/match/$matchId", params: { matchId: nextId } });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kunde inte starta ny match");
      setCreatingRematch(false);
    }
  };

  const shareResult = async () => {
    track({
      type: "metric",
      message: "result_share_clicked",
      context: { won, draw, matchType: match.match_type },
    });
    const elo = eloChange != null ? ` · ELO ${eloChange >= 0 ? "+" : ""}${eloChange}` : "";
    const verb = draw
      ? `spelade oavgjort ${myScore}–${oppScore}`
      : won
        ? `vann ${myScore}–${oppScore}`
        : `förlorade ${myScore}–${oppScore}`;
    const text = `Jag ${verb} mot ${opponentName} på HP Kampen${elo}! 🏆`;
    const url = "https://hpkampen.se";
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "HP Kampen", text, url });
      } else {
        await navigator.clipboard.writeText(`${text}\nSpela gratis: ${url}`);
        toast.success("Resultatet kopierat – klistra in var du vill!");
      }
    } catch {
      /* användaren avbröt delningen */
    }
  };

  // Group consecutive questions sharing passage_id
  const passageGroups: Array<{ passage_id: string; passage_text: string; question_ids: string[] }> =
    [];
  for (const q of questions) {
    if (!q.passage_id || !q.passage_text) continue;
    const last = passageGroups[passageGroups.length - 1];
    if (last && last.passage_id === q.passage_id) last.question_ids.push(q.id);
    else
      passageGroups.push({
        passage_id: q.passage_id,
        passage_text: q.passage_text,
        question_ids: [q.id],
      });
  }
  const passageByQ = new Map<string, { passage_id: string; passage_text: string }>();
  for (const g of passageGroups) for (const id of g.question_ids) passageByQ.set(id, g);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <RankUpModal open={!!rankUp} rank={rankUp} onClose={() => setRankUp(null)} />
      {/* Banner */}
      <m.div
        initial={{ opacity: 0, y: 30, scale: 0.92, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        className={`relative overflow-hidden rounded-2xl border p-6 text-center sm:p-10 ${bannerClass}`}
      >
        <m.div
          initial={{ scale: 0.4, opacity: 0, rotate: won ? -15 : 0 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{
            duration: 0.7,
            delay: 0.2,
            ease: [0.22, 1, 0.36, 1],
            type: "spring",
            stiffness: 220,
            damping: 16,
          }}
        >
          <Icon className={`mx-auto h-14 w-14 ${won ? "text-[#ae2f26]" : ""}`} />
        </m.div>
        <h1
          className={`mt-3 text-3xl font-bold sm:text-4xl ${won ? "shimmer-text" : ""}`}
          style={{ fontFamily: "var(--font-display)" }}
        >
          {verdict}
        </h1>
        <m.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 0.8, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-2 text-sm sm:text-base"
        >
          {subtext}
        </m.p>
      </m.div>

      {/* Guest signup CTA — direkt under bannern, i det heta ögonblicket */}
      {user?.is_anonymous && (
        <Reveal
          delay={0.2}
          className="mt-5 overflow-hidden rounded-3xl border border-[#ae2f26]/30 bg-[#ae2f26]/[0.06] p-6 sm:p-8"
        >
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#ae2f26]/25 bg-[#ae2f26]/10 text-[#ae2f26]">
              <Trophy className="h-7 w-7" />
            </span>
            <div className="flex-1">
              <h3
                className="text-[22px] font-bold leading-tight text-[var(--cream)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Bra spelat! Vill du komma in på topplistan?
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-white/65">
                Skapa ett gratis konto för att{" "}
                <strong className="text-[var(--cream)]">spara din ELO</strong>, klättra i rankingen och
                utmana dina vänner. Tar 30 sekunder.
              </p>
            </div>
            <Button
              asChild
              className="shrink-0 bg-[#ae2f26] px-6 text-base font-semibold text-[#fff8f5] shadow-md hover:bg-[#8f2620]"
            >
              <Link to="/signup">
                Skapa konto
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </Reveal>
      )}

      {/* Scorecard */}
      <Reveal
        delay={0.25}
        className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-sm sm:p-6"
      >
        <div className="mb-4 text-center text-xs font-semibold tracking-wide text-muted-foreground">
          {match.match_type === "verbal" ? "Verbal" : "Matte"} · Slutresultat
        </div>
        <div className="grid grid-cols-2 gap-4">
          <PlayerColumn
            name={
              profile?.username ?? (user?.user_metadata?.username as string | undefined) ?? "Du"
            }
            seed={user!.id}
            score={myScore}
            duration={myDuration}
            highlight={won}
          />
          <PlayerColumn
            name={opponentName}
            seed={opponentSeed}
            score={oppScore}
            duration={oppDuration}
            highlight={!won && !draw}
          />
        </div>

        {eloBefore !== null && eloAfter !== null && eloChange !== null && (
          <div className="mt-5 flex items-center justify-center gap-2 text-sm">
            <span className="text-muted-foreground">ELO {match.match_type}:</span>
            <span className="font-semibold tabular-nums">{eloBefore}</span>
            <span className="text-muted-foreground">→</span>
            <span className="font-semibold tabular-nums">{eloAfter}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                eloChange > 0
                  ? "bg-[var(--success-soft)] text-[var(--success)]"
                  : eloChange < 0
                    ? "bg-[var(--danger-soft)] text-[var(--danger)]"
                    : "bg-muted text-foreground"
              }`}
            >
              {eloChange >= 0 ? "+" : ""}
              {eloChange}
            </span>
          </div>
        )}

        {/* Streak — förstärk vanan i det heta ögonblicket */}
        {!user?.is_anonymous && (profile?.current_streak ?? 0) > 0 && (
          <div className="mt-3 flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ae2f26]/25 bg-[#ae2f26]/10 px-3 py-1 text-sm font-semibold text-[#ae2f26] tabular-nums">
              <Flame className="h-3.5 w-3.5" />
              {profile!.current_streak} dagar i rad
              {(profile!.current_streak ?? 0) >= 3 &&
                profile!.current_streak === profile!.longest_streak && (
                  <span className="font-medium text-white/70">· nytt rekord!</span>
                )}
            </span>
          </div>
        )}

        {questions.length > 0 &&
          (() => {
            const correctCount = myAnswers.filter((a) => a.is_correct).length;
            const total = questions.length;
            const pct = (correctCount / total) * 100;
            // Approximate HP normering for one delprov (verbal/quant), based on accuracy
            const norm =
              pct >= 95
                ? 2.0
                : pct >= 90
                  ? 1.9
                  : pct >= 82
                    ? 1.7
                    : pct >= 75
                      ? 1.5
                      : pct >= 67
                        ? 1.3
                        : pct >= 58
                          ? 1.1
                          : pct >= 50
                            ? 0.9
                            : pct >= 40
                              ? 0.7
                              : pct >= 30
                                ? 0.5
                                : 0.3;
            return (
              <div className="mt-5 rounded-xl border border-[#ae2f26]/30 bg-[#ae2f26]/[0.06] p-4 text-center">
                <div className="text-[11px] font-semibold tracking-wide text-[#ae2f26]">
                  Trolig normering
                </div>
                <div className="mt-1 flex items-baseline justify-center gap-2">
                  <span
                    className="text-4xl font-bold tabular-nums text-[#ae2f26] sm:text-5xl"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {norm.toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({correctCount}/{total} rätt)
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Uppskattning baserat på din andel rätt. Riktiga HP-normeringen varierar med
                  provets svårighet.
                </p>
              </div>
            );
          })()}
      </Reveal>

      {/* Dela resultat */}
      <Button
        onClick={shareResult}
        variant="outline"
        className="mt-5 w-full gap-1.5 border-[#ae2f26]/40 text-[#ae2f26] hover:bg-[#ae2f26]/10"
      >
        <Share2 className="h-4 w-4" />
        Dela resultat
      </Button>

      {/* Actions — tre likvärdiga knappar gav inget förstaval; nu en
          primär och vägarna vidare under, samma form som efter ett
          tränings- eller ordpass. */}
      <NextStep
        primaryLabel={isPvp ? "Begär revansch" : "Spela igen"}
        onPrimary={() => void playAgain()}
        primaryIcon={<RotateCcw className="h-4 w-4" />}
        primaryDisabled={creatingRematch}
        forward={[
          { label: "Plugga ord", icon: BookOpen, to: "/ord" },
          { label: "Statistik", icon: BarChart3, to: "/stats" },
          { label: "Hem", icon: Home, to: "/" },
        ]}
      />

      {/* Question review */}
      <section className="mt-8">
        <Accordion type="single" collapsible>
          <AccordionItem
            value="review"
            className="rounded-xl border border-white/10 bg-white/[0.02] px-4"
          >
            <AccordionTrigger className="text-base font-semibold">
              <span className="flex items-center gap-2">
                <ChevronDown className="h-4 w-4 opacity-60" />
                Genomgång av alla {questions.length} frågor
                {(() => {
                  const times = myAnswers
                    .map((a) => a.time_spent_seconds)
                    .filter((t): t is number => typeof t === "number" && t > 0);
                  if (times.length === 0) return null;
                  const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
                  const m = Math.floor(avg / 60);
                  const s = avg % 60;
                  return (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-normal text-muted-foreground">
                      <Clock className="h-3 w-3" /> {m > 0 ? `${m} min ` : ""}
                      {s} sek snitt
                    </span>
                  );
                })()}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ol className="grid gap-3 pb-2">
                {questions.map((q, i) => {
                  const a = myCorrectByQ.get(q.id);
                  const correct = a?.is_correct ?? false;
                  const noAnswer = !a || a.selected_answer === null;
                  const passage = passageByQ.get(q.id);
                  const showP = passage ? !!showPassageMap[passage.passage_id] : false;
                  return (
                    <li
                      key={q.id}
                      className={`rounded-xl border p-4 ${
                        noAnswer
                          ? "border-white/15 bg-white/5"
                          : correct
                            ? "border-[var(--success-line)] bg-[var(--success-soft)]"
                            : "border-[var(--danger-line)] bg-[var(--danger-soft)]"
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground">
                        <span>{i + 1}.</span>
                        <span>{displayCategory(q.category)}</span>
                        {typeof a?.time_spent_seconds === "number" && a.time_spent_seconds > 0 && (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] normal-case tracking-normal ${
                              a.time_spent_seconds > 180
                                ? "bg-[#ae2f26]/15 text-[#ae2f26]"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {a.time_spent_seconds > 180 ? (
                              <AlertTriangle className="h-3 w-3" />
                            ) : (
                              <Clock className="h-3 w-3" />
                            )}
                            {(() => {
                              const t = a.time_spent_seconds!;
                              const m = Math.floor(t / 60);
                              const s = t % 60;
                              return m > 0 ? `${m} min ${s} sek` : `${s} sek`;
                            })()}
                            {a.time_spent_seconds > 180 ? " · Lång tid" : ""}
                          </span>
                        )}
                        <span className="ml-auto inline-flex items-center gap-1">
                          {noAnswer ? (
                            <span className="text-white/55">Ej besvarad</span>
                          ) : correct ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-[var(--success)]" /> Rätt
                            </>
                          ) : (
                            <>
                              <X className="h-3.5 w-3.5 text-[var(--danger)]" /> Fel
                            </>
                          )}
                        </span>
                        {user && (
                          <ReportQuestionButton
                            questionId={q.id}
                            userId={user.id}
                            questionText={q.question_text}
                          />
                        )}
                      </div>

                      {passage && (
                        <div className="mb-2">
                          <button
                            type="button"
                            onClick={() =>
                              setShowPassageMap((m) => ({
                                ...m,
                                [passage.passage_id]: !m[passage.passage_id],
                              }))
                            }
                            className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                          >
                            {showP ? "Dölj textpassage" : "Visa textpassage"}
                          </button>
                          {showP && (
                            <div className="mt-2 rounded-lg border border-border bg-background p-3 text-sm leading-relaxed whitespace-pre-wrap">
                              {passage.passage_text}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {["XYZ", "KVA", "NOG", "DTK"].includes(q.category) ? (
                          <MathText autoDetect>{q.question_text}</MathText>
                        ) : q.category === "ORD" ? (
                          ordText(q.question_text)
                        ) : (
                          q.question_text
                        )}
                      </div>
                      <ul className="mt-2 grid gap-1">
                        {q.options.map((opt) => {
                          const isCorrect = opt.id === q.correct_answer;
                          const isPicked = a?.selected_answer === opt.id;
                          const isMath = ["XYZ", "KVA", "NOG", "DTK"].includes(q.category);
                          return (
                            <li
                              key={opt.id}
                              className={`flex items-start gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
                                isCorrect
                                  ? "border-[var(--success-line)] bg-[var(--success-soft)] text-foreground"
                                  : isPicked
                                    ? "border-[var(--danger-line)] bg-[var(--danger-soft)] text-foreground"
                                    : "border-transparent text-foreground/80"
                              }`}
                            >
                              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-background text-[11px] font-semibold">
                                {opt.id}
                              </span>
                              <span className={`leading-relaxed ${isMath ? "font-mono" : ""}`}>
                                {isMath ? (
                                  <MathText autoDetect>{opt.text}</MathText>
                                ) : q.category === "ORD" ? (
                                  ordText(opt.text)
                                ) : (
                                  opt.text
                                )}
                              </span>
                              {isCorrect && (
                                <Check className="ml-auto h-4 w-4 text-[var(--success)]" />
                              )}
                              {isPicked && !isCorrect && (
                                <X className="ml-auto h-4 w-4 text-[var(--danger)]" />
                              )}
                            </li>
                          );
                        })}
                      </ul>
                      <ExplanationBlock explanation={q.explanation} />
                    </li>
                  );
                })}
              </ol>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Hidden but available for future: opponent answers */}
      {oppAnswers.length > 0 && (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Motståndaren svarade på {oppAnswers.length} frågor.
        </p>
      )}
    </div>
  );
}

function PlayerColumn({
  name,
  seed,
  score,
  duration,
  highlight,
}: {
  name: string;
  seed: string;
  score: number;
  duration: string;
  highlight: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center rounded-xl border p-4 text-center ${
        highlight ? "border-primary/40 bg-primary/5" : "border-border bg-background"
      }`}
    >
      <UserAvatar name={seed || name} size={48} />
      <div className="mt-2 truncate text-sm font-semibold" title={name}>
        {name}
      </div>
      <div
        className="mt-2 text-3xl font-bold tabular-nums"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {score}
        <span className="text-base font-normal text-muted-foreground">/8</span>
      </div>
      <div className="mt-1 text-[11px] tracking-wide text-muted-foreground">
        Tid: <span className="font-medium text-foreground">{duration}</span>
      </div>
    </div>
  );
}
