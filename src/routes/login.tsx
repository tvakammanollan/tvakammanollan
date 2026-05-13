import { createFileRoute, Link, useNavigate, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { isGuestUser, useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
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

  if (!loading && user && !isGuestUser(user)) return <Navigate to="/" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    if (isGuestUser(user)) {
      await supabase.auth.signOut();
    }
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setSubmitting(false);
    if (error) {
      toast.error("Kunde inte logga in", { description: error.message });
      return;
    }
    toast.success("Välkommen tillbaka");
    navigate({ to: "/" });
  };

  return (
    <AuthShell title="Logga in" subtitle="Vi laddar din streak och ELO direkt.">
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-12 rounded-lg border-[var(--line-cream)] bg-paper-2 text-[15px]"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="btn-shine btn-amber mt-3 justify-center disabled:opacity-60"
        >
          {submitting ? "Loggar in…" : "Logga in"}
        </button>
        <p className="mt-2 text-center text-[14px] text-navy/65">
          Inget konto?{" "}
          <Link to="/signup" className="btn-link text-navy">
            Skapa ett här
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const isSignup = title.toLowerCase().includes("skapa");
  return (
    <div className="min-h-[calc(100vh-60px)] bg-paper text-navy">
      <div className="mx-auto grid min-h-[calc(100vh-60px)] max-w-[1240px] gap-0 px-6 py-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-20">
        {/* LEFT — editorial brand panel */}
        <aside className="hidden flex-col justify-between border-r border-[var(--line-cream)] pr-12 lg:flex">
          <div>
            <p className="eyebrow">
              {isSignup ? "Steg 1 av 2 · Skapa konto" : "Logga in"}
            </p>
            <h2 className="display mt-6 text-[44px] leading-[1.02] text-navy">
              {isSignup ? (
                <>
                  Lägg din ELO i potten.{" "}
                  <em className="text-amber-italic">
                    Vi hittar någon som är lika rädd.
                  </em>
                </>
              ) : (
                <>
                  Välkommen <em className="text-amber-italic">tillbaka.</em>
                </>
              )}
            </h2>
            <p className="prose-read mt-6 text-[17px]">
              {isSignup
                ? "Inget kreditkort. Ingen onödig fråga. Trettio sekunder från idé till första match."
                : "Du loggar in, vi laddar din senaste streak och ELO. Sen kör vi vidare."}
            </p>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 border-t border-[var(--line-cream)] pt-8">
            <Stat number="8 000+" label="HP-ord" />
            <Stat number="Brons → Diamant" label="ranks" />
            <Stat number="0 kr" label="alltid" />
          </div>
        </aside>

        {/* RIGHT — form */}
        <div className="flex items-center">
          <div className="w-full max-w-md">
            <div className="lg:hidden mb-8">
              <p className="eyebrow">{isSignup ? "Steg 1 av 2" : "Logga in"}</p>
              <h1 className="display mt-4 text-[34px] leading-tight text-navy">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 text-[15px] text-navy/65">{subtitle}</p>
              )}
            </div>

            <div className="surface-card p-8 sm:p-10">
              <div className="hidden lg:block mb-6">
                <h1
                  className="display text-[28px] leading-tight text-navy"
                >
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-2 text-[15px] text-navy/65">{subtitle}</p>
                )}
              </div>
              <div>{children}</div>
            </div>

            <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-navy/45">
              Genom att fortsätta godkänner du våra villkor
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div className="numeric-display text-[22px] leading-none text-navy">
        {number}
      </div>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-navy/55">
        {label}
      </div>
    </div>
  );
}
