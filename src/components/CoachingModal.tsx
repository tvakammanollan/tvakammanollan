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
import { Loader2, GraduationCap, Check, Lock, ArrowLeft, CalendarClock } from "lucide-react";
import {
  completeCoachingBooking,
  startCoachingBooking,
  startCoachingCheckout,
} from "@/lib/coaching.functions";
import { useCoachingOffer, coachingPriceLabel, coachingTermsLabel } from "@/hooks/useCoachingOffer";
import { trackEvent, type CoachingSource } from "@/lib/events";
import { trackError } from "@/lib/telemetry";
import { CALENDLY_ORIGIN, readCalendlyMessage } from "@/lib/calendly-embed";

/* =====================================================================
   COACHING — välj en tid, betala sedan.

   Två steg: erbjudandet, och Calendlys tidsväljare. Först när en tid är
   bokad skapas Stripe-sessionen och webbläsaren skickas vidare. Ordningen
   är vald medvetet — den som redan har en tid i kalendern slutför köpet
   oftare än den som ska "höra av sig sen" — och priset för den är att en
   bokning kan bli stående obetald om kassan överges. De listas i
   `coaching_obetalda_bokningar` och avbokas för hand.

   Calendly bäddas in som en vanlig iframe, utan deras widget.js: det enda
   scriptet gör är att lyssna på postMessage, vilket vi gör själva nedan.
   Därmed öppnas bara `frame-src` i CSP:n, inte `script-src`.

   Betalningen sker hos Stripe, inte här. Inga kortuppgifter passerar
   någonsin sajten. Priset står inte i koden utan läses ur produkten i
   Stripe, så ett ändrat pris i dashboarden syns här utan deploy.
   ===================================================================== */

type Steg = "erbjudande" | "tid" | "kassa";

