import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { limits } from "./rate-limit";
import { assertRateLimit, ipKey } from "./rate-limit.server";
import { invalidateVoteStats } from "./question-votes.server";

const FEL = "Rösten kunde inte sparas. Försök igen om en stund.";

/**
 * Lägger, byter eller tar tillbaka en röst. `vote: 0` tar bort rösten.
 *
 * `is_guest` sätts här ur den verifierade tokenen. Klienten skickar bara
 * fråga och röst, så den kan inte göra sig själv till ett riktigt konto för
 * att få full vikt.
 */
export const voteQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { questionId: string; vote: -1 | 0 | 1 }) =>
    z
      .object({
        questionId: z.string().uuid(),
        vote: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<{ vote: -1 | 0 | 1 }> => {
    const { userId, claims } = context;
    assertRateLimit(`question-vote:${userId}`, limits.questionVote);
    assertRateLimit(ipKey("question-vote"), limits.questionVoteIp);

    if (data.vote === 0) {
      const { error } = await supabaseAdmin
        .from("question_votes")
        .delete()
        .eq("question_id", data.questionId)
        .eq("user_id", userId);
      if (error) {
        console.error("[question-votes] radering föll:", error.message);
        throw new Error(FEL);
      }
    } else {
      const isGuest = (claims as { is_anonymous?: boolean } | undefined)?.is_anonymous === true;
      const { error } = await supabaseAdmin.from("question_votes").upsert(
        {
          question_id: data.questionId,
          user_id: userId,
          vote: data.vote,
          is_guest: isGuest,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "question_id,user_id" },
      );
      if (error) {
        console.error("[question-votes] röst föll:", error.message);
        throw new Error(FEL);
      }
    }
    invalidateVoteStats();
    return { vote: data.vote };
  });

/** Den inloggades egna röster på en lista frågor, så att knapparna visar läget. */
export const fetchMyQuestionVotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { questionIds: string[] }) =>
    z.object({ questionIds: z.array(z.string().uuid()).max(100) }).parse(data),
  )
  .handler(async ({ data, context }): Promise<Record<string, -1 | 1>> => {
    assertRateLimit(ipKey("question-vote-read"), limits.publicRead);
    if (data.questionIds.length === 0) return {};
    const { data: rows, error } = await supabaseAdmin
      .from("question_votes")
      .select("question_id, vote")
      .eq("user_id", context.userId)
      .in("question_id", data.questionIds);
    // Utan tabell (migrationen ej körd) eller vid fel: inga röster. Knapparna
    // visas ändå, och en röst som inte går att spara säger ifrån själv.
    if (error) {
      console.error("[question-votes] egna röster:", error.message);
      return {};
    }
    const out: Record<string, -1 | 1> = {};
    for (const r of rows ?? []) out[r.question_id] = r.vote === -1 ? -1 : 1;
    return out;
  });
