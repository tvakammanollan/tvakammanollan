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
        description: "Tack för den här tiden — lycka till på provet!",
      });
      await signOut().catch(() => {});
      navigate({ to: "/" });
    } catch (e) {
      toast.error("Kunde inte radera kontot", {
        description: e instanceof Error ? e.message : "Försök igen eller mejla info@hpkampen.se.",
      });
      setBusy(false);
    }
  };

  return (
    <section className="mt-10 rounded-2xl border border-[#8c1d18]/25 bg-[#8c1d18]/[0.04] p-5 sm:p-6">
      <h2
        className="text-base font-semibold text-[#2e1e14]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Radera konto
      </h2>
      <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-white/55">
        Raderar din inloggning, e-post, vänner, ordträning och all personlig historik permanent.
        Matchresultat behålls i anonymiserad form (utan namn). Detta går inte att ångra.
      </p>
      <Button
        variant="outline"
        className="mt-4 gap-1.5 border-[#8c1d18]/40 text-[#8c1d18] hover:bg-[#8c1d18]/10 hover:text-[#8c1d18]"
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
