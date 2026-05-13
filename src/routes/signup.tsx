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
  const [sentTo, setSentTo] = useState<string | null>(null);

  if (!loading && user && !user.is_anonymous) return <Navigate to="/" />;

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
      setSentTo(parsed.data.email);
    }
  };

  if (sentTo) {
    return (
      <AuthShell title="Kolla din e-post" subtitle="Sista steget innan du kan börja spela.">
        <div className="grid gap-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl">
            ✉️
          </div>
          <p className="text-sm leading-relaxed text-foreground">
            Vi har skickat en bekräftelselänk till
          </p>
          <p className="break-all rounded-lg bg-muted px-3 py-2 text-sm font-semibold">
            {sentTo}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Öppna mejlet på den här enheten och klicka på länken — då loggas du in
            automatiskt och kan välja användarnamn. Hittar du inte mejlet? Kolla
            skräpposten.
          </p>
          <Button variant="outline" onClick={() => setSentTo(null)} className="mt-2">
            Använd en annan e-postadress
          </Button>
        </div>
      </AuthShell>
    );
  }

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
          Har du redan ett konto?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Logga in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
