import { createFileRoute, Link, useNavigate, Navigate } from "@tanstack/react-router";
import { pageMeta, pageLinks } from "@/lib/page-meta";
import { useState } from "react";
import { z } from "zod";
import { m, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { isGuestUser, useAuth } from "@/hooks/useAuth";
import { trackEvent } from "@/lib/events";
import { toast } from "sonner";
import { ArrowRight, Mail } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { EyebrowLabel } from "@/components/layout/EyebrowLabel";
import { SuccessScreen } from "@/routes/login";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({
    meta: pageMeta({
      path: "/signup",
      title: "Skapa konto · gratis HP-träning · HP Kampen",
      description:
        "Skapa gratis konto på HP Kampen på 30 sekunder. Inget kreditkort. Börja tävla direkt.",
      ogTitle: "Skapa konto gratis · HP Kampen",
      ogDescription: "Tävla mot vänner i realtid. ELO-ranking. Alla 8 delprov. Gratis.",
      noindex: true,
    }),
    links: pageLinks("/signup"),
  }),
});

const schema = z.object({
  email: z.string().trim().email("Ogiltig e-postadress").max(255),
  password: z.string().min(6, "Lösenordet måste vara minst 6 tecken").max(128),
});

function SignupPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!loading && user && !user.is_anonymous) return <Navigate to="/" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    // Gäst → konto är sajtens viktigaste konvertering. Läses av före signUp,
    // eftersom sessionen byts ut på vägen.
    const fromGuest = isGuestUser(user);
    trackEvent("signup_submitted", { from_guest: fromGuest });
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding`,
      },
    });
    setSubmitting(false);

    if (error) {
      trackEvent("signup_failed", { from_guest: fromGuest });
      toast.error("Kunde inte skapa konto", { description: error.message });
      return;
    }
    trackEvent("signup_completed", {
      from_guest: fromGuest,
      needs_email_confirm: !data.session,
    });
    if (data.session) {
      toast.success("Konto skapat. Välj ditt användarnamn");
      setSuccess(true);
      setTimeout(() => navigate({ to: "/onboarding" }), 1400);
    } else {
      setSentTo(parsed.data.email);
    }
  };

  const reverseShader = success || sentTo !== null;

  return (
    <AuthLayout reverse={reverseShader}>
      <AnimatePresence mode="wait">
        {success ? (
          <SuccessScreen key="success" />
        ) : sentTo ? (
          <CheckEmailScreen key="email" address={sentTo} onUseAnother={() => setSentTo(null)} />
        ) : (
          <m.div
            key="form"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-7 text-center"
          >
            <div className="space-y-2">
              <EyebrowLabel tone="teal">Bli en HP-kämpe</EyebrowLabel>
              <h1
                className="text-[40px] font-bold leading-[1.05] tracking-tight text-white sm:text-[44px]"
                style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.025em" }}
              >
                Skapa konto
              </h1>
              <p className="text-[16px] text-white/65">Gratis. Inga kort, bara matcher.</p>
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
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#ae2f26] px-6 text-[15px] font-semibold text-[#2e1e14] shadow-[0_0_24px_rgba(174,47,38,0.35)] transition-all hover:bg-[#ae2f26]/90 hover:shadow-[0_0_32px_rgba(174,47,38,0.55)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Skapar konto…" : "Skapa konto"}
                {!submitting && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <p className="text-sm text-white/55">
              Har du redan ett konto?{" "}
              <Link to="/login" className="font-medium text-[#ae2f26] hover:underline">
                Logga in
              </Link>
            </p>

            <p className="pt-6 text-xs text-white/40">
              Genom att skapa konto godkänner du{" "}
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
      </AnimatePresence>
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
      className="h-12 w-full rounded-full border border-white/12 bg-white/[0.04] px-5 text-center text-[15px] text-white placeholder:text-white/35 backdrop-blur-sm transition-colors focus:border-white/30 focus:bg-white/[0.06] focus:outline-none"
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
    <m.div
      key="email"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-6 text-center"
    >
      <div className="space-y-2">
        <EyebrowLabel tone="teal">Nästan klart</EyebrowLabel>
        <h1
          className="text-[36px] font-bold leading-[1.05] tracking-tight text-white sm:text-[40px]"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.025em" }}
        >
          Kolla din e-post
        </h1>
        <p className="text-[15px] text-white/65">Sista steget innan du kan börja spela.</p>
      </div>

      <div className="flex justify-center py-2">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] backdrop-blur-sm">
          <Mail className="h-6 w-6 text-[#ae2f26]" />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-white/70">Vi skickade en bekräftelselänk till</p>
        <p className="break-all rounded-full border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white">
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
    </m.div>
  );
}
