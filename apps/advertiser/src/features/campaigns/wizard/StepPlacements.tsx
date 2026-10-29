import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { advertiserApi, type CampaignDetail, type PlacementRow, type TargetGroupWithReach } from '@slate/api';
import { Button, Card, ConfirmDialog, DataTable, EmptyState, type Column } from '@slate/ui';
import { AddIcon, DeleteIcon } from 'prefab/icons';
import { flight, inr, num, type Brand, type Media } from '@slate/domain';
import { notifyError, qk } from '../../../components/org';
import { positionLabel } from '../shared';
import { PlacementSheet } from './PlacementSheet';

/** Step 4: one media × one target group × dates × position, repeated. */
export function StepPlacements({ campaign, targetGroups, media }: {
  campaign: CampaignDetail;
  brands: Brand[];
  targetGroups: TargetGroupWithReach[];
  media: Media[];
}) {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<PlacementRow | null>(null);
  const remove = useMutation({
    mutationFn: (p: PlacementRow) => advertiserApi.placementAction(p.id, 'delete'),
    onSuccess: d => { qc.setQueryData(qk.campaign(campaign.id), d); setRemoving(null); },
    onError: e => { notifyError(e); setRemoving(null); }
  });
  const ready = campaign.targetGroupIds.length > 0 && campaign.mediaIds.length > 0;

  const columns: Column<PlacementRow>[] = [
    { key: 'media', header: 'Media', cell: p => <span className="sl-table__primary">{p.mediaName}</span> },
    { key: 'tg', header: 'Target group', cell: p => p.targetGroupName },
    { key: 'slot', header: 'Position', cell: p => <span style={{ display: 'flex', flexDirection: 'column' }}><span>{positionLabel(p.position)}</span><span className="sl-table__secondary">{p.timeBand}</span></span> },
    { key: 'dates', header: 'Dates', cell: p => flight(p.from, p.to) },
    { key: 'units', header: 'Screens', align: 'right', cell: p => num(p.screens) },
    { key: 'cost', header: 'Estimated', align: 'right', cell: p => <span style={{ display: 'flex', flexDirection: 'column' }}><strong>{inr(p.cost)}</strong><span className="sl-table__secondary">{num(p.plannedPlays)} plays</span></span> },
    {
      key: 'remove', header: <span className="sr-only">Remove</span>, align: 'right', cell: p => p.actions.includes('delete') && (
        <Button size="small" variant="secondary" iconOnly aria-label={`Remove ${p.code}`} onPress={() => setRemoving(p)}><DeleteIcon width={16} height={16} /></Button>
      )
    }
  ];

  return (
    <Card title="Placements" description="Each placement plays one media on one target group, for a date range and a position."
      actions={<Button size="small" variant="primary" isDisabled={!ready} onPress={() => setAdding(true)}><AddIcon width={16} height={16} />Add placement</Button>} flush>
      <DataTable rows={campaign.placements} columns={columns} rowKey={p => p.id} caption="Placements"
        empty={<EmptyState title="No placements yet" action={ready && <Button variant="secondary" onPress={() => setAdding(true)}>Add placement</Button>}>
          {ready ? 'A campaign needs at least one placement. Add one to choose the position, dates and inventory it plays against.'
            : 'Attach at least one target group and one media first.'}
        </EmptyState>} />
      {adding && <PlacementSheet campaign={campaign} targetGroups={targetGroups} media={media} onClose={() => setAdding(false)} />}
      <ConfirmDialog open={!!removing} title={`Remove ${removing?.code ?? 'placement'}?`} tone="negative" confirmLabel="Remove" busy={remove.isPending}
        onCancel={() => setRemoving(null)} onConfirm={() => removing && remove.mutate(removing)}>
        {removing && `${removing.mediaName} on ${removing.targetGroupName} is removed from this draft.`}
      </ConfirmDialog>
    </Card>
  );
}
