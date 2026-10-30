// Request/response shapes for the Slate API. The mock server and the real backend both implement these.
import type {
  AuditEvent, BillingType, Brand, CategoryNode, Campaign, CampaignDecision, CampaignType, Channel, ChecklistItem, Company, Contract,
  DeliveryRecord, DeliverySummary, Device, DoohGroup, Exhibitor, IngestionStatus, InventoryAccess, Invoice, Media,
  PaymentGateway, Placement, PlacementAction, PlacementPosition, Sac, SacBillingProfile, SacBranding, SacCollectionsProfile, SacContact, SacContactRole,
  ScreenFormat, ScreenHistoryGrid, TargetGroup, TaxId, Theatre, TheatreStatus, TimeBand, User
} from '@slate/domain';

/** The SAC as an advertiser or SAC user sees it: identity, branding and whether online payment works. No billing or key material. */
export interface SessionSac {
  id: string;
  name: string;
  legalName: string;
  url: string;
  supportEmail: string;
  branding: SacBranding;
  gateway: { provider: PaymentGateway['provider']; mode: PaymentGateway['mode']; enabled: boolean } | null;
}

/** Public lookup behind a registration link (`?sac=<subdomain>`). */
export interface PublicSac {
  name: string;
  legalName: string;
  subdomain: string;
  supportEmail: string;
  branding: SacBranding;
}

export interface Session {
  user: User;
  /** Set when a Qube admin is acting as this user. */
  impersonator: User | null;
  org: { kind: 'company'; company: Company; sac: SessionSac } | { kind: 'sac'; sac: SessionSac } | { kind: 'qube' };
}

export interface DemoAccount {
  user: User;
  orgName: string;
}

// ---------- advertiser ----------

export interface TargetGroupWithReach extends TargetGroup {
  reach: { units: number; theatres: number; cities: number };
  summary: string;
  usedBy: number;
}

export interface TargetGroupInput {
  name: string;
  channel: Channel;
  geo: TargetGroup['geo'];
  interest: TargetGroup['interest'];
  advanced: TargetGroup['advanced'];
  doohTypes: TargetGroup['doohTypes'];
}

export interface ReachPreview {
  units: number;
  theatres: number;
  cities: number;
  sample: { id: string; name: string; city: string; units: number }[];
}

export interface MediaInput {
  name: string;
  brandId: string;
  fileType: Media['fileType'];
  fileName: string;
  sizeBytes: number;
  durationSecs: number;
  languages: string[];
  censorCertificate: Media['censorCertificate'];
  attributes: Media['attributes'];
  orientation: Media['orientation'];
}

export interface CampaignRow extends Campaign {
  brandName: string;
  companyName: string;
  placementCount: number;
  screens: number;
  bookedValue: number;
  delivered: DeliverySummary;
}

export interface PlacementRow extends Placement {
  mediaName: string;
  mediaDuration: number;
  targetGroupName: string;
  delivered: DeliverySummary;
  actions: PlacementAction[];
}

export interface CampaignDetail extends CampaignRow {
  placements: PlacementRow[];
  checklist: ChecklistItem[];
  path: 'pay' | 'submit' | 'locked';
}

export interface CampaignInput {
  name: string;
  brandId: string;
  type: CampaignType;
  channels: Channel[];
  start: string;
  end: string;
  budget: number;
  targetGroupIds: string[];
  mediaIds: string[];
}

export interface PlacementInput {
  mediaId: string;
  targetGroupId: string;
  from: string;
  to: string;
  timeBand: TimeBand;
  position: PlacementPosition;
}

export interface PlacementQuoteResponse {
  units: number;
  theatres: number;
  days: number;
  plays: number;
  ratePerSpot: number;
  premium: boolean;
  cost: number;
}

export interface CheckoutInput {
  method: 'card' | 'upi' | 'netbanking';
}

