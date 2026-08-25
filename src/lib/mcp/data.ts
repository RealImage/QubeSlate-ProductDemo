// Demo data exposed by the app's MCP server. Intentionally public sample data.

export type Campaign = {
  id: string;
  name: string;
  client: string;
  campaignType: string;
  status: string;
  startDate: string;
  endDate: string;
  screens: number;
  budget: string;
  orderRegion: string;
};

export type TargetGroup = {
  id: string;
  campaignId: string;
  name: string;
  screenCount: number;
  theatreCount: number;
  validFrom: string;
  validTill: string;
  updatedBy: string;
  updatedOn: string;
};

export type Media = {
  id: string;
  campaignId: string;
  name: string;
  cplName: string;
  cplUuid: string;
  contentStatus: "Available" | "Missing";
  durationSeconds: number;
  updatedBy: string;
  updatedOn: string;
};

export const campaigns: Campaign[] = [
  {
    id: "CAM-001",
    name: "Summer Movie Festival",
    client: "Cineplex Entertainment",
    campaignType: "Private",
    status: "Active",
    startDate: "2024-06-15",
    endDate: "2024-08-31",
    screens: 45,
    budget: "$25,000",
    orderRegion: "Mumbai",
  },
  {
    id: "CAM-002",
    name: "Horror Night Promo",
    client: "AMC Theatres",
    campaignType: "Private",
    status: "Pending Approval",
    startDate: "2024-10-01",
    endDate: "2024-10-31",
    screens: 32,
    budget: "$18,500",
    orderRegion: "Bangalore",
  },
  {
    id: "CAM-003",
    name: "Holiday Blockbusters",
    client: "Regal Cinemas",
    campaignType: "Private",
    status: "In Review",
    startDate: "2024-11-15",
    endDate: "2024-12-31",
    screens: 67,
    budget: "$42,000",
    orderRegion: "Chennai",
  },
];

export const targetGroups: TargetGroup[] = [
  {
    id: "TG-001",
    campaignId: "CAM-001",
    name: "Metro Premium Screens",
    screenCount: 28,
    theatreCount: 9,
    validFrom: "2024-06-15",
    validTill: "2024-08-31",
    updatedBy: "Admin",
    updatedOn: "2024-06-10T10:24:00Z",
  },
  {
    id: "TG-002",
    campaignId: "CAM-001",
    name: "Tier 2 Multiplexes",
    screenCount: 17,
    theatreCount: 6,
    validFrom: "2024-07-01",
    validTill: "2024-08-15",
    updatedBy: "Admin",
    updatedOn: "2024-06-28T08:05:00Z",
  },
  {
    id: "TG-003",
    campaignId: "CAM-003",
    name: "South Region Wide",
    screenCount: 67,
    theatreCount: 21,
    validFrom: "2024-11-15",
    validTill: "2024-12-31",
    updatedBy: "Ops Team",
    updatedOn: "2024-11-02T13:40:00Z",
  },
];

export const media: Media[] = [
  {
    id: "MED-001",
    campaignId: "CAM-001",
    name: "Summer Fest 30s Spot",
    cplName: "SUMMERFEST_TLR-1_F_EN-XX_IN_51_2K",
    cplUuid: "urn:uuid:3f0d1c1a-1111-4a2b-9c3d-77aa2b1c0001",
    contentStatus: "Available",
    durationSeconds: 30,
    updatedBy: "Admin",
    updatedOn: "2024-06-11T09:00:00Z",
  },
  {
    id: "MED-002",
    campaignId: "CAM-002",
    name: "Horror Night Teaser",
    cplName: "HORRORNIGHT_ADV-1_F_EN-XX_IN_20_2K",
    cplUuid: "urn:uuid:3f0d1c1a-2222-4a2b-9c3d-77aa2b1c0002",
    contentStatus: "Missing",
    durationSeconds: 20,
    updatedBy: "Content Team",
    updatedOn: "2024-09-24T15:12:00Z",
  },
  {
    id: "MED-003",
    campaignId: "CAM-003",
    name: "Holiday Slide Pack",
    cplName: "HOLIDAY_SLD-1_F_EN-XX_IN_10_2K",
    cplUuid: "urn:uuid:3f0d1c1a-3333-4a2b-9c3d-77aa2b1c0003",
    contentStatus: "Available",
    durationSeconds: 10,
    updatedBy: "Ops Team",
    updatedOn: "2024-11-05T11:30:00Z",
  },
];
