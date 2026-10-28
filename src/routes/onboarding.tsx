import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { pageTitle } from "@/lib/page-meta";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { isAutoUsername } from "@/lib/username";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth/AuthLayout";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
  head: () => ({
    meta: [
      { title: pageTitle("Välkommen") },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const usernameSchema = z
  .string()
  .trim()
  .min(3, "Minst 3 tecken")
  .max(20, "Max 20 tecken")
  .regex(/^[a-z0-9_-]+$/, "Endast a–z, 0–9, _ och - tillåtna");

function OnboardingPage() {
  const { user, profile, loading, profileLoaded, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && !user) return <Navigate to="/login" />;
  if (profile && !isAutoUsername(profile.username)) return <Navigate to="/" />;

  // Google-inloggningen landar här (se GoogleButton), och den som redan valt
  // namn skickas vidare av guarden ovan — men först när profilen kommit hem.
  // Utan grinden hinner formuläret blinka förbi på varje återkommande login.
  if (loading || !profileLoaded) {
    return (
      <AuthLayout>
        <div className="mx-auto h-12 w-full max-w-sm rounded-full bg-white/[0.06]" />
      </AuthLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = usernameSchema.safeParse(username);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (!user) return;

    setSubmitting(true);
    const { error } = await supabase
      .from("users")
      .update({ username: parsed.data })
      .eq("id", user.id);
    setSubmitting(false);

    if (error) {
      if (error.code === "23505") {
        toast.error("Det användarnamnet är taget. Försök ett annat");
      } else {
        toast.error("Kunde inte spara", { description: error.message });
      }
      return;
    }
    toast.success(`Välkommen, ${parsed.data}`);
    refreshProfile();
    navigate({ to: "/" });
  };

  return (
    <AuthLayout>
      <div
        className="space-y-7 text-center"
      >
        <div className="space-y-2">
          <p className="text-sm text-white/65">Steg 2 av 2</p>
          <h1
            className="text-[36px] font-bold leading-[1.05] tracking-tight text-white sm:text-[40px]"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.025em" }}
          >
            Välj användarnamn
          </h1>
          <p className="text-[15px] text-white/65">
            Det här är namnet andra ser i matcher och toppliston.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            autoFocus
            aria-label="Användarnamn"
            autoComplete="off"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            placeholder="t.ex. lina_p"
            maxLength={20}
            required
            className="h-12 w-full rounded-full border border-input bg-white/[0.04] px-5 text-center text-[15px] text-white placeholder:text-white/45 transition-colors focus:bg-white/[0.06]"
          />
          <p className="text-xs text-white/45">3–20 tecken. Endast a–z, 0–9, _ och -.</p>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-[15px] font-semibold text-on-brand shadow-[0_0_24px_rgba(174,47,38,0.35)] transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Sparar…" : "Klart, ta mig till arenan"}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
