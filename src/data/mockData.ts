// Mock reference data ported verbatim from `project/Qube Slate.dc.html`.

export interface NavItem {
  title: string;
  route: string;
}

export interface NavGroup {
  key: string;
  title: string;
  icon: string;
  route?: string;
  items?: NavItem[];
}

export const navDef: NavGroup[] = [
  { key: 'Dashboard', title: 'Dashboard', route: '/', icon: 'Dashboard' },
  { key: 'Campaigns', title: 'Campaigns', icon: 'Campaign', items: [
    { title: 'Create Campaign', route: '/campaigns/create' },
    { title: 'Campaign Management', route: '/campaigns' },
    { title: 'Target Groups', route: '/target-groups' },
    { title: 'Campaign Rate Bias', route: '/campaigns/rate-bias' }
  ] },
  { key: 'Approvals', title: 'Approvals', icon: 'CampaignApproval', items: [
    { title: 'Campaign Approvals', route: '/approvals/campaigns' },
    { title: 'Brand Approvals', route: '/approvals/brands' },
    { title: 'Client Approvals', route: '/approvals/clients' }
  ] },
  { key: 'Content', title: 'Content', icon: 'Content', items: [
    { title: 'Compositions', route: '/content/compositions' },
    { title: 'Unmapped Compositions', route: '/content/unmapped' },
    { title: 'Archived Content', route: '/content/archived' }
  ] },
  { key: 'Inventory', title: 'Inventory', icon: 'Movies', items: [
    { title: 'Inventory Availability', route: '/inventory/availability' },
    { title: 'Network Theatres & Screens', route: '/inventory/theatres' },
    { title: 'Network DOOH', route: '/inventory/dooh' },
    { title: 'Playlist Templates', route: '/inventory/templates' },
    { title: 'Pre-Show Playlist', route: '/inventory/playlist' }
  ] },
  { key: 'Catalogue', title: 'Catalogue', icon: 'List', items: [
    { title: 'Brands', route: '/catalogue/brands' },
    { title: 'Clients', route: '/catalogue/clients' }
  ] },
  { key: 'Reports', title: 'Reports', icon: 'Reports', items: [
    { title: 'Reports & Analytics', route: '/reports' },
    { title: 'Proof of Play', route: '/reports/proof-of-play' },
    { title: 'Distribution Status', route: '/reports/distribution' }
  ] },
  { key: 'Users', title: 'User Management', route: '/users', icon: 'MultipleUsers' },
  { key: 'Settings', title: 'Settings', route: '/settings', icon: 'Settings' }
];

// route -> [group, leaf, description]
export const routeTitles: Record<string, [string, string, string]> = {
  '/': ['Overview', 'Dashboard', ''],
  '/campaigns': ['Campaigns', 'Campaign Management', ''],
  '/campaigns/create': ['Campaigns', 'Create Campaign', ''],
  '/campaigns/rate-bias': ['Campaigns', 'Campaign Rate Bias', 'Pricing adjustments by geography, theatre type, segment or daypart.'],
  '/target-groups': ['Campaigns', 'Target Groups', 'Theatre and screen groupings used for campaign targeting.'],
  '/approvals/campaigns': ['Approvals', 'Campaign Approvals', 'Review and approve campaigns for release to the network.'],
  '/approvals/brands': ['Approvals', 'Brand Approvals', 'Creative approvals from brand partners.'],
  '/approvals/clients': ['Approvals', 'Client Approvals', 'Advertiser and agency approvals before scheduling.'],
  '/content/compositions': ['Content', 'Compositions Library', 'Approved and active content assets across the network.'],
  '/content/unmapped': ['Content', 'Unmapped Compositions', 'Uploaded content not yet assigned to a campaign.'],
  '/content/archived': ['Content', 'Archived Content', 'Expired and past-use content kept for records.'],
  '/inventory/availability': ['Inventory', 'Inventory Availability', ''],
  '/inventory/theatres': ['Inventory', 'Network Theatres & Screens', 'Searchable directory of theatres with region, format and capacity filters.'],
  '/inventory/dooh': ['Inventory', 'Network DOOH', 'Digital display inventory configured per theatre.'],
  '/inventory/templates': ['Inventory', 'Playlist Templates', 'Predefined ad block layouts and playlist boundary rules.'],
  '/inventory/playlist': ['Inventory', 'Pre-Show Playlist', 'The exact sequence of content around a show.'],
  '/catalogue/brands': ['Catalogue', 'Brand Catalogue', 'Master brand list with linked creatives and metadata.'],
  '/catalogue/clients': ['Catalogue', 'Client Directory', 'Master advertiser and agency list with contact history.'],
  '/reports': ['Reports', 'Reports & Analytics', 'Campaign performance, inventory utilisation and approval turnaround.'],
  '/reports/proof-of-play': ['Reports', 'Proof of Play', 'What actually played, per screen and per show.'],
  '/reports/distribution': ['Reports', 'Distribution Status', 'Whether content reached each theatre.'],
  '/users': ['Platform', 'User Management', 'Users, roles, permissions and access levels.'],
  '/settings': ['Platform', 'Platform Settings', 'Time zones, default rates, content formats and network settings.']
};

