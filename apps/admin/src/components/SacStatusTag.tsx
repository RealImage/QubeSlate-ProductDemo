import type { Sac } from '@slate/domain';
import { StatusTag } from '@slate/ui';

const MAP: Record<Sac['status'], { label: string; tone: 'positive' | 'notice' | 'secondary' }> = {
  active: { label: 'Active', tone: 'positive' },
  onboarding: { label: 'Onboarding', tone: 'notice' },
  inactive: { label: 'Inactive', tone: 'secondary' }
};

export function SacStatusTag({ status }: { status: Sac['status'] }) {
  return <StatusTag tone={MAP[status].tone}>{MAP[status].label}</StatusTag>;
}
