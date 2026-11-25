import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/useAuth";
import { getOrdPurchaseStatus } from "@/lib/ord-paywall.functions";
import { PREMIUM_CHANGED_EVENT } from "@/lib/guest-claim";

/**
 * Är den inloggade en GÄST med ett köp som gäller? Det är den enda person på
 * sajten som kan förlora något hon betalat för: köpet finns bara i den här
 * webbläsarens gästsession tills ett konto skapats. Remsan under navbaren,
 * utloggningen och startsidan frågar.
 *
 * Riktiga konton och utloggade får `false` utan något anrop. Gästen avgörs på
 * `is_anonymous` och inte på `isGuestUser`, som också räknar konton utan
 * adress: ett gästkonto som just gjorts om till ett riktigt får inte fortsätta
 * se "du har inget konto".
 *
 * Svaret delas per användar-id i en modulcache, så att tre komponenter som
 * frågar samtidigt blir ett anrop. Ett fel läses som "inget köp": remsan ska
 * hellre saknas än påstå något på lösa grunder.
 */
const cache = new Map<string, Promise<boolean>>();

export function useGuestPremium(): boolean {
  const { user, loading } = useAuth();
  const fetchStatus = useServerFn(getOrdPurchaseStatus);
  const guestId = !loading && user?.is_anonymous === true ? user.id : null;
  const [owned, setOwned] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const onChange = () => {
      cache.clear();
      setTick((t) => t + 1);
    };
    window.addEventListener(PREMIUM_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(PREMIUM_CHANGED_EVENT, onChange);
  }, []);

  useEffect(() => {
    if (!guestId) {
      setOwned(false);
      return;
    }
    let cancelled = false;
    let pending = cache.get(guestId);
    if (!pending) {
      pending = fetchStatus()
        .then((s) => s?.active === true)
        .catch(() => false);
      cache.set(guestId, pending);
    }
    void pending.then((v) => {
      if (!cancelled) setOwned(v);
    });
    return () => {
      cancelled = true;
    };
  }, [guestId, fetchStatus, tick]);

  return owned;
}
