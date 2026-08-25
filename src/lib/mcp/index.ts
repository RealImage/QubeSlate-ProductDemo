import { defineMcp } from "@lovable.dev/mcp-js";
import listCampaignsTool from "./tools/list-campaigns";
import getCampaignTool from "./tools/get-campaign";
import listTargetGroupsTool from "./tools/list-target-groups";
import listMediaTool from "./tools/list-media";

export default defineMcp({
  name: "qube-slate",
  title: "qube-slate",
  version: "0.1.0",
  instructions:
    "Read-only tools for Qube Slate, a theatrical ad campaign manager. Use `list_campaigns` to browse campaigns, `get_campaign` for one campaign with its target groups and media, `list_target_groups` for screen selections, and `list_media` for campaign CPLs and their content status.",
  tools: [listCampaignsTool, getCampaignTool, listTargetGroupsTool, listMediaTool],
});
