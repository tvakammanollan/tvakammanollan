import { createFileRoute, Link, useNavigate, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AuthShell } from "@/routes/login";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
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

  if (!loading && user) return <Navigate to="/" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding`,
      },
    });
    setSubmitting(false);

    if (error) {
      toast.error("Kunde inte skapa konto", { description: error.message });
      return;
    }
    if (data.session) {
      toast.success("Konto skapat — välj ditt användarnamn");
      navigate({ to: "/onboarding" });
    } else {
      toast.success("Bekräfta din e-post för att fortsätta", {
        description: "Vi har skickat en bekräftelselänk till din inkorg.",
      });
    }
  };

  return (
    <AuthShell title="Skapa konto" subtitle="Gratis. Inga kort, bara battles.">
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="email">E-post</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="password">Lösenord</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
          <p className="text-xs text-muted-foreground">Minst 6 tecken.</p>
        </div>
        <Button type="submit" disabled={submitting} className="mt-2">
          {submitting ? "Skapar konto…" : "Skapa konto"}
        </Button>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Har redan ett konto?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Logga in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