export function CoachingModal({
  open,
  onOpenChange,
  source = "dashboard",
  autoStart = false,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  source?: CoachingSource;
  /** Hoppa förbi erbjudandesteget och gå rakt på tidsväljaren när den öppnas. */
  autoStart?: boolean;
}) {
  const { user, profile } = useAuth();
  const checkoutFn = useServerFn(startCoachingCheckout);
  const bookingFn = useServerFn(startCoachingBooking);
  const completeFn = useServerFn(completeCoachingBooking);
  const { offer, loading: loadingOffer } = useCoachingOffer(open);

  const [steg, setSteg] = useState<Steg>("erbjudande");
  const [redirecting, setRedirecting] = useState(false);
  const [schedulingUrl, setSchedulingUrl] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  /** Sparad för att kunna försöka igen — tiden är redan bokad hos Calendly. */
  const [inviteeUri, setInviteeUri] = useState<string | null>(null);
  /**
   * Calendly skickar ibland samma `event_scheduled` mer än en gång. Utan
   * spärren blir varje dubblett en extra Checkout-session hos Stripe, och
   * användaren skickas till den sista av dem — betalningen hamnar då på en
   * annan session än den vi hann skriva på raden.
   */
  const hanteradBokning = useRef<string | null>(null);
  /** En öppning ska räknas en gång, och Calendlys visningshändelser likaså —
      `event_type_viewed` kommer om igen varje gång väljaren byter vy. */
  const rapporterad = useRef({ öppning: false, kalender: false, tidsval: false });

  const riktigtKonto = !!user && !user.is_anonymous;
  const email = riktigtKonto ? (profile?.email ?? undefined) : undefined;
  const namn = riktigtKonto ? (profile?.username ?? undefined) : undefined;

  // En gång per öppning, men först när priset landat: `useCoachingOffer` börjar
  // hämta när modalen öppnas, så ett anrop i samma andetag som `open` hade
  // rapporterat `available: false` för alla vars cache ännu är kall — alltså
  // precis den kvot flaggan finns för ("ingen vill köpa" mot "ingen kunde").
  useEffect(() => {
    if (!open || loadingOffer || rapporterad.current.öppning) return;
    rapporterad.current.öppning = true;
    trackEvent("coaching_offer_opened", { source, available: offer?.available ?? false });
  }, [open, loadingOffer, offer, source]);

  // Nollställ när modalen stängs, annars öppnas den nästa gång mitt i ett
  // halvfärdigt bokningssteg med en länk som hör till ett annat köp.
  useEffect(() => {
    if (open) return;
    setSteg("erbjudande");
    setSchedulingUrl(null);
    setRequestId(null);
    setBookingError(null);
    setInviteeUri(null);
    setRedirecting(false);
    hanteradBokning.current = null;
    rapporterad.current = { öppning: false, kalender: false, tidsval: false };
  }, [open]);

  /** Rakt till Stripe — vägen när tidsbokning inte är påslagen. */
  const köpDirekt = useCallback(async () => {
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

  const öppnaTidsval = async () => {
    // Den som backar till erbjudandet och går fram igen ska inte lämna en ny
    // övergiven rad i coaching_requests för varje klick.
    if (schedulingUrl && requestId) {
      setSteg("tid");
      return;
    }
    setRedirecting(true);
    try {
      const { schedulingUrl: url, requestId: id } = await bookingFn({
        data: { source, email, name: namn },
      });
      trackEvent("coaching_booking_opened", { source, scheduling: !!url });
      if (!url || !id) {
        // Calendly är inte konfigurerat i den här miljön — hoppa steget helt
        // hellre än att visa en tom ruta.
        await köpDirekt();
        return;
      }
      setSchedulingUrl(url);
      setRequestId(id);
      setSteg("tid");
      setRedirecting(false);
    } catch (e) {
      setRedirecting(false);
      trackEvent("coaching_checkout_failed", { source });
      toast.error(e instanceof Error ? e.message : "Kunde inte öppna tidsvalet");
    }
  };

  /**
   * Öppnad från nudgen, som redan visat pris och argument: gå rakt på
   * kalendern i stället för att säga samma sak en gång till.
   *
   * Bara när tidsbokning bevisligen är påslagen. Utan Calendly faller
   * `öppnaTidsval` vidare till Stripe, och att skicka någon in i en betalning
   * på ett klick är inte samma sak som att visa lediga tider — då får
   * erbjudandesteget stå kvar och köparen klicka själv.
   */
  const öppnaTidsvalRef = useRef(öppnaTidsval);
  öppnaTidsvalRef.current = öppnaTidsval;
  const autoStartad = useRef(false);
  useEffect(() => {
    if (!open) {
      autoStartad.current = false;
      return;
    }
    if (!autoStart || autoStartad.current) return;
    if (!offer?.available || !offer.schedulingEnabled) return;
    autoStartad.current = true;
    void öppnaTidsvalRef.current();
  }, [open, autoStart, offer]);

  const slutför = useCallback(
    async (uri: string) => {
      if (!requestId) return;
      setSteg("kassa");
      setBookingError(null);
      setInviteeUri(uri);
      try {
        const { url } = await completeFn({ data: { requestId, inviteeUri: uri, source } });
        trackEvent("coaching_checkout_started", { source, is_guest: !riktigtKonto });
        window.location.href = url;
      } catch (e) {
        trackEvent("coaching_checkout_failed", { source });
        setBookingError(e instanceof Error ? e.message : "Kunde inte öppna kassan");
      }
    },
    [completeFn, requestId, riktigtKonto, source],
  );

  // Calendly meddelar bokningen via postMessage. Nyttolasten innehåller bara
  // URI:er — själva tiden hämtas server-side, så det finns inget här att lita
  // på utöver att meddelandet kom från rätt origin.
  //
  // Samma ström bär de två visningshändelserna, och de är enda sättet att se
  // in i iframen: `calendar_viewed` skiljer "väljaren laddade" från en trasig
  // event-typ-slug, `time_selected` skiljer "tittade på tiderna" från "valde en".
  const slutförRef = useRef(slutför);
  slutförRef.current = slutför;
  useEffect(() => {
    if (steg !== "tid" || !schedulingUrl) return;
    const lyssnare = (e: MessageEvent) => {
      if (e.origin !== CALENDLY_ORIGIN) return;
      const msg = readCalendlyMessage(e.data);
      if (!msg) return;
      if (msg.kind === "calendar_viewed") {
        if (rapporterad.current.kalender) return;
        rapporterad.current.kalender = true;
        trackEvent("coaching_calendar_viewed", { source });
        return;
      }
      if (msg.kind === "time_selected") {
        if (rapporterad.current.tidsval) return;
        rapporterad.current.tidsval = true;
        trackEvent("coaching_time_selected", { source });
        return;
      }
      // Bokad. Nyckeln får inte vara URI:n ensam — utan den skulle en
      // dubblett räknas som ett andra köp.
      const nyckel = msg.inviteeUri ?? "utan-uri";
      if (hanteradBokning.current === nyckel) return;
      hanteradBokning.current = nyckel;
      trackEvent("coaching_time_booked", { source });
      if (!msg.inviteeUri) {
        // Tiden ÄR bokad, men utan invitee-URI går den inte att slå upp och
        // därmed inte att knyta till en betalning. Säg det hellre än att låta
        // köparen sitta kvar i en kalender som ser klar ut.
        trackError("calendly: event_scheduled utan invitee-uri", { source });
        setSteg("kassa");
        setBookingError("vi fick inte tillbaka din bokningsreferens");
        return;
      }
      void slutförRef.current(msg.inviteeUri);
    };
    window.addEventListener("message", lyssnare);
    return () => window.removeEventListener("message", lyssnare);
  }, [steg, schedulingUrl, source]);

  const priceLabel = coachingPriceLabel(offer);
  const termsLabel = coachingTermsLabel(offer);
  const bokning = steg !== "erbjudande";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={bokning ? "sm:max-w-2xl" : "sm:max-w-md"}>
        {steg === "erbjudande" ? (
          <>
            <DialogHeader>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#ae2f26]/15 text-[#ae2f26]">
                <GraduationCap className="h-6 w-6" />
              </div>
              <DialogTitle className="text-center text-xl">
                Få ett studieupplägg gjort för dig
              </DialogTitle>
              <DialogDescription className="text-center">
                Träningen här tar dig långt på egen hand. Vet du inte var tiden ska läggas bygger vi
                ett upplägg efter var du står och hur lång tid du har kvar, av någon som själv fått{" "}
                <strong>1,95 eller högre</strong> på provet.
              </DialogDescription>
            </DialogHeader>

            <ul className="mt-1 space-y-2.5 text-sm text-white/70">
              {[
                "Upplägget byggs efter din nivå och tiden du har kvar till provet",
                "Gjort av en coach som själv skrivit 1,95 eller högre",
                offer?.schedulingEnabled
                  ? "Du väljer en tid som passar innan du betalar"
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
                {/* Beloppet ensamt läser som ett abonnemang för den som är van
                    vid att allt är månadsvis. Raden härleds ur priset i Stripe
                    och uteblir om det någonsin blir återkommande. */}
                {termsLabel && (
                  <p className="mt-1.5 text-center text-[13px] font-medium text-[#2f6b3c]">
                    {termsLabel}
                  </p>
                )}
                <Button
                  onClick={offer.schedulingEnabled ? öppnaTidsval : köpDirekt}
                  disabled={redirecting}
                  className="mt-3 w-full bg-[#ae2f26] py-6 text-[15px] text-[#fff8f5] hover:bg-[#8f2620]"
                >
                  {redirecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {redirecting
                    ? "Öppnar…"
                    : offer.schedulingEnabled
                      ? "Välj en tid"
                      : "Fortsätt till betalning"}
                </Button>
                <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-white/50">
                  <Lock className="h-3 w-3" aria-hidden />
                  {offer.schedulingEnabled
                    ? "Du betalar först efter att tiden är vald, säkert hos Stripe."
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
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <CalendarClock className="h-5 w-5 text-[#ae2f26]" aria-hidden />
                Välj en tid
              </DialogTitle>
              <DialogDescription>
                {priceLabel ? `Studieupplägg, ${priceLabel}. ` : ""}
                Betalningen sker i nästa steg, när tiden är vald.
              </DialogDescription>
            </DialogHeader>

            {steg === "tid" && schedulingUrl ? (
              <>
                <iframe
                  src={schedulingUrl}
                  title="Välj en tid för din coachning"
                  className="h-[65vh] min-h-[460px] w-full rounded-xl border border-[rgba(46,30,20,0.16)]"
                />
                <button
                  type="button"
                  onClick={() => setSteg("erbjudande")}
                  className="mx-auto flex items-center gap-1.5 text-sm text-white/60 underline-offset-4 transition hover:text-[var(--cream)] hover:underline"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                  Tillbaka
                </button>
              </>
            ) : bookingError ? (
              // Tiden ÄR bokad här — det som misslyckades var kassan. Säg det,
              // annars bokar köparen en tid till i tron att inget hände.
              <div className="py-6 text-center">
                <p className="text-[15px] leading-relaxed text-white/70">
                  Din tid är bokad, men kassan öppnade inte: {bookingError}
                </p>
                {/* Utan invitee-URI finns inget att försöka igen med — knappen
                    hade sett ut som en väg framåt och inte gjort någonting. */}
                {inviteeUri && (
                  <Button
                    onClick={() => {
                      // Spärren ovan gäller dubbletter från Calendly, inte ett
                      // medvetet omförsök efter ett fel.
                      hanteradBokning.current = null;
                      void slutför(inviteeUri);
                    }}
                    className="mt-5 bg-[#ae2f26] px-6 py-5 text-[15px] text-[#fff8f5] hover:bg-[#8f2620]"
                  >
                    Försök igen
                  </Button>
                )}
                <p className="mt-4 text-xs text-white/50">
                  Fortsätter det att strula, mejla{" "}
                  <a href="mailto:info@tvakommanollan.se" className="underline">
                    info@tvakommanollan.se
                  </a>{" "}
                  så tar vi det därifrån. Tiden är redan din.
                </p>
              </div>
            ) : (
              <div className="py-12 text-center" aria-busy="true">
                <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#ae2f26]" />
                <p className="mt-4 text-sm text-white/60">Tiden är bokad, öppnar kassan…</p>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
