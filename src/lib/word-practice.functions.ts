import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type WordQuestion = {
  id: string;
  question_text: string;
  options: { id: string; text: string }[];
  correct_answer: string;
  source: string | null;
};

export const fetchWordBatch = createServerFn({ method: "GET" })
  .inputValidator((data: { count?: number; exclude?: string[] }) =>
    z
      .object({
        count: z.number().int().min(1).max(50).optional().default(20),
        exclude: z.array(z.string().uuid()).optional().default([]),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data }) => {
    const supabase = supabaseAdmin;
    // Fetch a random batch using order by random()
    const { data: rows, error } = await supabase
      .from("questions")
      .select("id,question_text,options,correct_answer,source")
      .eq("category", "ORD")
      .limit(500);
    if (error) throw new Error(error.message);
    const filtered = (rows ?? []).filter(
      (r: { id: string }) => !data.exclude.includes(r.id as string),
    );
    // Shuffle in JS (Fisher-Yates) and slice
    for (let i = filtered.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
    }
    return {
      questions: filtered.slice(0, data.count) as WordQuestion[],
    };
  });

export const countOrdQuestions = createServerFn({ method: "GET" }).handler(
  async () => {
    const supabase = supabaseAdmin;
    const { count, error } = await supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("category", "ORD");
    if (error) throw new Error(error.message);
    return { count: count ?? 0 };
  },
);
