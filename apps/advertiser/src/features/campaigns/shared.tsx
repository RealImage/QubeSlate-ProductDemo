import type { CampaignRow } from '@slate/api';
import { Progress, StatusTag } from '@slate/ui';
import { CAMPAIGN_STATUS, deliveryTone, pct, type CampaignStatus, type PlacementPosition } from '@slate/domain';

export function CampaignStatusTag({ status, size }: { status: CampaignStatus; size?: 'small' | 'medium' }) {
  const s = CAMPAIGN_STATUS[status];
  return <StatusTag tone={s.tone} size={size}>{s.label}</StatusTag>;
}

/** "Pre-show · Segment 2 · Spot D" or "6 spots / hour". */
export function positionLabel(p: PlacementPosition): string {
  return p.channel === 'cinema' ? `${p.pack} · Segment ${p.segment} · ${p.spot}` : `${p.spotsPerHour} spot${p.spotsPerHour === 1 ? '' : 's'} / hour`;
}

export const channelsLabel = (channels: CampaignRow['channels']) =>
  channels.map(c => (c === 'cinema' ? 'Cinema' : 'DOOH')).join(' + ') || '—';

/** Delivered-to-date bar with percentage, used in campaign rows. */
export function DeliveryCell({ row }: { row: Pick<CampaignRow, 'delivered' | 'status'> }) {
  if (!row.delivered.planned) return <span className="sl-muted sl-small">{row.status === 'draft' || row.status === 'pending_approval' ? 'Not started' : 'No plays yet'}</span>;
  return (
    <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 110 }}>
      <span className="sl-small">{pct(row.delivered.rate)} delivered</span>
      <Progress value={row.delivered.rate} tone={deliveryTone(row.delivered.rate)} />
    </span>
  );
}
