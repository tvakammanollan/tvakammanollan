import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { GlassCard } from "@/components/layout/GlassCard";
import { AuthDivider, GoogleButton } from "@/components/auth/GoogleButton";
import { claimGuestPurchase, syncProfileEmail } from "@/lib/guest-upgrade.functions";
import { sendVerificationEmail } from "@/lib/email-verification.functions";
import { currentGuestToken, upgradeGuest } from "@/lib/guest-upgrade";
import { announcePremiumChanged, clearGuestClaim, storeGuestClaim } from "@/lib/guest-claim";
import { trackEvent } from "@/lib/events";
import { trackError } from "@/lib/telemetry";

/**
 * Steget efter ett köp som gäst: skapa ett konto så att köpet inte bara finns
 * i den här webbläsaren.
 *
 * Förstahandsvägen gör om gästen till ett riktigt konto med SAMMA id
 * (`upgradeGuest`), och köpet följer med utan att något flyttas. Hör adressen
 * redan till ett konto byter rutan till inloggning: då får personen ett annat
 * id, och köpet flyttas dit med gästens token (`claimGuestPurchase`). Tokenen
 * läses medan gästen fortfarande är inloggad och hålls i minnet; Google-vägen
 * lämnar sidan och sparar den i stället (`GoogleButton`), och roten flyttar
 * köpet när Google skickat tillbaka.
 *
 * Adressen är förifylld med den som skrevs i Stripes kassa. Den som köpt vill
 * nästan alltid ha kvittot och kontot på samma adress, och ett fält mindre att
 * fylla i är det som gör att steget blir av.
 */

export type SaveGuestOutcome = "created" | "moved" | "conflict";

const schema = z.object({
  email: z.string().trim().email("Skriv en giltig e-postadress").max(255),
  password: z.string().min(6, "Lösenordet måste vara minst 6 tecken").max(128),
});

const inputClass =
  "h-12 w-full rounded-full border border-input bg-white/[0.04] px-5 text-center text-[15px] text-white placeholder:text-white/45 transition-colors focus:bg-white/[0.06]";

const EXISTS_TEXT =
  "Det finns redan ett konto med den adressen. Logga in med det, så flyttas köpet dit.";

