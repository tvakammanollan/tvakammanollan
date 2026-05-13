import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { RankBadge } from "@/components/ui/RankBadge";
import { completeOnboarding } from "@/lib/onboarding.functions";
import { createMatch } from "@/lib/match.functions";
import { toast } from "sonner";

const GOALS = [
  { emoji: "🌱", range: "0.5–0.9", label: "Grundläggande", value: 0.7 },
  { emoji: "📘", range: "1.0–1.2", label: "Godkänt", value: 1.1 },
  { emoji: "🎯", range: "1.3–1.5", label: "Bra resultat", value: 1.4 },
  { emoji: "🏆", range: "1.6–1.8", label: "Mycket bra", value: 1.7 },
  { emoji: "💎", range: "1.9–2.0", label: "Toppresultat", value: 1.95 },
] as const;

const FOCUS = [
  { value: "verbal", emoji: "📖", label: "Svenska", sub: "ORD, MEK, LÄS, ELF" },
  { value: "math", emoji: "🔢", label: "Matte", sub: "XYZ, KVA, NOG, DTK" },
  { value: "both", emoji: "📚", label: "Båda", sub: "Träna allt" },
] as const;

interface Props {
  open: boolean;
  onClose: () => void;
  onStartFirstMatch?: (type: "verbal" | "math") => void;
}

export function OnboardingModal({ open, onClose, onStartFirstMatch }: Props) {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const completeOnboardingFn = useServerFn(completeOnboarding);
  const createMatchFn = useServerFn(createMatch);
  const [step, setStep] = useState(0);
  const [target, setTarget] = useState<number | null>(null);
  const [focus, setFocus] = useState<"verbal" | "math" | "both" | null>(null);
  const [saving, setSaving] = useState(false);

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
    refreshProfile();
    onClose();
    if (startMatch) {
      const t: "verbal" | "math" = focus === "math" ? "math" : "verbal";
      try {
        const match = await createMatchFn({ data: { match_type: t, mode: "bot" } });
        navigate({ to: "/match/$matchId", params: { matchId: match.match_id } });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Kunde inte starta matchen");
        onStartFirstMatch?.(t);
      }
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
    refreshProfile();
    onClose();
    setSaving(false);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
        {/* Progress indicator */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                i <= step ? "bg-[#0E1B2C]" : "bg-border"
              }`}
            />
          ))}
        </div>

        <div
          key={step}
          className="animate-in slide-in-from-right-4 fade-in duration-300"
        >
          {step === 0 && (
            <>
              <h2 className="text-2xl font-semibold" style={{ fontFamily: "Playfair Display, serif" }}>
                Välkommen, {profile.username}! 👋
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
                          ? "border-[#0E1B2C] bg-[#0E1B2C]/10"
                          : "border-border bg-card hover:border-foreground/20"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-xl">{g.emoji}</span>
                        <span>
                          <span className="font-semibold">{g.range}</span>{" "}
                          <span className="text-sm text-muted-foreground">{g.label}</span>
                        </span>
                      </span>
                      {selected && <span className="text-[#0E1B2C]">✓</span>}
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 flex items-center justify-between">
                <button onClick={skip} className="text-xs text-muted-foreground hover:underline">
                  Hoppa över onboarding
                </button>
                <Button onClick={() => setStep(1)} disabled={target === null}>
                  Sätt mitt mål →
                </Button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="text-2xl font-semibold" style={{ fontFamily: "Playfair Display, serif" }}>
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
                          ? "border-[#0E1B2C] bg-[#0E1B2C]/10"
                          : "border-border bg-card hover:border-foreground/20"
                      }`}
                    >
                      <span className="text-xl">{f.emoji}</span>
                      <span>
                        <div className="font-semibold">{f.label}</div>
                        <div className="text-xs text-muted-foreground">{f.sub}</div>
                      </span>
                      {selected && <span className="ml-auto text-[#0E1B2C]">✓</span>}
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 flex items-center justify-between">
                <Button variant="ghost" onClick={() => setStep(0)}>
                  ← Tillbaka
                </Button>
                <Button onClick={() => setStep(2)} disabled={focus === null}>
                  Nästa →
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-2xl font-semibold" style={{ fontFamily: "Playfair Display, serif" }}>
                Du är redo! 🚀
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
                  className="w-full bg-[#0E1B2C] text-white hover:bg-[#154a2f]"
                  disabled={saving}
                  onClick={() => finish(true)}
                >
                  ⚡ Spela första matchen nu!
                </Button>
                <Button variant="outline" disabled={saving} onClick={() => finish(false)}>
                  🏠 Gå till hemskärmen
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
