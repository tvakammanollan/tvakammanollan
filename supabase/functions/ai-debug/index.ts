Deno.serve(async () => {
  const apiKey = Deno.env.get("LOVABLE_API_KEY")!;
  const body = JSON.stringify({
    model: "google/gemini-2.5-flash",
    messages: [
      { role: "system", content: "Reply with JSON object {\"x\":1}" },
      { role: "user", content: "ok" },
    ],
    response_format: { type: "json_object" },
  });
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body,
  });
  const text = await res.text();
  return new Response(JSON.stringify({ status: res.status, body: text, sent: body }), {
    headers: { "content-type": "application/json" },
  });
});
