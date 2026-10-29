// Request/response shapes for the Slate API. The mock server and the real backend both implement these.
import type {
  AuditEvent, BillingType, Brand, Campaign, CampaignDecision, CampaignType, Channel, ChecklistItem, Company, Contract,
  DeliveryRecord, DeliverySummary, Device, DoohGroup, Exhibitor, IngestionStatus, InventoryAccess, Invoice, Media,
  PaymentGatewayConfig, Placement, PlacementAction, PlacementPosition, Sac, TargetGroup, Theatre, TimeBand, User
} from '@slate/domain';

export interface Session {
  user: User;
  /** Set when a Qube admin is acting as this user. */
  impersonator: User | null;
  org: { kind: 'company'; company: Company; sac: Sac } | { kind: 'sac'; sac: Sac } | { kind: 'qube' };
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
  sac: Pick<Sac, 'name' | 'legalName' | 'gstin' | 'supportEmail'>;
  gateway: { provider: PaymentGatewayConfig['provider']; enabled: boolean; mode: PaymentGatewayConfig['mode'] } | null;
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

export interface BrandRow extends Brand {
  companyName: string;
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
  groups: Omit<DoohGroup, 'theatreId'>[];
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
  advertisers: number;
  users: number;
  bookedValue: number;
}

export interface SacInput {
  name: string;
  legalName: string;
  slug: string;
  gstin: string;
  supportEmail: string;
  exhibitorIds: string[];
  adminName: string;
  adminEmail: string;
}

export interface ExhibitorInput {
  name: string;
  code: string;
  hq: string;
}

export interface GatewayInput {
  provider: PaymentGatewayConfig['provider'];
  mode: PaymentGatewayConfig['mode'];
  merchantId: string;
  /** Only sent when rotating. Never returned. */
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