export const builtRoutes = ['/', '/campaigns', '/campaigns/create', '/campaigns/rate-bias', '/target-groups',
  '/approvals/campaigns', '/approvals/brands', '/approvals/clients',
  '/content/compositions', '/content/unmapped', '/content/archived',
  '/inventory/availability', '/inventory/theatres', '/inventory/dooh', '/inventory/templates', '/inventory/playlist',
  '/catalogue/brands', '/catalogue/clients',
  '/reports', '/reports/proof-of-play', '/reports/distribution', '/users', '/settings'];

export interface Campaign {
  id: string; name: string; client: string; status: string; tone: string;
  start: string; end: string; screens: number; plays: number; budget: number;
}

export const campaigns: Campaign[] = [
  { id: 'CAM-001', name: 'Summer Movie Festival', client: 'Kestrel Media Holdings', status: 'Active', tone: 'positive', start: '2026-06-15', end: '2026-08-31', screens: 45, plays: 1260, budget: 25000 },
  { id: 'CAM-002', name: 'Horror Night Promo', client: 'Kestrel Media Holdings', status: 'Pending Approval', tone: 'notice', start: '2026-10-01', end: '2026-10-31', screens: 32, plays: 896, budget: 18500 },
  { id: 'CAM-003', name: 'Holiday Blockbusters', client: 'Vantage Group', status: 'In Review', tone: 'primary-secondary', start: '2026-11-15', end: '2026-12-31', screens: 67, plays: 2010, budget: 42000 },
  { id: 'CAM-004', name: 'Local Theatre Showcase', client: 'Tallgrass Brands', status: 'Draft', tone: 'default', start: '2026-12-01', end: '2026-12-15', screens: 12, plays: 288, budget: 8000 },
  { id: 'CAM-005', name: 'Autumn Auto Launch', client: 'Northwind Motors Group', status: 'Active', tone: 'positive', start: '2026-09-07', end: '2026-10-18', screens: 88, plays: 3080, budget: 61500 },
  { id: 'CAM-006', name: 'Streaming Service Teaser', client: 'Kestrel Media Holdings', status: 'Active', tone: 'positive', start: '2026-08-21', end: '2026-09-30', screens: 54, plays: 1620, budget: 33750 },
  { id: 'CAM-007', name: 'Regional Bank Awareness', client: 'Meridian Financial', status: 'Pending Approval', tone: 'notice', start: '2026-10-09', end: '2026-11-20', screens: 41, plays: 1148, budget: 21400 },
  { id: 'CAM-008', name: 'Winter Retail Sprint', client: 'Vantage Group', status: 'Draft', tone: 'default', start: '2026-11-27', end: '2026-12-26', screens: 19, plays: 456, budget: 9800 }
];

export interface TargetGroup {
  id: string; name: string; screens: number; theatres: number;
  createdOn: string; createdBy: string; validFrom: string; validTill: string;
  status: 'active' | 'expired' | 'upcoming';
}

export const targetGroups: TargetGroup[] = [
  { id: 'tg-001', name: 'Premium Metro Screens', screens: 45, theatres: 12, createdOn: '2026-01-15', createdBy: 'John Smith', validFrom: '2026-02-01', validTill: '2026-12-31', status: 'active' },
  { id: 'tg-002', name: 'Tier 2 City Multiplex', screens: 78, theatres: 25, createdOn: '2026-01-20', createdBy: 'Sarah Johnson', validFrom: '2026-02-15', validTill: '2026-11-30', status: 'active' },
  { id: 'tg-003', name: 'Weekend Prime Time', screens: 120, theatres: 40, createdOn: '2026-01-10', createdBy: 'Mike Chen', validFrom: '2026-01-25', validTill: '2026-07-31', status: 'expired' },
  { id: 'tg-004', name: 'Autumn Campaign Screens', screens: 95, theatres: 30, createdOn: '2026-02-01', createdBy: 'Lisa Wong', validFrom: '2026-09-01', validTill: '2026-12-31', status: 'upcoming' },
  { id: 'tg-005', name: 'IMAX & Premium Large Format', screens: 34, theatres: 28, createdOn: '2026-03-04', createdBy: 'Riya Deshpande', validFrom: '2026-04-01', validTill: '2026-12-31', status: 'active' },
  { id: 'tg-006', name: 'Family Matinee Network', screens: 62, theatres: 21, createdOn: '2026-03-19', createdBy: 'Diego Alvarez', validFrom: '2026-05-01', validTill: '2026-10-31', status: 'active' }
];