export interface DeliveryBreakdown {
  summary: DeliverySummary;
  byDay: { date: string; planned: number; played: number; failed: number }[];
  byTheatre: { theatreId: string; theatre: string; city: string; planned: number; played: number; failed: number }[];
}

export interface Dashboard {
  activeCampaigns: number;
  scheduledCampaigns: number;
  screensLive: number;
  playsDelivered: number;
  deliveryRate: number;
  spendToDate: number;
  pendingApprovals: number;
  recent: CampaignRow[];
}

export interface BillingOverview {
  billingType: BillingType | null;
  contract: Contract | null;
  outstanding: number;
  sac: Pick<Sac, 'name' | 'legalName' | 'supportEmail'> & { taxIds: TaxId[] };
  /** The SAC's default gateway; null when the company is not a card advertiser or the SAC has none. */
  gateway: { provider: PaymentGateway['provider']; enabled: boolean; mode: PaymentGateway['mode'] } | null;
}

export interface InvoiceRow extends Invoice {
  campaignName: string;
  companyName: string;
}

export interface UserInput {
  name: string;
  email: string;
  phone: string;
  role: User['role'];
}

// ---------- SAC ----------

export interface AdvertiserRow extends Company {
  brands: Brand[];
  activeCampaigns: number;
  bookedValue: number;
  outstanding: number;
}

export interface KycDecisionInput {
  decision: 'approve' | 'reject';
  note: string | null;
  billingType: BillingType | null;
  contract: Contract | null;
}

export interface AdvertiserTermsInput {
  billingType: BillingType;
  contract: Contract | null;
  inventoryAccess: InventoryAccess;
}

/** A brand as portals show it: the union of brand, product and variant mappings, resolved to readable paths. */
export interface BrandView extends Brand {
  /** Brand, product and variant mappings, deduplicated. */
  allCategoryIds: string[];
  /** Same order as `allCategoryIds`, e.g. "Auto / Automotive / Cars". */
  categoryPaths: string[];
}

export interface BrandRow extends BrandView {
  companyName: string;
}

export interface AdminBrandRow extends BrandRow {
  sacId: string;
  sacName: string;
}

