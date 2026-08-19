import { createFileRoute, Link, useNavigate, Navigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { pageMeta, pageLinks } from "@/lib/page-meta";
import { signInWithUsername } from "@/lib/auth.functions";
import { useState } from "react";
import { z } from "zod";
import { m } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { isGuestUser, useAuth } from "@/hooks/useAuth";
import { trackEvent } from "@/lib/events";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthDivider, GoogleButton } from "@/components/auth/GoogleButton";
import { EyebrowLabel } from "@/components/layout/EyebrowLabel";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: pageMeta({
      path: "/login",
      title: "Logga in · HP Kampen",
      description: "Logga in på HP Kampen och fortsätt klättra i ELO-rankingen.",
      ogTitle: "Logga in · HP Kampen",
      ogDescription: "Logga in för att fortsätta tävla mot vänner och spara dina HP-resultat.",
      noindex: true,
    }),
    links: pageLinks("/login"),
  }),
});

// Fältet tar både e-post och användarnamn. `@` skiljer dem åt och duger som
// hel regel: onboarding tillåter bara a–z, 0–9, _ och - i namn, så ett namn
// kan aldrig innehålla ett @.
const schema = z.object({
  identifier: z.string().trim().min(3, "Fyll i e-post eller användarnamn").max(255),
  password: z.string().min(6, "Minst 6 tecken").max(128),
});

const looksLikeEmail = (value: string) => value.includes("@");

function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const usernameLogin = useServerFn(signInWithUsername);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!loading && user && !isGuestUser(user)) return <Navigate to="/" />;

  /**
   * Namnvägen: servern slår upp adressen och loggar in åt oss (se
   * auth.functions.ts), vi sätter bara sessionen där klienten förväntar sig
   * den. Returnerar ett felmeddelande, eller undefined när det gick vägen.
   */
  const signInByUsername = async (username: string, password: string) => {
    try {
      const session = await usernameLogin({ data: { username, password } });
      const { error } = await supabase.auth.setSession(session);
      return error?.message;
    } catch (e) {
      return e instanceof Error ? e.message : "Något gick fel.";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ identifier, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    const { identifier: id, password: pw } = parsed.data;
    if (!looksLikeEmail(id) && !/^[a-z0-9_-]+$/i.test(id)) {
      toast.error("Ogiltigt användarnamn", { description: "Endast a–z, 0–9, _ och -." });
      return;
    }

    setSubmitting(true);
    // Läses av innan gästsessionen slängs, annars är svaret alltid nej.
    const fromGuest = isGuestUser(user);
    if (fromGuest) {
      await supabase.auth.signOut();
    }
    const failure = looksLikeEmail(id)
      ? (await supabase.auth.signInWithPassword({ email: id, password: pw })).error?.message
      : await signInByUsername(id.toLowerCase(), pw);
    setSubmitting(false);
    if (failure) {
      trackEvent("login_failed");
      toast.error("Kunde inte logga in", { description: failure });
      return;
    }
    trackEvent("login_completed", { from_guest: fromGuest });
    toast.success("Välkommen tillbaka");
    setSuccess(true);
    // Vänta in dot-matrix reverse-animationen innan navigering
    setTimeout(() => navigate({ to: "/" }), 1400);
  };

  return (
    <AuthLayout reverse={success}>
      {success ? (
        <SuccessScreen />
      ) : (
        <m.div
          key="form"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-7 text-center"
        >
          <div className="space-y-2">
            <EyebrowLabel tone="teal">Välkommen tillbaka</EyebrowLabel>
            <h1
              className="text-[40px] font-bold leading-[1.05] tracking-tight text-white sm:text-[44px]"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.025em" }}
            >
              Logga in
            </h1>
            <p className="text-[16px] text-white/65">Fortsätt där du slutade.</p>
          </div>

          <div className="space-y-4">
            <GoogleButton />
            <AuthDivider />

            <form onSubmit={handleSubmit} className="space-y-4">
              <PillInput
                type="text"
                label="E-post eller användarnamn"
                placeholder="E-post eller användarnamn"
                autoComplete="username"
                value={identifier}
                onChange={setIdentifier}
              />
              <PillInput
                type="password"
                label="Lösenord"
                placeholder="Lösenord"
                autoComplete="current-password"
                value={password}
                onChange={setPassword}
              />

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#ae2f26] px-6 text-[15px] font-semibold text-[#fff8f5] shadow-[0_0_24px_rgba(174,47,38,0.35)] transition-all hover:bg-[#ae2f26]/90 hover:shadow-[0_0_32px_rgba(174,47,38,0.55)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Loggar in…" : "Logga in"}
                {!submitting && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          </div>

          <p className="text-sm text-white/55">
            Inget konto?{" "}
            <Link to="/signup" className="font-medium text-[#ae2f26] hover:underline">
              Skapa ett här
            </Link>
          </p>

          <p className="pt-6 text-xs text-white/45">
            Genom att logga in godkänner du{" "}
            <Link to="/villkor" className="underline hover:text-white/70">
              villkoren
            </Link>{" "}
            och{" "}
            <Link to="/integritetspolicy" className="underline hover:text-white/70">
              integritetspolicyn
            </Link>
            .
          </p>
        </m.div>
      )}
    </AuthLayout>
  );
}

function PillInput({
  type,
  placeholder,
  autoComplete,
  value,
  onChange,
  label,
}: {
  type: string;
  placeholder: string;
  autoComplete: string;
  value: string;
  onChange: (v: string) => void;
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
      required
      className="h-12 w-full rounded-full border border-input bg-white/[0.04] px-5 text-center text-[15px] text-white placeholder:text-white/45 backdrop-blur-sm transition-colors focus:bg-white/[0.06]"
    />
  );
}

export function SuccessScreen() {
  return (
    <m.div
      key="success"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-6 text-center"
    >
      <div className="space-y-2">
        <EyebrowLabel tone="amber">Du är inne</EyebrowLabel>
        <h1
          className="text-[40px] font-bold leading-[1.05] tracking-tight text-white"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.025em" }}
        >
          Välkommen
        </h1>
      </div>
      <m.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="py-8"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#ae2f26] shadow-[0_0_32px_rgba(174,47,38,0.55)]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-[var(--cream)]"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </m.div>
    </m.div>
  );
}