export interface Media {
  id: string; name: string; cpl: string; status: string; tone: string;
  seconds: number; format: string; size: string;
}

export const media: Media[] = [
  { id: 'm-1', name: 'Autumn Auto — 30s Hero', cpl: 'CPL-123-ABC-456', status: 'Available', tone: 'positive', seconds: 30, format: 'DCP · 2K Flat', size: '2.4 GB' },
  { id: 'm-2', name: 'Product Launch Teaser', cpl: 'CPL-789-DEF-012', status: 'Missing', tone: 'negative', seconds: 15, format: 'DCP · 2K Scope', size: '—' },
  { id: 'm-3', name: 'Brand Awareness Static', cpl: 'CPL-345-GHI-678', status: 'Available', tone: 'positive', seconds: 10, format: 'Slide · PNG', size: '15 MB' },
  { id: 'm-4', name: 'Retail Sprint — 20s Cut', cpl: 'CPL-902-JKL-334', status: 'Available', tone: 'positive', seconds: 20, format: 'DCP · 2K Flat', size: '1.6 GB' },
  { id: 'm-5', name: 'Bank Awareness — 45s', cpl: 'CPL-556-MNO-771', status: 'In Certification', tone: 'notice', seconds: 45, format: 'DCP · 4K Flat', size: '5.1 GB' },
  { id: 'm-6', name: 'Streaming Teaser — 30s', cpl: 'CPL-118-PQR-620', status: 'Available', tone: 'positive', seconds: 30, format: 'DCP · 2K Scope', size: '2.2 GB' }
];

export interface TheatreDef {
  id: string; name: string; circuit: string; city: string; n: number;
}

export const theatreDefs: TheatreDef[] = [
  { id: 'TH-101', name: 'AMC Empire 25', circuit: 'AMC Theatres', city: 'New York, NY', n: 8 },
  { id: 'TH-118', name: 'AMC Century City 15', circuit: 'AMC Theatres', city: 'Los Angeles, CA', n: 6 },
  { id: 'TH-204', name: 'Regal Union Square', circuit: 'Regal Cinemas', city: 'New York, NY', n: 7 },
  { id: 'TH-231', name: 'Regal LA Live', circuit: 'Regal Cinemas', city: 'Los Angeles, CA', n: 5 },
  { id: 'TH-307', name: 'Cineplex Yonge-Dundas', circuit: 'Cineplex Entertainment', city: 'Toronto, ON', n: 6 },
  { id: 'TH-402', name: 'Rialto Independent', circuit: 'Independent Theatres', city: 'Austin, TX', n: 3 }
];

export interface ClientDef {
  name: string; brands: string[]; billing: string; addresses: string[];
}

export const clients: ClientDef[] = [
  { name: 'Northwind Motors Group', brands: ['Northwind Motors', 'Northwind Electric'], billing: 'Halcyon Media Group', addresses: ['411 Lexington Ave, Suite 900, New York, NY 10017'] },
  { name: 'Meridian Financial', brands: ['Meridian Bank', 'Meridian Wealth'], billing: 'Halcyon Media Group', addresses: ['411 Lexington Ave, Suite 900, New York, NY 10017'] },
  { name: 'Kestrel Media Holdings', brands: ['Kestrel Streaming', 'Kestrel Sports'], billing: 'Bright Harbour Media', addresses: ['2200 Wilshire Blvd, Los Angeles, CA 90057', '88 Kearny St, Floor 12, San Francisco, CA 94108'] },
  { name: 'Vantage Group', brands: ['Vantage Retail', 'Vantage Home'], billing: 'Vantage Group (direct)', addresses: ['15 Congress Ave, Austin, TX 78701'] },
  { name: 'Tallgrass Brands', brands: ['Tallgrass Foods', 'Tallgrass Dairy'], billing: 'Tallgrass Brands (direct)', addresses: ['700 W Madison St, Chicago, IL 60661'] },
  { name: 'Orbit Communications', brands: ['Orbit Telecom', 'Orbit Fibre'], billing: 'Bright Harbour Media', addresses: ['2200 Wilshire Blvd, Los Angeles, CA 90057', '88 Kearny St, Floor 12, San Francisco, CA 94108'] }
];

