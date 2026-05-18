import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Low-friction CTA: creates an anonymous user and drops them directly
 * into a verbal match (or specified type). Used by the landing hero
 * and the always-visible "Testa gratis" header button.
 */
export function useGuestPlay() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const play = async (type: "verbal" | "math" = "verbal") => {
    if (loading) return;
    setLoading(true);
    try {
      // If we're already a guest (anonymous user), just navigate.
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user?.is_anonymous) {
        navigate({ to: "/matchmaking", search: { type } });
        return;
      }
      const { error } = await supabase.auth.signInAnonymously();
      if (error) {
        toast.error("Kunde inte starta gästläge", { description: error.message });
        setLoading(false);
        return;
      }
      navigate({ to: "/matchmaking", search: { type } });
    } catch (err) {
      toast.error("Något gick fel", {
        description: err instanceof Error ? err.message : String(err),
      });
      setLoading(false);
    }
  };

  return { play, loading };
}
