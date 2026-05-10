import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Zap, Link2, KeyRound, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export type MatchType = "verbal" | "math";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchType: MatchType;
}

type Mode = "choose" | "join";

export function MatchmakerModal({ open, onOpenChange, matchType }: Props) {
  const [mode, setMode] = useState<Mode>("choose");
  const [code, setCode] = useState("");

  const reset = () => {
    setMode("choose");
    setCode("");
  };

  const close = () => {
    onOpenChange(false);
    setTimeout(reset, 200);
  };

  const typeLabel = matchType === "verbal" ? "Verbal" : "Matte";

  // Placeholder handlers — match-skapandet implementeras i kommande prompt
  const handleQuickMatch = () => {
    toast.info("Snabbmatch mot bot kommer i nästa steg", {
      description: `Match-typ: ${typeLabel}`,
    });
    close();
  };

  const handleCreateRoom = () => {
    toast.info("Privat rum kommer i nästa steg", {
      description: `Match-typ: ${typeLabel}`,
    });
    close();
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) {
      toast.error("Rumkoden måste vara 6 tecken");
      return;
    }
    toast.info("Gå med i rum kommer i nästa steg", {
      description: `Kod: ${code.toUpperCase()}`,
    });
    close();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(v) : close())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "var(--font-display)" }}>
            {mode === "choose" ? `Starta ${typeLabel.toLowerCase()} battle` : "Gå med i rum"}
          </DialogTitle>
          <DialogDescription>
            {mode === "choose"
              ? "Välj hur du vill spela."
              : "Ange den 6-teckens kod du fått av din motståndare."}
          </DialogDescription>
        </DialogHeader>

        {mode === "choose" ? (
          <div className="grid gap-2.5">
            <ChoiceCard
              icon={<Zap className="h-5 w-5" />}
              title="Snabbmatch"
              subtitle="Hoppa in direkt, matchas mot en bot baserat på din ELO"
              accent="primary"
              onClick={handleQuickMatch}
            />
            <ChoiceCard
              icon={<Link2 className="h-5 w-5" />}
              title="Privat rum"
              subtitle="Skapa ett rum och dela koden med en vän"
              accent="secondary"
              onClick={handleCreateRoom}
            />
            <ChoiceCard
              icon={<KeyRound className="h-5 w-5" />}
              title="Gå med i rum"
              subtitle="Ange en 6-teckens kod för att ansluta till en pågående väntan"
              accent="muted"
              onClick={() => setMode("join")}
            />
          </div>
        ) : (
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
              <Button type="submit">Anslut</Button>
            </div>
          </form>
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
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accent: "primary" | "secondary" | "muted";
  onClick: () => void;
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
      className="group flex items-start gap-3 rounded-xl border border-border bg-card p-3.5 text-left shadow-card transition hover:-translate-y-px hover:border-primary/40 hover:shadow-elevated"
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
