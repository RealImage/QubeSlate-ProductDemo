// Core entities shared by the advertiser, SAC and admin portals.
// Ownership: Exhibitor owns inventory -> SAC sells it -> Advertiser (one SAC each) books it.

export type ISODate = string; // 2026-09-04
export type ISODateTime = string; // 2026-09-04T10:30:00.000Z

export type Portal = 'advertiser' | 'sac' | 'admin';

export type AdvertiserRole = 'admin' | 'planner' | 'viewer';
export type SacRole = 'sac_admin' | 'ad_ops' | 'finance' | 'viewer';
export type AdminRole = 'qube_admin' | 'qube_support';
export type Role = AdvertiserRole | SacRole | AdminRole;

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  portal: Portal;
  /** Company id (advertiser), SAC id (sac) or 'qube' (admin). */
  orgId: string;
  role: Role;
  status: 'active' | 'invited' | 'disabled';
  lastActiveAt: ISODateTime | null;
}

// ---------- tenants ----------

export interface Exhibitor {
  id: string;
  name: string;
  code: string;
  hq: string;
  createdAt: ISODateTime;
}

export type GatewayProvider = 'razorpay' | 'payu' | 'ccavenue' | 'stub';

/** One payment gateway a SAC collects through. Exactly one is the default when any exist. */
export interface PaymentGateway {
  id: string;
  provider: GatewayProvider;
  mode: 'test' | 'live';
  merchantId: string;
  /** Only the last 4 characters are ever returned by the API. */
  keyHint: string;
  enabled: boolean;
  isDefault: boolean;
  /** When it was last switched on. Null while disabled since creation. */
  enabledOn: ISODateTime | null;
  /** When it first went live (enabled in live mode). Null until then. */
  activatedOn: ISODateTime | null;
  updatedAt: ISODateTime;
}

export interface TaxId { name: string; value: string }

export interface SacContact { name: string; email: string; phone: string }
export type SacContactRole = 'operations_manager' | 'billing_manager' | 'account_manager';

export interface SacBranding {
  /** #RRGGBB */
  headerColor: string;
  primaryColor: string;
  secondaryColor: string;
  /** Uploaded logo as a data URL; null means the Slate logo. */
  logo: string | null;
}

export type BillingMethod = 'per_screen_month' | 'per_screen_year' | 'flat_monthly' | 'flat_annual';
export type BillingFrequency = 'monthly' | 'quarterly' | 'half_yearly' | 'annually';
export type BillingCurrency = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'IDR';

/** How Qube bills the SAC. Blank values render as `--`. */
export interface SacBillingProfile {
  companyName: string;
  address: string;
  taxIds: TaxId[];
  method: BillingMethod | null;
  /** Day of month, 1-28. */
  billingDay: number | null;
  frequency: BillingFrequency | null;
  currency: BillingCurrency | null;
}

/** How the SAC collects from its advertisers. */
export interface SacCollectionsProfile {
  companyName: string;
  location: string;
  phone: string;
  email: string;
  taxIds: TaxId[];
}

export interface Sac {
  id: string;
  name: string;
  legalName: string;
  location: { city: string; country: string };
  /** Host of the SAC's advertiser portal, e.g. qcn.slate.com. Its first label is the SAC's identifier (see `sacSubdomain`). */
  url: string;
  supportEmail: string;
  branding: SacBranding;
  contacts: Record<SacContactRole, SacContact[]>;
  billing: SacBillingProfile;
  collections: SacCollectionsProfile;
  /**
   * Derived, never edited: exhibitors that have at least one screen or DOOH group mapped to this SAC.
   * The mapping itself lives on screens and DOOH groups and comes from CinemaDB (see `lastSyncedAt`).
   */
  exhibitorIds: string[];
  /** Last pull of the screen-to-SAC mapping from CinemaDB. Null until the first sync. */
  lastSyncedAt: ISODateTime | null;
  gateways: PaymentGateway[];
  /** Inactive SACs, their users and their advertisers cannot sign in. New SACs start as onboarding. */
  status: 'active' | 'onboarding' | 'inactive';
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  /** Name of the admin who last saved any section of this SAC. */
  updatedBy: string;
}

// ---------- inventory ----------

export type TheatreCategory = 'Premium' | 'Mainstream' | 'Value';
export type ScreenFormat = 'Standard' | 'IMAX' | '4DX' | 'ScreenX' | 'Recliner' | 'Onyx LED';
export type ScreenCategory = 'Gold' | 'Silver' | 'Standard';

