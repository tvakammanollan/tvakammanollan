import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, isAutoUsername } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AuthShell } from "@/routes/login";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
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
  // Already has a real username — skip
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
        toast.error("Det användarnamnet är taget — försök ett annat");
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
    <AuthShell
      title="Välj användarnamn"
      subtitle="Det här är namnet andra ser i matcher och toppliston."
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="username">Användarnamn</Label>
          <Input
            id="username"
            autoFocus
            autoComplete="off"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            placeholder="t.ex. lina_p"
            maxLength={20}
            required
          />
          <p className="text-xs text-muted-foreground">
            3–20 tecken. Endast små bokstäver, siffror, <code>_</code> och <code>-</code>.
          </p>
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Sparar…" : "Klart, ta mig till arenan"}
        </Button>
      </form>
    </AuthShell>
  );
}
