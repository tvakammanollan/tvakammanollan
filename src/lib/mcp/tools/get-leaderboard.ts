import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { isRankable } from "@/lib/username";

async function pgRest(path: string): Promise<unknown> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Backend är inte konfigurerad.");
  const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`Backend fel ${res.status}`);
  return res.json();
}

export default defineTool({
  name: "get_leaderboard",
  title: "Topplista",
  description:
    "Hämtar topplistan för HP Kampen — spelare rankade efter ELO i antingen verbal (ORD/MEK/LÄS/ELF) eller matematisk (XYZ/KVA/NOG/DTK) del.",
  inputSchema: {
    match_type: z
      .enum(["verbal", "math"])
      .describe("Vilken kategori topplistan gäller."),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe("Antal spelare att returnera (1–50, default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ match_type, limit }) => {
    const n = Math.min(Math.max(limit ?? 10, 1), 50);
    const eloCol = match_type === "verbal" ? "elo_verbal" : "elo_math";
    // Samma regler som /leaderboard: valt användarnamn krävs, antal spelade
    // matcher gör det inte. Anonyma konton är majoriteten av tabellen, så
    // raderna måste hämtas i överflöd och sållas här — ett `limit=${n}` hade
    // gett en lista bestående nästan enbart av gästkonton.
    const rows = (await pgRest(
      `users?select=username,${eloCol},games_played,wins,losses&order=${eloCol}.desc&limit=500`,
    )) as Array<Record<string, unknown>>;
    const ranked = rows
      .filter((r) => isRankable(r.username as string))
      .slice(0, n)
      .map((r, i) => ({
        rank: i + 1,
        username: (r.username as string) ?? "",
        elo: (r[eloCol] as number) ?? 1000,
        games_played: (r.games_played as number) ?? 0,
        wins: (r.wins as number) ?? 0,
        losses: (r.losses as number) ?? 0,
      }));
    return {
      content: [{ type: "text", text: JSON.stringify(ranked, null, 2) }],
      structuredContent: { leaderboard: ranked },
    };
  },
});
