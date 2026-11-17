import { createFileRoute, Link, useNavigate, Navigate } from "@tanstack/react-router";
import { pageMeta, pageLinks } from "@/lib/page-meta";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { isGuestUser, useAuth } from "@/hooks/useAuth";
import { trackEvent } from "@/lib/events";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthDivider, GoogleButton } from "@/components/auth/GoogleButton";
import { useServerFn } from "@tanstack/react-start";
import { sendVerificationEmail } from "@/lib/email-verification.functions";
import { AUTH_SUCCESS_DELAY_MS, SuccessScreen } from "@/routes/login";
import { syncProfileEmail } from "@/lib/guest-upgrade.functions";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({
    meta: pageMeta({
      path: "/signup",
      title: "Skapa konto",
      description:
        "Skapa ett gratis konto på Tvåkommanollan med e-post eller Google. Du behöver inget kort.",
      ogTitle: "Tvåkommanollan | Skapa konto",
      ogDescription: "Skapa ett gratis konto för att spara din ELO och synas på topplistan.",
      noindex: true,
    }),
    links: pageLinks("/signup"),
  }),
});

const schema = z.object({
  email: z.string().trim().email("Ogiltig e-postadress").max(255),
  password: z.string().min(6, "Lösenordet måste vara minst 6 tecken").max(128),
});

/**
 * Gör det inloggade gästkontot till ett riktigt konto, med samma id. ELO,
 * matcher, ordframsteg och utmärkelser ligger på id:t och följer därför med.
 *
 * Två steg med flit: Supabase släpper inte igenom ett lösenord på en anonym
 * användare som saknar adress, så adressen sätts först. "Confirm email" är
 * avslaget, så bytet gäller direkt och `is_anonymous` blir falskt i samma
 * anrop. Sessionen förnyas efteråt: servern läser `is_anonymous` ur tokenen
 * (kassan vägrar gäster), och den gamla tokenen säger fortfarande gäst.
 *
 * - "ok": kontot är riktigt och inloggat.
 * - "exists": adressen hör redan till ett annat konto.
 * - "fallback": bytet gick inte (inställning i Supabase, eller bekräftelse
 *   krävs). Anroparen skapar då ett nytt konto som förut, så att
 *   registreringen aldrig står still; framstegen följer inte med.
 */
async function upgradeGuest(
  email: string,
  password: string,
): Promise<"ok" | "exists" | "fallback"> {
  const first = await supabase.auth.updateUser({ email });
  if (first.error) {
    return /already|registered|exists/i.test(first.error.message) ||
      first.error.code === "email_exists"
      ? "exists"
      : "fallback";
  }
  const updated = first.data.user;
  if (!updated || updated.is_anonymous || updated.email?.toLowerCase() !== email.toLowerCase()) {
    return "fallback";
  }
  const second = await supabase.auth.updateUser({ password });
  if (second.error) throw second.error;
  const refreshed = await supabase.auth.refreshSession();
  if (refreshed.error) throw refreshed.error;
  return "ok";
}

function SignupPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  // Sant från det att formuläret skickats tills vi själva navigerat vidare.
  // Utan den slår vakten nedan till i samma ögonblick som kontot loggas in
  // och skickar till startsidan, förbi namnvalet och tillbaka-till-kassan.
  const [leaving, setLeaving] = useState(false);
  const sendVerification = useServerFn(sendVerificationEmail);
  const syncEmail = useServerFn(syncProfileEmail);

  if (!loading && user && !user.is_anonymous && !leaving) return <Navigate to="/" />;

  const finish = (fromGuest: boolean, keptProgress: boolean) => {
    trackEvent("signup_completed", {
      from_guest: fromGuest,
      needs_email_confirm: false,
      kept_progress: keptProgress,
    });
    // Kontot är inloggat direkt — verifieringen är en påminnelse, inte en
    // vägg (se BUGFIX-LOG punkt 2). Mejlet skickas i bakgrunden: går det
    // inte fram ska registreringen ändå vara klar, och remsan under
    // navbaren har en "skicka igen"-knapp.
    void sendVerification().catch(() => {});
    toast.success(
      keptProgress
        ? "Konto skapat. Din ELO och dina framsteg är sparade"
        : "Konto skapat. Välj ditt användarnamn",
    );
    setSuccess(true);
    setTimeout(() => navigate({ to: "/onboarding" }), AUTH_SUCCESS_DELAY_MS);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    setLeaving(true);
    // Gäst → konto är sajtens viktigaste konvertering. Läses av före bytet,
    // eftersom `user` ändras på vägen.
    const fromGuest = isGuestUser(user);
    trackEvent("signup_submitted", { from_guest: fromGuest });
    const failed = (description: string) => {
      setSubmitting(false);
      setLeaving(false);
      trackEvent("signup_failed", { from_guest: fromGuest });
      toast.error("Kunde inte skapa konto", { description });
    };
    const EXISTS = "Det finns redan ett konto med den e-postadressen. Logga in i stället.";

    if (fromGuest && user) {
      let result: "ok" | "exists" | "fallback";
      try {
        result = await upgradeGuest(parsed.data.email, parsed.data.password);
      } catch {
        failed("Något gick fel när kontot skulle sparas. Försök igen.");
        return;
      }
      if (result === "exists") {
        failed(EXISTS);
        return;
      }
      if (result === "ok") {
        // Profilens adress måste vara på plats innan verifieringsmejlet
        // skickas, annars går det till ingen. Ett fel här stoppar inte
        // registreringen: kontot är redan riktigt.
        await syncEmail().catch(() => {});
        setSubmitting(false);
        finish(true, true);
        return;
      }
      // "fallback": skapa ett nytt konto som förut.
    }

    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding`,
      },
    });
    setSubmitting(false);

    if (error) {
      failed(
        /already|registered|exists/i.test(error.message)
          ? EXISTS
          : "Kontrollera e-postadressen och försök igen.",
      );
      return;
    }
    if (data.session) {
      finish(fromGuest, false);
    } else {
      // Hit kommer vi bara om "Confirm email" råkar vara påslaget i Supabase
      // igen. Skärmen står kvar som säkerhetsnät men ska inte nås i drift.
      trackEvent("signup_completed", { from_guest: fromGuest, needs_email_confirm: true });
      setLeaving(false);
      setSentTo(parsed.data.email);
    }
  };

  return (
    <AuthLayout>
      <>
        {success ? (
          <SuccessScreen key="success" />
        ) : sentTo ? (
          <CheckEmailScreen key="email" address={sentTo} onUseAnother={() => setSentTo(null)} />
        ) : (
          <div
            key="form"
            className="space-y-7 text-center"
          >
            <div className="space-y-2">
              <h1
                className="text-[40px] font-bold leading-[1.05] tracking-tight text-white sm:text-[44px]"
                style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.025em" }}
              >
                Skapa konto
              </h1>
              <p className="text-[16px] text-white/65">Kontot är gratis och kräver inget kort.</p>
            </div>

            <div className="space-y-4">
              <GoogleButton />
              <AuthDivider />

              <form onSubmit={handleSubmit} className="space-y-4">
                <PillInput
                  type="email"
                  label="E-postadress"
                  placeholder="info@gmail.com"
                  autoComplete="email"
                  value={email}
                  onChange={setEmail}
                />
                <div>
                  <PillInput
                    type="password"
                    label="Lösenord"
                    placeholder="Lösenord (minst 6 tecken)"
                    autoComplete="new-password"
                    value={password}
                    onChange={setPassword}
                    minLength={6}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-[15px] font-semibold text-on-brand shadow-[0_0_24px_rgba(174,47,38,0.35)] transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Skapar konto…" : "Skapa konto"}
                </button>
              </form>
            </div>

            <p className="text-sm text-white/55">
              Har du redan ett konto?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Logga in
              </Link>
            </p>

            <p className="pt-6 text-xs text-white/45">
              Genom att skapa konto godkänner du{" "}
              <Link to="/villkor" className="underline hover:text-white/70">
                villkoren
              </Link>{" "}
              och{" "}
              <Link to="/integritetspolicy" className="underline hover:text-white/70">
                integritetspolicyn
              </Link>
              .
            </p>
          </div>
        )}
      </>
    </AuthLayout>
  );
}

function PillInput({
  type,
  placeholder,
  autoComplete,
  value,
  onChange,
  minLength,
  label,
}: {
  type: string;
  placeholder: string;
  autoComplete: string;
  value: string;
  onChange: (v: string) => void;
  minLength?: number;
  label: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      aria-label={label}
      autoComplete={autoComplete}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      minLength={minLength}
      required
      className="h-12 w-full rounded-full border border-input bg-white/[0.04] px-5 text-center text-[15px] text-white placeholder:text-white/45 transition-colors focus:bg-white/[0.06]"
    />
  );
}

function CheckEmailScreen({
  address,
  onUseAnother,
}: {
  address: string;
  onUseAnother: () => void;
}) {
  return (
    <div
      key="email"
      className="space-y-6 text-center"
    >
      <div className="space-y-2">
        <h1
          className="text-[36px] font-bold leading-[1.05] tracking-tight text-white sm:text-[40px]"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.025em" }}
        >
          Kolla din e-post
        </h1>
        <p className="text-[15px] text-white/65">Sista steget innan du kan börja spela.</p>
      </div>

      <div className="flex justify-center py-2">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/[0.04]">
          <Mail className="h-6 w-6 text-primary" />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-white/70">Vi skickade en bekräftelselänk till</p>
        <p className="break-all text-sm font-semibold text-white">
          {address}
        </p>
        <p className="text-xs leading-relaxed text-white/45">
          Öppna mejlet på den här enheten och klicka på länken. Hittar du inte mejlet? Kolla
          skräpposten.
        </p>
      </div>

      <button
        type="button"
        onClick={onUseAnother}
        className="inline-flex h-12 w-full items-center justify-center rounded-full border border-white/15 px-6 text-[14px] font-medium text-white/80 transition-colors hover:border-white/30 hover:bg-white/[0.04] hover:text-white"
      >
        Använd en annan e-postadress
      </button>
    </div>
  );
}
