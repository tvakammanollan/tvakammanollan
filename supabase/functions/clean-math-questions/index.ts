// Cleans up corrupted (PDF-scraped) HP math questions using Lovable AI Gateway.
// Run repeatedly until "remaining" is 0.
// POST { batch?: number, category?: string }
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RawQ {
  id: string;
  category: string;
  question_text: string;
  options: unknown;
}

const SYSTEM = `Du repairar förstörda mattefrågor från Högskoleprovet (svensk).
Indata kommer från PDF-extraktion där tecken/ord ibland hamnat i fel ordning.
Returnera ren, läsbar svensk text. Använd LaTeX i $...$ för matematiska uttryck (t.ex. $x^2 - 2x - 15$, $\\frac{1}{2}$, $\\sqrt{3}$).
Behåll betydelsen så troget som möjligt. Om frågan är så trasig att den inte går att rekonstruera meningsfullt, sätt status="unfixable".
Returnera ENDAST JSON enligt schemat: { "status": "ok"|"unfixable", "question_text": string, "options": string[] }.
options ska ha samma antal alternativ som indata, i samma ordning, var och en formaterad rent (LaTeX i $...$ vid behov).`;

async function cleanOne(q: RawQ): Promise<{ status: string; question_text?: string; options?: string[] } | null> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

  const optsArr = Array.isArray(q.options)
    ? (q.options as unknown[]).map((o) =>
        typeof o === "string" ? o : (o as { text?: string })?.text ?? String(o),
      )
    : [];

  const userMsg = `Kategori: ${q.category}
Fråga (rå): ${q.question_text}
Alternativ (råa): ${JSON.stringify(optsArr)}`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userMsg },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (res.status === 429 || res.status === 402) {
    throw new Error(`AI gateway error ${res.status}`);
  }
  if (!res.ok) {
    console.error("AI error", res.status, await res.text());
    return null;
  }

  const data = await res.json();
  const txt = data?.choices?.[0]?.message?.content;
  if (!txt) return null;
  try {
    const parsed = JSON.parse(txt);
    if (parsed.status === "unfixable") return { status: "unfixable" };
    if (
      typeof parsed.question_text === "string" &&
      Array.isArray(parsed.options) &&
      parsed.options.length === optsArr.length
    ) {
      return {
        status: "ok",
        question_text: parsed.question_text,
        options: parsed.options.map(String),
      };
    }
  } catch (e) {
    console.error("parse fail", e);
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const batch = Math.min(50, Math.max(1, Number(body.batch ?? 20)));
    const category: string | undefined = body.category;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let q = supabase
      .from("questions")
      .select("id, category, question_text, options")
      .in("category", ["XYZ", "KVA", "NOG", "DTK"])
      .eq("clean_status", "pending")
      .limit(batch);
    if (category) q = q.eq("category", category);

    const { data: rows, error } = await q;
    if (error) throw error;

    let okCount = 0;
    let badCount = 0;

    for (const row of (rows ?? []) as RawQ[]) {
      try {
        const result = await cleanOne(row);
        if (!result) {
          // leave pending; transient — skip
          continue;
        }
        if (result.status === "unfixable") {
          await supabase
            .from("questions")
            .update({ clean_status: "unfixable", cleaned_at: new Date().toISOString() })
            .eq("id", row.id);
          badCount++;
        } else {
          await supabase
            .from("questions")
            .update({
              clean_status: "ok",
              cleaned_question_text: result.question_text,
              cleaned_options: result.options,
              cleaned_at: new Date().toISOString(),
            })
            .eq("id", row.id);
          okCount++;
        }
      } catch (e) {
        console.error("clean fail", row.id, e);
      }
    }

    const { count: remaining } = await supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .in("category", ["XYZ", "KVA", "NOG", "DTK"])
      .eq("clean_status", "pending");

    return new Response(
      JSON.stringify({ processed: rows?.length ?? 0, ok: okCount, unfixable: badCount, remaining }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
