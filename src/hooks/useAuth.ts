import { useEffect, useState, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  username: string;
  email: string | null;
  elo_verbal: number;
  elo_math: number;
  elo_verbal_peak: number;
  elo_math_peak: number;
  games_played: number;
  wins: number;
  losses: number;
  created_at: string;
  is_admin?: boolean;
  onboarding_completed?: boolean;
  target_score?: number | null;
  preferred_type?: "verbal" | "math" | "both" | null;
  current_streak?: number;
  longest_streak?: number;
  last_active_date?: string | null;
}

export function isGuestUser(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.is_anonymous === true || user.app_metadata?.provider === "anonymous" || !user.email;
}

/**
 * Finns det en sparad session i webbläsaren? Svaret ges SYNKRONT.
 *
 * `useAuth().loading` är sant tills `getSession()` svarat, och under den tiden
 * ser en inloggad besökare ut som en utloggad. Startsidan visade därför
 * marknadsföringssidan först, sedan ett skelett, sedan sin dashboard — tre
 * olika layouter efter varandra vid varje laddning.
 *
 * `getServerSnapshot` är `false` med flit: servern har ingen localStorage, och
 * SSR:en SKA fortsätta rendera landningssidan (det är den crawlers och
 * first paint ska få — se kommentaren i `routes/index.tsx`). Klienten byter
 * till skelettet direkt efter hydreringen, utan att servern och klienten
 * någonsin är oense om första målningen.
 *
 * Nyckeln är supabase-js egen (`sb-<ref>-auth-token`). Den läses bara som
 * "finns/finns inte" — innehållet, giltigheten och utgångstiden är
 * `getSession()`:s sak, och en utgången token betyder bara att skelettet visas
 * en halv sekund innan landningssidan tar över.
 */
const AUTH_KEY = /^sb-.+-auth-token$/;

function läsSparadSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && AUTH_KEY.test(k)) return true;
    }
  } catch {
    /* privat läge — då får landningssidan gälla */
  }
  return false;
}

// Ingen prenumeration: värdet konsulteras bara under de millisekunder
// `loading` är sant, och varje riktig auth-ändring går ändå genom `useAuth`.
const ingenPrenumeration = () => () => {};

export function useHasStoredSession(): boolean {
  return useSyncExternalStore(ingenPrenumeration, läsSparadSession, () => false);
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  // Vilken användare profil-hämtningen hunnit svara för. Skilt från
  // `profile !== null` — en användare utan rad i public.users är färdighämtad,
  // inte pågående, och ska inte fastna i en evig laddning. Knuten till id:t så
  // att ett byte av användare räknas som ohämtat igen, medan refreshProfile()
  // (samma id) inte flimrar tillbaka till laddat läge.
  const [profileLoadedFor, setProfileLoadedFor] = useState<string | null>(null);
  const [profileTick, setProfileTick] = useState(0);

  useEffect(() => {
    // Set up listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setProfile(null);
    });

    // Then check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // Load profile whenever user changes (or refresh requested)
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("users").select("*").eq("id", user.id).maybeSingle();
      if (!cancelled) {
        setProfile((data as Profile) ?? null);
        setProfileLoadedFor(user.id);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, profileTick]);

  const refreshProfile = () => setProfileTick((t) => t + 1);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const profileLoaded = !!user && profileLoadedFor === user.id;

  return { user, profile, loading, profileLoaded, refreshProfile, signOut };
}
