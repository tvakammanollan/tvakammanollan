// Verify a batch of old HP ORD questions via Lovable AI Gateway
// and apply high-confidence corrections to the database.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SYSTEM = `Du är expert på svensk ordkunskap (HP-ORD).
För varje ord, välj det alternativ (A-E) som är närmast SYNONYM eller bästa motsvarighet.
Var noggrann. Tveksamma fall ska ha confidence "low".
Svara med JSON: {"results":[{"word":"X","answer":"A","confidence":"high"}]}`;

async function callAI(words: any[], apiKey: string): Promise<any[]> {
  const userMsg = "Ord:\n" + words.map(w => {
    const opts = Object.entries(w.options).map(([k, v]) => `${k}=${v}`).join(", ");
    return `${w.word}: ${opts}`;
  }).join("\n");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: SYSTEM }, { role: "user", content: userMsg }],
      temperature: 0,
    }),
  });
  if (!res.ok) {
    console.error("AI err", res.status, await res.text());
    return [];
  }
  const data = await res.json();
  let content = data.choices?.[0]?.message?.content?.trim() ?? "";
  if (content.startsWith("```")) {
    content = content.replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "");
  }
  try { return JSON.parse(content); } catch { return []; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: { "access-control-allow-origin": "*" } });
  const apiKey = Deno.env.get("LOVABLE_API_KEY")!;
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { offset = 0, limit = 50 } = await req.json().catch(() => ({}));

  const { data: rows, error } = await supabase
    .from("questions")
    .select("id, question_text, options, correct_answer")
    .eq("category", "ORD")
    .not("source", "is", null)
    .order("question_text")
    .range(offset, offset + limit - 1);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  const items = (rows ?? []).map((r: any) => ({
    id: r.id, word: r.question_text,
    options: Object.fromEntries((r.options as any[]).map(o => [o.id, o.text])),
    current: r.correct_answer,
  }));

  // First pass in batches of 25
  const BATCH = 25;
  const allAnswers = new Map<string, any>();
  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    const res = await callAI(batch, apiKey);
    for (const a of res) {
      if (a?.word && a?.answer) allAnswers.set(String(a.word).toUpperCase().trim(), a);
    }
  }

  // Find disagreements with high confidence
  const disagreements = items.filter(it => {
    const a = allAnswers.get(it.word.toUpperCase().trim());
    return a && a.answer !== it.current && a.confidence === "high" && it.options[a.answer];
  });

  // Verify each disagreement individually (second opinion)
  const fixes: any[] = [];
  for (const d of disagreements) {
    const verify = await callAI([d], apiKey);
    const v = verify[0];
    const a1 = allAnswers.get(d.word.toUpperCase().trim());
    if (v && v.answer === a1.answer && v.confidence === "high" && d.options[v.answer]) {
      const { error: upErr } = await supabase
        .from("questions")
        .update({ correct_answer: v.answer })
        .eq("id", d.id);
      if (!upErr) {
        fixes.push({ word: d.word, old: d.current, new: v.answer,
          old_text: d.options[d.current], new_text: d.options[v.answer] });
      }
    }
  }

  return new Response(JSON.stringify({
    processed: items.length, disagreements: disagreements.length, fixes
  }), { headers: { "content-type": "application/json" } });
});
