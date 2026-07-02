import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        targetScore: z.number().nullable(),
        preferredType: z.enum(["verbal", "math", "both"]).nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin
      .from("users")
      .update({
        onboarding_completed: true,
        target_score: data.targetScore,
        preferred_type: data.preferredType,
      })
      .eq("id", context.userId);

    if (error) throw error;

    return { ok: true };
  });
