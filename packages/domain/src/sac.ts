import type { BillingCurrency, BillingFrequency, BillingMethod, ISODateTime, PaymentGateway, Sac, SacBranding, SacContact, SacContactRole, TaxId } from './types';

// ---------- defaults ----------

/** The main blue fill of the Slate logo (packages/ui/assets/QubeSlate.svg). */
export const SLATE_BLUE = '#084782';
/** Qube Wire --grey-600. */
export const SLATE_GREY = '#526273';
export const DEFAULT_SUPPORT_EMAIL = 'support@qubeslate.com';

export const defaultBranding = (): SacBranding => ({ headerColor: SLATE_BLUE, primaryColor: SLATE_BLUE, secondaryColor: SLATE_GREY, logo: null });

export const CONTACT_ROLES: { role: SacContactRole; label: string }[] = [
  { role: 'operations_manager', label: 'SAC Operations Manager' },
  { role: 'billing_manager', label: 'SAC Billing Manager' },
  { role: 'account_manager', label: 'Qube Account Manager' }
];
export const emptyContacts = (): Record<SacContactRole, SacContact[]> => ({ operations_manager: [], billing_manager: [], account_manager: [] });

export const BILLING_METHODS: { value: BillingMethod; label: string }[] = [
  { value: 'per_screen_month', label: 'Per screen per month' },
  { value: 'per_screen_year', label: 'Per screen per year' },
  { value: 'flat_monthly', label: 'Flat monthly rate' },
  { value: 'flat_annual', label: 'Flat annual rate' }
];
export const BILLING_FREQUENCIES: { value: BillingFrequency; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'half_yearly', label: 'Half-yearly' },
  { value: 'annually', label: 'Annually' }
];
export const BILLING_CURRENCIES: BillingCurrency[] = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'IDR'];

/** Read views show `--` for any blank value. */
export const orDash = (v: string | number | null | undefined): string => (v === null || v === undefined || String(v).trim() === '' ? '--' : String(v));

// ---------- validation ----------

export const isEmail = (v: string) => /^\S+@\S+\.\S+$/.test(v.trim());

export const HEX_COLOUR = /^#[0-9a-fA-F]{6}$/;
export const isHexColour = (v: string) => HEX_COLOUR.test(v);

/** WCAG relative luminance of a #RRGGBB colour. */
function luminance(hex: string): number {
  const lin = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(1) + 0.7152 * lin(3) + 0.0722 * lin(5);
}

/** Black or white, whichever reads better on the given #RRGGBB background (WCAG contrast ratio). */
export function contrastText(hex: string): '#000000' | '#ffffff' {
  if (!isHexColour(hex)) return '#ffffff';
  const l = luminance(hex);
  // Contrast against white is 1.05 / (l + 0.05); against black (l + 0.05) / 0.05.
  return 1.05 / (l + 0.05) >= (l + 0.05) / 0.05 ? '#ffffff' : '#000000';
}

/** WCAG contrast ratio of a #RRGGBB colour against white. */
export const contrastOnWhite = (hex: string) => 1.05 / (luminance(hex) + 0.05);

/**
 * The portals use the primary colour as text and borders on white and as a fill behind white text,
 * so it must reach the WCAG 4.5:1 text contrast against white.
 */
export function primaryColourError(hex: string): string | null {
  if (!isHexColour(hex)) return 'Use a #RRGGBB hex value.';
  return contrastOnWhite(hex) < 4.5 ? 'Too light: buttons and links need a darker colour (4.5:1 contrast with white).' : null;
}

export const LOGO_TYPES = ['image/png', 'image/svg+xml', 'image/jpeg'];
export const LOGO_MAX_BYTES = 200 * 1024;

/** Lower-cases and strips a pasted scheme or trailing slash: `https://QCN.slate.com/` becomes `qcn.slate.com`. */
export const normaliseSacHost = (v: string) => v.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '');

const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
/** A bare host with at least two labels and an alphabetic TLD: no scheme, port or path. */
export function isValidSacHost(host: string): boolean {
  const labels = host.split('.');
  return host.length <= 253 && labels.length >= 2 && labels.every(l => LABEL.test(l)) && /^[a-z]{2,}$/.test(labels[labels.length - 1]!);
}

/** The SAC's identifier: first label of its URL (`qcn` for `qcn.slate.com`). */
export const sacSubdomain = (url: string) => normaliseSacHost(url).split('.')[0] ?? '';

/** Returns an error message, or null when the URL is usable and no other SAC already holds that subdomain. */
export function sacUrlError(url: string, others: Pick<Sac, 'url'>[]): string | null {
  const host = normaliseSacHost(url);
  if (!host) return 'SAC URL is required.';
  if (!isValidSacHost(host)) return 'Enter a host such as qcn.slate.com (letters, numbers and hyphens; no path or port).';
  if (others.some(o => sacSubdomain(o.url) === sacSubdomain(host))) return `The identifier “${sacSubdomain(host)}” is already used by another SAC.`;
  return null;
}

/** Name–value pairs: blank rows are dropped, half-filled rows are an error. */
export const cleanTaxIds = (rows: TaxId[]): TaxId[] =>
  rows.map(r => ({ name: r.name.trim(), value: r.value.trim() })).filter(r => r.name || r.value);
export const taxIdsError = (rows: TaxId[]): string | null =>
  cleanTaxIds(rows).some(r => !r.name || !r.value) ? 'Each tax ID needs both a name and a value.' : null;

