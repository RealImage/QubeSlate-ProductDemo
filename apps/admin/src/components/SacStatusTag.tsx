import type { Sac } from '@slate/domain';
import { StatusTag } from '@slate/ui';

const MAP: Record<Sac['status'], { label: string; tone: 'positive' | 'notice' | 'negative' }> = {
  active: { label: 'Active', tone: 'positive' },
  onboarding: { label: 'Onboarding', tone: 'notice' },
  suspended: { label: 'Suspended', tone: 'negative' }
};

export function SacStatusTag({ status }: { status: Sac['status'] }) {
  return <StatusTag tone={MAP[status].tone}>{MAP[status].label}</StatusTag>;
}

export function GatewayTag({ gateway }: { gateway: Sac['gateway'] }) {
  if (!gateway.enabled) return <StatusTag tone="negative">Disabled</StatusTag>;
  return <StatusTag tone={gateway.mode === 'live' ? 'positive' : 'primary-secondary'}>{gateway.provider} · {gateway.mode}</StatusTag>;
}
