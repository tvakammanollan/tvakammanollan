import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Trophy, Zap, BookOpen } from "lucide-react";

export function HeroLanding() {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-12 sm:pt-20">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
          <Trophy className="h-3.5 w-3.5" />
          Ranked tävlingar i HP-frågor
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

        <ul className="mt-10 flex flex-wrap items-center justify-center gap-2 text-xs">
          <FeatureChip icon={<Trophy className="h-3.5 w-3.5" />} label="ELO-ranking" />
          <FeatureChip icon={<Zap className="h-3.5 w-3.5" />} label="Realtidsmatcher" />
          <FeatureChip icon={<BookOpen className="h-3.5 w-3.5" />} label="Alla HP-delmoment" />
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
