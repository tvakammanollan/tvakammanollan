import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Mail, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchVerificationStatus,
  sendVerificationEmail,
  type VerificationStatus,
} from "@/lib/email-verification.functions";

/* =====================================================================
   Påminnelsen om att bekräfta e-postadressen.

   En diskret remsa, inte en vägg: registreringen loggar in direkt och allt
   i appen fungerar utan att adressen är bekräftad (undantaget forumet, som
   säger det rakt ut när man försöker skriva). Därför får den här rutan
   heller aldrig ligga över något — den är en rad under navbaren som går
   att stänga.

   Stängningen sparas i sessionStorage och inte localStorage: en påminnelse
   som stängs bort för alltid är ingen påminnelse. Nästa besök frågar igen,
   men samma flik gör det inte.
   ===================================================================== */

const DISMISS_KEY = "tkn:verify-notice-dismissed";

export function EmailVerificationNotice() {
  const { user, loading } = useAuth();
  const getStatus = useServerFn(fetchVerificationStatus);
  const sendMail = useServerFn(sendVerificationEmail);
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  useEffect(() => {
    // Gäster har ingen adress att bekräfta, och utloggade ser inget alls.
    if (loading || !user || user.is_anonymous) return;
    let cancelled = false;
    (async () => {
      try {
        const res = (await getStatus()) as VerificationStatus;
        if (!cancelled) setStatus(res);
      } catch {
        /* En trasig statusfråga får inte visa en påminnelse på lösa grunder. */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, loading, getStatus]);

  if (!status?.needsVerification || dismissed) return null;

  const close = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* privat läge — stängningen lever då bara i minnet */
    }
  };

  const resend = async () => {
    if (sending) return;
    setSending(true);
    try {
      const res = (await sendMail()) as { sent: boolean };
      toast[res.sent ? "success" : "error"](
        res.sent
          ? `Mejl skickat till ${status.email}. Kolla skräpposten om det dröjer.`
          : "Kunde inte skicka just nu. Försök igen om en stund.",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kunde inte skicka just nu.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="border-b border-[#7a5236]/25 bg-[#7a5236]/[0.07] px-4 py-2.5"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
        <Mail className="h-4 w-4 shrink-0 text-[#7a5236]" aria-hidden />
        <span className="min-w-0 flex-1 text-[var(--cream)]">
          Bekräfta <strong>{status.email}</strong> när du får en stund. Allt fungerar under tiden.
        </span>
        <button
          type="button"
          onClick={() => void resend()}
          disabled={sending}
          className="shrink-0 rounded-full border border-[#7a5236]/40 px-3 py-1 text-xs font-semibold text-[#7a5236] transition-colors hover:bg-[#7a5236]/10 disabled:opacity-60"
        >
          {sending ? "Skickar…" : "Skicka mejlet igen"}
        </button>
        <button
          type="button"
          onClick={close}
          aria-label="Dölj påminnelsen"
          className="shrink-0 rounded-full p-1 text-[#7a5236] transition-colors hover:bg-[#7a5236]/10"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
