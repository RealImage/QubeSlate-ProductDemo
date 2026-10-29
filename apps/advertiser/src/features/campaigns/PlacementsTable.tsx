import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { advertiserApi, type CampaignDetail, type PlacementRow } from '@slate/api';
import { Button, ConfirmDialog, DataTable, EmptyState, Progress, StatusTag, type Column } from '@slate/ui';
import { DeleteIcon, PauseIcon, PlayIcon } from 'prefab/icons';
import { deliveryTone, duration, flight, inr, num, PLACEMENT_STATUS, type PlacementAction } from '@slate/domain';
import { notifyError, notifySuccess, qk, useOrg } from '../../components/org';
import { positionLabel } from './shared';

const ACTION: Record<PlacementAction, { label: string; verb: string; tone: 'primary' | 'negative'; body: string }> = {
  pause: { label: 'Pause', verb: 'paused', tone: 'primary', body: 'The placement stops playing from the next show until you resume it. Other placements are not affected.' },
  resume: { label: 'Resume', verb: 'resumed', tone: 'primary', body: 'The placement starts playing again from the next show.' },
  cancel: { label: 'Cancel', verb: 'cancelled', tone: 'negative', body: 'The placement will not run. Its inventory is released. This can’t be undone.' },
  delete: { label: 'Delete', verb: 'deleted', tone: 'negative', body: 'The placement is removed from the campaign. This can’t be undone.' }
};

/** Placements with per-row lifecycle actions (pause / resume / cancel / delete) from `row.actions`. */
export function PlacementsTable({ campaign }: { campaign: CampaignDetail }) {
  const { can } = useOrg();
  const qc = useQueryClient();
  const [pending, setPending] = useState<{ row: PlacementRow; action: PlacementAction } | null>(null);
  const editable = can('campaign.edit');

  const act = useMutation({
    mutationFn: ({ row, action }: { row: PlacementRow; action: PlacementAction }) => advertiserApi.placementAction(row.id, action),
    onSuccess: (detail, { row, action }) => {
      qc.setQueryData(qk.campaign(campaign.id), detail);
      qc.invalidateQueries({ queryKey: qk.campaigns });
      qc.invalidateQueries({ queryKey: qk.dashboard });
      notifySuccess(`${row.code} ${ACTION[action].verb}.`);
      setPending(null);
    },
    onError: e => { notifyError(e); setPending(null); }
  });

  const columns: Column<PlacementRow>[] = [
    {
      key: 'media', header: 'Media', sort: p => p.mediaName, cell: p => (
        <span style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="sl-table__primary">{p.mediaName}</span>
          <span className="sl-table__secondary">{p.code} · {duration(p.mediaDuration)}</span>
        </span>
      )
    },
    { key: 'tg', header: 'Target group', sort: p => p.targetGroupName, cell: p => p.targetGroupName },
    {
      key: 'position', header: 'Position', cell: p => (
        <span style={{ display: 'flex', flexDirection: 'column' }}>
          <span>{positionLabel(p.position)}</span>
          <span className="sl-table__secondary">{p.timeBand}</span>
        </span>
      )
    },
    { key: 'dates', header: 'Dates', sort: p => p.from, cell: p => flight(p.from, p.to) },
    { key: 'screens', header: campaign.channels.includes('cinema') ? 'Screens' : 'Displays', align: 'right', sort: p => p.screens, cell: p => num(p.screens) },
    {
      key: 'plays', header: 'Delivered / planned', sort: p => p.delivered.rate, cell: p => (
        <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 130 }}>
          <span className="sl-small">{num(p.delivered.played)} / {num(p.plannedPlays)} plays</span>
          {p.delivered.planned > 0 && <Progress label={`Delivery for ${p.code}`} value={p.delivered.played / Math.max(1, p.plannedPlays)} tone={deliveryTone(p.delivered.rate)} />}
        </span>
      )
    },
    { key: 'cost', header: 'Cost', align: 'right', sort: p => p.cost, cell: p => inr(p.cost) },
    { key: 'status', header: 'Status', sort: p => p.status, cell: p => <StatusTag tone={PLACEMENT_STATUS[p.status].tone}>{PLACEMENT_STATUS[p.status].label}</StatusTag> },
    {
      key: 'actions', header: 'Actions', cell: p => !editable || !p.actions.length ? <span className="sl-muted sl-small">No actions</span> : (
        <span className="sl-row" style={{ flexWrap: 'nowrap', gap: 4 }}>
          {p.actions.map(a => a === 'delete' ? (
            <Button key={a} size="small" variant="secondary" iconOnly aria-label={`Delete ${p.code}`} onPress={() => setPending({ row: p, action: a })}><DeleteIcon width={16} height={16} /></Button>
          ) : (
            <Button key={a} size="small" variant={a === 'cancel' ? 'negative' : 'default'} aria-label={`${ACTION[a].label} ${p.code}`} onPress={() => setPending({ row: p, action: a })}>
              {a === 'pause' && <PauseIcon width={14} height={14} />}{a === 'resume' && <PlayIcon width={14} height={14} />}{ACTION[a].label}
            </Button>
          ))}
        </span>
      )
    }
  ];
  const a = pending ? ACTION[pending.action] : null;
  return (
    <>
      <DataTable rows={campaign.placements} columns={columns} rowKey={p => p.id} caption="Placements" defaultSort={{ key: 'dates', dir: 'asc' }}
        empty={<EmptyState title="No placements">This campaign has no placements.</EmptyState>} />
      <ConfirmDialog open={!!pending} title={pending && a ? `${a.label} ${pending.row.code}?` : ''} confirmLabel={a ? `${a.label} placement` : 'Confirm'}
        tone={a?.tone} busy={act.isPending} onCancel={() => setPending(null)} onConfirm={() => pending && act.mutate(pending)}>
        {pending && <><strong>{pending.row.mediaName}</strong> on {pending.row.targetGroupName}, {flight(pending.row.from, pending.row.to)}. {a?.body}</>}
      </ConfirmDialog>
    </>
  );
}
