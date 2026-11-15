import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { fetchEmailOptIn, setEmailOptIn } from "@/lib/email-optin.functions";
import { useAuth } from "@/hooks/useAuth";

/** Texten vid rutan. Samma ordalydelse överallt där samtycket ges. */
export const EMAIL_OPT_IN_LABEL =
  "Jag vill få mejl från Tvåkommanollan när nya prov, facit och funktioner läggs upp.";

/**
 * "Mejl från oss": den inloggades val om utskick, på /stats och
 * /avregistrera. Hämtas i webbläsaren eftersom kortet är privat. Gäster
 * (ingen adress) och misslyckad läsning renderar ingenting.
 */
export function EmailOptInCard({ className = "" }: { className?: string }) {
  const { user } = useAuth();
  const fetchFn = useServerFn(fetchEmailOptIn);
  const setFn = useServerFn(setEmailOptIn);
  const [optIn, setOptIn] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    fetchFn()
      .then((s) => {
        if (alive && s.hasEmail) setOptIn(s.optIn);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [user, fetchFn]);

  if (!user || optIn === null) return null;

  const change = async (next: boolean) => {
    if (busy) return;
    setBusy(true);
    setOptIn(next);
    try {
      await setFn({ data: { optIn: next } });
      toast.success(next ? "Du får mejl från oss." : "Du får inga fler mejl från oss.");
    } catch (e) {
      setOptIn(!next);
      toast.error("Kunde inte spara valet", {
        description: e instanceof Error ? e.message : "Försök igen om en stund.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      className={`rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6 ${className}`}
    >
      <h2
        className="text-base font-semibold text-[var(--cream)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Mejl från oss
      </h2>
      <label className="mt-3 flex min-h-[44px] cursor-pointer items-start gap-3 text-left text-sm leading-relaxed text-[var(--cream)]">
        <input
          type="checkbox"
          checked={optIn}
          disabled={busy}
          onChange={(e) => change(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-[var(--primary)]"
        />
        <span>{EMAIL_OPT_IN_LABEL}</span>
      </label>
      <p className="mt-1 max-w-xl text-sm leading-relaxed text-white/55">
        Mejl om ditt konto och dina köp skickas oavsett vad du väljer här.
      </p>
    </section>
  );
}
