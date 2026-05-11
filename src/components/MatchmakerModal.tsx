import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Zap, Link2, KeyRound, ArrowLeft, Copy, Loader2, Target } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { createMatch, joinMatch } from "@/lib/match.functions";
import { supabase } from "@/integrations/supabase/client";

export type MatchType = "verbal" | "math";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchType: MatchType;
}

type Mode = "choose" | "join" | "waiting";

export function MatchmakerModal({ open, onOpenChange, matchType }: Props) {
  const [mode, setMode] = useState<Mode>("choose");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [waitingMatchId, setWaitingMatchId] = useState<string | null>(null);
  const [waitingCode, setWaitingCode] = useState<string>("");
  const navigate = useNavigate();
  const createFn = useServerFn(createMatch);
  const joinFn = useServerFn(joinMatch);

  const reset = () => {
    setMode("choose");
    setCode("");
    setWaitingMatchId(null);
    setWaitingCode("");
    setBusy(false);
  };

  const close = () => {
    onOpenChange(false);
    setTimeout(reset, 200);
  };

  // Subscribe to match status when waiting in private room
  useEffect(() => {
    if (mode !== "waiting" || !waitingMatchId) return;
    const channel = supabase
      .channel(`waiting-${waitingMatchId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "matches",
          filter: `id=eq.${waitingMatchId}`,
        },
        (payload) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const row = payload.new as any;
          if (row.status === "active") {
            navigate({ to: "/match/$matchId", params: { matchId: waitingMatchId } });
            close();
          }
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, waitingMatchId]);

  const typeLabel = matchType === "verbal" ? "Verbal" : "Matte";

  const handleQuickMatch = async () => {
    setBusy(true);
    try {
      const res = await createFn({ data: { match_type: matchType, mode: "bot" } });
      navigate({ to: "/match/$matchId", params: { matchId: res.match_id } });
      close();
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Kunde inte starta matchen");
    } finally {
      setBusy(false);
    }
  };

  const handleCreateRoom = async () => {
    setBusy(true);
    try {
      const res = await createFn({ data: { match_type: matchType, mode: "private" } });
      setWaitingMatchId(res.match_id);
      setWaitingCode(res.room_code ?? "");
      setMode("waiting");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Kunde inte skapa rum");
    } finally {
      setBusy(false);
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) {
      toast.error("Rumkoden måste vara 6 tecken");
      return;
    }
    setBusy(true);
    try {
      const res = await joinFn({ data: { room_code: code.toUpperCase() } });
      navigate({ to: "/match/$matchId", params: { matchId: res.match_id } });
      close();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kunde inte ansluta");
    } finally {
      setBusy(false);
    }
  };

  const shareUrl =
    waitingCode && typeof window !== "undefined"
      ? `${window.location.origin}/join/${waitingCode}`
      : "";

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(v) : close())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "var(--font-display)" }}>
            {mode === "choose"
              ? `Starta ${typeLabel.toLowerCase()} battle`
              : mode === "join"
              ? "Gå med i rum"
              : "Väntar på motståndare"}
          </DialogTitle>
          <DialogDescription>
            {mode === "choose"
              ? "Välj hur du vill spela."
              : mode === "join"
              ? "Ange den 6-teckens kod du fått av din motståndare."
              : "Dela koden eller länken nedan. Matchen startar automatiskt när någon ansluter."}
          </DialogDescription>
        </DialogHeader>

        {mode === "choose" && (
          <div className="grid gap-2.5">
            <ChoiceCard
              icon={busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
              title="Snabbmatch"
              subtitle="Hoppa in direkt, matchas mot en bot baserat på din ELO"
              accent="primary"
              onClick={handleQuickMatch}
              disabled={busy}
            />
            <ChoiceCard
              icon={<Link2 className="h-5 w-5" />}
              title="Privat rum"
              subtitle="Skapa ett rum och dela koden med en vän"
              accent="secondary"
              onClick={handleCreateRoom}
              disabled={busy}
            />
            <ChoiceCard
              icon={<KeyRound className="h-5 w-5" />}
              title="Gå med i rum"
              subtitle="Ange en 6-teckens kod för att ansluta till en pågående väntan"
              accent="muted"
              onClick={() => setMode("join")}
              disabled={busy}
            />
          </div>
        )}

        {mode === "join" && (
          <form onSubmit={handleJoinSubmit} className="grid gap-3">
            <Input
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="HP4829"
              maxLength={6}
              className="text-center text-lg font-semibold tracking-[0.4em] uppercase"
            />
            <div className="flex items-center justify-between gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setMode("choose")}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Tillbaka
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Ansluter…" : "Anslut"}
              </Button>
            </div>
          </form>
        )}

        {mode === "waiting" && (
          <div className="grid gap-4">
            <div className="rounded-xl border border-border bg-background p-5 text-center">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Rumkod</div>
              <div className="mt-1 text-3xl font-bold tracking-[0.3em]">{waitingCode}</div>
            </div>
            <div className="flex items-center gap-2">
              <Input readOnly value={shareUrl} className="text-xs" />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  toast.success("Länk kopierad");
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Väntar på att någon ansluter…
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ChoiceCard({
  icon,
  title,
  subtitle,
  accent,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accent: "primary" | "secondary" | "muted";
  onClick: () => void;
  disabled?: boolean;
}) {
  const iconBg =
    accent === "primary"
      ? "bg-primary text-primary-foreground"
      : accent === "secondary"
      ? "bg-secondary text-secondary-foreground"
      : "bg-muted text-foreground";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex items-start gap-3 rounded-xl border border-border bg-card p-3.5 text-left shadow-card transition hover:-translate-y-px hover:border-primary/40 hover:shadow-elevated disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
        {icon}
      </span>
      <span className="flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
          {subtitle}
        </span>
      </span>
    </button>
  );
}
