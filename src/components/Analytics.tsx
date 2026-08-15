import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { isGuestUser, useAuth } from "@/hooks/useAuth";
import {
  capturePageview,
  identifyAnalyticsUser,
  resetAnalyticsUser,
  startAnalytics,
  stopAnalytics,
} from "@/lib/analytics";
import { CONSENT_CHANGED_EVENT, hasAnalyticsConsent } from "@/lib/consent";

/**
 * Kopplar PostHog till appen: startar det när samtycke finns, skickar
 * $pageview vid navigering och binder händelserna till inloggad användare.
 *
 * Renderar ingenting. Mountas i __root under SafeBoundary — analys ska aldrig
 * kunna ta ner sidan.
 */
export function Analytics() {
  const { user, profile } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [consented, setConsented] = useState(false);
  /** Sant först när skriptet faktiskt laddats — dessförinnan tappas händelser. */
  const [ready, setReady] = useState(false);
  const identifiedRef = useRef<string | null>(null);

  // Läs valet, och reagera när det ändras — både från bannern i den här fliken
  // och från integritetspolicyn i en annan.
  useEffect(() => {
    const apply = () => setConsented(hasAnalyticsConsent());
    apply();
    window.addEventListener(CONSENT_CHANGED_EVENT, apply);
    window.addEventListener("storage", apply);
    return () => {
      window.removeEventListener(CONSENT_CHANGED_EVENT, apply);
      window.removeEventListener("storage", apply);
    };
  }, []);

  useEffect(() => {
    if (!consented) {
      identifiedRef.current = null;
      setReady(false);
      stopAnalytics();
      return;
    }
    let cancelled = false;
    void startAnalytics().then((ph) => {
      if (!cancelled && ph) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [consented]);

  // Identitet — bara när något faktiskt ändrats, annars skickas en identify
  // per render.
  useEffect(() => {
    if (!ready) return;
    if (!user) {
      if (identifiedRef.current) {
        identifiedRef.current = null;
        resetAnalyticsUser();
      }
      return;
    }
    if (identifiedRef.current === user.id) return;
    identifiedRef.current = user.id;
    identifyAnalyticsUser(user.id, {
      is_guest: isGuestUser(user),
      username: profile?.username ?? null,
    });
  }, [ready, user, profile?.username]);

  // Sidvisningar. PostHogs inbyggda detektering är avstängd (capture_pageview:
  // false) eftersom den inte ser TanStack Routers navigeringar.
  useEffect(() => {
    if (!ready) return;
    capturePageview(pathname);
  }, [ready, pathname]);

  return null;
}
