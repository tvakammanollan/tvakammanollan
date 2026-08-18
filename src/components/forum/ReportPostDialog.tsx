import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { reportForumPost } from "@/lib/forum.functions";
import { REPORT_REASONS, type ReportReason } from "@/lib/forum";

/**
 * Rapportknappens dialog.
 *
 * Öppen för alla inloggade, gäster inkluderade: att rapportera är billigt och
 * signalen är värd mer än risken. Att den finns och fungerar är dessutom ett
 * krav i BBS-lagen, inte en trevlig detalj.
 */
export function ReportPostDialog({
  postId,
  open,
  onOpenChange,
}: {
  postId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [reason, setReason] = useState<ReportReason>("spam");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const report = useServerFn(reportForumPost);

  const submit = async () => {
    setSending(true);
    try {
      await report({ data: { postId, reason, note: note.trim() || undefined } });
      toast.success("Tack, inlägget är rapporterat.");
      onOpenChange(false);
      setNote("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Något gick fel.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rapportera inlägg</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup value={reason} onValueChange={(v) => setReason(v as ReportReason)}>
            {REPORT_REASONS.map((r) => (
              <div key={r.value} className="flex items-center gap-2">
                <RadioGroupItem value={r.value} id={`report-${postId}-${r.value}`} />
                <Label htmlFor={`report-${postId}-${r.value}`} className="font-normal">
                  {r.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div>
            <Label htmlFor={`report-note-${postId}`} className="text-xs">
              Kommentar (frivillig)
            </Label>
            <Textarea
              id={`report-note-${postId}`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={3}
              className="mt-1"
              placeholder="Vad är problemet?"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={submit} disabled={sending}>
            {sending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Rapportera
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
