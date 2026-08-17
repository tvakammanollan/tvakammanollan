import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { m } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { isAutoUsername } from "@/lib/username";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { EyebrowLabel } from "@/components/layout/EyebrowLabel";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
  head: () => ({
    meta: [{ title: "Välkommen · HP Kampen" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

const usernameSchema = z
  .string()
  .trim()
  .min(3, "Minst 3 tecken")
  .max(20, "Max 20 tecken")
  .regex(/^[a-z0-9_-]+$/, "Endast a–z, 0–9, _ och - tillåtna");

function OnboardingPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && !user) return <Navigate to="/login" />;
  if (profile && !isAutoUsername(profile.username)) return <Navigate to="/" />;

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
      <m.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-7 text-center"
      >
        <div className="space-y-2">
          <EyebrowLabel tone="teal">Steg 2 av 2</EyebrowLabel>
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
            className="h-12 w-full rounded-full border border-white/12 bg-white/[0.04] px-5 text-center text-[15px] text-white placeholder:text-white/35 backdrop-blur-sm transition-colors focus:border-white/30 focus:bg-white/[0.06] focus:outline-none"
          />
          <p className="text-xs text-white/40">3–20 tecken. Endast a–z, 0–9, _ och -.</p>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#ae2f26] px-6 text-[15px] font-semibold text-[#2e1e14] shadow-[0_0_24px_rgba(174, 47, 38,0.35)] transition-all hover:bg-[#ae2f26]/90 hover:shadow-[0_0_32px_rgba(174, 47, 38,0.55)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Sparar…" : "Klart, ta mig till arenan"}
            {!submitting && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>
      </m.div>
    </AuthLayout>
  );
}
