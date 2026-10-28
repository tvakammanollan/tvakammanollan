import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { fetchQuestionVotes, voteQuestion } from "@/lib/question-votes.functions";
import { displayedVoteCounts } from "@/lib/question-votes";
import { formatInt } from "@/lib/sv-format";
import { trackEvent } from "@/lib/events";

interface QuestionVoteButtonsProps {
  questionId: string;
  category: string;
  surface: "train" | "result";
  /**
   * `large` är blocket under en besvarad fråga i `/train`: stora knappar, en
   * rad om varför rösten spelar roll. `compact` ryms i en rad på
   * resultatsidan bredvid rätt/fel.
   */
  size?: "large" | "compact";
}

type Current = -1 | 0 | 1;

/**
 * Tumme upp/ned på en fråga man just svarat på, med hur många som röstat åt
 * vardera hållet. Rösterna styr urvalet: bra frågor dras oftare och frågor
 * många ogillar slutar delas ut (`question-votes.ts`). Ett klick på samma
 * tumme igen tar tillbaka rösten.
 *
 * Läget och siffrorna uppdateras direkt och rullas tillbaka om servern säger
 * nej, så att knappen inte känns död på ett långsamt nät.
 */
export function QuestionVoteButtons({
  questionId,
  category,
  surface,
  size = "large",
}: QuestionVoteButtonsProps) {
  const vote = useServerFn(voteQuestion);
  const fetchVotes = useServerFn(fetchQuestionVotes);
  const [current, setCurrent] = useState<Current>(0);
  const [stored, setStored] = useState<Current>(0);
  const [server, setServer] = useState<{ up: number; down: number } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setCurrent(0);
    setStored(0);
    setServer(null);
    fetchVotes({ data: { questionIds: [questionId] } })
      .then((res) => {
        if (cancelled) return;
        const mine = res.mine[questionId] ?? 0;
        setCurrent(mine);
        setStored(mine);
        setServer(res.counts[questionId] ?? { up: 0, down: 0 });
      })
      .catch(() => {
        /* Utan läsning visas knapparna utan siffror; en röst fungerar ändå. */
      });
    return () => {
      cancelled = true;
    };
  }, [questionId, fetchVotes]);

  const cast = async (pressed: -1 | 1) => {
    if (busy) return;
    const next: Current = current === pressed ? 0 : pressed;
    const before = current;
    setCurrent(next);
    setBusy(true);
    try {
      await vote({ data: { questionId, vote: next } });
      trackEvent("question_voted", { category, vote: next, surface });
    } catch (e) {
      setCurrent(before);
      toast.error(e instanceof Error ? e.message : "Rösten kunde inte sparas.");
    } finally {
      setBusy(false);
    }
  };

  const counts = server ? displayedVoteCounts(server, stored, current) : null;

  if (size === "compact") {
    const base =
      "inline-flex h-8 items-center gap-1 rounded-full border px-2.5 text-xs font-semibold transition-colors disabled:opacity-60";
    return (
      <span className="inline-flex items-center gap-1.5" role="group" aria-label="Betygsätt frågan">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            void cast(1);
          }}
          disabled={busy}
          aria-pressed={current === 1}
          aria-label="Bra fråga"
          title="Bra fråga"
          className={`${base} ${
            current === 1
              ? "border-success bg-success text-on-brand"
              : "border-success-line bg-success-soft text-success hover:border-success"
          }`}
        >
          <ThumbsUp className={`h-3.5 w-3.5 ${current === 1 ? "fill-current" : ""}`} />
          {counts && <span className="tabular-nums">{formatInt(counts.up)}</span>}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            void cast(-1);
          }}
          disabled={busy}
          aria-pressed={current === -1}
          aria-label="Dålig fråga"
          title="Dålig fråga"
          className={`${base} ${
            current === -1
              ? "border-danger bg-danger text-on-brand"
              : "border-danger-line bg-danger-soft text-destructive hover:border-danger"
          }`}
        >
          <ThumbsDown className={`h-3.5 w-3.5 ${current === -1 ? "fill-current" : ""}`} />
          {counts && <span className="tabular-nums">{formatInt(counts.down)}</span>}
        </button>
      </span>
    );
  }

  const base =
    "inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 text-[15px] font-bold transition-all active:scale-[0.97] disabled:opacity-60";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-sm font-semibold text-foreground">Var det här en bra fråga?</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Din röst avgör vilka frågor som visas oftare och vilka som sållas bort.
      </p>
      <div className="mt-3 flex gap-2" role="group" aria-label="Betygsätt frågan">
        <button
          type="button"
          onClick={() => void cast(1)}
          disabled={busy}
          aria-pressed={current === 1}
          className={`${base} ${
            current === 1
              ? "border-success bg-success text-on-brand shadow-[0_4px_14px_rgba(47,107,60,0.35)]"
              : "border-success-line bg-success-soft text-success hover:border-success"
          }`}
        >
          <ThumbsUp className={`h-5 w-5 ${current === 1 ? "fill-current" : ""}`} />
          Bra fråga
          {counts && (
            <span className="text-xs tabular-nums">
              {formatInt(counts.up)}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => void cast(-1)}
          disabled={busy}
          aria-pressed={current === -1}
          className={`${base} ${
            current === -1
              ? "border-danger bg-danger text-on-brand shadow-[0_4px_14px_rgba(211,47,47,0.35)]"
              : "border-danger-line bg-danger-soft text-destructive hover:border-danger"
          }`}
        >
          <ThumbsDown className={`h-5 w-5 ${current === -1 ? "fill-current" : ""}`} />
          Dålig fråga
          {counts && (
            <span className="text-xs tabular-nums">
              {formatInt(counts.down)}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
