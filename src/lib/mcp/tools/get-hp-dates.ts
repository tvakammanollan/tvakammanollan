import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { HP_DATES, getNextHpDate } from "@/lib/hp-dates";

export default defineTool({
  name: "get_hp_dates",
  title: "Kommande högskoleprovsdatum",
  description:
    "Returnerar officiella datum för kommande högskoleprov (HP) samt hur många dagar det är kvar till nästa prov.",
  inputSchema: {
    include_past: z
      .boolean()
      .optional()
      .describe("Ta även med tidigare provdatum (default false)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ include_past }) => {
    const now = Date.now();
    const dates = HP_DATES.filter((d) => {
      if (include_past) return true;
      return new Date(d.date + "T08:00:00+02:00").getTime() > now;
    });
    const next = getNextHpDate();
    const daysUntilNext = next
      ? Math.ceil((next.date.getTime() - now) / 86400000)
      : null;
    const payload = {
      next: next
        ? { date: next.date.toISOString().slice(0, 10), label: next.label, session: next.session, days_until: daysUntilNext }
        : null,
      dates,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
