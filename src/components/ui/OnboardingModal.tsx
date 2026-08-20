import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { RankBadge } from "@/components/ui/RankBadge";
import {
  Sprout,
  BookMarked,
  Target,
  Trophy,
  Gem,
  BookOpen,
  Sigma,
  Library,
  Check,
  ArrowLeft,
  ArrowRight,
  Zap,
  Home,
  type LucideIcon,
} from "lucide-react";
import { completeOnboarding } from "@/lib/onboarding.functions";
import { trackEvent } from "@/lib/events";
import { useDismissible } from "@/hooks/useDismissible";
import { displayName } from "@/lib/guest-name";
import { toast } from "sonner";

const GOALS: ReadonlyArray<{ icon: LucideIcon; range: string; label: string; value: number }> = [
  { icon: Sprout, range: "0,5–0,9", label: "Grundläggande", value: 0.7 },
  { icon: BookMarked, range: "1,0–1,2", label: "Godkänt", value: 1.1 },
  { icon: Target, range: "1,3–1,5", label: "Bra resultat", value: 1.4 },
  { icon: Trophy, range: "1,6–1,8", label: "Mycket bra", value: 1.7 },
  { icon: Gem, range: "1,9–2,0", label: "Toppresultat", value: 1.95 },
];

const FOCUS: ReadonlyArray<{
  value: "verbal" | "math" | "both";
  icon: LucideIcon;
  label: string;
  sub: string;
}> = [
  { value: "verbal", icon: BookOpen, label: "Svenska", sub: "ORD, MEK, LÄS, ELF" },
  { value: "math", icon: Sigma, label: "Matte", sub: "XYZ, KVA, NOG, DTK" },
  { value: "both", icon: Library, label: "Båda", sub: "Träna allt" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onStartFirstMatch?: (type: "verbal" | "math") => void;
}

export function OnboardingModal({ open, onClose, onStartFirstMatch }: Props) {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const completeOnboardingFn = useServerFn(completeOnboarding);
  const [step, setStep] = useState(0);
  const [target, setTarget] = useState<number | null>(null);
  const [focus, setFocus] = useState<"verbal" | "math" | "both" | null>(null);
  const [saving, setSaving] = useState(false);

  // Bara scroll-lås, ingen Escape-stängning: "Hoppa över onboarding" sparar
  // att onboardingen är avklarad. En tyst Esc hade stängt rutan utan att
  // spara, så den dykt upp igen vid nästa sidladdning.
  useDismissible(open && !!user && !!profile);

  if (!open || !user || !profile) return null;

  const persist = async () => {
    await completeOnboardingFn({
      data: {
        targetScore: target,
        preferredType: focus,
      },
    });
  };

  const finish = async (startMatch: boolean) => {
    if (!user) return;
    setSaving(true);
    try {
      await persist();
    } catch (error) {
      toast.error("Kunde inte spara", {
        description: error instanceof Error ? error.message : "Försök igen.",
      });
      setSaving(false);
      return;
    }
    // Onboarding klar — den viktigaste funnel-punkten på sajten.
    trackEvent("onboarding_completed", {
      skipped: false,
      target_score: target,
      preferred_type: focus,
      started_match: startMatch,
    });
    refreshProfile();
    onClose();
    if (startMatch) {
      const t: "verbal" | "math" = focus === "math" ? "math" : "verbal";
      navigate({ to: "/matchmaking", search: { type: t } });
    } else {
      navigate({ to: "/" });
    }
    setSaving(false);
  };

  const skip = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await completeOnboardingFn({
        data: {
          targetScore: null,
          preferredType: null,
        },
      });
    } catch (error) {
      toast.error("Kunde inte spara", {
        description: error instanceof Error ? error.message : "Försök igen.",
      });
      setSaving(false);
      return;
    }
    // Överhoppad onboarding räknas som avklarad i databasen — håll isär dem
    // här, annars går det inte att se hur många som faktiskt fyllde i något.
    trackEvent("onboarding_completed", { skipped: true });
    refreshProfile();
    onClose();
    setSaving(false);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(46,30,20,0.5)] p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Kom igång"
    >
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
        {/* Progress indicator */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                i <= step ? "bg-[#ae2f26]" : "bg-border"
              }`}
            />
          ))}
        </div>

        <div key={step} className="animate-in slide-in-from-right-4 fade-in duration-300">
          {step === 0 && (
            <>
              <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                Välkommen, {displayName(profile.username, profile.id)}!
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">Vad siktar du på för HP-poäng?</p>
              <div className="mt-5 grid gap-2">
                {GOALS.map((g) => {
                  const selected = target === g.value;
                  return (
                    <button
                      key={g.value}
                      onClick={() => setTarget(g.value)}
                      className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-all ${
                        selected
                          ? "border-[#ae2f26] bg-[#ae2f26]/10"
                          : "border-border bg-card hover:border-foreground/20"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <g.icon className="h-5 w-5 text-[#ae2f26]" strokeWidth={1.5} aria-hidden />
                        <span>
                          <span className="font-semibold tabular-nums">{g.range}</span>{" "}
                          <span className="text-sm text-muted-foreground">{g.label}</span>
                        </span>
                      </span>
                      {selected && <Check className="h-4 w-4 text-[#ae2f26]" aria-hidden />}
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 flex items-center justify-between">
                <button onClick={skip} className="text-xs text-muted-foreground hover:underline">
                  Hoppa över onboarding
                </button>
                <Button onClick={() => setStep(1)} disabled={target === null}>
                  Sätt mitt mål
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                Vad vill du träna på?
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">Du kan alltid byta senare.</p>
              <div className="mt-5 grid gap-2">
                {FOCUS.map((f) => {
                  const selected = focus === f.value;
                  return (
                    <button
                      key={f.value}
                      onClick={() => setFocus(f.value)}
                      className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                        selected
                          ? "border-[#ae2f26] bg-[#ae2f26]/10"
                          : "border-border bg-card hover:border-foreground/20"
                      }`}
                    >
                      <f.icon className="h-5 w-5 text-[#ae2f26]" strokeWidth={1.5} aria-hidden />
                      <span>
                        <div className="font-semibold">{f.label}</div>
                        <div className="text-xs text-muted-foreground">{f.sub}</div>
                      </span>
                      {selected && <Check className="ml-auto h-4 w-4 text-[#ae2f26]" aria-hidden />}
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 flex items-center justify-between">
                <Button variant="ghost" onClick={() => setStep(0)}>
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                  Tillbaka
                </Button>
                <Button onClick={() => setStep(2)} disabled={focus === null}>
                  Nästa
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                Du är redo!
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Din ELO börjar på 1000 – Silver-rankingen.
              </p>
              <div className="mt-6 flex justify-center">
                <RankBadge elo={1000} size="lg" showName />
              </div>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Spela din första match för att se var du hamnar.
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <Button
                  size="lg"
                  className="w-full bg-[#ae2f26] text-[#2e1e14] hover:bg-[#8f2620]"
                  disabled={saving}
                  onClick={() => finish(true)}
                >
                  <Zap className="h-4 w-4" aria-hidden />
                  Spela första matchen
                </Button>
                <Button variant="outline" disabled={saving} onClick={() => finish(false)}>
                  <Home className="h-4 w-4" aria-hidden />
                  Gå till hemskärmen
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
