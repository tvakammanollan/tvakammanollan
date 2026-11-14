import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  cancelOrdSubscription,
  getOrdPurchaseStatus,
  resumeOrdSubscription,
  type OrdPurchaseStatus,
} from "@/lib/ord-paywall.functions";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDate, formatMoney } from "@/lib/sv-format";

/** "14 december 2026", i svensk tid. Kortet renderas bara i webbläsaren. */
function datum(iso: string): string {
  return formatDate(iso, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Stockholm",
  });
}

/**
 * "Ditt köp": vad användaren har köpt, hur länge det gäller och, för
 * månadsprenumerationen, knappen för att säga upp. Står på /stats ovanför
 * kontoraderingen och i /kassa när köpet redan är gjort.
 *
 * Hämtas i webbläsaren: kortet är privat, och sidorna det står på
 * serverrenderas lika för alla. Utan köp renderas ingenting.
 */
export function OrdPurchaseCard({ className = "" }: { className?: string }) {
  const { user } = useAuth();
  const getStatus = useServerFn(getOrdPurchaseStatus);
  const cancelFn = useServerFn(cancelOrdSubscription);
  const resumeFn = useServerFn(resumeOrdSubscription);
  const [status, setStatus] = useState<OrdPurchaseStatus | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    getStatus()
      .then((s) => {
        if (alive) setStatus(s);
      })
      .catch(() => {
        // Kortet är information, inte ett flöde. Saknas det kan köpet
        // fortfarande användas och sägas upp en annan gång.
      });
    return () => {
      alive = false;
    };
  }, [user, getStatus]);

  if (!user || !status) return null;

  const change = async (cancel: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      const next = await (cancel ? cancelFn() : resumeFn());
      setStatus(next);
      setOpen(false);
      if (cancel) {
        toast.success("Prenumerationen är uppsagd.", {
          description: next.expiresAt
            ? `Du har kvar tillgången till den ${datum(next.expiresAt)}.`
            : undefined,
        });
      } else {
        toast.success("Prenumerationen fortsätter.");
      }
    } catch (e) {
      toast.error(cancel ? "Kunde inte säga upp" : "Kunde inte ångra uppsägningen", {
        description:
          e instanceof Error ? e.message : "Försök igen eller mejla info@tvakommanollan.se.",
      });
    } finally {
      setBusy(false);
    }
  };

  const until = status.expiresAt ? datum(status.expiresAt) : null;
  const price = status.monthlyAmount !== null ? `${formatMoney(status.monthlyAmount)} per månad. ` : "";
  const isSub = status.kind === "subscription";

  let line: string;
  if (!status.active) {
    line = until ? `Gick ut den ${until}.` : "Köpet gäller inte längre.";
  } else if (isSub && status.status === "past_due") {
    line = `Senaste dragningen gick inte igenom, och Stripe försöker igen. Tillgången gäller till den ${until}.`;
  } else if (isSub && status.cancelAtPeriodEnd) {
    line = `Uppsagd. Tillgången gäller till den ${until}, och inga fler dragningar görs.`;
  } else if (isSub && status.renews) {
    line = `${price}Förnyas den ${until}.`;
  } else if (until) {
    line = `Gäller till den ${until}.`;
  } else {
    line = "Gäller utan tidsgräns.";
  }

  const canCancel = isSub && status.active && status.renews && !status.cancelAtPeriodEnd;
  const canResume = isSub && status.active && status.cancelAtPeriodEnd;

  return (
    <section
      className={`rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6 ${className}`}
    >
      <h2
        className="text-base font-semibold text-[var(--cream)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Ditt köp
      </h2>
      <p className="mt-1.5 text-sm text-[var(--cream)]">
        Hela ordlistan och MEK{isSub ? ", månadsprenumeration" : ""}
      </p>
      <p className="mt-1 max-w-xl text-sm leading-relaxed text-white/55">{line}</p>

      {canCancel && (
        <Button variant="outline" className="mt-4" onClick={() => setOpen(true)}>
          Säg upp
        </Button>
      )}
      {canResume && (
        <Button
          variant="outline"
          className="mt-4 gap-1.5"
          disabled={busy}
          onClick={() => change(false)}
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Ångra uppsägningen
        </Button>
      )}
      {!status.active && (
        <p className="mt-3 text-sm">
          <Link to="/kassa" className="font-semibold text-primary underline-offset-2 hover:underline">
            Köp igen
          </Link>
        </p>
      )}

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Säg upp prenumerationen?</AlertDialogTitle>
            <AlertDialogDescription>
              Du har kvar hela ordlistan och MEK till den {until}. Efter det dras inga fler pengar.
              Du kan ångra uppsägningen fram till dess.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
              Behåll
            </Button>
            <Button onClick={() => change(true)} disabled={busy} className="gap-1.5">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Säg upp
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
