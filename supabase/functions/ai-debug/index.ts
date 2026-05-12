Deno.serve(async () => {
  const apiKey = Deno.env.get("LOVABLE_API_KEY")!;
  const tests = [
    { name: "minimal", body: { model: "google/gemini-2.5-flash", messages: [{ role: "user", content: "hi" }] } },
    { name: "openai-mini", body: { model: "openai/gpt-5-mini", messages: [{ role: "user", content: "hi" }] } },
    { name: "no-prefix", body: { model: "gemini-2.5-flash", messages: [{ role: "user", content: "hi" }] } },
  ];
  const results: any = { keyLen: apiKey?.length ?? 0, keyPrefix: apiKey?.slice(0, 8), tests: [] };
  for (const t of tests) {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(t.body),
    });
    results.tests.push({ name: t.name, status: res.status, body: (await res.text()).slice(0, 300) });
  }
  return new Response(JSON.stringify(results, null, 2), { headers: { "content-type": "application/json" } });
});
