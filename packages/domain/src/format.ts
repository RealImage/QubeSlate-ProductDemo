import type { CampaignStatus, PlacementStatus, Role } from './types';

/** ₹12,34,567 (Indian digit grouping). */
export function inr(n: number): string {
  const neg = n < 0;
  const s = Math.round(Math.abs(n)).toString();
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  return (neg ? '-' : '') + '₹' + (rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3 : last3);
}

/** ₹48.5L / ₹1.2Cr */
export function inrShort(n: number): string {
  if (Math.abs(n) >= 1e7) return '₹' + (n / 1e7).toFixed(1).replace(/\.0$/, '') + 'Cr';
  if (Math.abs(n) >= 1e5) return '₹' + (n / 1e5).toFixed(1).replace(/\.0$/, '') + 'L';
  return inr(n);
}

export function num(n: number): string {
  return n.toLocaleString('en-IN');
}

export const TZ = 'Asia/Kolkata';

export function date(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d.length === 10 ? d + 'T00:00:00' : d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: TZ });
}

export function dateShort(d: string): string {
  return new Date(d.length === 10 ? d + 'T00:00:00' : d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: TZ });
}

export function dateTime(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ });
}

export function flight(start: string, end: string): string {
  if (!start || !end) return 'Not scheduled';
  return `${dateShort(start)} – ${date(end)}`;
}

export function duration(secs: number): string {
  if (!secs) return '—';
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

export function bytes(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + ' GB';
  if (n >= 1e6) return Math.round(n / 1e6) + ' MB';
  return Math.round(n / 1e3) + ' KB';
}

export function pct(r: number): string {
  return Math.round(r * 100) + '%';
}

type Tone = 'positive' | 'notice' | 'negative' | 'primary-secondary' | 'secondary' | 'default';

export const CAMPAIGN_STATUS: Record<CampaignStatus, { label: string; tone: Tone }> = {
  draft: { label: 'Draft', tone: 'secondary' },
  pending_approval: { label: 'Pending approval', tone: 'notice' },
  scheduled: { label: 'Scheduled', tone: 'primary-secondary' },
  active: { label: 'Active', tone: 'positive' },
  paused: { label: 'Paused', tone: 'notice' },
  completed: { label: 'Completed', tone: 'secondary' },
  rejected: { label: 'Rejected', tone: 'negative' },
  cancelled: { label: 'Cancelled', tone: 'negative' }
};

export const PLACEMENT_STATUS: Record<PlacementStatus, { label: string; tone: Tone }> = {
  draft: { label: 'Draft', tone: 'secondary' },
  scheduled: { label: 'Scheduled', tone: 'primary-secondary' },
  active: { label: 'Active', tone: 'positive' },
  paused: { label: 'Paused', tone: 'notice' },
  cancelled: { label: 'Cancelled', tone: 'negative' },
  completed: { label: 'Completed', tone: 'secondary' }
};

export const APPROVAL_TONE: Record<string, Tone> = { pending: 'notice', approved: 'positive', rejected: 'negative', draft: 'secondary' };

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin',
  planner: 'Planner',
  viewer: 'Viewer',
  sac_admin: 'SAC Admin',
  ad_ops: 'Ad Ops',
  finance: 'Finance',
  qube_admin: 'Qube Admin',
  qube_support: 'Qube Support'
};

export const ROLE_HINT: Partial<Record<Role, string>> = {
  admin: 'Full access — company details, KYC, billing, users, and campaign checkout.',
  planner: 'Build target groups, upload media and plan campaigns. Cannot pay or manage users.',
  viewer: 'Read-only access to campaigns, delivery and reports.',
  sac_admin: 'Everything in the SAC portal, including users and settings.',
  ad_ops: 'Approvals, inventory, content and playlists.',
  finance: 'Advertiser billing types, contracts and invoices.',
  qube_admin: 'Tenant onboarding, network, gateways and oversight.',
  qube_support: 'Read-only oversight with audited impersonation.'
};

export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]!.toUpperCase()).join('');
}
