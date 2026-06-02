import { useRouterState } from "@tanstack/react-router";
import { useAuth, isGuestUser } from "@/hooks/useAuth";
import { FloatingActionMenu } from "./FloatingActionMenu";

// Visa FAB endast på "workspace"-rutter där snabbnavigering är värdefullt.
// Döljs på landing, auth, immersiva matchsidor, content och legal.
const VISIBLE_PREFIXES = ["/train", "/leaderboard", "/friends", "/stats", "/ord"];

export function FloatingActionMenuGate() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return null;
  // Gäst-anonyma användare behöver inte denna meny — låt landingens CTAs leda
  if (isGuestUser(user)) return null;
  if (!VISIBLE_PREFIXES.some((p) => path === p || path.startsWith(p + "/"))) {
    return null;
  }

  return <FloatingActionMenu />;
}
