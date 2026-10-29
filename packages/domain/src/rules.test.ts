import { describe, expect, it } from 'vitest';
import {
  applyPlacementAction, checkoutChecklist, decide, hasCredit, inr, inrShort, placementActions, quotePlacement,
  resolveReach, rollupStatus, statusOnApproval, submissionPath, suggestCampaignName, TransitionError, validateDoohGroup,
  visibleTheatres, withGst, crossesMidnight, summarizeDelivery
} from './index';
import type { Company, TargetGroup, Theatre } from './types';

const TODAY = '2026-09-10';

describe('placement lifecycle', () => {
  it('only allows pause on active and resume on paused', () => {
    expect(placementActions({ status: 'active', from: '2026-09-01' }, TODAY)).toEqual(['pause']);
    expect(placementActions({ status: 'paused', from: '2026-09-01' }, TODAY)).toEqual(['resume']);
    expect(applyPlacementAction({ status: 'active', from: '2026-09-01' }, 'pause', TODAY)).toBe('paused');
    expect(applyPlacementAction({ status: 'paused', from: '2026-09-01' }, 'resume', TODAY)).toBe('active');
  });

  it('allows cancel and delete only before a scheduled placement starts', () => {
    expect(placementActions({ status: 'scheduled', from: '2026-09-20' }, TODAY)).toEqual(['cancel', 'delete']);
    expect(applyPlacementAction({ status: 'scheduled', from: '2026-09-20' }, 'cancel', TODAY)).toBe('cancelled');
    expect(applyPlacementAction({ status: 'scheduled', from: '2026-09-20' }, 'delete', TODAY)).toBeNull();
    expect(placementActions({ status: 'scheduled', from: '2026-09-10' }, TODAY)).toEqual([]);
    expect(() => applyPlacementAction({ status: 'scheduled', from: '2026-09-01' }, 'cancel', TODAY)).toThrow(TransitionError);
  });

  it('rejects actions on terminal placements', () => {
    for (const status of ['completed', 'cancelled'] as const) {
      expect(placementActions({ status, from: '2026-09-20' }, TODAY)).toEqual([]);
      expect(() => applyPlacementAction({ status, from: '2026-09-20' }, 'pause', TODAY)).toThrow(TransitionError);
    }
  });

  it('places approved placements by date', () => {
    expect(statusOnApproval({ from: '2026-09-01', to: '2026-09-30' }, TODAY)).toBe('active');
    expect(statusOnApproval({ from: '2026-09-20', to: '2026-09-30' }, TODAY)).toBe('scheduled');
    expect(statusOnApproval({ from: '2026-08-01', to: '2026-08-30' }, TODAY)).toBe('completed');
  });
});

describe('pricing', () => {
  it('quotes cinema at 3 spots per screen per day, with a premium for Spot A or Segment 1', () => {
    const base = quotePlacement({ screens: 10, from: '2026-09-01', to: '2026-09-10', position: { channel: 'cinema', pack: 'Pre-show', segment: 2, spot: 'Spot D', unavailableAction: 'next-available' } });
    expect(base).toMatchObject({ days: 10, plays: 300, premium: false, cost: 300 * 640 });
    const premium = quotePlacement({ screens: 10, from: '2026-09-01', to: '2026-09-10', position: { channel: 'cinema', pack: 'Pre-show', segment: 2, spot: 'Spot A', unavailableAction: 'next-available' } });
    expect(premium.premium).toBe(true);
    expect(premium.cost).toBe(Math.round(300 * 640 * 1.35));
  });

  it('quotes DOOH per display group per operating hour', () => {
    const q = quotePlacement({ screens: 2, from: '2026-09-01', to: '2026-09-02', position: { channel: 'dooh', spotsPerHour: 4 } });
    expect(q.plays).toBe(2 * 2 * 14 * 4);
  });

  it('adds 18% GST', () => {
    expect(withGst(100_000)).toEqual({ net: 100_000, gst: 18_000, total: 118_000 });
  });
});

