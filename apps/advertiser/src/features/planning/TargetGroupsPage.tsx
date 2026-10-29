import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { advertiserApi, type TargetGroupWithReach } from '@slate/api';
import { Button, Card, ConfirmDialog, EmptyState, Page, PageHeader, Query, StatusTag } from '@slate/ui';
import { AddIcon, DeleteIcon } from 'prefab/icons';
import { date, num } from '@slate/domain';
import { notifyError, notifySuccess, qk, useOrg } from '../../components/org';
import { ButtonLink, FilterChips } from '../../components/controls';

export function TargetGroupsPage() {
  const { can } = useOrg();
  const q = useQuery({ queryKey: qk.targetGroups, queryFn: advertiserApi.targetGroups });
  const [channel, setChannel] = useState<'all' | 'cinema' | 'dooh'>('all');
  const editable = can('targets.edit');
  return (
    <Page>
      <PageHeader title="Target Groups" description="Reusable audience and inventory definitions. Attach the same group to any number of campaigns."
        actions={editable && <ButtonLink to="/target-groups/new"><AddIcon width={16} height={16} />Create target group</ButtonLink>} />
      <Query q={q}>
        {list => {
          const shown = channel === 'all' ? list : list.filter(t => t.channel === channel);
          return (
            <>
              <FilterChips label="Channel" value={channel} onChange={setChannel} options={[
                { value: 'all', label: 'All', count: list.length },
                { value: 'cinema', label: 'Cinema', count: list.filter(t => t.channel === 'cinema').length },
                { value: 'dooh', label: 'DOOH', count: list.filter(t => t.channel === 'dooh').length }
              ]} />
              {shown.length === 0 ? (
                <Card><EmptyState title={list.length ? 'No target groups for this channel' : 'No target groups yet'}
                  action={editable && !list.length && <Link to="/target-groups/new">Create your first target group</Link>}>
                  Target groups define where a placement plays — cities, cinemas, screen formats and audience interests.
                </EmptyState></Card>
              ) : (
                <div className="sl-grid sl-grid--2">{shown.map(t => <TargetGroupCard key={t.id} tg={t} editable={editable} />)}</div>
              )}
            </>
          );
        }}
      </Query>
    </Page>
  );
}

function TargetGroupCard({ tg, editable }: { tg: TargetGroupWithReach; editable: boolean }) {
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const del = useMutation({
    mutationFn: () => advertiserApi.deleteTargetGroup(tg.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.targetGroups }); notifySuccess(`${tg.name} deleted.`); setConfirm(false); },
    onError: e => { notifyError(e); setConfirm(false); }
  });
  return (
    <Card title={<Link to={`/target-groups/${tg.id}`}>{tg.name}</Link>}
      description={`Used by ${tg.usedBy} campaign${tg.usedBy === 1 ? '' : 's'} · Updated ${date(tg.updatedAt)}`}
      actions={
        <div className="sl-row">
          <StatusTag tone={tg.channel === 'cinema' ? 'primary-secondary' : 'secondary'}>{tg.channel === 'cinema' ? 'Cinema' : 'DOOH'}</StatusTag>
          {editable && tg.usedBy === 0 && (
            <Button size="small" variant="secondary" iconOnly aria-label={`Delete ${tg.name}`} onPress={() => setConfirm(true)}><DeleteIcon width={16} height={16} /></Button>
          )}
        </div>
      }>
      <div className="sl-stack" style={{ gap: 12 }}>
        <span className="sl-muted sl-small">{tg.summary}</span>
        <div className="adv-metrics">
          <div className="adv-metric"><strong>{num(tg.reach.units)}</strong><span>{tg.channel === 'cinema' ? 'Screens' : 'Display groups'}</span></div>
          <div className="adv-metric"><strong>{num(tg.reach.theatres)}</strong><span>Cinemas</span></div>
          <div className="adv-metric"><strong>{num(tg.reach.cities)}</strong><span>Cities</span></div>
        </div>
      </div>
      <ConfirmDialog open={confirm} title={`Delete ${tg.name}?`} tone="negative" confirmLabel="Delete" busy={del.isPending}
        onCancel={() => setConfirm(false)} onConfirm={() => del.mutate()}>
        The target group is removed for everyone in your company. Campaigns that already use it are not affected.
      </ConfirmDialog>
    </Card>
  );
}
