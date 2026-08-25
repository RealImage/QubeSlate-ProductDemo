import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { campaigns, media, targetGroups } from "../data";

export default defineTool({
  name: "get_campaign",
  title: "Get campaign",
  description:
    "Get one Qube Slate campaign by ID, including its target groups and media items.",
  inputSchema: {
    campaign_id: z.string().min(1).describe("Campaign ID, e.g. CAM-001."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ campaign_id }) => {
    const id = campaign_id.trim().toUpperCase();
    const campaign = campaigns.find((c) => c.id.toUpperCase() === id);
    if (!campaign) throw new ToolError(`No campaign found with ID ${campaign_id}`);
    const payload = {
      campaign,
      targetGroups: targetGroups.filter((t) => t.campaignId === campaign.id),
      media: media.filter((m) => m.campaignId === campaign.id),
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
