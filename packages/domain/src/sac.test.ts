import { describe, expect, it } from 'vitest';
import {
  addGateway, checkoutGateway, cleanTaxIds, contrastText, gatewayError, isHexColour, isValidSacHost, rampScreenHistory, removeGateway,
  sacSubdomain, sacUrlError, screenHistoryGrid, setDefaultGateway, stampGatewayDates, taxIdsError
} from './index';
import type { PaymentGateway } from './types';

const gw = (id: string, over: Partial<PaymentGateway> = {}): PaymentGateway => ({
  id, provider: 'razorpay', mode: 'test', merchantId: 'm', keyHint: '••••1234', enabled: true, isDefault: false, enabledOn: null, activatedOn: null, updatedAt: '2026-01-01T00:00:00Z', ...over
});
const defaults = (list: PaymentGateway[]) => list.filter(g => g.isDefault).map(g => g.id);

describe('default gateway invariant', () => {
  it('makes the first gateway the default and never moves it on later adds', () => {
    let list = addGateway([], gw('a', { isDefault: true }));
    expect(defaults(list)).toEqual(['a']);
    list = addGateway(list, gw('b', { isDefault: true }));
    expect(defaults(list)).toEqual(['a']);
  });

  it('keeps exactly one default when it is changed', () => {
    const list = setDefaultGateway(addGateway(addGateway([], gw('a')), gw('b')), 'b');
    expect(defaults(list)).toEqual(['b']);
  });

  it('promotes another gateway when the default is deleted, and leaves none when the last goes', () => {
    const list = addGateway(addGateway([], gw('a')), gw('b'));
    expect(defaults(removeGateway(list, 'a'))).toEqual(['b']);
    expect(defaults(removeGateway(list, 'b'))).toEqual(['a']);
    expect(removeGateway(removeGateway(list, 'a'), 'b')).toEqual([]);
  });

  it('only checks out through an enabled default', () => {
    expect(checkoutGateway([])).toBeNull();
    expect(checkoutGateway(addGateway([], gw('a', { enabled: false })))).toBeNull();
    expect(checkoutGateway(addGateway([], gw('a')))?.id).toBe('a');
  });
});

describe('gateway save rules', () => {
  const base = { provider: 'razorpay' as const, mode: 'test' as const, merchantId: 'm1', enabled: true };
  it('needs a merchant ID and a key to enable a real gateway', () => {
    expect(gatewayError({ ...base, merchantId: ' ' }, null, 'k')).toMatch(/Merchant ID/);
    expect(gatewayError(base, null, null)).toMatch(/secret key/);
    expect(gatewayError(base, null, 'sk_test_1')).toBeNull();
  });
  it('keeps a stored key for the same provider only', () => {
    const prev = { provider: 'razorpay' as const, mode: 'test' as const, keyHint: '••••1234' };
    expect(gatewayError(base, prev, null)).toBeNull();
    expect(gatewayError({ ...base, provider: 'payu' }, prev, null)).toMatch(/secret key/);
  });
  it('needs fresh keys to go live, except for the stub, which cannot run live', () => {
    const prev = { provider: 'razorpay' as const, mode: 'test' as const, keyHint: '••••1234' };
    expect(gatewayError({ ...base, mode: 'live' }, prev, null)).toMatch(/live keys/);
    expect(gatewayError({ ...base, mode: 'live' }, prev, 'rzp_live_x')).toBeNull();
    expect(gatewayError({ provider: 'stub', mode: 'test', merchantId: '', enabled: true }, null, null)).toBeNull();
    expect(gatewayError({ provider: 'stub', mode: 'live', merchantId: '', enabled: true }, null, null)).toMatch(/stub/);
  });
  it('stamps enabled and activated dates', () => {
    const t1 = '2026-02-01T00:00:00Z';
    const t2 = '2026-03-01T00:00:00Z';
    const first = stampGatewayDates(null, { ...base, enabled: true, mode: 'test' }, t1);
    expect(first).toEqual({ enabledOn: t1, activatedOn: null });
    const live = stampGatewayDates({ enabled: true, ...first }, { ...base, mode: 'live' }, t2);
    expect(live).toEqual({ enabledOn: t1, activatedOn: t2 });
    expect(stampGatewayDates({ enabled: true, ...live }, { ...base, enabled: false, mode: 'live' }, '2026-04-01T00:00:00Z')).toEqual(live);
  });
});

