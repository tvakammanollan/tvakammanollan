import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { createMatch } from "@/lib/match.functions";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/UserAvatar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Trophy, Frown, Minus, Check, X, ChevronDown, RotateCcw, BarChart3, Home, Clock, AlertTriangle } from "lucide-react";
import { MathText } from "@/components/MathText";
import { ExplanationBlock } from "@/components/ExplanationBlock";
import { ReportQuestionButton } from "@/components/ui/ReportQuestionButton";
import { RankUpModal } from "@/components/ui/RankUpModal";
import { getRankForElo, type RankTier } from "@/types";

export const Route = createFileRoute("/result/$matchId")({
  component: ResultPage,
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

const FAKE_NAMES = [
  "linnea_92","oskarH","mattevurm","noa.k","elsa_w","viktorL",
  "alicia.s","hugo_b","saga.m","ebba.n","leo_99","moa_r",
  "wilmaP","edvin.t","felicia_k","axel.j",
];
function pickFakeName(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return FAKE_NAMES[Math.abs(h) % FAKE_NAMES.length];
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
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const createMatchFn = useServerFn(createMatch);

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

      // Opponent display
      if (mr.is_bot_match) {
        setOpponentSeed(mr.id);
        setOpponentName(pickFakeName(mr.id));
      } else {
        const oppId = mr.player1_id === user.id ? mr.player2_id : mr.player1_id;
        if (oppId) {
          setOpponentSeed(oppId);
          const { data: u } = await supabase.from("users").select("username").eq("id", oppId).maybeSingle();
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
        colors: ["#d4a017", "#e8c468", "#1a5c3a", "#ffffff"],
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
  const myScore = isP1 ? match.player1_score ?? 0 : match.player2_score ?? 0;
  const oppScore = isP1 ? match.player2_score ?? 0 : match.player1_score ?? 0;
  const mySubmittedAt = isP1 ? match.player1_submitted_at : match.player2_submitted_at;
  const oppSubmittedAt = isP1 ? match.player2_submitted_at : match.player1_submitted_at;
  const myDuration = formatDuration(match.created_at, mySubmittedAt);
  const oppDuration = formatDuration(match.created_at, oppSubmittedAt);

  const scoreDelta = myScore - oppScore;
  const won = scoreDelta > 0;
  const draw = scoreDelta === 0;

  // Banner styles
  const bannerClass = draw
    ? "bg-gradient-to-br from-zinc-200 to-zinc-50 text-zinc-800 border-zinc-300"
    : won
    ? "bg-gradient-to-br from-[#1a5c3a] via-[#236d44] to-[#2d7a52] text-white border-[#1a5c3a] shadow-[0_20px_60px_-15px_rgba(26,92,58,0.55)]"
    : "bg-gradient-to-br from-[#2a2a2a] to-[#3a3a3a] text-zinc-100 border-zinc-700";
  const verdict = draw ? "Oavgjort!" : won ? "🏆 Du vann!" : "Du förlorade";
  const Icon = draw ? Minus : won ? Trophy : Frown;
  const subtext = draw
    ? "Tätt och jämnt."
    : won
    ? "Snyggt jobbat. Spela igen och fortsätt klättra."
    : "Bra kämpa! Varje match gör dig bättre.";

  const playAgain = async () => {
    if (creatingRematch) return;
    setCreatingRematch(true);
    try {
      const r = await createMatchFn({ data: { match_type: match.match_type, mode: "bot" } });
      const nextId = (r as { match_id: string }).match_id;
      navigate({ to: "/match/$matchId", params: { matchId: nextId } });
    } catch (e) {
      console.error(e);
      setCreatingRematch(false);
    }
  };

  // Group consecutive questions sharing passage_id
  const passageGroups: Array<{ passage_id: string; passage_text: string; question_ids: string[] }> = [];
  for (const q of questions) {
    if (!q.passage_id || !q.passage_text) continue;
    const last = passageGroups[passageGroups.length - 1];
    if (last && last.passage_id === q.passage_id) last.question_ids.push(q.id);
    else passageGroups.push({ passage_id: q.passage_id, passage_text: q.passage_text, question_ids: [q.id] });
  }
  const passageByQ = new Map<string, { passage_id: string; passage_text: string }>();
  for (const g of passageGroups) for (const id of g.question_ids) passageByQ.set(id, g);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <RankUpModal open={!!rankUp} rank={rankUp} onClose={() => setRankUp(null)} />
      {/* Banner */}
      <div
        className={`animate-fade-up relative overflow-hidden rounded-2xl border p-6 text-center sm:p-10 ${bannerClass}`}
        style={{ animationDelay: "60ms" }}
      >
        <Icon className={`mx-auto h-14 w-14 ${won ? "text-[#1a5c3a]" : ""}`} />
        <h1
          className={`mt-3 text-3xl font-bold sm:text-4xl ${won ? "shimmer-text" : ""}`}
          style={{ fontFamily: "var(--font-display)" }}
        >
          {verdict}
        </h1>
        <p className="mt-2 text-sm opacity-80 sm:text-base">{subtext}</p>
      </div>

      {/* Scorecard */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
        <div className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {match.match_type === "verbal" ? "Verbal" : "Matte"} · Slutresultat
        </div>
        <div className="grid grid-cols-2 gap-4">
          <PlayerColumn
            name={(user && (user.user_metadata?.username ?? user.email)) ?? "Du"}
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
                  ? "bg-emerald-100 text-emerald-700"
                  : eloChange < 0
                  ? "bg-rose-100 text-rose-700"
                  : "bg-muted text-foreground"
              }`}
            >
              {eloChange >= 0 ? "+" : ""}
              {eloChange}
            </span>
          </div>
        )}
      </section>

      {/* Actions */}
      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Button onClick={playAgain} disabled={creatingRematch} className="gap-1.5">
          <RotateCcw className="h-4 w-4" />
          Spela igen
        </Button>
        <Button asChild variant="secondary" className="gap-1.5">
          <Link to="/stats">
            <BarChart3 className="h-4 w-4" />
            Gå till statistik
          </Link>
        </Button>
        <Button asChild variant="ghost" className="gap-1.5">
          <Link to="/">
            <Home className="h-4 w-4" />
            Hem
          </Link>
        </Button>
      </div>

      {/* Question review */}
      <section className="mt-8">
        <Accordion type="single" collapsible>
          <AccordionItem value="review" className="rounded-xl border border-border bg-card px-4">
            <AccordionTrigger className="text-base font-semibold">
              <span className="flex items-center gap-2">
                <ChevronDown className="h-4 w-4 opacity-60" />
                Genomgång av alla {questions.length} frågor
                {(() => {
                  const times = myAnswers.map((a) => a.time_spent_seconds).filter((t): t is number => typeof t === "number" && t > 0);
                  if (times.length === 0) return null;
                  const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
                  const m = Math.floor(avg / 60);
                  const s = avg % 60;
                  return (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-normal text-muted-foreground">
                      <Clock className="h-3 w-3" /> {m > 0 ? `${m} min ` : ""}{s} sek snitt
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
                          ? "border-zinc-300 bg-zinc-50"
                          : correct
                          ? "border-emerald-300/60 bg-emerald-50/60"
                          : "border-rose-300/60 bg-rose-50/60"
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        <span>{i + 1}.</span>
                        <span>{q.category}</span>
                        {typeof a?.time_spent_seconds === "number" && a.time_spent_seconds > 0 && (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] normal-case tracking-normal ${
                              a.time_spent_seconds > 180
                                ? "bg-amber-100 text-amber-800"
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
                            <span className="text-zinc-600">— Ej besvarad</span>
                          ) : correct ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-700" /> Rätt
                            </>
                          ) : (
                            <>
                              <X className="h-3.5 w-3.5 text-rose-700" /> Fel
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
                        {["XYZ","KVA","NOG","DTK"].includes(q.category)
                          ? <MathText autoDetect>{q.question_text}</MathText>
                          : q.question_text}
                      </div>
                      <ul className="mt-2 grid gap-1">
                        {q.options.map((opt) => {
                          const isCorrect = opt.id === q.correct_answer;
                          const isPicked = a?.selected_answer === opt.id;
                          const isMath = ["XYZ","KVA","NOG","DTK"].includes(q.category);
                          return (
                            <li
                              key={opt.id}
                              className={`flex items-start gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
                                isCorrect
                                  ? "border-emerald-300 bg-emerald-100/60 text-emerald-900"
                                  : isPicked
                                  ? "border-rose-300 bg-rose-100/60 text-rose-900"
                                  : "border-transparent text-foreground/80"
                              }`}
                            >
                              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-background text-[11px] font-semibold">
                                {opt.id}
                              </span>
                              <span className={`leading-relaxed ${isMath ? "font-mono" : ""}`}>
                                {isMath ? <MathText autoDetect>{opt.text}</MathText> : opt.text}
                              </span>
                              {isCorrect && <Check className="ml-auto h-4 w-4 text-emerald-700" />}
                              {isPicked && !isCorrect && <X className="ml-auto h-4 w-4 text-rose-700" />}
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
      <div className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
        Tid: <span className="font-medium text-foreground">{duration}</span>
      </div>
    </div>
  );
}
