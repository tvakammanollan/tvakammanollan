import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { isGuestUser, useAuth } from "@/hooks/useAuth";
import {
  capturePageview,
  identifyAnalyticsUser,
  registerAnalyticsProperties,
  resetAnalyticsUser,
  setAnalyticsPersonProperties,
  startAnalytics,
  stopAnalytics,
} from "@/lib/analytics";
import { CONSENT_CHANGED_EVENT, hasAnalyticsConsent } from "@/lib/consent";
import { getRankForElo } from "@/types";

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
      // Utloggad är också ett tillstånd att kunna filtrera på — annars ser en
      // besökare utan konto ut som saknad data i stället för som en besökare.
      registerAnalyticsProperties({ is_guest: false, is_logged_in: false });
      return;
    }
    const guest = isGuestUser(user);
    registerAnalyticsProperties({ is_guest: guest, is_logged_in: true });
    if (identifiedRef.current === user.id) return;
    identifiedRef.current = user.id;
    identifyAnalyticsUser(user.id, {
      is_guest: guest,
      username: profile?.username ?? null,
    });
  }, [ready, user, profile?.username]);

  // Nuläget på profilen. Ligger separat från identify: profilen laddas i ett
  // andra anrop och hinner ofta inte fram till identify, och den ändras under
  // sessionens gång (ELO efter varje match).
  useEffect(() => {
    if (!ready || !user || !profile) return;
    const elo = Math.max(profile.elo_verbal, profile.elo_math);
    setAnalyticsPersonProperties({
      elo_verbal: profile.elo_verbal,
      elo_math: profile.elo_math,
      rank: getRankForElo(elo).tier,
      games_played: profile.games_played,
      current_streak: profile.current_streak ?? 0,
      onboarding_completed: profile.onboarding_completed ?? false,
      signed_up_at: profile.created_at,
    });
    // Rank som super property gör det möjligt att bryta ned VARJE händelse på
    // spelarnivå — "hur många diamanter lämnar in i tid" går inte att svara på
    // med bara en personegenskap.
    registerAnalyticsProperties({ rank: getRankForElo(elo).tier });
  }, [ready, user, profile]);

  // Sidvisningar. PostHogs inbyggda detektering är avstängd (capture_pageview:
  // false) eftersom den inte ser TanStack Routers navigeringar.
  useEffect(() => {
    if (!ready) return;
    capturePageview(pathname);
  }, [ready, pathname]);

  return null;
}
