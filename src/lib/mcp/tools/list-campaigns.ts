import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { campaigns } from "../data";

export default defineTool({
  name: "list_campaigns",
  title: "List campaigns",
  description:
    "List theatrical ad campaigns in Qube Slate, optionally filtered by status or a text search on campaign name, client, or campaign ID.",
  inputSchema: {
    query: z
      .string()
      .optional()
      .describe("Text to match against campaign name, client, or campaign ID."),
    status: z
      .string()
      .optional()
      .describe("Filter by campaign status, e.g. Active, Pending Approval, In Review."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ query, status }) => {
    const q = query?.trim().toLowerCase();
    const s = status?.trim().toLowerCase();
    const rows = campaigns.filter((c) => {
      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.client.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q);
      const matchesStatus = !s || c.status.toLowerCase() === s;
      return matchesQuery && matchesStatus;
    });
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { count: rows.length, campaigns: rows },
    };
  },
});