export interface Screen {
  id: string;
  theatreId: string;
  name: string;
  format: ScreenFormat;
  category: ScreenCategory;
  projection: '2K' | '4K';
  sound: '5.1' | '7.1' | 'Atmos';
  seats: number;
  /** The SAC that sells this screen, as mapped in CinemaDB. One theatre's screens can belong to different SACs. */
  sacId: string | null;
}

export interface Theatre {
  id: string;
  exhibitorId: string;
  name: string;
  brand: string; // PVR ICON, INOX Insignia, ...
  city: string;
  state: string;
  country: string;
  category: TheatreCategory;
  /** Active = bookable; Inactive = temporarily not selling (renovation, dispute); Closed = shut, kept for history. */
  status: TheatreStatus;
  screens: Screen[];
  /** Daily operating hours for DOOH, Mon..Sun. */
  hours: { open: string; close: string }[];
  updatedAt: ISODateTime;
  updatedBy: string;
}

export type TheatreStatus = 'active' | 'inactive' | 'closed';

export const DOOH_TYPES = [
  'Lobby', 'Foyer', 'Box Office / Ticketing', 'Concessions', 'Corridor / Circulation',
  'Auditorium Entrance', 'Auditorium', 'F&B', 'Restroom', 'Other'
] as const;
export type DoohType = (typeof DOOH_TYPES)[number];

export type DoohOrientation = 'Horizontal' | 'Vertical' | 'Full Container';
export type DoohScreenMode = 'Independent Screens' | 'Synchronized Screens' | 'Single Canvas';
export type DoohLoopMode = 'Scheduled' | 'Synchronized with Screen' | 'Free Duration';

export interface DoohGroup {
  id: string;
  theatreId: string;
  type: DoohType;
  name: string;
  screens: number;
  orientation: DoohOrientation;
  mode: DoohScreenMode;
  loop: DoohLoopMode;
  loopSecs: number | null;
  /** The SAC that sells this display group, as mapped in CinemaDB. */
  sacId: string | null;
}

export type DeviceKind = 'cinema-server' | 'dooh-player';
export interface Device {
  id: string;
  theatreId: string;
  screenId: string | null;
  doohGroupId: string | null;
  kind: DeviceKind;
  model: string;
  serial: string;
  lastSeenAt: ISODateTime;
  lastLogAt: ISODateTime | null;
}

// ---------- advertiser company ----------

export type KycStatus = 'draft' | 'pending' | 'approved' | 'rejected';
export type KycDocKind = 'GST certificate' | 'PAN card' | 'Certificate of incorporation' | 'Authorised signatory ID';
export interface KycDoc {
  kind: KycDocKind;
  fileName: string | null;
  uploadedAt: ISODateTime | null;
  status: 'missing' | 'uploaded' | 'verified' | 'rejected';
  note?: string;
}

export interface Contact {
  id: string;
  role: 'Primary' | 'Billing' | 'Creative' | 'Other';
  name: string;
  email: string;
  phone: string;
}

/** Card/Prepaid pays at checkout. Contracted is invoiced by the SAC against a contract. */
export type BillingType = 'card' | 'contracted';

export interface Contract {
  ref: string;
  creditLimit: number;
  paymentTermsDays: number;
  validUntil: ISODate;
}

export type InventoryAccess =
  | { mode: 'full' }
  | { mode: 'restricted'; exhibitorIds: string[]; theatreIds: string[] };

