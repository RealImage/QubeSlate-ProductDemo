import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { targetGroups } from "../data";

export default defineTool({
  name: "list_target_groups",
  title: "List target groups",
  description:
    "List target groups (screen selections) in Qube Slate, optionally filtered by campaign ID or a name search.",
  inputSchema: {
    campaign_id: z.string().optional().describe("Only target groups of this campaign ID."),
    query: z.string().optional().describe("Text to match against target group name or ID."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ campaign_id, query }) => {
    const cid = campaign_id?.trim().toUpperCase();
    const q = query?.trim().toLowerCase();
    const rows = targetGroups.filter((t) => {
      const matchesCampaign = !cid || t.campaignId.toUpperCase() === cid;
      const matchesQuery =
        !q || t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q);
      return matchesCampaign && matchesQuery;
    });
    const totals = rows.reduce(
      (acc, t) => ({
        screens: acc.screens + t.screenCount,
        theatres: acc.theatres + t.theatreCount,
      }),
      { screens: 0, theatres: 0 },
    );
    return {
      content: [{ type: "text", text: JSON.stringify({ totals, rows }, null, 2) }],
      structuredContent: { count: rows.length, totals, targetGroups: rows },
    };
  },
});