export interface Composition {
  id: string; name: string; cpl: string; sec: number; format: string; size: string;
  state: string; campaign: string | null; ingested: string;
}

export const compositions: Composition[] = [
  { id: 'c-1', name: 'Autumn Auto — 30s Hero', cpl: '123e4567-e89b-12d3-a456-426614174000', sec: 30, format: 'DCP · 2K Flat', size: '2.4 GB', state: 'Available', campaign: 'Autumn Auto Launch', ingested: '2026-08-19' },
  { id: 'c-2', name: 'Product Launch Teaser', cpl: '6ba7b810-9dad-11d1-80b4-00c04fd430c8', sec: 15, format: 'DCP · 2K Scope', size: '—', state: 'Missing', campaign: 'Autumn Auto Launch', ingested: '—' },
  { id: 'c-3', name: 'Brand Awareness Static', cpl: '9f1c2d44-31aa-4c0e-9c11-7b2f5d8e6a03', sec: 10, format: 'Slide · PNG', size: '15 MB', state: 'Available', campaign: 'Summer Movie Festival', ingested: '2026-06-02' },
  { id: 'c-4', name: 'Retail Sprint — 20s Cut', cpl: '4e7b91c2-08d5-4b6a-9e33-1c5f7a2b8d40', sec: 20, format: 'DCP · 2K Flat', size: '1.6 GB', state: 'Available', campaign: null, ingested: '2026-08-28' },
  { id: 'c-5', name: 'Bank Awareness — 45s', cpl: 'b2d9f371-6c4e-4a18-8f52-3d7e9c1a5b66', sec: 45, format: 'DCP · 4K Flat', size: '5.1 GB', state: 'In Certification', campaign: 'Regional Bank Awareness', ingested: '2026-09-01' },
  { id: 'c-6', name: 'Streaming Teaser — 30s', cpl: '7a3e5c18-9b2d-4f70-a611-8e4d2c9f3b57', sec: 30, format: 'DCP · 2K Scope', size: '2.2 GB', state: 'Available', campaign: 'Streaming Service Teaser', ingested: '2026-08-12' },
  { id: 'c-7', name: 'Horror Night — 15s Sting', cpl: 'e91d4b06-2f78-4c3a-b055-6a1e8d7f2c94', sec: 15, format: 'DCP · 2K Scope', size: '1.1 GB', state: 'Available', campaign: null, ingested: '2026-09-03' },
  { id: 'c-8', name: 'Spring Travel — 30s', cpl: 'd47c2a95-1e83-4d61-9f28-5b3a7c6e0f12', sec: 30, format: 'DCP · 2K Flat', size: '2.3 GB', state: 'Archived', campaign: 'Spring Travel Push', ingested: '2026-03-14' },
  { id: 'c-9', name: 'Winter Retail — 10s Slide', cpl: 'a8f31e57-4b90-42cd-8e16-9c2d5f7a3b08', sec: 10, format: 'Slide · PNG', size: '9 MB', state: 'Archived', campaign: 'Winter Retail 2025', ingested: '2025-11-08' }
];

export interface PlaylistItem {
  seg: 'Pre-show' | 'Intermission'; name: string; type: string; sec: number; pos: string;
}

export const playlistItems: PlaylistItem[] = [
  { seg: 'Pre-show', name: 'Auditorium policy slide', type: 'Policy', sec: 15, pos: '—' },
  { seg: 'Pre-show', name: 'Brand Awareness Static', type: 'Ad', sec: 10, pos: 'A' },
  { seg: 'Pre-show', name: 'Autumn Auto — 30s Hero', type: 'Ad', sec: 30, pos: 'B' },
  { seg: 'Pre-show', name: 'Streaming Teaser — 30s', type: 'Ad', sec: 30, pos: 'C' },
  { seg: 'Pre-show', name: 'Local advertiser pod', type: 'Ad pod', sec: 90, pos: 'D' },
  { seg: 'Pre-show', name: 'Trailer — The Long Winter', type: 'Trailer', sec: 150, pos: '—' },
  { seg: 'Pre-show', name: 'Trailer — Neon Harbour', type: 'Trailer', sec: 135, pos: '—' },
  { seg: 'Pre-show', name: 'Feature presentation ident', type: 'Ident', sec: 20, pos: '—' },
  { seg: 'Intermission', name: 'Concessions promo', type: 'Ad', sec: 45, pos: 'A' },
  { seg: 'Intermission', name: 'Retail Sprint — 20s Cut', type: 'Ad', sec: 20, pos: 'B' },
  { seg: 'Intermission', name: 'Next week at this cinema', type: 'Promo', sec: 60, pos: '—' }
];

