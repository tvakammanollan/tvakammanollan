import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { fetchMyQuestionVotes, voteQuestion } from "@/lib/question-votes.functions";
import { trackEvent } from "@/lib/events";

interface QuestionVoteButtonsProps {
  questionId: string;
  category: string;
  surface: "train" | "result";
}

type Current = -1 | 0 | 1;

/**
 * Tumme upp/ned på en fråga man just svarat på. Rösterna styr urvalet: bra
 * frågor dras oftare och frågor många ogillar slutar delas ut
 * (`question-votes.ts`). Ett klick på samma tumme igen tar tillbaka rösten.
 *
 * Läget uppdateras direkt och rullas tillbaka om servern säger nej, så att
 * knappen inte känns död på ett långsamt nät.
 */
export function QuestionVoteButtons({ questionId, category, surface }: QuestionVoteButtonsProps) {
  const vote = useServerFn(voteQuestion);
  const fetchMine = useServerFn(fetchMyQuestionVotes);
  const [current, setCurrent] = useState<Current>(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setCurrent(0);
    fetchMine({ data: { questionIds: [questionId] } })
      .then((mine) => {
        if (!cancelled) setCurrent(mine[questionId] ?? 0);
      })
      .catch(() => {
        /* Utan läsning visas knapparna neutrala; en röst fungerar ändå. */
      });
    return () => {
      cancelled = true;
    };
  }, [questionId, fetchMine]);

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

  const base =
    "inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-white/[0.06] disabled:opacity-60";

  return (
    <span className="inline-flex items-center gap-0.5" role="group" aria-label="Betygsätt frågan">
      <button
        type="button"
        onClick={() => void cast(1)}
        disabled={busy}
        aria-pressed={current === 1}
        aria-label="Bra fråga"
        title="Bra fråga"
        className={`${base} ${current === 1 ? "text-[var(--success)]" : "text-muted-foreground hover:text-[var(--success)]"}`}
      >
        <ThumbsUp className={`h-3.5 w-3.5 ${current === 1 ? "fill-current" : ""}`} />
      </button>
      <button
        type="button"
        onClick={() => void cast(-1)}
        disabled={busy}
        aria-pressed={current === -1}
        aria-label="Dålig fråga"
        title="Dålig fråga"
        className={`${base} ${current === -1 ? "text-[var(--danger)]" : "text-muted-foreground hover:text-[var(--danger)]"}`}
      >
        <ThumbsDown className={`h-3.5 w-3.5 ${current === -1 ? "fill-current" : ""}`} />
      </button>
    </span>
  );
}
