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
      <AuthShell title="Kolla din inkorg" subtitle="Vi skickade en länk. Klicka på den så är du inne.">
        <div className="grid gap-5 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-amber-deep">
            ✉ Mejl skickat till
          </p>
          <p className="break-all rounded-lg bg-pergament px-4 py-3 font-mono text-[13px] text-navy">
            {sentTo}
          </p>
          <p className="text-[14px] leading-[1.5] text-navy/65">
            Öppna mejlet på den här enheten och klicka på länken — då loggas du in
            automatiskt. Hittar du inget? Kolla skräpposten.
          </p>
          <button
            type="button"
            onClick={() => setSentTo(null)}
            className="btn-link mx-auto text-navy/55"
          >
            Använd en annan e-postadress
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Skapa konto" subtitle="Gratis. Inga kort. Inga annonser.">
      <form onSubmit={handleSubmit} className="grid gap-5">
        <div className="grid gap-2">
          <Label htmlFor="email" className="font-mono text-[11px] uppercase tracking-[0.14em] text-navy/65">
            E-post
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12 rounded-lg border-[var(--line-cream)] bg-paper-2 text-[15px]"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password" className="font-mono text-[11px] uppercase tracking-[0.14em] text-navy/65">
            Lösenord
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
            className="h-12 rounded-lg border-[var(--line-cream)] bg-paper-2 text-[15px]"
          />
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy/45">
            Minst 6 tecken
          </p>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="btn-shine btn-amber mt-3 justify-center disabled:opacity-60"
        >
          {submitting ? "Skapar konto…" : "Skapa konto"}
        </button>
        <p className="mt-2 text-center text-[14px] text-navy/65">
          Har du redan ett konto?{" "}
          <Link to="/login" className="btn-link text-navy">
            Logga in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
