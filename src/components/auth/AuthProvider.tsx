import type { ReactNode } from "react";
import { AuthContext, useAuthState } from "@/hooks/useAuth";

/**
 * Håller appens enda auth-state.
 *
 * Monteras överst i `__root.tsx`, utanför allt som kallar `useAuth()`. Se
 * `useAuth.ts` för varför den finns: 34 komponenter höll var sin kopia av
 * `profile`, gjorde var sin profilhämtning och kunde därför visa olika ELO för
 * samma användare samtidigt.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const value = useAuthState();
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
