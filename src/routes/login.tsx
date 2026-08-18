import { createFileRoute, Link, useNavigate, Navigate } from "@tanstack/react-router";
import { pageMeta, pageLinks } from "@/lib/page-meta";
import { useState } from "react";
import { z } from "zod";
import { m } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { isGuestUser, useAuth } from "@/hooks/useAuth";
import { trackEvent } from "@/lib/events";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth/AuthLayout";
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

const schema = z.object({
  email: z.string().trim().email("Ogiltig e-postadress").max(255),
  password: z.string().min(6, "Minst 6 tecken").max(128),
});

function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!loading && user && !isGuestUser(user)) return <Navigate to="/" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    // Läses av innan gästsessionen slängs, annars är svaret alltid nej.
    const fromGuest = isGuestUser(user);
    if (fromGuest) {
      await supabase.auth.signOut();
    }
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setSubmitting(false);
    if (error) {
      trackEvent("login_failed");
      toast.error("Kunde inte logga in", { description: error.message });
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <PillInput
              type="email"
              label="E-postadress"
              placeholder="info@gmail.com"
              autoComplete="email"
              value={email}
              onChange={setEmail}
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

          <p className="text-sm text-white/55">
            Inget konto?{" "}
            <Link to="/signup" className="font-medium text-[#ae2f26] hover:underline">
              Skapa ett här
            </Link>
          </p>

          <p className="pt-6 text-xs text-white/40">
            Genom att logga in godkänner du{" "}
            <Link to="/villkor" className="underline hover:text-white/60">
              villkoren
            </Link>{" "}
            och{" "}
            <Link to="/integritetspolicy" className="underline hover:text-white/60">
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
      className="h-12 w-full rounded-full border border-white/12 bg-white/[0.04] px-5 text-center text-[15px] text-white placeholder:text-white/35 backdrop-blur-sm transition-colors focus:border-white/30 focus:bg-white/[0.06] focus:outline-none"
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