export interface ProofRow {
  id: string; creative: string; campaign: string; screen: string; show: string;
  scheduled: string; actual: string; state: string;
}

export const proofRows: ProofRow[] = [
  { id: 'pp-1', creative: 'Autumn Auto — 30s Hero', campaign: 'Autumn Auto Launch', screen: 'AMC Empire 25 · Screen 1', show: '19:45 Dune: Part Three', scheduled: '19:31:00', actual: '19:31:02', state: 'Played' },
  { id: 'pp-2', creative: 'Autumn Auto — 30s Hero', campaign: 'Autumn Auto Launch', screen: 'AMC Empire 25 · Screen 4', show: '19:45 The Long Winter', scheduled: '19:32:15', actual: '19:32:14', state: 'Played' },
  { id: 'pp-3', creative: 'Brand Awareness Static', campaign: 'Summer Movie Festival', screen: 'Regal Union Square · Screen 2', show: '17:00 Neon Harbour', scheduled: '16:48:30', actual: '—', state: 'Missed' },
  { id: 'pp-4', creative: 'Streaming Teaser — 30s', campaign: 'Streaming Service Teaser', screen: 'Regal LA Live · Screen 1', show: '22:15 Silverline', scheduled: '22:01:00', actual: '22:01:05', state: 'Played' },
  { id: 'pp-5', creative: 'Retail Sprint — 20s Cut', campaign: 'Winter Retail Sprint', screen: 'Cineplex Yonge-Dundas · Screen 3', show: '14:15 Paper Moons', scheduled: '14:03:40', actual: '14:03:41', state: 'Played' },
  { id: 'pp-6', creative: 'Autumn Auto — 30s Hero', campaign: 'Autumn Auto Launch', screen: 'AMC Century City 15 · Screen 2', show: '17:00 Dune: Part Three', scheduled: '16:47:10', actual: '16:52:30', state: 'Late' },
  { id: 'pp-7', creative: 'Brand Awareness Static', campaign: 'Summer Movie Festival', screen: 'Rialto Independent · Screen 1', show: '19:45 Paper Moons', scheduled: '19:33:00', actual: '19:33:00', state: 'Played' },
  { id: 'pp-8', creative: 'Streaming Teaser — 30s', campaign: 'Streaming Service Teaser', screen: 'Regal Union Square · Screen 5', show: '11:30 The Long Winter', scheduled: '11:18:20', actual: '—', state: 'Missed' },
  { id: 'pp-9', creative: 'Retail Sprint — 20s Cut', campaign: 'Winter Retail Sprint', screen: 'AMC Empire 25 · Screen 7', show: '14:15 Silverline', scheduled: '14:04:00', actual: '14:04:03', state: 'Played' },
  { id: 'pp-10', creative: 'Autumn Auto — 30s Hero', campaign: 'Autumn Auto Launch', screen: 'Cineplex Yonge-Dundas · Screen 1', show: '22:15 Neon Harbour', scheduled: '22:02:45', actual: '22:02:47', state: 'Played' }
];

export interface DistRow {
  id: string; theatre: string; content: string; screens: number; state: string; pct: number;
}

export const distRows: DistRow[] = [
  { id: 'd-1', theatre: 'AMC Empire 25', content: 'Autumn Auto — 30s Hero', screens: 8, state: 'Delivered', pct: 100 },
  { id: 'd-2', theatre: 'AMC Century City 15', content: 'Autumn Auto — 30s Hero', screens: 6, state: 'Delivered', pct: 100 },
  { id: 'd-3', theatre: 'Regal Union Square', content: 'Streaming Teaser — 30s', screens: 7, state: 'In Transit', pct: 64 },
  { id: 'd-4', theatre: 'Regal LA Live', content: 'Streaming Teaser — 30s', screens: 5, state: 'Delivered', pct: 100 },
  { id: 'd-5', theatre: 'Cineplex Yonge-Dundas', content: 'Retail Sprint — 20s Cut', screens: 6, state: 'Failed', pct: 18 },
  { id: 'd-6', theatre: 'Rialto Independent', content: 'Retail Sprint — 20s Cut', screens: 3, state: 'In Transit', pct: 41 },
  { id: 'd-7', theatre: 'AMC Empire 25', content: 'Brand Awareness Static', screens: 8, state: 'Delivered', pct: 100 },
  { id: 'd-8', theatre: 'Regal Union Square', content: 'Bank Awareness — 45s', screens: 7, state: 'Failed', pct: 0 }
];

