import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Check, GraduationCap } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CoachingModal } from "@/components/CoachingModal";
import { useCoachingOffer, coachingPriceLabel, coachingTermsLabel } from "@/hooks/useCoachingOffer";
import { trackEvent } from "@/lib/events";
import {
  isPromptablePath,
  promptTrigger,
  readPromptState,
  recordPageview,
  recordPromptShown,
  type PromptTrigger,
} from "@/lib/coaching-prompt";

/* =====================================================================
   NUDGEN — erbjudandet om ett studieupplägg, av sig självt.

   Kommer upp var sjunde sidvisning eller varannan avslutade match (se
   coaching-prompt.ts, som äger räkningen och trösklarna). Just nu bara EN
   gång per webbläsare: `MAX_PROMPTS` där är spärren, allt annat är redan
   byggt återkommande.

   Två regler gör skillnaden mellan en nudge och en pop-up-annons:

   1. Aldrig mitt i något. `isPromptablePath` håller den borta från matcher,
      provpass, träningspass och kassan.
   2. Aldrig ovanpå något annat. Utmärkelser, rank-up, matchmakern och
      samtyckesbannern äger skärmen när de är uppe — då hoppas visningen
      över helt och räknarna står kvar, så nudgen kommer vid nästa
      navigering i stället.

   Knappen går rakt till kassan via CoachingModal (`autoStart`) — samma köpväg
   som kortet på startsidan, ingen andra kodväg till Stripe. Nudgen har redan
   visat pris och argument, så erbjudandesteget vore att säga samma sak en
   gång till. Tiden väljs efter betalningen, på tacksidan.
   ===================================================================== */

/**
 * Låt sidan landa först. En ruta som slår upp i samma bild som innehållet
 * läses som ett fel, och på resultatsidan hinner konfettin och en eventuell
 * rank-up-modal fram före den här.
 */
const SHOW_DELAY_MS = 2600;

/**
 * Är någon annan overlay uppe? Alla handrullade overlayer i appen sätter
 * `role="dialog"` (utmärkelser, rank-up, onboarding, bild-lightboxen), och
 * Radix gör det själv. `data-state="closed"` filtreras bort — Radix låter
 * innehållet ligga kvar under uttoningen.
 */
function annanOverlayÖppen(): boolean {
  return !!document.querySelector('[role="dialog"]:not([data-state="closed"])');
}

const ÖPPNINGSRAD: Record<PromptTrigger, string> = {
  matches: "Du har spelat ett par matcher nu.",
  pageviews: "Du har varit här en stund nu.",
};

