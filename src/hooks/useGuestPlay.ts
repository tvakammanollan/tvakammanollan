import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { createMatch } from "@/lib/match.functions";
import { toast } from "sonner";
import { trackEvent } from "@/lib/events";

/**
 * Lowest-friction CTA: creates an anonymous guest and drops them
 * STRAIGHT into a bot match (no matchmaking queue, no 6s wait).
 * Used by the landing hero and the always-visible "Testa gratis" button.
 */
export function useGuestPlay() {
  const navigate = useNavigate();
  const createFn = useServerFn(createMatch);
  const [loading, setLoading] = useState(false);

  const play = async (type: "verbal" | "math" = "verbal") => {
    if (loading) return;
    setLoading(true);
    try {
      // Ensure we have a session — sign in anonymously if needed
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user) {
        // INGET username i metadatan. `users.username` är UNIQUE och
        // gästnamnen kommer ur en lista på 20 ord, så det tjugoförsta
        // "Gäst ekorre" fick triggern att fela — auth svarade 500
        // "Database error creating anonymous user" och gästläget dog för
        // en växande andel av besökarna. Låt triggern sätta
        // user_ || left(id, 8), som är unikt per konstruktion;
        // `displayName()` gör om det till lundnamnet vid rendering.
        const { error } = await supabase.auth.signInAnonymously();
        if (error) {
          toast.error("Kunde inte starta gästläge", { description: error.message });
          setLoading(false);
          return;
        }
      }

      trackEvent("guest_match_started", { match_type: type });
      // Create a bot match immediately and drop the user into it.
      try {
        const res = await createFn({ data: { match_type: type, mode: "bot" } });
        trackEvent("match_created", { match_type: type, mode: "bot", is_guest: true });
        navigate({ to: "/match/$matchId", params: { matchId: res.match_id } });
      } catch (matchErr) {
        // Cooldown / other → fall back to matchmaking page (which auto-bot-matches after 6s)
        console.warn("[guest-play] createMatch failed, falling back to matchmaking", matchErr);
        navigate({ to: "/matchmaking", search: { type } });
      }
    } catch (err) {
      toast.error("Något gick fel", {
        description: err instanceof Error ? err.message : String(err),
      });
      setLoading(false);
    }
  };

  return { play, loading };
}
