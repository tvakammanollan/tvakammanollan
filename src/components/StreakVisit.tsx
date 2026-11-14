import { useEffect, useRef } from "react";
import { isGuestUser, useAuth } from "@/hooks/useAuth";
import { updateStreak } from "@/lib/streak";
import { stockholmDate } from "@/lib/streak-dates";

/**
 * Ett besök som inloggad räknas som dagens aktivitet i streaken.
 *
 * Före det här räknades bara ett avslutat pass, så den som öppnade sajten såg
 * gårdagens siffra tills något spelats: en bruten streak stod kvar som om den
 * levde, och en ny dag syntes inte alls. Nu skrivs dagen vid besöket och
 * profilen läses om, så att startsidan visar minst 1 dag.
 *
 * Körs en gång per användare och svensk kalenderdag, och igen när fliken blir
 * synlig efter midnatt. Gästkonton har ingen streak.
 */
export function StreakVisit() {
  const { user, refreshProfile } = useAuth();
  const counted = useRef<string | null>(null);
  const userId = user && !isGuestUser(user) ? user.id : null;

  useEffect(() => {
    if (!userId) return;

    const run = () => {
      const key = `${userId}:${stockholmDate()}`;
      if (counted.current === key) return;
      counted.current = key;
      updateStreak(userId, { silent: true })
        .then((res) => {
          if (!res) counted.current = null;
          else if (!res.alreadyCountedToday) refreshProfile();
        })
        .catch(() => {
          counted.current = null;
        });
    };

    run();
    const onVisible = () => {
      if (document.visibilityState === "visible") run();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
    // refreshProfile är en ny funktion varje rendering; den ska inte starta om effekten.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return null;
}