export function CoachingPrompt() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  const [öppen, setÖppen] = useState(false);
  const [modalÖppen, setModalÖppen] = useState(false);
  /**
   * Modalen drar in `useAuth` (en auth-lyssnare och en profil-query per
   * mount). Den monteras därför först när nudgen faktiskt visats, inte på
   * varje sidladdning för alla.
   */
  const [modalMonterad, setModalMonterad] = useState(false);
  const trigger = useRef<PromptTrigger>("pageviews");

  // Priset hämtas först när rutan ska upp — annars hade varje sidladdning i
  // appen kostat ett anrop till en endpoint som bara nudgen behöver.
  const { offer } = useCoachingOffer(öppen);
  const pris = coachingPriceLabel(offer);
  const villkor = coachingTermsLabel(offer);
  const tidsbokning = !!offer?.available && offer.schedulingEnabled;

  // Sidvisningarna. Refen gör att en omrendering på samma path inte räknas en
  // gång till — och att React 19:s dubbelkörning i dev inte gör det heller.
  const räknadPath = useRef<string | null>(null);
  useEffect(() => {
    if (räknadPath.current === path) return;
    räknadPath.current = path;
    recordPageview();
  }, [path]);

  // Nudgen och modalen ligger i roten och överlever därför en navigering, till
  // skillnad från kortens egna instanser som försvinner med sin sida. Backar
  // användaren ut ur rutan ska den inte bli kvar liggande över nästa sida.
  useEffect(() => {
    setÖppen(false);
    setModalÖppen(false);
  }, [path]);

  // Beslutet. Ligger efter räkningen ovan (effekter körs i deklarationsordning)
  // och läser därför ett läge som redan innehåller den här sidvisningen.
  useEffect(() => {
    if (öppen || modalÖppen) return;
    if (!isPromptablePath(path)) return;
    const utlösare = promptTrigger(readPromptState());
    if (!utlösare) return;

    const id = window.setTimeout(() => {
      if (annanOverlayÖppen()) return;
      trigger.current = utlösare;
      // Bokförs vid visning, inte vid stängning: stänger användaren fliken
      // mitt i ska nudgen inte ligga kvar tröskad till nästa besök.
      recordPromptShown();
      setModalMonterad(true);
      setÖppen(true);
      trackEvent("coaching_prompt_shown", { trigger: utlösare });
    }, SHOW_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [path, öppen, modalÖppen]);

  const stäng = (v: boolean) => {
    if (v) return;
    setÖppen(false);
    trackEvent("coaching_prompt_dismissed", { trigger: trigger.current });
  };

  const boka = () => {
    trackEvent("coaching_prompt_clicked", { trigger: trigger.current });
    setÖppen(false);
    setModalÖppen(true);
  };

  return (
    <>
      <Dialog open={öppen} onOpenChange={stäng}>
        <DialogContent className="max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-[440px]">
          <div
            className="px-6 pb-5 pt-8 text-center"
            style={{
              background:
                "linear-gradient(165deg, rgba(174,47,38,0.10) 0%, rgba(174,47,38,0.035) 48%, rgba(174,47,38,0) 100%)",
            }}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
              <GraduationCap className="h-6 w-6" aria-hidden />
            </div>
            <p className="mt-3.5 text-[11px] font-bold uppercase tracking-[0.16em] text-success">
              Personlig coachning
            </p>
            <DialogTitle
              className="mt-2 text-[22px] leading-tight tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Vill du höja dig snabbare?
            </DialogTitle>
          </div>

          <div className="px-6 pb-6">
            {/* Vänsterställd under en centrerad rubrik: brödtexten går på sex rader
                i mobil, och centrerad blir den en ojämn kil. Tillsammans med
                punkterna nedan bildar den en sammanhållen spalt. */}
            <DialogDescription className="text-[14.5px] leading-relaxed text-white/70">
              {ÖPPNINGSRAD[trigger.current]} Det som lyfter resultatet härifrån är sällan fler
              timmar. Det är att veta vilka timmar som ger mest. Ett personligt studieupplägg byggs
              efter var du står och hur lång tid du har kvar till provet.
            </DialogDescription>

            <ul className="mt-5 space-y-2.5 text-[14px] text-white/70">
              {[
                "Byggt efter din nivå och tiden du har kvar",
                "Av någon som själv skrivit 1,95 eller högre på provet",
                tidsbokning
                  ? "Direkt efter köpet väljer du en tid som passar dig"
                  : "Vi hör av oss inom 24 timmar efter köpet",
              ].map((rad) => (
                <li key={rad} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                  <span>{rad}</span>
                </li>
              ))}
            </ul>

            {/* Priset läses ur Stripe och kan saknas (nere, eller inte
                konfigurerat). Då blir knappen ett "läs mer" i stället för ett
                belopp vi inte kan stå för — modalen visar kontaktvägen. */}
            {villkor && (
              <p className="mt-5 text-center text-[13px] font-medium text-success">{villkor}</p>
            )}

            <Button
              onClick={boka}
              className={`w-full bg-primary py-6 text-[15px] text-on-brand hover:bg-primary-deep ${villkor ? "mt-2.5" : "mt-6"}`}
            >
              {pris ? `Kom igång för ${pris}` : "Läs mer om coachning"}
            </Button>

            <button
              type="button"
              onClick={() => stäng(false)}
              className="mx-auto mt-3 block text-[13px] text-white/50 underline-offset-4 transition hover:text-[var(--cream)] hover:underline"
            >
              Inte nu
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {modalMonterad && (
        <CoachingModal open={modalÖppen} onOpenChange={setModalÖppen} source="popup" autoStart />
      )}
    </>
  );
}
