import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { media } from "../data";

export default defineTool({
  name: "list_media",
  title: "List media",
  description:
    "List campaign media (CPLs) in Qube Slate with their content status, optionally filtered by campaign ID, content status, or a text search on media name, CPL name, or CPL UUID.",
  inputSchema: {
    campaign_id: z.string().optional().describe("Only media of this campaign ID."),
    content_status: z
      .string()
      .optional()
      .describe("Filter by content status: Available or Missing."),
    query: z
      .string()
      .optional()
      .describe("Text to match against media name, CPL name, or CPL UUID."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ campaign_id, content_status, query }) => {
    const cid = campaign_id?.trim().toUpperCase();
    const status = content_status?.trim().toLowerCase();
    const q = query?.trim().toLowerCase();
    const rows = media.filter((m) => {
      const matchesCampaign = !cid || m.campaignId.toUpperCase() === cid;
      const matchesStatus = !status || m.contentStatus.toLowerCase() === status;
      const matchesQuery =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.cplName.toLowerCase().includes(q) ||
        m.cplUuid.toLowerCase().includes(q);
      return matchesCampaign && matchesStatus && matchesQuery;
    });
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { count: rows.length, media: rows },
    };
  },
});
