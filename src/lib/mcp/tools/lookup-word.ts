import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { ordDefinitionParts } from "@/lib/ord-definition";

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
    // Databasen lagrar betydelse, exempelmening, liknande ord och ordklass i
    // ett textfält. Anropare ska slippa parsa det själva — och den råa texten
    // innehåller dessutom ordboksförkortningar som först skrivs ut här.
    const parts = ordDefinitionParts(row.definition);
    const payload = {
      found: true,
      word: row.question_text,
      definition: parts.senses.join(" "),
      senses: parts.senses,
      examples: parts.examples,
      related: parts.related,
      wordClass: parts.wordClass,
      source: row.definition_source,
    };
    const lines = [`${row.question_text}: ${parts.senses.join(" ")}`];
    if (parts.wordClass) lines[0] += ` (${parts.wordClass})`;
    for (const e of parts.examples) lines.push(`Exempel: ${e}`);
    if (parts.related.length) lines.push(`Liknande ord: ${parts.related.join(", ")}`);
    if (row.definition_source) lines.push(`Källa: ${row.definition_source}`);
    return {
      content: [{ type: "text", text: lines.join("\n") }],
      structuredContent: payload,
    };
  },
});