export interface ApprovalItem {
  id: string; title: string; meta: string; note: string;
}

export const approvalQueues: Record<string, ApprovalItem[]> = {
  '/approvals/campaigns': [
    { id: 'a-1', title: 'Horror Night Promo', meta: 'AMC Theatres · flight 1 Oct – 31 Oct · 32 screens', note: 'Awaiting inventory confirmation' },
    { id: 'a-2', title: 'Regional Bank Awareness', meta: 'Cineplex Entertainment · flight 9 Oct – 20 Nov · 41 screens', note: 'Creative in certification' },
    { id: 'a-3', title: 'Winter Retail Sprint', meta: 'Independent Theatres · flight 27 Nov – 26 Dec · 19 screens', note: 'Rate bias exception requested' }
  ],
  '/approvals/brands': [
    { id: 'b-1', title: 'Northwind Motors', meta: '3 creatives submitted · automotive category', note: 'Category exclusivity check pending' },
    { id: 'b-2', title: 'Meridian Bank', meta: '1 creative submitted · financial services', note: 'Regulatory disclaimer review' }
  ],
  '/approvals/clients': [
    { id: 'c-1', title: 'Halcyon Media Group', meta: 'New agency · Northeast region', note: 'Credit terms not yet set' },
    { id: 'c-2', title: 'Bright Harbour Media', meta: 'New agency · West region', note: 'Billing entity verification' }
  ]
};

export interface BiasRule {
  id: string; dimension: string; value: string; mult: number;
}

export const biasRules: BiasRule[] = [
  { id: 'r-1', dimension: 'Geography', value: 'New York, NY', mult: 1.35 },
  { id: 'r-2', dimension: 'Geography', value: 'Austin, TX', mult: 0.9 },
  { id: 'r-3', dimension: 'Theatre type', value: 'IMAX / PLF', mult: 1.6 },
  { id: 'r-4', dimension: 'Daypart', value: 'Prime (18:00–22:59)', mult: 1.25 },
  { id: 'r-5', dimension: 'Daypart', value: 'Matinee (before 15:00)', mult: 0.75 },
  { id: 'r-6', dimension: 'Segment', value: 'Intermission Premium', mult: 1.4 }
];

export const brandsCat = [
  { name: 'Northwind Motors', category: 'Automotive', creatives: 6, campaigns: 3, client: 'Halcyon Media Group' },
  { name: 'Meridian Bank', category: 'Financial Services', creatives: 2, campaigns: 1, client: 'Halcyon Media Group' },
  { name: 'Kestrel Streaming', category: 'Media & Entertainment', creatives: 9, campaigns: 4, client: 'Bright Harbour Media' },
  { name: 'Vantage Retail', category: 'Retail', creatives: 5, campaigns: 2, client: 'Direct' },
  { name: 'Tallgrass Foods', category: 'FMCG', creatives: 4, campaigns: 2, client: 'Direct' },
  { name: 'Orbit Telecom', category: 'Telecom', creatives: 7, campaigns: 3, client: 'Bright Harbour Media' }
];

export const clientsCat = [
  { name: 'Halcyon Media Group', type: 'Media Agency', region: 'Northeast', campaigns: 6, contact: 'aisha.karim@halcyon.example' },
  { name: 'Bright Harbour Media', type: 'Media Agency', region: 'West', campaigns: 4, contact: 'devon.pike@brightharbour.example' },
  { name: 'AMC Theatres', type: 'Exhibitor', region: 'National', campaigns: 3, contact: 'adops@amc.example' },
  { name: 'Regal Cinemas', type: 'Exhibitor', region: 'National', campaigns: 3, contact: 'adops@regal.example' },
  { name: 'Cineplex Entertainment', type: 'Exhibitor', region: 'Canada', campaigns: 2, contact: 'adops@cineplex.example' },
  { name: 'Independent Theatres', type: 'Exhibitor', region: 'South', campaigns: 2, contact: 'bookings@indie.example' }
];

export const users = [
  { name: 'Riya Deshpande', email: 'riya.d@qube.example', role: 'Ad Operations', scope: 'QCN — all circuits', state: 'Active' },
  { name: 'John Smith', email: 'john.s@qube.example', role: 'Campaign Manager', scope: 'Northeast', state: 'Active' },
  { name: 'Sarah Johnson', email: 'sarah.j@qube.example', role: 'Campaign Manager', scope: 'West', state: 'Active' },
  { name: 'Mike Chen', email: 'mike.c@qube.example', role: 'Content Operations', scope: 'QCN — all circuits', state: 'Active' },
  { name: 'Lisa Wong', email: 'lisa.w@halcyon.example', role: 'Agency (read only)', scope: 'Own campaigns', state: 'Active' },
  { name: 'Diego Alvarez', email: 'diego.a@qube.example', role: 'Exhibitor Admin', scope: 'Cineplex Entertainment', state: 'Suspended' }
];

