import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { unsubscribeEmail } from "@/lib/email-optin.functions";
import { pageMeta } from "@/lib/page-meta";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { EmailOptInCard } from "@/components/EmailOptInCard";

/* =====================================================================
   Avregistrering från utskick. Länken står sist i varje mejl.

   Kräver ingen inloggning: mejlet öppnas ofta på en enhet där man inte är
   inloggad. Utskicken går med mottagarna i hemlig kopia, så länken är
   densamma för alla och adressen skrivs i fältet. Den som är inloggad får
   dessutom sitt eget val som en ruta.
   ===================================================================== */

export const Route = createFileRoute("/avregistrera")({
  component: UnsubscribePage,
  head: () => ({
    meta: pageMeta({
      path: "/avregistrera",
      title: "Avregistrera dig från mejl",
      description: "Här slutar du få mejl från Tvåkommanollan.",
      noindex: true,
    }),
  }),
});

const emailSchema = z.string().trim().email().max(255);

function UnsubscribePage() {
  const { user } = useAuth();
  const unsubscribe = useServerFn(unsubscribeEmail);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error("Skriv en giltig e-postadress.");
      return;
    }
    setBusy(true);
    try {
      await unsubscribe({ data: { email: parsed.data } });
      setDone(true);
    } catch (err) {
      toast.error("Det gick inte just nu", {
        description:
          err instanceof Error ? err.message : "Försök igen eller mejla info@tvakommanollan.se.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center gap-6 px-6 py-12">
      <h1
        className="text-[28px] font-bold leading-tight text-[var(--cream)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Avregistrera dig från mejl
      </h1>

      {done ? (
        <>
          <p className="text-sm leading-relaxed text-[var(--cream)]">
            Adressen får inga fler utskick från Tvåkommanollan. Mejl om ditt konto och dina köp
            skickas fortfarande.
          </p>
          <Button asChild className="self-start">
            <Link to="/">Till startsidan</Link>
          </Button>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm leading-relaxed text-white/65">
            Skriv adressen som mejlet kom till.
          </p>
          <input
            type="email"
            aria-label="E-postadress"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="din@adress.se"
            maxLength={255}
            required
            className="h-12 w-full rounded-lg border border-input bg-white/[0.04] px-4 text-[15px] text-white placeholder:text-white/45 transition-colors focus:bg-white/[0.06]"
          />
          <Button type="submit" disabled={busy}>
            {busy ? "Sparar…" : "Avregistrera"}
          </Button>
        </form>
      )}

      {user && <EmailOptInCard />}
    </main>
  );
}