export function SaveGuestPurchase({
  defaultEmail,
  onDone,
  onSkip,
}: {
  defaultEmail: string | null;
  onDone: (outcome: SaveGuestOutcome) => void;
  onSkip: () => void;
}) {
  const { refreshProfile } = useAuth();
  const syncEmail = useServerFn(syncProfileEmail);
  const sendVerification = useServerFn(sendVerificationEmail);
  const claim = useServerFn(claimGuestPurchase);

  const [mode, setMode] = useState<"create" | "login">("create");
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  /** Satt när inloggningen gick men flytten inte gjorde det: då går det att försöka igen. */
  const [pendingToken, setPendingToken] = useState<string | null>(null);

  const switchMode = (next: "create" | "login") => {
    setMode(next);
    setError(null);
    setNotice(null);
    setPassword("");
  };

  /** Flyttar köpet till kontot som just loggade in. */
  const moveTo = async (guestToken: string) => {
    try {
      const { result } = await claim({ data: { guestToken } });
      if (result === "not_ready") throw new Error("Sessionen hann inte bytas");
      setPendingToken(null);
      clearGuestClaim();
      if (result === "conflict") {
        trackEvent("guest_purchase_claim_conflict", {});
        onDone("conflict");
        return;
      }
      if (result === "moved") trackEvent("guest_purchase_saved", { via: "claim" });
      announcePremiumChanged();
      onDone("moved");
    } catch (e) {
      trackError(e, { where: "save_guest_claim" });
      // Sparas också, så att nästa sidladdning försöker själv (GuestPurchaseClaimer).
      storeGuestClaim(guestToken);
      setPendingToken(guestToken);
      setError(
        "Du är inloggad, men köpet kunde inte flyttas just nu. Försök igen om en stund. Köpet ligger kvar och går inte förlorat.",
      );
    }
  };

  const create = async (data: z.infer<typeof schema>) => {
    let result: "ok" | "exists" | "fallback";
    try {
      result = await upgradeGuest(data.email, data.password);
    } catch (e) {
      trackError(e, { where: "save_guest_upgrade" });
      setError("Något gick fel när kontot skulle sparas. Försök igen.");
      return;
    }
    if (result === "exists") {
      setMode("login");
      setPassword("");
      setNotice(EXISTS_TEXT);
      return;
    }
    if (result === "ok") {
      // Profilens adress först, annars går verifieringsmejlet till ingen.
      await syncEmail().catch(() => {});
      void sendVerification().catch(() => {});
      trackEvent("signup_completed", {
        from_guest: true,
        needs_email_confirm: false,
        kept_progress: true,
      });
      trackEvent("guest_purchase_saved", { via: "upgrade" });
      refreshProfile();
      announcePremiumChanged();
      toast.success("Kontot är skapat och köpet sparat på det");
      onDone("created");
      return;
    }
    // "fallback": bytet gick inte. Skapa ett nytt konto som /signup gör, och
    // flytta köpet dit med gästens token.
    const guestToken = await currentGuestToken();
    clearGuestClaim();
    const { data: signed, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { emailRedirectTo: `${window.location.origin}/onboarding` },
    });
    if (signUpError) {
      if (/already|registered|exists/i.test(signUpError.message)) {
        setMode("login");
        setPassword("");
        setNotice(EXISTS_TEXT);
      } else {
        setError("Kontrollera e-postadressen och försök igen.");
      }
      return;
    }
    if (!signed.session || !guestToken) {
      // Bara om "Confirm email" slagits på i Supabase igen. Köpet finns kvar
      // på gästkontot och kan flyttas för hand.
      if (guestToken) storeGuestClaim(guestToken);
      setError("Kolla din e-post och bekräfta adressen, logga sedan in här.");
      return;
    }
    trackEvent("signup_completed", {
      from_guest: true,
      needs_email_confirm: false,
      kept_progress: false,
    });
    void sendVerification().catch(() => {});
    await moveTo(guestToken);
  };

  const login = async (data: z.infer<typeof schema>) => {
    // Gästens token måste läsas innan inloggningen byter ut sessionen.
    const guestToken = await currentGuestToken();
    clearGuestClaim();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (signInError) {
      trackEvent("login_failed", {});
      setError("Fel e-postadress eller lösenord.");
      return;
    }
    trackEvent("login_completed", { from_guest: true });
    if (!guestToken) {
      // Sessionen var redan bytt. Det finns inget att flytta härifrån.
      onDone("moved");
      return;
    }
    await moveTo(guestToken);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (pendingToken) {
      setBusy(true);
      setError(null);
      await moveTo(pendingToken);
      setBusy(false);
      return;
    }
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await (mode === "create" ? create(parsed.data) : login(parsed.data));
    } finally {
      setBusy(false);
    }
  };

  const creating = mode === "create";

  return (
    <div className="mx-auto max-w-md pt-2 sm:pt-8">
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-11 w-11 text-success" aria-hidden />
        <h1 className="mt-4 text-[30px] leading-[1.1] tracking-[-0.035em] sm:text-[40px]">
          Betalningen är klar
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-[16px] leading-relaxed text-white/70">
          Premium är öppet i den här webbläsaren. Skapa ett konto så att du kommer åt köpet på andra
          enheter och inte tappar det om webbläsaren rensas.
        </p>
      </div>

      <GlassCard className="mt-6 p-5 text-center sm:p-7">
        <h2 className="text-lg font-semibold text-[var(--cream)]">
          {creating ? "Skapa ditt konto" : "Logga in för att spara köpet"}
        </h2>
        {notice ? (
          <p className="mt-2 text-sm text-white/70" role="status">
            {notice}
          </p>
        ) : !creating ? (
          <p className="mt-2 text-sm text-white/65">Köpet flyttas till kontot du loggar in på.</p>
        ) : null}

        <form onSubmit={(e) => void submit(e)} className="mt-5 space-y-3" noValidate>
          <input
            type="email"
            aria-label="E-postadress"
            placeholder="E-postadress"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!!pendingToken}
            required
            className={inputClass}
          />
          <input
            type="password"
            aria-label="Lösenord"
            placeholder={creating ? "Välj ett lösenord (minst 6 tecken)" : "Lösenord"}
            autoComplete={creating ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={!!pendingToken}
            minLength={6}
            required
            className={inputClass}
          />
          {error && (
            <p role="alert" className="text-sm text-[var(--destructive)]">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-[15px] font-semibold text-on-brand transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-label="Sparar" />
            ) : pendingToken ? (
              "Försök igen"
            ) : creating ? (
              "Skapa konto"
            ) : (
              "Logga in"
            )}
          </button>
        </form>

        {!pendingToken && (
          <>
            {!creating && (
              <div className="mt-4 space-y-4">
                <AuthDivider />
                {/* Google lämnar sidan. Knappen sparar gästens token först, och
                    roten flyttar köpet när Google skickat tillbaka. */}
                <GoogleButton label="Logga in med Google" />
              </div>
            )}
            <p className="mt-5 text-sm text-white/60">
              {creating ? "Har du redan ett konto? " : "Har du inget konto? "}
              <button
                type="button"
                onClick={() => switchMode(creating ? "login" : "create")}
                className="font-semibold text-primary hover:underline"
              >
                {creating ? "Logga in" : "Skapa ett nytt"}
              </button>
            </p>
          </>
        )}
      </GlassCard>

      {!pendingToken && (
        <p className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              trackEvent("guest_purchase_save_skipped", {});
              onSkip();
            }}
            className="inline-flex min-h-[44px] items-center px-3 text-sm text-white/60 underline underline-offset-2 transition hover:text-[var(--cream)]"
          >
            Gör det senare
          </button>
        </p>
      )}
    </div>
  );
}
