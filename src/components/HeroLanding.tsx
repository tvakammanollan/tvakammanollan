import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trophy, Zap, BookOpen, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function HeroLanding() {
  const navigate = useNavigate();
  const [guestLoading, setGuestLoading] = useState(false);

  const playAsGuest = async () => {
    setGuestLoading(true);
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      setGuestLoading(false);
      toast.error("Kunde inte starta gästläge", { description: error.message });
      return;
    }
    // useAuth listener picks up the session; HomeDashboard will render
    navigate({ to: "/" });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-12 sm:pt-20">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
          <Trophy className="h-3.5 w-3.5" />
          Rankade tävlingar i HP-frågor
        </span>

        <h1
          className="mt-6 text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-7xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          HP Kampen
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground sm:text-xl">
          Testa dina kunskaper. Slå dina vänner. Klättra i rankingen.
        </p>

        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground/90 sm:text-base">
          HP Kampen är arenan där du tränar inför Högskoleprovet i realtidsbattles
          mot andra studenter eller en bot. Varje match räknas — ditt ELO speglar
          var du faktiskt står, delprov för delprov.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link to="/signup">Skapa gratis konto</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
            <Link to="/login">Logga in</Link>
          </Button>
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={playAsGuest}
            disabled={guestLoading}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-60"
          >
            {guestLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {guestLoading ? "Startar gästläge…" : "Spela som gäst (utan konto)"}
          </button>
        </div>

        {/* Unique selling point: free word practice */}
        <Link
          to="/ord"
          className="group mx-auto mt-10 flex max-w-2xl items-center gap-4 rounded-2xl border border-primary/30 bg-primary-soft px-5 py-4 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/50"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-[#1a5c3a] shadow-sm">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-foreground">
              Helt gratis ordlista — öva 1000+ riktiga HP-ord
            </div>
            <div className="text-xs text-muted-foreground">
              Unikt för HP Kampen: en av Sveriges största samlingar av riktiga
              ORD-frågor från tidigare högskoleprov, fritt att öva på solo.
            </div>
          </div>
          <span className="text-primary transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </Link>

        <ul className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs">
          <FeatureChip icon={<Trophy className="h-3.5 w-3.5" />} label="ELO-ranking" />
          <FeatureChip icon={<Zap className="h-3.5 w-3.5" />} label="Realtidsmatcher" />
          <FeatureChip icon={<BookOpen className="h-3.5 w-3.5" />} label="1000+ ORD-frågor gratis" />
        </ul>
      </div>
    </div>
  );
}

function FeatureChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <li className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 font-medium text-foreground/80 shadow-card">
      <span className="text-primary">{icon}</span>
      {label}
    </li>
  );
}
