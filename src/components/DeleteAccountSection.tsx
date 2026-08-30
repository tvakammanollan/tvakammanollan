import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { deleteAccount } from "@/lib/account.functions";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

/**
 * GDPR: självservice-radering av konto (danger zone på /stats).
 * Kräver att användaren skriver RADERA — servern validerar samma sträng.
 */
export function DeleteAccountSection() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const deleteFn = useServerFn(deleteAccount);
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  const doDelete = async () => {
    if (confirmText.trim().toUpperCase() !== "RADERA" || busy) return;
    setBusy(true);
    try {
      await deleteFn({ data: { confirm: "RADERA" } });
      toast.success("Ditt konto är raderat.", {
        description: "Tack för den här tiden. Lycka till på provet!",
      });
      await signOut().catch(() => {});
      navigate({ to: "/" });
    } catch (e) {
      toast.error("Kunde inte radera kontot", {
        description:
          e instanceof Error ? e.message : "Försök igen eller mejla info@tvakommanollan.se.",
      });
      setBusy(false);
    }
  };

  return (
    <section className="mt-10 rounded-2xl border border-destructive/25 bg-destructive/[0.04] p-5 sm:p-6">
      <h2
        className="text-base font-semibold text-[var(--cream)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Radera konto
      </h2>
      {/* Texten måste stämma med `deleteAccount` rad för rad. Den sa tidigare
          "all personlig historik" medan sju tabeller med personuppgifter
          faktiskt låg kvar — provförsök, e-postverifieringar, forumets
          prenumerationer, reaktioner och anmälningar, veckoutmaningar och
          ringlistan. De raderas nu, och listan nedan speglar koden. */}
      <div className="mt-1.5 max-w-xl space-y-2 text-sm leading-relaxed text-white/55">
        <p>
          <strong className="text-[var(--cream)]">Raderas permanent:</strong> inloggning och e-post,
          ditt användarnamn, vänner och inbjudningar, ordträning, dina svar och din ELO-historik,
          provförsök, forumprenumerationer och reaktioner, samt dina uppgifter i kontaktlistan för
          coachning.
        </p>
        <p>
          <strong className="text-[var(--cream)]">Behålls:</strong> matchresultat och forumsinlägg,
          men utan ditt namn — motståndarens historik och trådarnas läsbarhet ska överleva. Har du
          köpt studieupplägget behålls köpuppgifterna, eftersom bokföring kräver det.
        </p>
        <p>Detta går inte att ångra.</p>
      </div>
      <Button
        variant="outline"
        className="mt-4 gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => {
          setConfirmText("");
          setOpen(true);
        }}
      >
        <Trash2 className="h-4 w-4" />
        Radera mitt konto
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Radera kontot permanent?</AlertDialogTitle>
            <AlertDialogDescription>
              Detta raderar din inloggning och alla personuppgifter. Det går inte att ångra. Skriv{" "}
              <strong>RADERA</strong> för att bekräfta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="RADERA"
            aria-label="Skriv RADERA för att bekräfta"
            autoFocus
          />
          <AlertDialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
              Avbryt
            </Button>
            <Button
              variant="destructive"
              disabled={confirmText.trim().toUpperCase() !== "RADERA" || busy}
              onClick={doDelete}
              className="gap-1.5"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Radera permanent
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
