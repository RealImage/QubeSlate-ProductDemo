import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sacApi, useSession, type BrandRow } from '@slate/api';
import { APPROVAL_TONE, dateTime } from '@slate/domain';
import { Button, Card, DataTable, EmptyState, Page, PageHeader, Query, StatusTag, toast } from '@slate/ui';
import { NoteDialog, errorText } from '../shared';

export function BrandApprovals() {
  const qc = useQueryClient();
  const { can } = useSession();
  const canDecide = can('approvals.decide');
  const q = useQuery({ queryKey: ['sac', 'brands'], queryFn: sacApi.brands });
  const [rejecting, setRejecting] = useState<BrandRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const decide = useMutation({
    mutationFn: ({ brand, decision, note }: { brand: BrandRow; decision: 'approve' | 'reject'; note: string | null }) => sacApi.decideBrand(brand.id, { decision, note }),
    onMutate: ({ brand }) => setBusyId(brand.id),
    onSettled: () => setBusyId(null),
    onSuccess: (_, { brand, decision }) => {
      void qc.invalidateQueries({ queryKey: ['sac'] });
      // Only close the reject dialog if it belongs to this decision.
      setRejecting(r => (r?.id === brand.id ? null : r));
      toast.add({ variant: 'positive', message: `${brand.name} ${decision === 'approve' ? 'approved' : 'rejected'}.` });
    },
    onError: e => toast.add({ variant: 'negative', message: errorText(e) })
  });

  return (
    <Page>
      <PageHeader title="Brand Approvals" description="Brands advertisers want to book campaigns under." actions={q.data && <StatusTag tone="notice" size="medium">{q.data.filter(b => b.status === 'pending').length} awaiting decision</StatusTag>} />
      <Query q={q}>
        {all => {
          const pending = all.filter(b => b.status === 'pending');
          const decided = all.filter(b => b.status !== 'pending');
          return (
            <>
              <Card title="Pending" flush>
                <DataTable
                  rows={pending}
                  rowKey={b => b.id}
                  caption="Brands pending approval"
                  empty={<EmptyState title="No brands to review">Every requested brand has been decided.</EmptyState>}
                  columns={[
                    { key: 'name', header: 'Brand', sort: b => b.name, cell: b => <div className="sl-table__primary">{b.name}</div> },
                    { key: 'category', header: 'Category', sort: b => b.category, cell: b => b.category },
                    { key: 'advertiser', header: 'Advertiser', sort: b => b.companyName, cell: b => b.companyName },
                    { key: 'requested', header: 'Requested', sort: b => b.requestedAt, cell: b => dateTime(b.requestedAt) },
                    ...(canDecide ? [{
                      key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right' as const, cell: (b: BrandRow) => (
                        <span className="sl-row" style={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                          <Button size="small" variant="default" isDisabled={decide.isPending} onPress={() => { decide.reset(); setRejecting(b); }}>Reject</Button>
                          <Button size="small" variant="primary" isPending={busyId === b.id && !rejecting} isDisabled={decide.isPending && busyId !== b.id} onPress={() => decide.mutate({ brand: b, decision: 'approve', note: null })}>Approve</Button>
                        </span>
                      )
                    }] : [])
                  ]}
                />
              </Card>
              {decided.length > 0 && (
                <Card title="Decided" flush>
                  <DataTable
                    rows={decided}
                    rowKey={b => b.id}
                    caption="Decided brands"
                    defaultSort={{ key: 'reviewed', dir: 'desc' }}
                    columns={[
                      { key: 'name', header: 'Brand', sort: b => b.name, cell: b => <div className="sl-table__primary">{b.name}</div> },
                      { key: 'advertiser', header: 'Advertiser', sort: b => b.companyName, cell: b => b.companyName },
                      { key: 'status', header: 'Decision', cell: b => <StatusTag tone={APPROVAL_TONE[b.status] ?? 'default'}>{b.status[0]!.toUpperCase() + b.status.slice(1)}</StatusTag> },
                      { key: 'reviewed', header: 'Decided', sort: b => b.reviewedAt ?? '', cell: b => dateTime(b.reviewedAt) },
                      { key: 'note', header: 'Note', cell: b => b.note || '—' }
                    ]}
                  />
                </Card>
              )}
            </>
          );
        }}
      </Query>
      <NoteDialog open={!!rejecting} title={`Reject ${rejecting?.name ?? 'brand'}?`} label="Reason for the advertiser" confirmLabel="Reject brand"
        busy={decide.isPending} error={decide.error} onCancel={() => setRejecting(null)}
        onConfirm={note => rejecting && decide.mutate({ brand: rejecting, decision: 'reject', note })} />
    </Page>
  );
}
