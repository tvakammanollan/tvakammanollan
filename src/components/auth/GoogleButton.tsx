import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isGuestUser, useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

/**
 * "Fortsätt med Google" för /login och /signup.
 *
 * Flödet är implicit grant — client.ts sätter inget `flowType`, och auth-js
 * default är implicit. Supabase skickar tillbaka access-token i URL:ens
 * fragment och `detectSessionInUrl` (på som default) plockar upp den i
 * webbläsaren. Fragmentet når aldrig servern, så SSR:en behöver inte veta
 * något om returen.
 *
 * Landningen går till /onboarding, inte /: Google skickar aldrig något
 * username, så handle_new_user() ger nya konton ett auto-namn
 * (`user_xxxxxxxx`) och onboarding är där man byter till ett riktigt. Samma
 * mål som e-postregistreringen använder. Återvändare bounceas därifrån till /
 * av sidans egen guard.
 *
 * OBS: knappen gör ingenting förrän Google-providern är påslagen i Supabase
 * (Authentication → Providers). Är den av svarar /auth/v1/authorize 400
 * "Unsupported provider: provider is not enabled" — och eftersom
 * signInWithOAuth navigerar utan att först fråga API:t landar användaren på
 * en rå JSON-sida i stället för hos Google.
 */
export function GoogleButton({ label = "Fortsätt med Google" }: { label?: string }) {
  const { user } = useAuth();
  const [pending, setPending] = useState(false);

  const handleClick = async () => {
    setPending(true);

    // Gästsessionen måste bort först, annars ligger den anonyma identiteten
    // kvar när vi kommer tillbaka. Lösenordsvägen i login.tsx gör detsamma.
    if (isGuestUser(user)) await supabase.auth.signOut();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/onboarding` },
    });

    // Vid lyckad start lämnar webbläsaren sidan — då låter vi knappen stå
    // kvar i pending så etiketten inte hinner blinka tillbaka.
    if (error) {
      setPending(false);
      toast.error("Kunde inte starta Google-inloggningen", { description: error.message });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-full border border-white/12 bg-white/[0.04] px-6 text-[15px] font-medium text-white backdrop-blur-sm transition-colors hover:border-white/25 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <GoogleMark />
      {pending ? "Öppnar Google…" : label}
    </button>
  );
}

/** Hairline med "eller" — skiljer Google-knappen från e-postformuläret. */
export function AuthDivider() {
  return (
    <div className="flex items-center gap-3 text-xs text-white/40">
      <span className="h-px flex-1 bg-white/12" />
      eller
      <span className="h-px flex-1 bg-white/12" />
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