// Rate-card / currency "props" — configurable via the design tool in the original;
// hardcoded here as sensible defaults for the port.
export const ratePerSecond = 0.012;
export const currency: 'USD' | 'INR' | 'EUR' | 'GBP' = 'USD';
export const showCapacityBars = true;

/* ---------- Network DOOH ---------- */

export interface DoohGroup {
  id: string; type: string; name: string; screens: number;
  orientation: string; mode: string; loop: string; loopSecs: number;
}

export interface DoohTheatreConfig {
  updatedOn: string; updatedBy: string; hoursMode: string;
  /** keyed by day, value is [start, end, on] */
  hours: Record<string, [string, string, boolean]>;
  groups: DoohGroup[];
}

export const doohTypes = [
  'Lobby', 'Foyer', 'Box Office / Ticketing', 'Concessions', 'Corridor / Circulation',
  'Auditorium Entrance', 'Auditorium', 'F&B', 'Restroom', 'Other'
];

export const doohDayDefs: { key: string; label: string }[] = [
  { key: 'mon', label: 'Monday' }, { key: 'tue', label: 'Tuesday' }, { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' }, { key: 'fri', label: 'Friday' }, { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' }
];

export const doohLoopHints: Record<string, string> = {
  'Scheduled': 'Loop duration is configured for this display group.',
  'Synchronized with Screen': 'Follows the playback loop of the connected signage system. No loop duration is set in Slate.',
  'Free Duration': 'Not constrained by a fixed loop; playback length follows the scheduled content.'
};

export const doohModeHints: Record<string, string> = {
  'Independent Screens': 'Each physical screen can play different content.',
  'Synchronized Screens': 'All screens play the same content at the same time — commercially one advertising unit.',
  'Single Canvas': 'Several panels form one logical display, such as a multi-panel LED wall.'
};

// state/country resolution for the city/state abbreviation baked into `theatreDefs[].city`.
export const doohStates: Record<string, string> = { NY: 'New York', CA: 'California', ON: 'Ontario', TX: 'Texas', IL: 'Illinois' };
export const doohCountries: Record<string, string> = { ON: 'Canada' };

