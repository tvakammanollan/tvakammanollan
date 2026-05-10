import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * processMatchResult — skelett. Fylls i Prompt 4.
 *
 * Tänkt ansvar:
 *  - validera att matchen är klar (båda spelare submitted, eller bot-match)
 *  - räkna ut score per spelare
 *  - bestäm winner_id
 *  - räkna ut nytt ELO (verbal eller math) för båda
 *  - uppdatera users (elo, peak, games_played, wins, losses)
 *  - skriv elo_history-rader
 *  - sätt matches.status = 'finished'
 */
export const processMatchResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ matchId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // TODO (Prompt 4): full implementation
    return {
      ok: true,
      matchId: data.matchId,
      userId,
      message: "processMatchResult skeleton — implementeras i Prompt 4",
      _supabaseReady: Boolean(supabase),
    };
  });
