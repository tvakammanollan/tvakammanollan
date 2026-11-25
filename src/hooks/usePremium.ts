import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/useAuth";
import { getOrdAccess } from "@/lib/ord-paywall.functions";
import { PREMIUM_CHANGED_EVENT } from "@/lib/guest-claim";

export type PremiumState = "loading" | "owned" | "none";

/**
 * Har besökaren Premium? `loading` tills inloggningen och köpet är lästa.
 * Utloggade och gäster utan köp är `none`.
 *
 * `enabled: false` hoppar över anropet (gratisproven behöver inte fråga) och
 * svarar `owned`, så att den som anropar bara har ett fall att hantera.
 * Går köpet inte att läsa blir svaret `owned`, samma princip som
 * `hasOrdAccess`: ett fel ska aldrig låsa ute någon som betalat.
 */
export function usePremium(enabled = true): PremiumState {
  const { user, loading } = useAuth();
  const fetchAccess = useServerFn(getOrdAccess);
  const [state, setState] = useState<PremiumState>(enabled ? "loading" : "owned");
  const userId = user?.id ?? null;
  // Ett köp som bekräftas eller flyttas från ett gästkonto medan sidan står
  // öppen ska synas utan omladdning.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const onChange = () => setTick((t) => t + 1);
    window.addEventListener(PREMIUM_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(PREMIUM_CHANGED_EVENT, onChange);
  }, []);

  useEffect(() => {
    if (!enabled) return setState("owned");
    if (loading) return;
    if (!userId) return setState("none");
    let cancelled = false;
    setState("loading");
    fetchAccess({})
      .then((a) => !cancelled && setState(a.owned ? "owned" : "none"))
      .catch(() => !cancelled && setState("owned"));
    return () => {
      cancelled = true;
    };
  }, [enabled, loading, userId, fetchAccess, tick]);

  return state;
}
