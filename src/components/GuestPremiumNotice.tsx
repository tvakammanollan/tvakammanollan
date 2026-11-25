import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useGuestPremium } from "@/hooks/useGuestPremium";

/* =====================================================================
   Påminnelsen till den som köpt Premium som gäst och inte skapat konto.

   Köpet finns då bara i den här webbläsarens gästsession: rensas den, eller
   loggar personen ut, går köpet inte att nå. Steget efter betalningen ber om
   kontot direkt (`SaveGuestPurchase`), men den som hoppade över det ska se
   frågan igen, därför den här raden under navbaren. Samma form som
   påminnelsen om e-postadressen, och av samma skäl aldrig en ruta ovanpå
   sidan.

   /signup gör om gästen till ett riktigt konto med samma id, så köpet följer
   med utan något mer. Raden syns inte där man redan är på väg att skapa
   kontot, och inte på kassans tacksida, som har formuläret i sig.

   Stängningen gäller fliken (sessionStorage): frågan kommer tillbaka nästa
   besök, eftersom risken finns kvar tills kontot är skapat.
   ===================================================================== */

const DISMISS_KEY = "tkn:gastkop-notice-dismissed";
const HIDDEN_ON = new Set(["/signup", "/login", "/onboarding"]);

export function GuestPremiumNotice() {
  const owned = useGuestPremium();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onThankYouPage = useRouterState({
    select: (s) =>
      s.location.pathname === "/kassa" && (s.location.search as { kop?: unknown }).kop === "klart",
  });
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (!owned || dismissed || HIDDEN_ON.has(pathname) || onThankYouPage) return null;

  const close = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* privat läge: stängningen lever då bara i minnet */
    }
  };

  return (
    <div
      className="border-b border-bark/25 bg-bark/[0.07] px-4 py-2.5"
      role="status"
      aria-live="polite"
      data-chrome
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
        <span className="min-w-0 flex-1 text-[var(--cream)]">
          Du har Premium men inget konto. Skapa ett konto så att du inte tappar köpet.
        </span>
        <Link
          to="/signup"
          className="inline-flex min-h-[44px] shrink-0 items-center rounded-lg bg-primary px-4 text-xs font-semibold text-on-brand transition hover:brightness-110"
        >
          Skapa konto
        </Link>
        <button
          type="button"
          onClick={close}
          aria-label="Dölj påminnelsen"
          className="-mr-2 grid h-11 w-11 shrink-0 place-items-center rounded-full text-bark transition-colors hover:bg-bark/10"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