const company = (over: Partial<Company> = {}): Company => ({
  id: 'c1', sacId: 's1', code: 'ADV-1', name: 'Co', gstin: '', pan: '', address: '', kycStatus: 'approved', kycDocs: [],
  kycSubmittedAt: null, kycReviewedAt: null, kycNote: null, billingType: 'card', contract: null,
  inventoryAccess: { mode: 'full' }, contacts: [], createdAt: '2026-01-01T00:00:00Z', ...over
});

describe('checkout', () => {
  const campaign = { name: 'Festive', start: '2026-09-01', end: '2026-09-30', targetGroupIds: ['tg1'], mediaIds: ['m1'], channels: ['cinema' as const] };
  const media = [{ id: 'm1', fileType: 'CPL' as const, status: 'ready' as const }];

  it('requires every checklist item, including approved KYC', () => {
    const items = checkoutChecklist({ campaign, media, placements: [{ cost: 1000 }], company: company({ kycStatus: 'pending' }) });
    expect(items.find(i => i.key === 'kyc')?.done).toBe(false);
    expect(items.filter(i => i.key !== 'kyc').every(i => i.done)).toBe(true);
  });

  it('requires a ready CPL for cinema campaigns', () => {
    const items = checkoutChecklist({ campaign, media: [{ id: 'm1', fileType: 'Video', status: 'ready' }], placements: [{ cost: 1 }], company: company() });
    expect(items.find(i => i.key === 'media')?.done).toBe(false);
  });

  it('routes card advertisers to pay and contracted advertisers to submit', () => {
    expect(submissionPath(company({ billingType: 'card' }))).toBe('pay');
    expect(submissionPath(company({ billingType: 'contracted' }))).toBe('submit');
    expect(() => submissionPath(company({ kycStatus: 'pending', billingType: null }))).toThrow(/KYC/);
  });

  it('checks contracted advertisers against their credit limit, GST included', () => {
    const c = company({ billingType: 'contracted', contract: { ref: 'K', creditLimit: 1_180_000, paymentTermsDays: 30, validUntil: '2027-03-31' } });
    expect(hasCredit(c, 0, 1_180_000)).toBe(true);
    expect(hasCredit(c, 1, 1_180_000)).toBe(false);
    const items = checkoutChecklist({ campaign, media, placements: [{ cost: 1_000_000 }], company: c, outstanding: 1 });
    expect(items.find(i => i.key === 'credit')?.done).toBe(false);
  });
});

describe('SAC approval', () => {
  it('refunds a paid card campaign on rejection', () => {
    const payment = { method: 'card' as const, amount: 1, gst: 0, gatewayRef: 'x', paidAt: '2026-09-01T00:00:00Z', refundedAt: null };
    expect(decide({ status: 'pending_approval', billingType: 'card', payment }, 'reject')).toEqual({ status: 'rejected', refund: true });
    expect(decide({ status: 'pending_approval', billingType: 'contracted', payment: null }, 'reject')).toEqual({ status: 'rejected', refund: false });
    expect(decide({ status: 'pending_approval', billingType: 'card', payment }, 'approve')).toEqual({ status: 'scheduled', refund: false });
  });

  it('only decides campaigns that are pending approval', () => {
    expect(() => decide({ status: 'draft', billingType: 'card', payment: null }, 'approve')).toThrow();
  });

  it('rolls campaign status up from placements', () => {
    expect(rollupStatus('scheduled', [{ status: 'active' }, { status: 'scheduled' }])).toBe('active');
    expect(rollupStatus('active', [{ status: 'paused' }, { status: 'cancelled' }])).toBe('paused');
    expect(rollupStatus('active', [{ status: 'completed' }])).toBe('completed');
    expect(rollupStatus('pending_approval', [{ status: 'active' }])).toBe('pending_approval');
  });
});

const theatre = (id: string, exhibitorId: string, city: string, formats: string[]): Theatre => ({
  id, exhibitorId, name: id, brand: 'PVR', city, state: 'S', country: 'India', category: 'Premium',
  screens: formats.map((f, i) => ({ id: `${id}-S${i + 1}`, theatreId: id, name: `Audi ${i + 1}`, format: f as never, category: 'Gold', projection: '4K', sound: 'Atmos', seats: 200 })),
  hours: [], updatedAt: '', updatedBy: ''
});

