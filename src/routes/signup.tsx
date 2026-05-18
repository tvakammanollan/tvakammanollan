import { createFileRoute, Link, useNavigate, Navigate } from "@tanstack/react-router";
import { pageMeta, pageLinks } from "@/lib/page-meta";
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
      toast.success("Konto skapat. Välj ditt användarnamn");
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
            Öppna mejlet på den här enheten och klicka på länken. Då loggas du in
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

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/onboarding` },
    });
  };

  return (
    <AuthShell title="Skapa konto" subtitle="Gratis. Inga kort, bara battles.">
      <button
        type="button"
        onClick={handleGoogle}
        className="flex w-full items-center justify-center gap-3 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
        style={{ borderColor: "var(--border)" }}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden>
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Fortsätt med Google
      </button>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        eller
        <span className="h-px flex-1 bg-border" />
      </div>
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
