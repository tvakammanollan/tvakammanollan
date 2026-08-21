import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { isPromptablePath } from "@/lib/coaching-prompt";
import { m } from "framer-motion";
import { ChartNoAxesColumn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { analyticsConfigured } from "@/lib/analytics";
import { CONSENT_CHANGED_EVENT, needsConsentDecision, writeConsent } from "@/lib/consent";
import { trackEvent } from "@/lib/events";

/**
 * Samtyckesbanner för analys.
 *
 * Visas bara när (a) en PostHog-nyckel är konfigurerad och (b) inget val
 * gjorts på aktuell samtyckesversion. Inget analysskript laddas förrän
 * "Godkänn" klickats — det är hela poängen med komponenten.
 *
 * Bannern blockerar inte sajten. Att tvinga fram ett svar innan man får läsa
 * något är varken nödvändigt eller trevligt; utan svar samlas ingenting in,
 * vilket är rätt utfall ändå.
 */
export function ConsentBanner() {
  // Renderas aldrig under SSR: valet ligger i localStorage, och att gissa
  // skulle ge hydration-mismatch.
  const [visible, setVisible] = useState(false);
  const { pathname } = useLocation();

  const sync = useCallback(() => {
    setVisible(analyticsConfigured() && needsConsentDecision());
  }, []);

  useEffect(() => {
    sync();
    // Återkallar man samtycket från integritetspolicyn ska bannern komma
    // tillbaka direkt, utan omladdning.
    window.addEventListener(CONSENT_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CONSENT_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [sync]);

  // Skriver bara valet — <Analytics /> lyssnar på CONSENT_CHANGED_EVENT och
  // äger start/stopp av PostHog. Två ägare till samma livscykel blir fel förr
  // eller senare.
  const decide = (choice: "granted" | "denied") => {
    writeConsent(choice);
    // Ett nej laddar aldrig PostHog, så bara ja:en syns där. Båda hamnar i
    // våra egna loggar — det är enda stället kvoten går att läsa.
    trackEvent("consent_decided", { choice });
    setVisible(false);
  };

  // Aldrig ovanpå något som pågår. Bannern är full bredd på telefon och tar
  // ~40 % av skärmen: mitt i en match dolde den svarsalternativ D och E OCH
  // hela inlämningslisten, medan klockan tickade. Samma väg och samma regel
  // som coachningsnudgen (`isPromptablePath`) — den kommer upp på nästa sida
  // som inte är ett pågående pass. Att skjuta upp frågan är dessutom det
  // integritetsmässigt säkra hållet: utan svar laddas ingen analys alls.
  if (!visible || !isPromptablePath(pathname)) return null;

  return (
    <m.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-title"
      className="fixed inset-x-0 bottom-0 z-50 px-3 pt-3 pb-safe sm:px-4 sm:pt-4"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-xl border border-white/10 bg-[#fbf6ec]/95 p-4 shadow-2xl backdrop-blur-sm sm:p-5">
        <div className="flex gap-3">
          <ChartNoAxesColumn
            className="mt-0.5 size-5 shrink-0"
            style={{ color: "var(--amber)" }}
            aria-hidden="true"
          />
          <div className="space-y-1.5">
            <p id="consent-title" className="text-sm font-semibold text-[var(--cream)]">
              Får vi mäta hur sajten används?
            </p>
            <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">
              Vi vill förstå vilka delar av Tvåkommanollan som faktiskt hjälper, så att rätt saker
              byggs vidare. Säger du ja laddas ett analysverktyg (PostHog, hostat i EU) som
              registrerar sidvisningar, klick och sessioner. Säger du nej laddas det inte alls.
              Sajten fungerar likadant, och du kan ändra dig när du vill.{" "}
              <Link
                to="/integritetspolicy"
                className="underline underline-offset-2"
                style={{ color: "var(--amber)" }}
              >
                Läs mer i integritetspolicyn
              </Link>
              .
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="ghost"
            onClick={() => decide("denied")}
            className="border border-white/10 hover:bg-white/5 sm:w-auto"
          >
            Bara nödvändigt
          </Button>
          <Button
            onClick={() => decide("granted")}
            className="bg-[var(--amber)] font-semibold text-[#fbf6ec] hover:bg-[var(--amber)]/90 sm:w-auto"
          >
            Godkänn analys
          </Button>
        </div>
      </div>
    </m.div>
  );
}
