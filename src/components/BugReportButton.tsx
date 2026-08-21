import { useState } from "react";
import { Bug, CheckCircle2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";
import { submitBugReport } from "@/lib/bug-report.functions";

/* =====================================================================
   RAPPORTERA BUGG

   Knappen krävde tidigare inloggning och svarade "Du måste vara inloggad
   för att rapportera buggar" — alltså ingen väg alls för den som stötte på
   ett fel i startsidan, registreringen eller gamla prov, som alla går att
   använda utan konto. Rapporten hamnade dessutom i en tabell som ingen
   läste: inget mejl, ingen notis.

   Nu går inskicket genom en serverfunktion som skriver raden med service
   role OCH mejlar den vidare, och rutan visar en riktig bekräftelse i
   stället för att bara stängas.
   ===================================================================== */

export function BugReportButton({ variant = "icon" }: { variant?: "icon" | "text" }) {
  const { user } = useAuth();
  const submitFn = useServerFn(submitBugReport);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [replyEmail, setReplyEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Ett riktigt konto har en adress vi redan känner. Gäster (anonym
  // inloggning) har det inte, och ska därför få frågan precis som utloggade.
  const harKontoEpost = !!user && !user.is_anonymous;

  const stäng = (v: boolean) => {
    setOpen(v);
    if (!v) {
      // Nollställ först när rutan stängts, annars blinkar formuläret förbi
      // ovanpå bekräftelsen på vägen ut.
      setTimeout(() => {
        setSent(false);
        setMsg("");
        setReplyEmail("");
      }, 200);
    }
  };

  const submit = async () => {
    if (msg.trim().length < 5) {
      toast.error("Skriv lite mer så vi förstår problemet.");
      return;
    }
    setSending(true);
    try {
      await submitFn({
        data: {
          message: msg.trim(),
          page: typeof window !== "undefined" ? window.location.pathname : undefined,
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 400) : undefined,
          replyEmail: replyEmail.trim() || undefined,
        },
      });
      setSent(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kunde inte skicka. Försök igen.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={stäng}>
      <DialogTrigger asChild>
        {variant === "icon" ? (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
            title="Rapportera bugg"
            aria-label="Rapportera bugg"
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
        {sent ? (
          <>
            <DialogHeader>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#2f6b3c]/15 text-[#2f6b3c]">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <DialogTitle className="text-center">Tack! Rapporten är skickad</DialogTitle>
              <DialogDescription className="text-center">
                Den ligger nu hos oss tillsammans med vilken sida du var på, så vi kan börja leta
                direkt.
                {replyEmail.trim() || harKontoEpost
                  ? " Vi hör av oss om vi behöver veta mer."
                  : " Vill du ha svar kan du mejla info@tvakommanollan.se så kopplar vi ihop det."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => stäng(false)} className="w-full">
                Stäng
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Rapportera bugg</DialogTitle>
              <DialogDescription>
                Tvåkommanollan byggs fortfarande, så en del går sönder. Beskriv vad som hände och
                vad du väntade dig. Det räcker långt.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="T.ex. 'Jag vann 6–3 mot boten men resultatsidan sa oavgjort.'"
              rows={5}
              maxLength={2000}
              aria-label="Beskriv buggen"
            />
            {!harKontoEpost && (
              <div>
                <Input
                  type="email"
                  value={replyEmail}
                  onChange={(e) => setReplyEmail(e.target.value)}
                  placeholder="Din e-post (frivilligt)"
                  aria-label="Din e-postadress, frivilligt"
                  maxLength={200}
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Bara om du vill ha svar. Vi använder den inte till något annat.
                </p>
              </div>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => stäng(false)}>
                Avbryt
              </Button>
              <Button onClick={() => void submit()} disabled={sending}>
                {sending ? "Skickar…" : "Skicka"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
