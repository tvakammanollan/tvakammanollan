import { createFileRoute, Link, useNavigate, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { isGuestUser, useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { SplitText } from "@/components/landing/MotionFX";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Logga in · HP Kampen" },
      {
        name: "description",
        content:
          "Logga in på HP Kampen för att fortsätta tävla mot vänner, klättra i ELO-rankingen och spara dina HP-resultat.",
      },
      { property: "og:title", content: "Logga in · HP Kampen" },
      { name: "robots", content: "noindex, follow" },
    ],
    links: [{ rel: "canonical", href: "https://hpkampen.se/login" }],
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

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
  };

  return (
    <AuthShell title="Logga in" subtitle="Fortsätt där du slutade.">
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={submitting} className="mt-2">
          {submitting ? "Loggar in…" : "Logga in"}
        </Button>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Inget konto?{" "}
          <Link to="/signup" className="font-medium text-primary hover:underline">
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
  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 60% 60% at 20% 30%, rgba(26, 92, 58, 0.10), transparent 70%), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(212, 160, 23, 0.08), transparent 70%)",
        }}
      />

      <div className="mx-auto grid max-w-6xl gap-0 px-4 py-8 sm:py-12 lg:min-h-[calc(100vh-60px)] lg:grid-cols-2 lg:gap-12 lg:py-16">
        {/* LEFT — brand panel */}
        <aside className="hidden flex-col justify-between rounded-3xl bg-ink bg-grid-ink p-10 text-white lg:flex">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#6366f1] to-[#4338ca] shadow-lg">
                <span
                  className="text-[14px] font-black tracking-tighter text-white"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  HP
                </span>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-[#050507] bg-[#eab308]" />
              </span>
              <span
                className="text-lg font-semibold text-white"
                style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
              >
                Kampen
              </span>
            </div>

            <div className="mt-16">
              <p className="eyebrow text-[#eab308]">Välkommen till arenan</p>
              <h2
                className="mt-4 text-[40px] leading-[1.05] text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Tävla mot vänner.{" "}
                <span className="font-light italic text-white/85">Klättra i rankingen.</span>{" "}
                <span className="text-gold-gradient font-medium">Klara HP.</span>
              </h2>
              <p className="mt-6 max-w-md text-[15px] leading-relaxed text-white/65">
                Live-matcher, ELO-ranking och träning för Högskoleprovet. Helt gratis.
              </p>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
            <Stat number="8 000+" label="HP-ord" />
            <Stat number="Brons → Diamant" label="ranks" />
            <Stat number="0 kr" label="alltid" />
          </div>
        </aside>

        {/* RIGHT — form panel */}
        <div className="flex lg:items-center">
          <div className="w-full max-w-md">
            <div
              className="rounded-3xl border border-black/5 bg-white/90 p-8 backdrop-blur-sm sm:p-10"
              style={{ boxShadow: "var(--shadow-lg)" }}
            >
              <div className="text-center lg:text-left">
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="eyebrow text-[#6366f1]"
                >
                  {title.toLowerCase().includes("skapa") ? "Steg 1 av 2" : "Logga in"}
                </motion.p>
                <h1
                  className="display mt-3 text-[34px] leading-tight text-[#050507]"
                  style={{
                    fontFamily: "var(--font-display)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  <SplitText as="span">{title}</SplitText>
                </h1>
                {subtitle && (
                  <motion.p
                    initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{
                      duration: 0.7,
                      delay: 0.35,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="mt-2 text-[15px] text-[#737373]"
                  >
                    {subtitle}
                  </motion.p>
                )}
              </div>
              <div className="mt-7">{children}</div>
            </div>

            <p className="mt-6 text-center text-xs text-neutral-500">
              Genom att fortsätta godkänner du våra villkor.
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
      <div
        className="text-[20px] font-bold leading-tight text-white"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {number}
      </div>
      <div className="mt-1 text-[10px] tracking-wide text-white/50">{label}</div>
    </div>
  );
}