export interface Company {
  id: string;
  sacId: string;
  code: string; // ADV-10428
  name: string;
  gstin: string;
  pan: string;
  address: string;
  kycStatus: KycStatus;
  kycDocs: KycDoc[];
  kycSubmittedAt: ISODateTime | null;
  kycReviewedAt: ISODateTime | null;
  kycNote: string | null;
  /** Set by the SAC when it approves KYC. Null until then. */
  billingType: BillingType | null;
  contract: Contract | null;
  inventoryAccess: InventoryAccess;
  contacts: Contact[];
  createdAt: ISODateTime;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Brand {
  id: string;
  companyId: string;
  name: string;
  category: string;
  status: ApprovalStatus;
  requestedAt: ISODateTime;
  reviewedAt: ISODateTime | null;
  note: string | null;
}

// ---------- planning ----------

export type Channel = 'cinema' | 'dooh';

export interface TargetGroup {
  id: string;
  companyId: string;
  name: string;
  channel: Channel;
  geo: {
    countries: string[];
    states: string[];
    cities: string[];
    theatreIds: string[];
    screenIds: string[];
    theatreCategories: TheatreCategory[];
    screenCategories: ScreenCategory[];
    formats: ScreenFormat[];
  };
  /** Cinema only. */
  interest: { genres: string[]; ratings: string[]; languages: string[] };
  /** Cinema only. */
  advanced: { movies: string[]; actors: string[] };
  /** DOOH only: which display types to reach. */
  doohTypes: DoohType[];
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export type MediaFileType = 'CPL' | 'Video' | 'Image';
export const CPL_ATTRIBUTES = ['2D', '2K', '4K', 'Flat', 'Scope', 'Full Container', '5.1', '7.1', 'Atmos'] as const;
export type CplAttribute = (typeof CPL_ATTRIBUTES)[number];
export type MediaStatus = 'processing' | 'ready' | 'rejected';

export interface Media {
  id: string;
  companyId: string;
  brandId: string;
  name: string;
  fileType: MediaFileType;
  fileName: string;
  sizeBytes: number;
  durationSecs: number; // 0 for still images
  languages: string[];
  /** CPL only. */
  censorCertificate: { fileName: string; number: string; rating: 'U' | 'UA' | 'A' } | null;
  /** CPL only. */
  attributes: CplAttribute[];
  /** Video / Image only. Placement eligibility by orientation is an open question; not enforced. */
  orientation: 'Horizontal' | 'Vertical' | null;
  status: MediaStatus;
  rejectionReason: string | null;
  createdAt: ISODateTime;
  createdBy: string;
}

export type CampaignType = 'Private' | 'Government' | 'Social';

export type CampaignStatus =
  | 'draft'
  | 'pending_approval'
  | 'scheduled'
  | 'active'
  | 'paused'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export interface Payment {
  method: 'card' | 'upi' | 'netbanking';
  amount: number; // incl. GST
  gst: number;
  gatewayRef: string;
  paidAt: ISODateTime;
  refundedAt: ISODateTime | null;
}

export interface Campaign {
  id: string;
  code: string; // CMP-2026-0184
  companyId: string;
  sacId: string;
  brandId: string;
  name: string;
  type: CampaignType;
  channels: Channel[];
  start: ISODate;
  end: ISODate;
  budget: number;
  targetGroupIds: string[];
  mediaIds: string[];
  status: CampaignStatus;
  /** Billing type is copied from the company at submission so later changes don't rewrite history. */
  billingType: BillingType | null;
  payment: Payment | null;
  review: { by: string; at: ISODateTime; note: string | null } | null;
  createdAt: ISODateTime;
  createdBy: string;
  submittedAt: ISODateTime | null;
}

export type PlacementStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'cancelled' | 'completed';
export type CinemaPack = 'Pre-show' | 'Intermission';
export const CINEMA_SPOTS = ['Spot A', 'Spot B', 'Spot C', 'Spot D', 'Spot E', 'Spot F', 'Spot G', 'Spot H', 'Normal'] as const;
export type CinemaSpot = (typeof CINEMA_SPOTS)[number];
export type TimeBand = 'All day' | 'Morning' | 'Afternoon' | 'Evening' | 'Night';

export type PlacementPosition =
  | { channel: 'cinema'; pack: CinemaPack; segment: number; spot: CinemaSpot; unavailableAction: 'next-available' | 'skip' }
  | { channel: 'dooh'; spotsPerHour: number };

export interface Placement {
  id: string;
  code: string; // PL-4801
  campaignId: string;
  mediaId: string;
  targetGroupId: string;
  from: ISODate;
  to: ISODate;
  timeBand: TimeBand;
  position: PlacementPosition;
  status: PlacementStatus;
  /** Snapshot of reach and price at booking. */
  screens: number;
  plannedPlays: number;
  cost: number;
  createdAt: ISODateTime;
}

/** Daily roll-up of theatre play logs per placement and screen. */
export interface DeliveryRecord {
  placementId: string;
  campaignId: string;
  date: ISODate;
  theatreId: string;
  screenId: string | null;
  doohGroupId: string | null;
  planned: number;
  played: number;
  failed: number;
}

export interface Invoice {
  id: string;
  number: string;
  sacId: string;
  companyId: string;
  campaignId: string;
  amount: number;
  gst: number;
  issuedAt: ISODateTime;
  status: 'paid' | 'due' | 'overdue' | 'refunded';
}

export interface AuditEvent {
  id: string;
  at: ISODateTime;
  actorId: string;
  actorName: string;
  portal: Portal;
  action: string;
  entity: string;
  entityId: string;
  detail: string;
  /** Set when the action was taken by Qube support while impersonating. */
  impersonatedBy: string | null;
}

/** Play-log ingestion health per theatre, computed from device check-ins. */
export interface IngestionStatus {
  theatreId: string;
  devices: number;
  online: number;
  stale: number;
  offline: number;
  lastLogAt: ISODateTime | null;
  logsLast24h: number;
}
