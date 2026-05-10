import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Trophy, Frown, Minus } from "lucide-react";

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
  winner_id: string | null;
  is_bot_match: boolean;
  bot_elo: number | null;
  status: string;
}

interface AnswerRow {
  question_id: string;
  selected_answer: string | null;
  is_correct: boolean;
}

interface QuestionRow {
  id: string;
  question_text: string;
  category: string;
  options: string[];
  correct_answer: string;
}

function ResultPage() {
  const { matchId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [match, setMatch] = useState<MatchRow | null>(null);
  const [opponentName, setOpponentName] = useState("");
  const [eloChange, setEloChange] = useState<number | null>(null);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [answers, setAnswers] = useState<AnswerRow[]>([]);

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
      setMatch(m as MatchRow);

      if ((m as MatchRow).is_bot_match) {
        setOpponentName(`Bot (ELO ${(m as MatchRow).bot_elo ?? "?"})`);
      } else {
        const oppId =
          (m as MatchRow).player1_id === user.id
            ? (m as MatchRow).player2_id
            : (m as MatchRow).player1_id;
        if (oppId) {
          const { data: u } = await supabase.from("users").select("username").eq("id", oppId).maybeSingle();
          setOpponentName(u?.username ?? "Motståndare");
        }
      }

      const { data: hist } = await supabase
        .from("elo_history")
        .select("elo_change")
        .eq("match_id", matchId)
        .eq("user_id", user.id)
        .maybeSingle();
      setEloChange(hist?.elo_change ?? null);

      const { data: mq } = await supabase
        .from("match_questions")
        .select("question_id, questions(*)")
        .eq("match_id", matchId)
        .order("question_order", { ascending: true });
      const qs: QuestionRow[] = (mq ?? [])
        .map((row) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const q = (row as any).questions;
          if (!q) return null;
          return {
            id: q.id,
            question_text: q.question_text,
            category: q.category,
            options: Array.isArray(q.options) ? q.options : [],
            correct_answer: q.correct_answer,
          } as QuestionRow;
        })
        .filter(Boolean) as QuestionRow[];
      setQuestions(qs);

      const { data: ans } = await supabase
        .from("match_answers")
        .select("question_id, selected_answer, is_correct")
        .eq("match_id", matchId)
        .eq("user_id", user.id);
      setAnswers((ans ?? []) as AnswerRow[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [matchId, user, loading, navigate]);

  if (!match) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Laddar resultat…
      </div>
    );
  }

  const isP1 = match.player1_id === user!.id;
  const myScore = isP1 ? match.player1_score ?? 0 : match.player2_score ?? 0;
  const oppScore = isP1 ? match.player2_score ?? 0 : match.player1_score ?? 0;
  const won = match.winner_id === user!.id;
  const draw = match.winner_id === null;

  const verdict = draw ? "Oavgjort" : won ? "Du vann!" : "Du förlorade";
  const Icon = draw ? Minus : won ? Trophy : Frown;
  const verdictColor = draw
    ? "text-muted-foreground"
    : won
    ? "text-primary"
    : "text-destructive";

  const answerMap = new Map(answers.map((a) => [a.question_id, a]));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-card sm:p-10">
        <Icon className={`mx-auto h-12 w-12 ${verdictColor}`} />
        <h1
          className={`mt-3 text-3xl font-semibold ${verdictColor}`}
          style={{ fontFamily: "var(--font-display)" }}
        >
          {verdict}
        </h1>
        <div className="mt-6 flex items-center justify-center gap-6 text-2xl font-semibold tabular-nums">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Du</div>
            <div>{myScore}</div>
          </div>
          <div className="text-muted-foreground">–</div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{opponentName}</div>
            <div>{oppScore}</div>
          </div>
        </div>
        {eloChange !== null && (
          <div className="mt-5 inline-block rounded-full bg-muted px-4 py-1.5 text-sm font-semibold">
            ELO {eloChange >= 0 ? "+" : ""}
            {eloChange}
          </div>
        )}
        <div className="mt-7 flex justify-center gap-2">
          <Button asChild>
            <Link to="/">Tillbaka hem</Link>
          </Button>
        </div>
      </div>

      <h2 className="mt-10 text-lg font-semibold">Genomgång</h2>
      <div className="mt-3 grid gap-3">
        {questions.map((q, i) => {
          const a = answerMap.get(q.id);
          const correct = a?.is_correct ?? false;
          return (
            <div
              key={q.id}
              className={`rounded-xl border p-4 ${
                correct ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5"
              }`}
            >
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {i + 1}. {q.category} · {correct ? "Rätt" : "Fel"}
              </div>
              <div className="whitespace-pre-wrap text-sm">{q.question_text}</div>
              <div className="mt-2 text-xs text-muted-foreground">
                Ditt svar: <span className="font-medium text-foreground">{a?.selected_answer ?? "—"}</span>
                {" · "}
                Rätt svar: <span className="font-medium text-foreground">{q.correct_answer}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
