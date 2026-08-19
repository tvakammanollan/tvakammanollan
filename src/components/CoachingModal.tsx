import { useCallback, useEffect, useRef, useState } from "react";
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
import { useCoachingOffer, coachingPriceLabel, coachingTermsLabel } from "@/hooks/useCoachingOffer";
import { trackEvent, type CoachingSource } from "@/lib/events";

/* =====================================================================
   COACHING — betala först, välj tid sedan.

   Modalen har ett enda steg: erbjudandet och en knapp till Stripe.
   Tidsväljaren låg tidigare HÄR, före betalningen, med motiveringen att
   den som redan har en tid i kalendern slutför köpet oftare. Priset för
   det var att en tid kunde bli bokad utan att någon betalade — Calendly
   binder tiden i samma sekund den bokas, medan Checkout går att stänga —
   och att den publika bokningslänken låg i sidkällan, där vem som helst
   kunde ta den och boka helt utan att passera kassan.

   Tidsvalet ligger nu på `/coachning/tack`, bakom en betald session. Se
   `CoachingScheduler` och `startPaidCoachingBooking`.

   Betalningen sker hos Stripe, inte här. Inga kortuppgifter passerar
   någonsin sajten. Priset står inte i koden utan läses ur produkten i
   Stripe, så ett ändrat pris i dashboarden syns här utan deploy.
   ===================================================================== */

export function CoachingModal({
  open,
  onOpenChange,
  source = "dashboard",
  autoStart = false,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  source?: CoachingSource;
  /**
   * Öppnad från nudgen, som redan visat pris och argument: skicka vidare till
   * kassan direkt i stället för att säga samma sak en gång till. Bara när
   * priset bevisligen är hämtat — att skicka någon in i en betalning innan
   * beloppet ens är känt är inte samma sak som att visa ett erbjudande.
   */
  autoStart?: boolean;
}) {
  const { user, profile } = useAuth();
  const checkoutFn = useServerFn(startCoachingCheckout);
  const { offer, loading: loadingOffer } = useCoachingOffer(open);

  const [redirecting, setRedirecting] = useState(false);
  /** En öppning ska räknas en gång per gång modalen visas. */
  const rapporterad = useRef(false);

  const riktigtKonto = !!user && !user.is_anonymous;
  const email = riktigtKonto ? (profile?.email ?? undefined) : undefined;

  // Först när priset landat: `useCoachingOffer` börjar hämta när modalen
  // öppnas, så ett anrop i samma andetag som `open` hade rapporterat
  // `available: false` för alla vars cache ännu är kall — alltså precis den
  // kvot flaggan finns för ("ingen vill köpa" mot "ingen kunde").
  useEffect(() => {
    if (!open || loadingOffer || rapporterad.current) return;
    rapporterad.current = true;
    trackEvent("coaching_offer_opened", { source, available: offer?.available ?? false });
  }, [open, loadingOffer, offer, source]);

  useEffect(() => {
    if (open) return;
    setRedirecting(false);
    rapporterad.current = false;
  }, [open]);

  const köp = useCallback(async () => {
    setRedirecting(true);
    trackEvent("coaching_checkout_started", { source, is_guest: !riktigtKonto });
    try {
      const { url } = await checkoutFn({ data: { source, email } });
      window.location.href = url;
    } catch (e) {
      setRedirecting(false);
      trackEvent("coaching_checkout_failed", { source });
      toast.error(e instanceof Error ? e.message : "Kunde inte öppna kassan");
    }
  }, [checkoutFn, email, riktigtKonto, source]);

  const köpRef = useRef(köp);
  köpRef.current = köp;
  const autoStartad = useRef(false);
  useEffect(() => {
    if (!open) {
      autoStartad.current = false;
      return;
    }
    if (!autoStart || autoStartad.current) return;
    if (!offer?.available) return;
    autoStartad.current = true;
    void köpRef.current();
  }, [open, autoStart, offer]);

  const priceLabel = coachingPriceLabel(offer);
  const termsLabel = coachingTermsLabel(offer);

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
            offer?.schedulingEnabled
              ? "Direkt efter köpet väljer du en tid som passar dig"
              : "Vi hör av oss inom 24 timmar efter köpet",
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
            {/* Beloppet ensamt läser som ett abonnemang för den som är van vid
                att allt är månadsvis. Raden härleds ur priset i Stripe och
                uteblir om det någonsin blir återkommande. */}
            {termsLabel && (
              <p className="mt-1.5 text-center text-[13px] font-medium text-[#2f6b3c]">
                {termsLabel}
              </p>
            )}
            <Button
              onClick={() => void köp()}
              disabled={redirecting}
              className="mt-3 w-full bg-[#ae2f26] py-6 text-[15px] text-[#fff8f5] hover:bg-[#8f2620]"
            >
              {redirecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {redirecting ? "Öppnar…" : "Fortsätt till betalning"}
            </Button>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-white/50">
              <Lock className="h-3 w-3" aria-hidden />
              {offer.schedulingEnabled
                ? "Betalningen sker säkert hos Stripe. Tiden väljer du direkt efteråt."
                : "Betalningen sker säkert hos Stripe. Kort sparas aldrig hos oss."}
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