export interface BrandsQuery {
  /** Matches brand, advertiser or product name. */
  q?: string;
  sacId?: string;
  status?: Brand['status'];
  /** A category-master node; brands match when any mapping is this node or a descendant. */
  categoryId?: string;
  sort?: BrandSortKey;
  dir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/** Columns the brand catalog can sort by on the server (applied before paging). */
export type BrandSortKey = 'name' | 'companyName' | 'products' | 'status' | 'requestedAt' | 'reviewedAt';

export interface BrandsPage {
  rows: AdminBrandRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BrandInput { name: string; categoryIds: string[] }
/** Products and variants share this shape. */
export interface BrandItemInput { name: string; categoryIds: string[] }

export interface CategoryInput { parentId: string | null; name: string }

/** The category master plus, per node, how many brands use it (directly or through a descendant). */
export interface CategoryMaster {
  nodes: CategoryNode[];
  usage: Record<string, number>;
}

export interface DecisionInput {
  decision: CampaignDecision;
  note: string | null;
}

export interface TheatreRow extends Theatre {
  exhibitorName: string;
  doohGroups: DoohGroup[];
  doohStatus: 'Configured' | 'Pending';
}

export interface DoohConfigInput {
  hours: Theatre['hours'];
  /** The server assigns theatre and SAC; a SAC only edits its own groups. */
  groups: Omit<DoohGroup, 'theatreId' | 'sacId'>[];
}

export interface ProofOfPlayRow {
  campaignId: string;
  campaignName: string;
  companyName: string;
  placementId: string;
  placementCode: string;
  theatreId: string;
  theatre: string;
  city: string;
  planned: number;
  played: number;
  failed: number;
}

// ---------- admin ----------

export interface ExhibitorRow extends Exhibitor {
  theatres: number;
  screens: number;
  doohGroups: number;
  sacs: string[];
}

export interface SacRow extends Sac {
  exhibitorNames: string[];
  /** Theatres and screens mapped to this SAC in CinemaDB (any theatre status). */
  theatres: number;
  screens: number;
  advertisers: number;
  users: number;
  bookedValue: number;
  /** Active theatres of this SAC with at least one Qube device online right now. */
  connectedTheatres: number;
}

export interface SacsQuery {
  /** Matches SAC name. */
  q?: string;
  /** Matches city or country. */
  location?: string;
  sort?: SacSortKey;
  dir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/** Columns the SACs list can sort by on the server (applied before paging). */
export type SacSortKey = 'name' | 'theatres' | 'screens' | 'advertisers' | 'users' | 'connectedTheatres' | 'status' | 'createdAt' | 'updatedAt' | 'updatedBy';

export interface SacsPage {
  rows: SacRow[];
  total: number;
  page: number;
  pageSize: number;
}

/** Onboarding: the minimum to create the SAC and invite its first admin. Everything else is filled in from the SAC page. */
export interface SacInput {
  name: string;
  legalName: string;
  url: string;
  supportEmail: string;
  adminName: string;
  adminEmail: string;
}

export interface SacDetailsInput { name: string; legalName: string; city: string; country: string }

export interface SacSetupInput extends SacBranding {
  url: string;
  supportEmail: string;
}

export type SacContactsInput = Record<SacContactRole, SacContact[]>;
export type SacBillingInput = SacBillingProfile;
export type SacCollectionsInput = SacCollectionsProfile;

export interface SacStatusInput { status: Sac['status'] }

/** Active mapped screens by month for the last 3 calendar years. */
export type SacActiveScreens = ScreenHistoryGrid;

export interface SacTheatreRow {
  theatreId: string;
  name: string;
  city: string;
  state: string;
  country: string;
  chain: string;
  status: TheatreStatus;
  category: Theatre['category'];
  /** Special formats among this SAC's screens (IMAX, 4DX, Recliner…). */
  formats: ScreenFormat[];
  screensTotal: number;
  /** Screens in this theatre mapped to the SAC; can be fewer than screensTotal when screens are split between SACs. */
  screensForSac: number;
  doohScreens: number;
  doohGroups: number;
}

export interface SacTheatresQuery {
  q?: string;
  chain?: string;
  location?: string;
  status?: TheatreStatus;
  page?: number;
  pageSize?: number;
}

export interface SacTheatresPage {
  rows: SacTheatreRow[];
  total: number;
  page: number;
  pageSize: number;
  totals: { theatres: number; activeTheatres: number; screens: number; doohScreens: number };
  facets: {
    chains: { value: string; count: number }[];
    locations: { value: string; count: number }[];
    statuses: { value: TheatreStatus; count: number }[];
  };
  lastSyncedAt: string | null;
}

export interface SacSyncResult {
  added: number;
  removed: number;
  lastSyncedAt: string;
}

export interface ExhibitorInput {
  name: string;
  code: string;
  hq: string;
}

export interface GatewayInput {
  provider: PaymentGateway['provider'];
  mode: PaymentGateway['mode'];
  merchantId: string;
  /** Only sent when entering or rotating a key. Never returned. */
  secretKey: string | null;
  enabled: boolean;
}

export interface DeviceRow extends Device {
  theatreName: string;
  city: string;
  exhibitorName: string;
  health: 'online' | 'stale' | 'offline';
}

export interface IngestionRow extends IngestionStatus {
  theatreName: string;
  city: string;
  exhibitorName: string;
}

export interface PlatformOverview {
  exhibitors: number;
  sacs: number;
  theatres: number;
  screens: number;
  doohGroups: number;
  advertisers: number;
  campaignsLive: number;
  bookedValue: number;
  devicesOffline: number;
  devicesStale: number;
}

export type { AuditEvent, DeliveryRecord, PlacementAction };
