import { useCallback, useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/useAuth";
import { fetchAchievements } from "@/lib/achievements.functions";
import type { AchievementState } from "@/lib/achievements";
import { AchievementCelebration } from "@/components/AchievementCelebration";

/* =====================================================================
   Global vakt: upptäcker nyligen upplåsta utmärkelser och firar dem med
   en pop-up. Baslinjen sparas per användare i localStorage — allt som
   låsts upp sedan förra besöket dyker upp på en gång (dopaminkick).
   Första gången seedas baslinjen tyst (inga gamla utmärkelser spammar).
   Körs klient-only; kollar vid inloggning + (strypt) vid sidbyte.
   ===================================================================== */

const KEY = (uid: string) => `hpk:ach:v1:${uid}`;
const THROTTLE_MS = 20_000;

function readSeen(uid: string): Set<string> | null {
  try {
    const raw = localStorage.getItem(KEY(uid));
    if (!raw) return null;
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return null;
  }
}

function writeSeen(uid: string, ids: string[]) {
  try {
    localStorage.setItem(KEY(uid), JSON.stringify(ids));
  } catch {
    /* localStorage kan vara blockerad — strunt samma */
  }
}

export function AchievementWatcher() {
  const { user } = useAuth();
  const fetchFn = useServerFn(fetchAchievements);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [celebrating, setCelebrating] = useState<AchievementState[]>([]);
  const lastCheckRef = useRef(0);
  const inFlightRef = useRef(false);

  const check = useCallback(async () => {
    if (!user || inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const res = (await fetchFn({})) as { achievements: AchievementState[] };
      const unlocked = res.achievements.filter((a) => a.unlocked);
      const unlockedIds = unlocked.map((a) => a.id);
      const seen = readSeen(user.id);
      if (seen === null) {
        // Första körningen: seeda tyst, fira inget retroaktivt.
        writeSeen(user.id, unlockedIds);
        return;
      }
      const newly = unlocked.filter((a) => !seen.has(a.id));
      if (newly.length > 0) {
        writeSeen(user.id, unlockedIds);
        setCelebrating(newly);
      }
    } catch {
      /* tyst — får aldrig störa appen */
    } finally {
      inFlightRef.current = false;
    }
  }, [user, fetchFn]);

  // Vid inloggning/byte av användare: kolla direkt.
  useEffect(() => {
    if (!user) return;
    lastCheckRef.current = Date.now();
    void check();
  }, [user, check]);

  // Vid sidbyte: kolla, men strypt så vi inte spammar servern.
  useEffect(() => {
    if (!user) return;
    const now = Date.now();
    if (now - lastCheckRef.current < THROTTLE_MS) return;
    lastCheckRef.current = now;
    void check();
  }, [pathname, user, check]);

  // Omedelbar check på begäran (förbi throttlen) — t.ex. när resultatsidan
  // laddats, så en nyss upplåst utmärkelse firas i rätt ögonblick.
  useEffect(() => {
    if (!user) return;
    const onDemand = () => {
      lastCheckRef.current = Date.now();
      void check();
    };
    window.addEventListener("hpk:achievements:check", onDemand);
    return () => window.removeEventListener("hpk:achievements:check", onDemand);
  }, [user, check]);

  if (celebrating.length === 0) return null;
  return <AchievementCelebration items={celebrating} onClose={() => setCelebrating([])} />;
}