export const doohSeed: Record<string, DoohTheatreConfig> = {
  'TH-101': {
    updatedOn: '2026-08-24T16:40:00', updatedBy: 'Priya Raman',
    hoursMode: 'Scheduled',
    hours: { mon: ['10:00', '23:00', true], tue: ['10:00', '23:00', true], wed: ['10:00', '23:00', true], thu: ['10:00', '23:00', true], fri: ['10:00', '00:00', true], sat: ['09:00', '00:00', true], sun: ['09:00', '23:00', true] },
    groups: [
      { id: 'dg-101-1', type: 'Lobby', name: 'Main Lobby LED', screens: 2, orientation: 'Horizontal', mode: 'Single Canvas', loop: 'Scheduled', loopSecs: 60 },
      { id: 'dg-101-2', type: 'Foyer', name: 'Foyer LED Wall', screens: 1, orientation: 'Horizontal', mode: 'Single Canvas', loop: 'Scheduled', loopSecs: 60 },
      { id: 'dg-101-3', type: 'Foyer', name: 'Foyer Digital Screens', screens: 8, orientation: 'Vertical', mode: 'Synchronized Screens', loop: 'Synchronized with Screen', loopSecs: 60 },
      { id: 'dg-101-4', type: 'Concessions', name: 'Concession Screens', screens: 4, orientation: 'Horizontal', mode: 'Independent Screens', loop: 'Scheduled', loopSecs: 30 },
      { id: 'dg-101-5', type: 'Auditorium Entrance', name: 'Entrance Screens', screens: 4, orientation: 'Vertical', mode: 'Independent Screens', loop: 'Scheduled', loopSecs: 60 }
    ]
  },
  'TH-118': {
    updatedOn: '2026-08-19T11:05:00', updatedBy: 'Dan Whitfield',
    hoursMode: 'Scheduled',
    hours: { mon: ['11:00', '23:00', true], tue: ['11:00', '23:00', true], wed: ['11:00', '23:00', true], thu: ['11:00', '23:00', true], fri: ['11:00', '01:00', true], sat: ['10:00', '01:00', true], sun: ['10:00', '23:00', true] },
    groups: [
      { id: 'dg-118-1', type: 'Lobby', name: 'Lobby Portrait Pair', screens: 2, orientation: 'Vertical', mode: 'Synchronized Screens', loop: 'Scheduled', loopSecs: 45 },
      { id: 'dg-118-2', type: 'Foyer', name: 'Foyer Screens', screens: 6, orientation: 'Vertical', mode: 'Independent Screens', loop: 'Scheduled', loopSecs: 60 },
      { id: 'dg-118-3', type: 'Box Office / Ticketing', name: 'Ticketing Overhead', screens: 2, orientation: 'Horizontal', mode: 'Synchronized Screens', loop: 'Synchronized with Screen', loopSecs: 60 },
      { id: 'dg-118-4', type: 'F&B', name: 'Bar Menu Boards', screens: 2, orientation: 'Horizontal', mode: 'Independent Screens', loop: 'Free Duration', loopSecs: 60 }
    ]
  },
  'TH-204': {
    updatedOn: '2026-08-25T09:22:00', updatedBy: 'Priya Raman',
    hoursMode: 'Scheduled',
    hours: { mon: ['10:30', '23:30', true], tue: ['10:30', '23:30', true], wed: ['10:30', '23:30', true], thu: ['10:30', '23:30', true], fri: ['10:30', '01:00', true], sat: ['09:30', '01:00', true], sun: ['09:30', '23:00', true] },
    groups: [
      { id: 'dg-204-1', type: 'Foyer', name: 'Foyer Entrance Wall', screens: 3, orientation: 'Full Container', mode: 'Single Canvas', loop: 'Scheduled', loopSecs: 60 },
      { id: 'dg-204-2', type: 'Concessions', name: 'Concession Screens', screens: 3, orientation: 'Horizontal', mode: 'Independent Screens', loop: 'Scheduled', loopSecs: 30 },
      { id: 'dg-204-3', type: 'Corridor / Circulation', name: 'Corridor Panels', screens: 4, orientation: 'Vertical', mode: 'Independent Screens', loop: 'Scheduled', loopSecs: 60 }
    ]
  },
  'TH-231': {
    updatedOn: '2026-07-30T14:10:00', updatedBy: 'Lena Okafor',
    hoursMode: 'Scheduled',
    hours: { mon: ['12:00', '23:00', true], tue: ['12:00', '23:00', true], wed: ['12:00', '23:00', true], thu: ['12:00', '23:00', true], fri: ['12:00', '01:00', true], sat: ['11:00', '01:00', true], sun: ['11:00', '23:00', true] },
    groups: [
      { id: 'dg-231-1', type: 'Lobby', name: 'Atrium LED Wall', screens: 6, orientation: 'Full Container', mode: 'Single Canvas', loop: 'Scheduled', loopSecs: 90 },
      { id: 'dg-231-2', type: 'Auditorium Entrance', name: 'Entrance Screens', screens: 5, orientation: 'Vertical', mode: 'Synchronized Screens', loop: 'Synchronized with Screen', loopSecs: 60 }
    ]
  },
  'TH-307': {
    updatedOn: '2026-08-11T17:48:00', updatedBy: 'Marcus Bell',
    hoursMode: 'Scheduled',
    hours: { mon: ['10:00', '22:30', true], tue: ['10:00', '22:30', true], wed: ['10:00', '22:30', true], thu: ['10:00', '22:30', true], fri: ['10:00', '00:30', true], sat: ['09:00', '00:30', true], sun: ['09:00', '22:30', true] },
    groups: [
      { id: 'dg-307-1', type: 'Foyer', name: 'Foyer Digital Screens', screens: 6, orientation: 'Vertical', mode: 'Synchronized Screens', loop: 'Scheduled', loopSecs: 60 },
      { id: 'dg-307-2', type: 'Restroom', name: 'Washroom Panels', screens: 4, orientation: 'Vertical', mode: 'Independent Screens', loop: 'Free Duration', loopSecs: 60 }
    ]
  },
  'TH-402': {
    updatedOn: '2026-06-02T10:15:00', updatedBy: 'Lena Okafor',
    hoursMode: 'Scheduled',
    hours: { mon: ['14:00', '22:00', false], tue: ['14:00', '22:00', true], wed: ['14:00', '22:00', true], thu: ['14:00', '22:00', true], fri: ['14:00', '23:30', true], sat: ['12:00', '23:30', true], sun: ['12:00', '22:00', true] },
    groups: []
  }
};
