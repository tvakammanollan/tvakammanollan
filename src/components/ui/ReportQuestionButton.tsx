import { useEffect, useState } from "react";
import { Flag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReportQuestionButtonProps {
  questionId: string;
  userId: string;
  questionText?: string;
}

type Reason =
  | "wrong_answer"
  | "unclear_question"
  | "technical_error"
  | "other";

const REASONS: Array<{ value: Reason; label: string }> = [
  { value: "wrong_answer", label: "Felaktigt svar" },
  { value: "unclear_question", label: "Otydlig eller dåligt formulerad fråga" },
  { value: "technical_error", label: "Tekniskt fel (t.ex. text som saknas)" },
  { value: "other", label: "Annat" },
];

const STORE_KEY = "reported_questions";

function loadReported(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveReported(set: Set<string>) {
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    /* ignore */
  }
}

export function ReportQuestionButton({
  questionId,
  userId,
  questionText,
}: ReportQuestionButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<Reason | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reported, setReported] = useState(false);

  useEffect(() => {
    setReported(loadReported().has(questionId));
  }, [questionId]);

  const submit = async () => {
    if (!reason) return;
    setSubmitting(true);
    const { error } = await supabase.from("question_reports").insert({
      question_id: questionId,
      reporter_id: userId,
      reason,
      comment: comment.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      if (
        error.code === "23505" ||
        /unique|duplicate/i.test(error.message)
      ) {
        toast.info("Du har redan rapporterat denna fråga");
        const s = loadReported();
        s.add(questionId);
        saveReported(s);
        setReported(true);
        setOpen(false);
        return;
      }
      toast.error("Kunde inte skicka rapport", { description: error.message });
      return;
    }
    const s = loadReported();
    s.add(questionId);
    saveReported(s);
    setReported(true);
    setOpen(false);
    setReason(null);
    setComment("");
    toast.success("Tack! Din rapport har skickats.");
  };

  if (reported) {
    return (
      <button
        type="button"
        title="Rapporterad"
        aria-label="Rapporterad"
        className="inline-flex h-7 w-7 cursor-default items-center justify-center rounded-full text-[#c0392b]"
      >
        <Flag className="h-3.5 w-3.5 fill-current" />
      </button>
    );
  }

  const truncated =
    questionText && questionText.length > 60
      ? questionText.slice(0, 60).trimEnd() + "…"
      : questionText;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Rapportera fråga"
        aria-label="Rapportera fråga"
        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#9a9a9a] transition-colors hover:bg-muted hover:text-[#e67e22]"
      >
        <Flag className="h-3.5 w-3.5" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[340px]">
          <DialogHeader>
            <DialogTitle>Rapportera fråga</DialogTitle>
          </DialogHeader>
          {truncated && (
            <p className="text-xs italic text-muted-foreground">{truncated}</p>
          )}
          <fieldset className="space-y-2">
            <legend className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground">
              Anledning
            </legend>
            {REASONS.map((r) => (
              <label
                key={r.value}
                className="flex cursor-pointer items-start gap-2 rounded-md border border-border bg-background p-2 text-sm hover:border-[#f2a65a]"
              >
                <input
                  type="radio"
                  name="report-reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="mt-1 accent-[#f2a65a]"
                />
                <span>{r.label}</span>
              </label>
            ))}
          </fieldset>
          <div>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 300))}
              placeholder="Beskriv problemet kortfattat (valfritt)"
              rows={3}
              className="resize-none text-sm"
            />
            <div className="mt-1 text-right text-[11px] text-muted-foreground">
              {comment.length}/300
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Avbryt
            </Button>
            <Button
              onClick={() => void submit()}
              disabled={!reason || submitting}
              className="bg-[#f2a65a] text-[#1a0d04] hover:bg-[#c97b41]"
            >
              Skicka rapport
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
