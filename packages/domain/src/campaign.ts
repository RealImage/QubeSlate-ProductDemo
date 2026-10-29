import { withGst } from './pricing';
import type { Campaign, CampaignStatus, Company, Media, Placement } from './types';

export interface ChecklistItem {
  key: 'named' | 'targets' | 'media' | 'placements' | 'fit' | 'kyc' | 'credit';
  label: string;
  done: boolean;
}

/** "Before checkout" list in the wizard's summary rail. Every item must be done to submit. */
export function checkoutChecklist(input: {
  campaign: Pick<Campaign, 'name' | 'start' | 'end' | 'targetGroupIds' | 'mediaIds' | 'channels'>;
  media: Pick<Media, 'id' | 'fileType' | 'status'>[];
  placements: Pick<Placement, 'cost'>[];
  company: Pick<Company, 'kycStatus' | 'billingType' | 'contract'>;
  /** Outstanding (booked, unbilled or unpaid) amount for contracted advertisers. */
  outstanding?: number;
}): ChecklistItem[] {
  const { campaign, media, placements, company } = input;
  const attached = media.filter(m => campaign.mediaIds.includes(m.id) && m.status === 'ready');
  const needsCpl = campaign.channels.includes('cinema');
  const items: ChecklistItem[] = [
    { key: 'named', label: 'Campaign named and dated', done: !!campaign.name.trim() && !!campaign.start && !!campaign.end && campaign.start <= campaign.end },
    { key: 'targets', label: 'At least one target group', done: campaign.targetGroupIds.length > 0 },
    {
      key: 'media',
      label: needsCpl ? 'At least one CPL media' : 'At least one ready media',
      done: needsCpl ? attached.some(m => m.fileType === 'CPL') : attached.length > 0
    },
    { key: 'placements', label: 'At least one placement', done: placements.length > 0 },
    { key: 'kyc', label: 'Company KYC approved', done: company.kycStatus === 'approved' }
  ];
  if (company.billingType === 'contracted') {
    const total = withGst(placements.reduce((s, p) => s + p.cost, 0)).total;
    items.push({ key: 'credit', label: 'Within contract credit limit', done: hasCredit(company, input.outstanding ?? 0, total) });
  }
  return items;
}

export function hasCredit(company: Pick<Company, 'contract'>, outstanding: number, amount: number): boolean {
  if (!company.contract) return false;
  return outstanding + amount <= company.contract.creditLimit;
}

export class CampaignRuleError extends Error {}

/**
 * Submission paths:
 *  - Card / prepaid: pay at checkout -> pending_approval. A SAC rejection refunds the payment.
 *  - Contracted: submit -> pending_approval. Invoiced by the SAC against the contract.
 */
export function submissionPath(company: Pick<Company, 'billingType' | 'kycStatus'>): 'pay' | 'submit' {
  if (company.kycStatus !== 'approved' || !company.billingType) {
    throw new CampaignRuleError('Checkout is locked until your company KYC is approved by your sales house.');
  }
  return company.billingType === 'card' ? 'pay' : 'submit';
}

export function assertSubmittable(items: ChecklistItem[]) {
  const missing = items.filter(i => !i.done);
  if (missing.length) throw new CampaignRuleError('Not ready to submit: ' + missing.map(i => i.label).join(', ') + '.');
}

export type CampaignDecision = 'approve' | 'reject';

export function decide(campaign: Pick<Campaign, 'status' | 'billingType' | 'payment'>, decision: CampaignDecision): {
  status: CampaignStatus;
  refund: boolean;
} {
  if (campaign.status !== 'pending_approval') {
    throw new CampaignRuleError(`Only campaigns pending approval can be ${decision}d.`);
  }
  if (decision === 'approve') return { status: 'scheduled', refund: false };
  return { status: 'rejected', refund: campaign.billingType === 'card' && !!campaign.payment && !campaign.payment.refundedAt };
}

/** Campaign status follows its placements once approved. */
export function rollupStatus(current: CampaignStatus, placements: Pick<Placement, 'status'>[]): CampaignStatus {
  if (!['scheduled', 'active', 'paused', 'completed'].includes(current)) return current;
  const live = placements.filter(p => p.status !== 'cancelled');
  if (!live.length) return 'completed';
  if (live.some(p => p.status === 'active')) return 'active';
  if (live.some(p => p.status === 'scheduled')) return 'scheduled';
  if (live.some(p => p.status === 'paused')) return 'paused';
  return 'completed';
}

export function isEditable(status: CampaignStatus): boolean {
  return status === 'draft';
}

/** Suggested campaign name from brand + flight, e.g. "Tanishq · Sep–Oct 2026". */
export function suggestCampaignName(brand: string, start: string, end: string): string {
  if (!brand) return '';
  const fmt = (d: string, year: boolean) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short', ...(year ? { year: 'numeric' } : {}) });
  if (!start) return brand;
  const s = fmt(start, false);
  const e = end ? fmt(end, true) : '';
  return e && !e.startsWith(s) ? `${brand} · ${s}–${e}` : `${brand} · ${fmt(start, true)}`;
}

export const CAMPAIGN_TYPES = [
  { value: 'Private', hint: 'Standard commercial rate card.' },
  { value: 'Government', hint: 'DAVP / government rate card and statutory treatment.' },
  { value: 'Social', hint: 'Public-service messaging at the social rate card.' }
] as const;
