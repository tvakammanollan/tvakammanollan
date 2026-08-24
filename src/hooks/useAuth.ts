import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
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
  /**
   * Antal rankade matcher per gren, räknade i `elo_history` — inte kolumner i
   * `users`. `undefined` betyder att räkningen inte kom med (se
   * `fetchProfileRow`), inte noll matcher.
   */
  matches_verbal?: number;
  matches_math?: number;
}

/**
 * `*` plus antalet rankade matcher per gren. Räkningen bäddas in i profil-
 * frågan i stället för att hämtas separat med flit: useAuth har ingen delad
 * cache utan körs i ett trettiotal komponenter, så varje extra anrop hade
 * blivit ett anrop per monterad komponent.
 */
const PROFILE_SELECT = "*, matches_verbal:elo_history(count), matches_math:elo_history(count)";

type ProfileRow = Record<string, unknown>;

async function fetchProfileRow(userId: string): Promise<ProfileRow | null> {
  const withCounts = await supabase
    .from("users")
    .select(PROFILE_SELECT)
    .eq("id", userId)
    .eq("matches_verbal.match_type", "verbal")
    .eq("matches_math.match_type", "math")
    .maybeSingle();
  if (!withCounts.error) return withCounts.data as ProfileRow | null;

  // Skulle inbäddningen falla (RLS, PostgREST-version) får den inte ta med sig
  // inloggningen i fallet — utan räkning visas högsta ELO:t som förut.
  const plain = await supabase.from("users").select("*").eq("id", userId).maybeSingle();
  return plain.data as ProfileRow | null;
}

/** PostgREST svarar `[{ count: n }]` per inbäddad räkning; platta ut till ett tal. */
function embeddedCount(value: unknown): number | undefined {
  if (!Array.isArray(value)) return undefined;
  const first = value[0] as { count?: number } | undefined;
  return typeof first?.count === "number" ? first.count : 0;
}

function toProfile(row: ProfileRow | null): Profile | null {
  if (!row) return null;
  return {
    ...(row as unknown as Profile),
    matches_verbal: embeddedCount(row.matches_verbal),
    matches_math: embeddedCount(row.matches_math),
  };
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

export interface AuthValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileLoaded: boolean;
  refreshProfile: () => void;
  signOut: () => Promise<void>;
}

/**
 * EN delad auth-state för hela appen.
 *
 * `useAuth()` var tidigare en vanlig hook med eget `useState`, och 34
 * komponenter kallade den. Var och en höll alltså sin EGEN kopia av `profile`
 * och gjorde sin egen `select * from users` — 34 hämtningar per sidladdning,
 * och 34 tal som inte kunde hållas i synk. Följden var att navbaren visade
 * ELO:t från sidladdningen medan resultatsidan visade det nya: samma användare,
 * två siffror, ingen väg att invalidera den ena från den andra.
 *
 * Nu bor state:t i en provider och `useAuth()` läser ur den. Anropsställena är
 * oförändrade — samma namn, samma returform — men det finns bara ett värde,
 * och `refreshProfile()` når alla.
 */
const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // Providern monteras i `__root.tsx` och omsluter hela trädet. Hamnar man
    // här renderas komponenten utanför den, och att tyst falla tillbaka på en
    // egen kopia hade återinfört precis den drift som providern finns för.
    throw new Error("useAuth() kräver <AuthProvider> — den monteras i __root.tsx");
  }
  return ctx;
}

export { AuthContext };

/**
 * Själva tillståndet. Anropas EN gång, av `AuthProvider`.
 * Komponenter ska använda `useAuth()`.
 */
export function useAuthState(): AuthValue {
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
      const row = await fetchProfileRow(user.id);
      if (!cancelled) {
        setProfile(toProfile(row));
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
