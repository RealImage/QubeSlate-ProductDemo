import { StatusTag } from '@slate/ui';

export type Health = 'online' | 'stale' | 'offline';

const TONE = { online: 'positive', stale: 'notice', offline: 'negative' } as const;
const LABEL = { online: 'Online', stale: 'Stale', offline: 'Offline' } as const;

export function HealthTag({ health }: { health: Health }) {
  return <StatusTag tone={TONE[health]}>{LABEL[health]}</StatusTag>;
}

/** Worst health first: offline 0, stale 1, online 2. */
export const healthRank = (h: Health) => (h === 'offline' ? 0 : h === 'stale' ? 1 : 2);
