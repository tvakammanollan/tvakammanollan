import { useState } from "react";
import { Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { rateLimit, limits } from "@/lib/rate-limit";

export function BugReportButton({
  variant = "icon",
}: {
  variant?: "icon" | "text";
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!user) {
      toast.error("Du måste vara inloggad för att rapportera buggar.");
      return;
    }
    if (msg.trim().length < 3) {
      toast.error("Skriv lite mer så vi förstår problemet.");
      return;
    }
    // Client-side throttle (server enforces too via submit_bug_report RPC).
    const r = rateLimit(`bug:${user.id}`, limits.bugReport);
    if (!r.ok) {
      toast.error(
        `Vänta ${Math.ceil(r.resetIn / 60000)} min innan nästa rapport.`,
      );
      return;
    }
    setSending(true);
    // Try the new RPC (with throttle + rate limit). Fall back to direct
    // insert into bug_reports if the migration isn't applied yet.
    const meta = {
      page: typeof window !== "undefined" ? window.location.pathname : null,
      user_agent:
        typeof navigator !== "undefined" ? navigator.userAgent : null,
    };
    const r1 = await supabase.rpc("submit_bug_report", {
      _message: msg.trim(),
      _meta: meta,
    });
    let error = r1.error;
    if (error && /function .* does not exist|could not find/i.test(error.message)) {
      // Legacy path
      const r2 = await supabase.from("bug_reports").insert({
        user_id: user.id,
        message: msg.trim(),
        page: meta.page,
        user_agent: meta.user_agent,
      });
      error = r2.error;
    }
    setSending(false);
    if (error) {
      toast.error(error.message ?? "Kunde inte skicka. Försök igen.");
      return;
    }
    toast.success("Tack! Buggen är rapporterad.");
    setMsg("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === "icon" ? (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
            title="Rapportera bugg"
          >
            <Bug className="h-4 w-4" />
            <span className="hidden sm:inline">Rapportera bugg</span>
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="gap-1.5">
            <Bug className="h-4 w-4" /> Rapportera bugg
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rapportera bugg</DialogTitle>
          <DialogDescription>
            HP Kampen är ett projekt under uppbyggnad så vissa buggar finns
            tyvärr fortfarande. Beskriv vad som gick fel så fixar vi det.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="T.ex. 'Det stod oavgjort men jag tappade ELO i match X'…"
          rows={5}
          maxLength={2000}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Avbryt
          </Button>
          <Button onClick={submit} disabled={sending}>
            {sending ? "Skickar…" : "Skicka"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