export const cleanContacts = (rows: SacContact[]): SacContact[] =>
  rows.map(r => ({ name: r.name.trim(), email: r.email.trim(), phone: r.phone.trim() })).filter(r => r.name || r.email || r.phone);
export const contactError = (c: SacContact): string | null =>
  !c.name.trim() ? 'Name is required.' : !isEmail(c.email) ? 'Enter a valid email address.' : null;

// ---------- payment gateways ----------

export interface GatewayDraft {
  provider: PaymentGateway['provider'];
  mode: PaymentGateway['mode'];
  merchantId: string;
  enabled: boolean;
}

/**
 * Rules for saving a gateway. `prev` is the stored gateway being edited (null when adding);
 * `secretKey` is only present when a key is being entered.
 */
export function gatewayError(next: GatewayDraft, prev: Pick<PaymentGateway, 'provider' | 'mode' | 'keyHint'> | null, secretKey: string | null): string | null {
  if (next.enabled && next.provider === 'stub' && next.mode === 'live') return 'The stub gateway cannot run in live mode.';
  if (next.enabled && next.provider !== 'stub' && !next.merchantId.trim()) return 'Merchant ID is required to enable the gateway.';
  // A stored key belongs to its provider; switching provider without a new key leaves none.
  const hasKey = !!secretKey || (!!prev?.keyHint && prev.provider === next.provider);
  if (next.enabled && next.provider !== 'stub' && !hasKey) return 'A secret key is required to enable this gateway.';
  if (next.provider !== 'stub' && next.mode === 'live' && prev?.mode !== 'live' && !secretKey) return 'Enter live keys when switching to live mode.';
  return null;
}

export const defaultGateway = (gateways: PaymentGateway[]) => gateways.find(g => g.isDefault) ?? null;

/** The gateway advertisers pay through: the default one, and only when enabled. */
export const checkoutGateway = (gateways: PaymentGateway[]) => {
  const g = defaultGateway(gateways);
  return g?.enabled ? g : null;
};

/** Adds a gateway; the first one becomes the default, later ones never steal it. */
export const addGateway = (gateways: PaymentGateway[], g: PaymentGateway): PaymentGateway[] =>
  [...gateways, { ...g, isDefault: gateways.length === 0 }];

export const setDefaultGateway = (gateways: PaymentGateway[], id: string): PaymentGateway[] =>
  gateways.map(g => ({ ...g, isDefault: g.id === id }));

/** Removes a gateway; deleting the default promotes the first remaining one (or leaves none). */
export function removeGateway(gateways: PaymentGateway[], id: string): PaymentGateway[] {
  const gone = gateways.find(g => g.id === id);
  const rest = gateways.filter(g => g.id !== id);
  if (gone?.isDefault && rest.length) return rest.map((g, i) => ({ ...g, isDefault: i === 0 }));
  return rest;
}

/** Stamps the dates a gateway changes state: `enabledOn` on each switch-on, `activatedOn` the first time it runs live. */
export function stampGatewayDates(prev: Pick<PaymentGateway, 'enabled' | 'enabledOn' | 'activatedOn'> | null, next: GatewayDraft, at: ISODateTime) {
  const enabledOn = next.enabled ? (prev?.enabled ? prev.enabledOn ?? at : at) : prev?.enabledOn ?? null;
  const activatedOn = prev?.activatedOn ?? (next.enabled && next.mode === 'live' ? at : null);
  return { enabledOn, activatedOn };
}

// ---------- active screens history ----------

/** `YYYY-MM` -> active mapped screens at that month's close. */
export type ScreenHistory = Record<string, number>;

export const monthKey = (iso: string) => iso.slice(0, 7);

export interface ScreenHistoryGrid {
  /** Newest first: current year, then the two before it. */
  years: number[];
  /** One row per calendar month (1 = Jan); a null cell is a month before the SAC existed, in the future, or without data. */
  rows: { month: number; values: (number | null)[] }[];
}

/** Buckets monthly counts into a Jan..Dec by year table covering the last 3 calendar years. */
export function screenHistoryGrid(history: ScreenHistory, createdAt: ISODateTime, now: ISODateTime, yearCount = 3): ScreenHistoryGrid {
  const thisYear = Number(now.slice(0, 4));
  const years = Array.from({ length: yearCount }, (_, i) => thisYear - i);
  const first = monthKey(createdAt);
  const last = monthKey(now);
  return {
    years,
    rows: Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      values: years.map(y => {
        const key = `${y}-${String(i + 1).padStart(2, '0')}`;
        return key < first || key > last ? null : history[key] ?? null;
      })
    }))
  };
}

/** Plausible ramp from a SAC's first month towards its current count; the last month equals `current`. */
export function rampScreenHistory(createdAt: ISODateTime, current: number, now: ISODateTime): ScreenHistory {
  const out: ScreenHistory = {};
  const [y0, m0] = [Number(createdAt.slice(0, 4)), Number(createdAt.slice(5, 7))];
  const [y1, m1] = [Number(now.slice(0, 4)), Number(now.slice(5, 7))];
  const span = (y1 - y0) * 12 + (m1 - m0);
  if (span < 0 || current <= 0) return out;
  for (let i = 0; i <= span; i++) {
    const idx = y0 * 12 + (m0 - 1) + i;
    const key = `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, '0')}`;
    const progress = span === 0 ? 1 : i / span;
    const wobble = 1 + 0.015 * Math.sin(i * 1.7);
    out[key] = i === span ? current : Math.max(1, Math.round(current * (0.3 + 0.7 * progress) * wobble));
  }
  return out;
}
