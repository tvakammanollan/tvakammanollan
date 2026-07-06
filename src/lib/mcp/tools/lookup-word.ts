import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "lookup_word",
  title: "Slå upp ord (ORD)",
  description:
    "Slår upp definitionen för ett svenskt ord som förekommit i ORD-delen av högskoleprovet. Returnerar definition och källa om ordet finns i databasen.",
  inputSchema: {
    word: z.string().trim().min(1).describe("Ordet att slå upp (t.ex. 'kapabel')."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ word }) => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      return {
        content: [{ type: "text", text: "Backend är inte konfigurerad." }],
        isError: true,
      };
    }
    const q = encodeURIComponent(word.toLowerCase());
    const res = await fetch(
      `${url.replace(/\/$/, "")}/rest/v1/questions?select=question_text,definition,definition_source&category=eq.ORD&question_text=ilike.${q}&definition=not.is.null&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    );
    if (!res.ok) {
      return {
        content: [{ type: "text", text: `Kunde inte nå databasen (${res.status}).` }],
        isError: true,
      };
    }
    const rows = (await res.json()) as Array<{
      question_text: string;
      definition: string | null;
      definition_source: string | null;
    }>;
    if (!rows.length) {
      return {
        content: [
          { type: "text", text: `Hittade ingen definition för "${word}" i ORD-databasen.` },
        ],
        structuredContent: { found: false, word },
      };
    }
    const row = rows[0];
    const payload = {
      found: true,
      word: row.question_text,
      definition: row.definition,
      source: row.definition_source,
    };
    return {
      content: [
        {
          type: "text",
          text: `${row.question_text}: ${row.definition}${row.definition_source ? ` (källa: ${row.definition_source})` : ""}`,
        },
      ],
      structuredContent: payload,
    };
  },
});