const tg = (over: Partial<TargetGroup> = {}): TargetGroup => ({
  id: 'tg', companyId: 'c1', name: 'TG', channel: 'cinema',
  geo: { countries: [], states: [], cities: [], theatreIds: [], screenIds: [], theatreCategories: [], screenCategories: [], formats: [] },
  interest: { genres: [], ratings: [], languages: [] }, advanced: { movies: [], actors: [] }, doohTypes: [], createdAt: '', updatedAt: '', ...over
});

describe('inventory', () => {
  const theatres = [theatre('T1', 'e1', 'Mumbai', ['IMAX', 'Standard']), theatre('T2', 'e2', 'Pune', ['Standard']), theatre('T3', 'e3', 'Delhi', ['4DX'])];

  it('shows the SAC exhibitors by default and narrows on restricted access', () => {
    const sac = { exhibitorIds: ['e1', 'e2'] };
    expect(visibleTheatres(company(), sac, theatres).map(t => t.id)).toEqual(['T1', 'T2']);
    const restricted = company({ inventoryAccess: { mode: 'restricted', exhibitorIds: [], theatreIds: ['T2'] } });
    expect(visibleTheatres(restricted, sac, theatres).map(t => t.id)).toEqual(['T2']);
  });

  it('resolves geography and formats to screens', () => {
    const r = resolveReach(tg({ geo: { ...tg().geo, cities: ['Mumbai', 'Delhi'], formats: ['IMAX', '4DX'] } }), theatres, []);
    expect(r.screens.map(s => s.id)).toEqual(['T1-S1', 'T3-S1']);
    expect(r.cities).toBe(2);
  });

  it('resolves DOOH groups by display type', () => {
    const dooh = [
      { id: 'd1', theatreId: 'T1', type: 'Lobby' as const, name: 'L', screens: 4, orientation: 'Horizontal' as const, mode: 'Synchronized Screens' as const, loop: 'Scheduled' as const, loopSecs: 60 },
      { id: 'd2', theatreId: 'T1', type: 'Restroom' as const, name: 'R', screens: 2, orientation: 'Vertical' as const, mode: 'Independent Screens' as const, loop: 'Free Duration' as const, loopSecs: null }
    ];
    const r = resolveReach(tg({ channel: 'dooh', doohTypes: ['Lobby'] }), theatres, dooh);
    expect(r.doohGroups.map(d => d.id)).toEqual(['d1']);
    expect(r.units).toBe(1);
  });

  it('validates DOOH groups', () => {
    const siblings = [{ id: 'a', name: 'Main Lobby' }];
    expect(validateDoohGroup({ id: 'b', name: ' main lobby ', screens: 0, loop: 'Scheduled', loopSecs: null }, siblings)).toEqual([
      'Group Name must be unique within the theatre.', 'Screen Count must be at least 1.', 'Loop Duration must be at least 5 seconds.'
    ]);
    expect(crossesMidnight('10:00', '01:30')).toBe(true);
  });
});

describe('format and naming', () => {
  it('formats rupees with Indian grouping', () => {
    expect(inr(4850000)).toBe('₹48,50,000');
    expect(inrShort(4850000)).toBe('₹48.5L');
    expect(inrShort(12_000_000)).toBe('₹1.2Cr');
  });

  it('suggests a campaign name from brand and flight', () => {
    expect(suggestCampaignName('Tanishq', '2026-09-04', '2026-10-22')).toBe('Tanishq · Sept–Oct 2026');
    expect(suggestCampaignName('', '2026-09-04', '2026-10-22')).toBe('');
  });

  it('summarizes delivery', () => {
    expect(summarizeDelivery([{ planned: 100, played: 96, failed: 4 }, { planned: 100, played: 100, failed: 0 }]).rate).toBeCloseTo(0.98);
  });
});
