import { useEffect, useState } from "react";
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
}

export function isAutoUsername(username: string | null | undefined): boolean {
  return !!username && /^user_[0-9a-f]{8}$/.test(username);
}

export function isGuestUser(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.is_anonymous === true || user.app_metadata?.provider === "anonymous" || !user.email;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
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
      if (!cancelled) setProfile((data as Profile) ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, profileTick]);

  const refreshProfile = () => setProfileTick((t) => t + 1);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, profile, loading, refreshProfile, signOut };
}
