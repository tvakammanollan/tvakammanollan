// One-time import function for gamla prov questions.
// Prerequisites: run this in Lovable SQL editor first (3 lines):
//   ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS exam_term text;
//   ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS provpass_num int;
//   ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS q_num int;
//
// Then call this function from browser console on hpkampen.se:
//   fetch("https://dqhgnioniarhiugxdgla.supabase.co/functions/v1/import-gamla-prov",{method:"POST"}).then(r=>r.json()).then(console.log)

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("POST only", { status: 405, headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  // Fetch question data from the deployed app
  const jsonRes = await fetch("https://hpkampen.se/gamla-prov-data.json");
  if (!jsonRes.ok) {
    return new Response(
      JSON.stringify({ error: `Could not fetch data: ${jsonRes.status}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const questions: Record<string, unknown>[] = await jsonRes.json();

  // Delete existing gamla-prov questions
  await admin.from("questions").delete().not("exam_term", "is", null);

  // Insert in batches of 50
  let inserted = 0;
  const errors: string[] = [];

  for (let i = 0; i < questions.length; i += 50) {
    const batch = questions.slice(i, i + 50);
    const { error } = await admin.from("questions").insert(batch);
    if (error) {
      errors.push(`Batch ${i}: ${error.message}`);
    } else {
      inserted += batch.length;
    }
  }

  return new Response(
    JSON.stringify({ success: errors.length === 0, inserted, total: questions.length, errors }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
