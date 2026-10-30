// Mock reference data ported verbatim from `project/Qube Slate.dc.html`.

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

const seedCompositions: Composition[] = [
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

/**
 * A compositions library holds thousands of CPLs, so the prototype pads the hand-written rows above with generated ones
 * (seeded, so every load shows the same library).
 */
function generateCompositions(count: number): Composition[] {
  let seed = 20261030;
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)];
  const hex = (n: number) => Array.from({ length: n }, () => Math.floor(rand() * 16).toString(16)).join('');
  const brands = ['Amul Dark', 'Northwind Air', 'Tanishq Rivaah', 'Royal Enfield', 'Sunrise Foods', 'Meridian Bank', 'Zest Cola', 'Orbit Mobile',
    'Lumen Paints', 'Kaveri Silks', 'Peak Shoes', 'Monsoon Travels', 'Harbor Insurance', 'Spice Route', 'Velocity Bikes', 'Nimbus Streaming'];
  const cuts = ['Hero', 'Teaser', 'Sting', 'Cutdown', 'Tag', 'Launch', 'Festive', 'Brand Film', 'Offer', 'Reminder'];
  const campaigns = ['Autumn Auto Launch', 'Summer Movie Festival', 'Regional Bank Awareness', 'Streaming Service Teaser', 'Diwali Burst',
    'Winter Lobby', 'Festive Q3', 'Monsoon Offers', 'IPL Season', 'New Year Countdown', 'Back to School', 'Republic Day Sale'];
  const formats = ['DCP · 2K Flat', 'DCP · 2K Flat', 'DCP · 2K Scope', 'DCP · 4K Flat', 'DCP · 4K Scope', 'Slide · PNG', 'Slide · JPEG'];
  const durations = [10, 15, 15, 20, 30, 30, 30, 45, 60];
  const states = ['Available', 'Available', 'Available', 'Available', 'Available', 'Missing', 'In Certification', 'In Certification', 'Archived'];
  const day = 24 * 3600 * 1000;
  const today = Date.UTC(2026, 9, 30);
  return Array.from({ length: count }, (_, i) => {
    const sec = pick(durations);
    const format = pick(formats);
    const state = pick(states);
    const slide = format.startsWith('Slide');
    const gb = (sec / 30) * (format.includes('4K') ? 4.8 : 2.3) * (0.85 + rand() * 0.3);
    return {
      id: `c-${i + 10}`,
      name: `${pick(brands)} — ${sec}s ${pick(cuts)}${rand() < 0.3 ? ` v${2 + Math.floor(rand() * 3)}` : ''}`,
      cpl: `${hex(8)}-${hex(4)}-4${hex(3)}-${pick(['8', '9', 'a', 'b'])}${hex(3)}-${hex(12)}`,
      sec, format,
      size: state === 'Missing' ? '—' : slide ? `${4 + Math.floor(rand() * 20)} MB` : `${gb.toFixed(1)} GB`,
      state,
      campaign: rand() < 0.18 ? null : pick(campaigns),
      ingested: state === 'Missing' ? '—' : new Date(today - Math.floor(rand() * 400) * day).toISOString().slice(0, 10)
    };
  });
}

export const compositions: Composition[] = [...seedCompositions, ...generateCompositions(2491)];

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

// Rate-card / currency "props" — configurable via the design tool in the original;
// hardcoded here as sensible defaults for the port.
export const ratePerSecond = 0.012;
export const currency: 'USD' | 'INR' | 'EUR' | 'GBP' = 'USD';
export const showCapacityBars = true;