describe('SAC setup validation', () => {
  it('validates #RRGGBB colours', () => {
    expect(isHexColour('#084782')).toBe(true);
    expect(isHexColour('084782')).toBe(false);
    expect(isHexColour('#08478')).toBe(false);
    expect(isHexColour('#GGGGGG')).toBe(false);
  });
  it('picks readable text for a header colour', () => {
    expect(contrastText('#084782')).toBe('#ffffff');
    expect(contrastText('#ffd400')).toBe('#000000');
  });
  it('validates SAC hosts and derives the subdomain', () => {
    expect(isValidSacHost('qcn.slate.com')).toBe(true);
    for (const bad of ['qcn', 'qcn.slate.com/path', 'qcn.slate.com:8080', '-a.slate.com', 'a_b.slate.com', 'a.b.c1']) expect(isValidSacHost(bad)).toBe(false);
    expect(sacSubdomain('QCN.slate.com')).toBe('qcn');
    expect(sacSubdomain('https://pvr-media.slate.com/')).toBe('pvr-media');
  });
  it('requires a unique identifier', () => {
    const others = [{ url: 'qcn.slate.com' }];
    expect(sacUrlError('', others)).toMatch(/required/);
    expect(sacUrlError('nope', others)).toMatch(/Enter a host/);
    expect(sacUrlError('qcn.other.com', others)).toMatch(/already used/);
    expect(sacUrlError('new.slate.com', others)).toBeNull();
  });
  it('drops blank tax ID rows and rejects half-filled ones', () => {
    expect(cleanTaxIds([{ name: ' ', value: '' }, { name: 'GSTIN', value: ' 06X ' }])).toEqual([{ name: 'GSTIN', value: '06X' }]);
    expect(taxIdsError([{ name: 'GSTIN', value: '' }])).toMatch(/both/);
    expect(taxIdsError([{ name: '', value: '' }])).toBeNull();
  });
});

describe('active screens history', () => {
  const NOW = '2026-10-29T10:00:00Z';
  it('ramps from the creation month up to the current count', () => {
    const h = rampScreenHistory('2025-11-15T00:00:00Z', 200, NOW);
    expect(Object.keys(h)[0]).toBe('2025-11');
    expect(h['2026-10']).toBe(200);
    expect(h['2025-11']).toBeLessThan(h['2026-10']!);
    expect(Object.keys(h)).toHaveLength(12);
    expect(rampScreenHistory('2026-11-01T00:00:00Z', 5, NOW)).toEqual({});
    expect(rampScreenHistory('2026-01-01T00:00:00Z', 0, NOW)).toEqual({});
  });
  it('buckets 3 years, current first, blanking months before creation and in the future', () => {
    const history = rampScreenHistory('2025-11-15T00:00:00Z', 200, NOW);
    const grid = screenHistoryGrid(history, '2025-11-15T00:00:00Z', NOW);
    expect(grid.years).toEqual([2026, 2025, 2024]);
    expect(grid.rows).toHaveLength(12);
    const jan = grid.rows[0]!.values;
    expect(jan[0]).toBe(history['2026-01']);
    expect(jan[1]).toBeNull(); // Jan 2025 predates the SAC
    expect(jan[2]).toBeNull();
    expect(grid.rows[9]!.values[0]).toBe(200); // Oct 2026
    expect(grid.rows[10]!.values[0]).toBeNull(); // Nov 2026 is in the future
    expect(grid.rows[10]!.values[1]).toBe(history['2025-11']);
  });
});
