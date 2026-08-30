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
import {
  Loader2,
  GraduationCap,
  Check,
  Lock,
  ArrowLeft,
  CalendarClock,
  CalendarCheck2,
} from "lucide-react";
import {
  completeCoachingBooking,
  startCoachingBooking,
  startCoachingCheckout,
  type CoachingCheckoutHandle,
} from "@/lib/coaching.functions";
import { useCoachingOffer, coachingPriceLabel, coachingTermsLabel } from "@/hooks/useCoachingOffer";
import { trackEvent, type CoachingSource } from "@/lib/events";
import { trackError } from "@/lib/telemetry";
import { CALENDLY_ORIGIN, readCalendlyMessage } from "@/lib/calendly-embed";
import { StripeCheckoutEmbed } from "@/components/StripeCheckoutEmbed";
import { formatDateLong, formatTime } from "@/lib/sv-format";

/* =====================================================================
   COACHING — välj en tid, betala sedan, allt i samma modal.

   Tre steg: erbjudandet, Calendlys tidsväljare och Stripes kassa. Ingen av
   dem byter sida. Ordningen tid-före-betalning är den som säljer bäst — den
   som redan har en tid i kalendern slutför köpet oftare än den som ska
   "höra av sig sen" — och den var tidigare dyr av ett enda skäl: kassan låg
   på checkout.stripe.com, och den som stängde fliken där lämnade en bokad,
   obetald tid efter sig. Med kassan inbäddad står tiden och betalningen i
   samma ruta, ett klick isär.

   Baksidan finns kvar i det lilla: den som bokar och stänger modalen håller
   en tid tills städaren river den. Se `coaching-sweep.ts`; kassan går ut
   efter CHECKOUT_TTL_MIN och `checkout.session.expired` släpper tiden direkt.

   Calendly bäddas in som en vanlig iframe, utan deras widget.js: det enda
   scriptet gör är att lyssna på postMessage, vilket vi gör själva nedan.
   Stripes v3 måste däremot laddas från deras domän — se StripeCheckoutEmbed.

   Inga kortuppgifter passerar någonsin vår kod. Priset står inte heller i
   koden utan läses ur produkten i Stripe, så ett ändrat pris i dashboarden
   syns här utan deploy.
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
  const [arbetar, setArbetar] = useState(false);
  const [schedulingUrl, setSchedulingUrl] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  /** Kassan, så som servern gav oss den. Ett av fälten är satt, aldrig båda. */
  const [kassa, setKassa] = useState<CoachingCheckoutHandle | null>(null);
  /** Den bokade tiden (ISO), att visa ovanför kassan. */
  const [bokadTid, setBokadTid] = useState<string | null>(null);
  const [kassaFel, setKassaFel] = useState<string | null>(null);
  /** Sparad för att kunna försöka igen — tiden är redan bokad hos Calendly. */
  const [inviteeUri, setInviteeUri] = useState<string | null>(null);

  /**
   * Calendly skickar ibland samma `event_scheduled` mer än en gång. Utan
   * spärren blir varje dubblett en extra Checkout-session hos Stripe, och
   * köparen ser den sista av dem — betalningen hamnar då på en annan session
   * än den vi hann skriva på raden.
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
  // halvfärdigt steg med en kassa som hör till ett annat köp.
  useEffect(() => {
    if (open) return;
    setSteg("erbjudande");
    setSchedulingUrl(null);
    setRequestId(null);
    setKassa(null);
    setBokadTid(null);
    setKassaFel(null);
    setInviteeUri(null);
    setArbetar(false);
    hanteradBokning.current = null;
    rapporterad.current = { öppning: false, kalender: false, tidsval: false };
  }, [open]);

  /**
   * Tar emot kassan från servern.
   *
   * Två utfall, och vilket det blir avgörs av om `STRIPE_PUBLISHABLE_KEY` är
   * satt i miljön: antingen renderas kassan här (`clientSecret`), eller så
   * skickas webbläsaren till Stripe som förut (`url`).
   */
  const visaKassa = useCallback(
    (handle: CoachingCheckoutHandle) => {
      trackEvent("coaching_checkout_started", { source, is_guest: !riktigtKonto });
      setBokadTid(handle.scheduledAt);
      if (handle.clientSecret) {
        setKassa(handle);
        setKassaFel(null);
        setSteg("kassa");
        return;
      }
      if (handle.url) {
        window.location.href = handle.url;
        return;
      }
      // Servern kastar hellre än att svara så här, men typen tillåter det.
      trackError("stripe: kassa utan både client_secret och url", { source });
      setSteg("kassa");
      setKassaFel("Kassan kunde inte öppnas.");
    },
    [riktigtKonto, source],
  );

  /** Rakt till kassan — vägen när tidsbokning inte är påslagen. */
  const köpDirekt = useCallback(async () => {
    setArbetar(true);
    try {
      const handle = (await checkoutFn({ data: { source, email } })) as CoachingCheckoutHandle;
      visaKassa(handle);
    } catch (e) {
      trackEvent("coaching_checkout_failed", { source });
      toast.error(e instanceof Error ? e.message : "Kunde inte öppna kassan");
    } finally {
      setArbetar(false);
    }
  }, [checkoutFn, email, source, visaKassa]);

  const öppnaTidsval = async () => {
    // Den som backar till erbjudandet och går fram igen ska inte lämna en ny
    // övergiven rad i coaching_requests för varje klick.
    if (schedulingUrl && requestId) {
      setSteg("tid");
      return;
    }
    setArbetar(true);
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
    } catch (e) {
      trackEvent("coaching_checkout_failed", { source });
      toast.error(e instanceof Error ? e.message : "Kunde inte öppna tidsvalet");
    } finally {
      setArbetar(false);
    }
  };

  /**
   * Öppnad från nudgen, som redan visat pris och argument: gå rakt på
   * kalendern i stället för att säga samma sak en gång till.
   *
   * Bara när tidsbokning bevisligen är påslagen. Utan Calendly faller
   * `öppnaTidsval` vidare till kassan, och att skicka någon in i en betalning
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
      setKassaFel(null);
      setInviteeUri(uri);
      try {
        const handle = (await completeFn({
          data: { requestId, inviteeUri: uri, source },
        })) as CoachingCheckoutHandle;
        visaKassa(handle);
      } catch (e) {
        trackEvent("coaching_checkout_failed", { source });
        setKassaFel(e instanceof Error ? e.message : "Kunde inte öppna kassan");
      }
    },
    [completeFn, requestId, source, visaKassa],
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
        setKassaFel("Vi fick inte tillbaka din bokningsreferens.");
        return;
      }
      void slutförRef.current(msg.inviteeUri);
    };
    window.addEventListener("message", lyssnare);
    return () => window.removeEventListener("message", lyssnare);
  }, [steg, schedulingUrl, source]);

  const priceLabel = coachingPriceLabel(offer);
  const termsLabel = coachingTermsLabel(offer);
  const brett = steg !== "erbjudande";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={brett ? "max-h-[92vh] overflow-y-auto sm:max-w-2xl" : "max-h-[92vh] sm:max-w-md"}
        // Ett klick bredvid rutan får inte kasta bort en bokad tid och en
        // halvfärdig betalning. Escape och krysset stänger fortfarande —
        // att stänga ska vara möjligt, bara inte av misstag.
        onInteractOutside={(e) => {
          if (brett) e.preventDefault();
        }}
      >
        {steg === "erbjudande" ? (
          <>
            <DialogHeader>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
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
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
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
                  <p className="mt-1.5 text-center text-[13px] font-medium text-success">
                    {termsLabel}
                  </p>
                )}
                <Button
                  onClick={() => void (offer.schedulingEnabled ? öppnaTidsval() : köpDirekt())}
                  disabled={arbetar}
                  className="mt-3 min-h-[44px] w-full bg-primary py-6 text-[15px] text-on-brand hover:bg-primary-deep"
                >
                  {arbetar && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {arbetar
                    ? "Öppnar…"
                    : offer.schedulingEnabled
                      ? "Välj en tid"
                      : "Fortsätt till betalning"}
                </Button>
                <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-white/50">
                  <Lock className="h-3 w-3" aria-hidden />
                  {offer.schedulingEnabled
                    ? "Du betalar först efter att tiden är vald, säkert via Stripe."
                    : "Betalningen sker säkert via Stripe. Kort sparas aldrig hos oss."}
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
                  className="mt-3 inline-flex items-center justify-center rounded-xl bg-success px-5 py-2.5 text-sm font-semibold text-on-brand transition hover:brightness-110"
                >
                  Hör av dig så löser vi det
                </Link>
              </div>
            )}
          </>
        ) : steg === "tid" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <CalendarClock className="h-5 w-5 text-primary" aria-hidden />
                Välj en tid
              </DialogTitle>
              <DialogDescription>
                {priceLabel ? `Studieupplägg, ${priceLabel}. ` : ""}
                Betalningen sker i nästa steg, här i rutan.
              </DialogDescription>
            </DialogHeader>

            <iframe
              src={schedulingUrl ?? undefined}
              title="Välj en tid för din coachning"
              className="h-[65vh] min-h-[460px] w-full rounded-xl border border-[rgba(46,30,20,0.16)]"
            />
            <button
              type="button"
              onClick={() => setSteg("erbjudande")}
              className="mx-auto flex min-h-[44px] items-center gap-1.5 text-sm text-white/60 underline-offset-4 transition hover:text-[var(--cream)] hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              Tillbaka
            </button>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Lock className="h-5 w-5 text-primary" aria-hidden />
                Betala
              </DialogTitle>
              <DialogDescription>
                {bokadTid ? (
                  <span className="flex items-center gap-1.5">
                    <CalendarCheck2 className="h-4 w-4 shrink-0 text-success" aria-hidden />
                    Din tid {formatDateLong(bokadTid)} kl {formatTime(bokadTid)} är reserverad medan
                    du betalar.
                  </span>
                ) : (
                  "Kortuppgifterna går direkt till Stripe och passerar aldrig oss."
                )}
              </DialogDescription>
            </DialogHeader>

            {kassaFel ? (
              // Tiden ÄR bokad här — det som misslyckades var kassan. Säg det,
              // annars bokar köparen en tid till i tron att inget hände.
              <div className="py-6 text-center">
                <p className="text-[15px] leading-relaxed text-white/70">
                  {requestId ? `Din tid är bokad, men kassan öppnade inte: ${kassaFel}` : kassaFel}
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
                    className="mt-5 min-h-[44px] bg-primary px-6 py-5 text-[15px] text-on-brand hover:bg-primary-deep"
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
            ) : kassa?.clientSecret && offer?.publishableKey ? (
              <StripeCheckoutEmbed
                clientSecret={kassa.clientSecret}
                publishableKey={offer.publishableKey}
                onError={setKassaFel}
              />
            ) : (
              <div className="py-12 text-center" aria-busy="true">
                <Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" />
                <p className="mt-4 text-sm text-white/60">
                  {requestId ? "Tiden är bokad, öppnar kassan…" : "Öppnar kassan…"}
                </p>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
