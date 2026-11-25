import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { claimGuestPurchase } from "@/lib/guest-upgrade.functions";
import { announcePremiumChanged, clearGuestClaim, readGuestClaim } from "@/lib/guest-claim";
import { trackEvent } from "@/lib/events";
import { trackError } from "@/lib/telemetry";

/**
 * Flyttar ett Premium-köp gjort som gäst till kontot gästen just loggade in
 * på. Renderar ingenting.
 *
 * Inloggningen, Google-knappen och registreringens reservväg sparar gästens
 * token innan sessionen byts (`rememberGuestForClaim`). Här, i roten, läses
 * den när ett riktigt konto väl är inloggat, oavsett vilken sida inloggningen
 * landade på: Google kommer tillbaka till /onboarding, lösenordet till
 * startsidan eller kassan.
 *
 * Den sparade tokenen tas bort så fort servern gett ett besked. Går anropet
 * inte fram ligger den kvar, och nästa sidladdning försöker igen tills den
 * gått ut (en timme).
 */
export function GuestPurchaseClaimer() {
  const { user, loading } = useAuth();
  const claim = useServerFn(claimGuestPurchase);
  const running = useRef(false);
  const accountId = !loading && user && user.is_anonymous !== true ? user.id : null;

  useEffect(() => {
    if (!accountId || running.current) return;
    const guestToken = readGuestClaim();
    if (!guestToken) return;
    running.current = true;
    void claim({ data: { guestToken } })
      .then(({ result }) => {
        // Tokenen i Authorization var fortfarande gästens; den byts strax.
        if (result === "not_ready") return;
        clearGuestClaim();
        if (result === "moved") {
          trackEvent("guest_purchase_saved", { via: "claim" });
          announcePremiumChanged();
          toast.success("Premium-köpet du gjorde som gäst finns nu på ditt konto");
        } else if (result === "conflict") {
          trackEvent("guest_purchase_claim_conflict", {});
          toast.error("Kontot hade redan Premium", {
            description:
              "Köpet du gjorde som gäst flyttades inte hit. Mejla info@tvakommanollan.se så hjälper vi dig med det.",
            duration: 20_000,
          });
        }
      })
      .catch((e) => trackError(e, { where: "guest_claim" }))
      .finally(() => {
        running.current = false;
      });
  }, [accountId, claim]);

  return null;
}
