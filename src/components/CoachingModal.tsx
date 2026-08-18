import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, GraduationCap, Check, Lock } from "lucide-react";
import { startCoachingCheckout } from "@/lib/coaching.functions";
import { useCoachingOffer, coachingPriceLabel } from "@/hooks/useCoachingOffer";
import { trackEvent, type CoachingSource } from "@/lib/events";

/* =====================================================================
   COACHING — köp av studieupplägg via Stripe Checkout.

   Betalningen sker hos Stripe, inte här: knappen skapar en session på
   servern och skickar webbläsaren vidare. Inga kortuppgifter passerar
   någonsin sajten, och därför behövs varken Stripes JS eller en öppning
   i CSP:n.

   Priset står inte i koden. Det läses ur produkten i Stripe, så ett
   ändrat pris i dashboarden syns här utan deploy — och kan aldrig visa
   ett annat belopp än det kassan sedan drar.
   ===================================================================== */

export function CoachingModal({
  open,
  onOpenChange,
  source = "dashboard",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  source?: CoachingSource;
}) {
  const { user, profile } = useAuth();
  const checkoutFn = useServerFn(startCoachingCheckout);
  const { offer, loading: loadingOffer } = useCoachingOffer(open);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (open) trackEvent("coaching_offer_opened", { source, available: offer?.available ?? false });
    // Bara vid öppning — inte varje gång priset landar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const buy = async () => {
    setRedirecting(true);
    trackEvent("coaching_checkout_started", { source, is_guest: !user || !!user.is_anonymous });
    try {
      const { url } = await checkoutFn({
        data: {
          source,
          // Förifyller kassan för inloggade med riktigt konto. Gäster har en
          // genererad adress som inte går att nå, så den skickas inte med.
          email: user && !user.is_anonymous ? (profile?.email ?? undefined) : undefined,
        },
      });
      window.location.href = url;
    } catch (e) {
      setRedirecting(false);
      trackEvent("coaching_checkout_failed", { source });
      toast.error(e instanceof Error ? e.message : "Kunde inte öppna kassan");
    }
  };

  const priceLabel = coachingPriceLabel(offer);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#ae2f26]/15 text-[#ae2f26]">
            <GraduationCap className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-xl">
            Få ett studieupplägg gjort för dig
          </DialogTitle>
          <DialogDescription className="text-center">
            Träningen här tar dig långt på egen hand. Vet du inte var tiden ska läggas bygger vi ett
            upplägg efter var du står och hur lång tid du har kvar, av någon som själv fått{" "}
            <strong>1,95 eller högre</strong> på provet.
          </DialogDescription>
        </DialogHeader>

        <ul className="mt-1 space-y-2.5 text-sm text-white/70">
          {[
            "Upplägget byggs efter din nivå och tiden du har kvar till provet",
            "Gjort av en coach som själv skrivit 1,95 eller högre",
            "Vi hör av oss inom 24 timmar efter köpet",
          ].map((rad) => (
            <li key={rad} className="flex items-start gap-2.5">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2f6b3c]" aria-hidden />
              <span>{rad}</span>
            </li>
          ))}
        </ul>

        {loadingOffer ? (
          <div className="skeleton-shimmer mt-4 h-[52px] rounded-xl" aria-busy="true" />
        ) : offer?.available ? (
          <>
            <div className="mt-4 flex items-baseline justify-center gap-2">
              <span
                className="text-[32px] font-bold leading-none text-[var(--cream)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {priceLabel}
              </span>
            </div>
            <Button
              onClick={buy}
              disabled={redirecting}
              className="mt-3 w-full bg-[#ae2f26] py-6 text-[15px] text-[#fff8f5] hover:bg-[#8f2620]"
            >
              {redirecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {redirecting ? "Öppnar kassan…" : "Fortsätt till betalning"}
            </Button>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-white/50">
              <Lock className="h-3 w-3" aria-hidden />
              Betalningen sker säkert hos Stripe. Kort sparas aldrig hos oss.
            </p>
          </>
        ) : (
          // Utan pris blir en köpknapp ett löfte vi inte kan hålla — visa
          // kontaktvägen i stället för en knapp som leder till ett felmeddelande.
          <div className="mt-4 rounded-xl border border-[rgba(46,30,20,0.16)] p-4 text-center text-sm text-white/70">
            <p>Köp direkt i appen är inte igång just nu.</p>
            <Link
              to="/kontakt"
              onClick={() => onOpenChange(false)}
              className="mt-3 inline-flex items-center justify-center rounded-xl bg-[#2f6b3c] px-5 py-2.5 text-sm font-semibold text-[#fff8f5] transition hover:brightness-110"
            >
              Hör av dig så löser vi det
            </Link>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
