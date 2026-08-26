repo: RealImage/QubeSlate-ProductDemo
branch: main
path: src

## Last sync

date: 2026-08-25T15:35:00Z

### Updated in this project
- Rebuilt the Slate advertiser app in the Qube Design System as one Design Component.
- Kept the repo's structure and vocabulary (Target Groups, Placements, Playlist Pack, CPL).
- Filled every "Coming Soon" placeholder route with a real screen.
- Added screens the repo lacks: Inventory Availability, Pre-Show Playlist, Proof of Play, Distribution Status, playlist boundary rules.

## Screen map

| Project screen | Repo source |
| --- | --- |
| Sidebar + shell | src/components/AppSidebar.tsx, src/components/Layout.tsx, src/App.tsx |
| Dashboard | src/pages/Dashboard.tsx |
| Campaign Management | src/pages/CampaignManagement.tsx |
| Create Campaign (5-step wizard) | src/pages/CreateCampaign.tsx |
| Wizard · Target Groups step | src/components/TargetGroupsManager.tsx |
| Wizard · Media Selection step | src/components/MediaManager.tsx, src/components/AddMediaDialog.tsx |
| Wizard · Placement Planning step | src/components/PlacementManager.tsx, src/components/AddPlacementDialog.tsx |
| Target Groups | src/pages/TargetGroups.tsx, src/components/ManageScreensDialog.tsx |
| Campaign Rate Bias | src/App.tsx (placeholder route) |
| Approvals (campaigns / brands / clients) | src/App.tsx (placeholder routes) |
| Compositions / Unmapped / Archived | src/App.tsx (placeholder routes) |
| Network Theatres & Screens | src/App.tsx (placeholder route) |
| Playlist Templates | src/App.tsx (placeholder route) |
| Brand Catalogue / Client Directory | src/App.tsx (placeholder routes) |
| Reports & Analytics | src/App.tsx (placeholder route) |
| User Management / Platform Settings | src/App.tsx (placeholder routes) |
| Inventory Availability | new — no repo source |
| Pre-Show Playlist | new — no repo source |
| Proof of Play | new — no repo source |
| Distribution Status | new — no repo source |
