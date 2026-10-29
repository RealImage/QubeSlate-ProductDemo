import type { DeliveryRecord, IngestionStatus, Device } from './types';

export interface DeliverySummary {
  planned: number;
  played: number;
  failed: number;
  /** Played / planned to date, 0..1. */
  rate: number;
}

export function summarizeDelivery(records: Pick<DeliveryRecord, 'planned' | 'played' | 'failed'>[]): DeliverySummary {
  const planned = records.reduce((s, r) => s + r.planned, 0);
  const played = records.reduce((s, r) => s + r.played, 0);
  const failed = records.reduce((s, r) => s + r.failed, 0);
  return { planned, played, failed, rate: planned ? played / planned : 0 };
}

export function deliveryTone(rate: number): 'positive' | 'notice' | 'negative' {
  if (rate >= 0.95) return 'positive';
  if (rate >= 0.8) return 'notice';
  return 'negative';
}

export function groupBy<T, K extends string>(items: T[], key: (t: T) => K): Record<K, T[]> {
  const out = {} as Record<K, T[]>;
  for (const item of items) (out[key(item)] ||= []).push(item);
  return out;
}

const HOUR = 3_600_000;

export function deviceHealth(d: Pick<Device, 'lastSeenAt'>, now: number): 'online' | 'stale' | 'offline' {
  const age = now - Date.parse(d.lastSeenAt);
  if (age <= HOUR) return 'online';
  if (age <= 24 * HOUR) return 'stale';
  return 'offline';
}

export function ingestionFor(theatreId: string, devices: Device[], records: Pick<DeliveryRecord, 'theatreId' | 'date' | 'played'>[], now: number): IngestionStatus {
  const mine = devices.filter(d => d.theatreId === theatreId);
  const health = mine.map(d => deviceHealth(d, now));
  const lastLogAt = mine.map(d => d.lastLogAt).filter((x): x is string => !!x).sort().at(-1) ?? null;
  const yesterday = new Date(now - 24 * HOUR).toISOString().slice(0, 10);
  return {
    theatreId,
    devices: mine.length,
    online: health.filter(h => h === 'online').length,
    stale: health.filter(h => h === 'stale').length,
    offline: health.filter(h => h === 'offline').length,
    lastLogAt,
    logsLast24h: records.filter(r => r.theatreId === theatreId && r.date >= yesterday).reduce((s, r) => s + r.played, 0)
  };
}
