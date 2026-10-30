import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { advertiserApi, type BrandView } from '@slate/api';
import { Alert, Button, CategoryChips, CategoryField, Card, DataTable, Dialog, EmptyState, Input, Page, PageHeader, Query, StatusTag, type Column } from '@slate/ui';
import { AddIcon } from 'prefab/icons';
import { APPROVAL_TONE, date, type Brand } from '@slate/domain';
import { errorText, notifySuccess, qk, useOrg } from '../../components/org';
import { FilterChips } from '../../components/controls';

const STATUS_LABEL: Record<Brand['status'], string> = { approved: 'Approved', pending: 'Pending approval', rejected: 'Rejected' };

export function BrandsPage() {
  const { sac, can } = useOrg();
  const q = useQuery({ queryKey: qk.brands, queryFn: advertiserApi.brands });
  const [filter, setFilter] = useState<'all' | Brand['status']>('all');
  const [requesting, setRequesting] = useState(false);
  const editable = can('company.edit');

  const columns: Column<BrandView>[] = [
    { key: 'name', header: 'Brand', sort: b => b.name, cell: b => <span className="sl-table__primary">{b.name}</span> },
    { key: 'category', header: 'Categories', cell: b => <CategoryChips paths={b.categoryPaths} /> },
    { key: 'status', header: 'Status', sort: b => b.status, cell: b => <StatusTag tone={APPROVAL_TONE[b.status] ?? 'secondary'}>{STATUS_LABEL[b.status]}</StatusTag> },
    { key: 'requested', header: 'Requested', sort: b => b.requestedAt, cell: b => date(b.requestedAt) },
    { key: 'reviewed', header: 'Reviewed', sort: b => b.reviewedAt ?? '', cell: b => date(b.reviewedAt) },
    { key: 'note', header: 'Note', cell: b => b.note ? <span className="sl-muted">{b.note}</span> : '—' }
  ];

  return (
    <Page>
      <PageHeader title="Brands" description={`Brands you may advertise on behalf of. ${sac.name} approves each one before it can be used on media or campaigns.`}
        actions={editable && <Button variant="primary" onPress={() => setRequesting(true)}><AddIcon width={16} height={16} />Request a brand</Button>} />
      <Card flush>
        <Query q={q}>
          {list => {
            const counts = (s: Brand['status']) => list.filter(b => b.status === s).length;
            const shown = filter === 'all' ? list : list.filter(b => b.status === filter);
            return (
              <>
                <div className="adv-toolbar">
                  <FilterChips label="Filter by status" value={filter} onChange={setFilter} options={[
                    { value: 'all', label: 'All', count: list.length },
                    { value: 'approved', label: 'Approved', count: counts('approved') },
                    { value: 'pending', label: 'Pending', count: counts('pending') },
                    { value: 'rejected', label: 'Rejected', count: counts('rejected') }
                  ]} />
                </div>
                <DataTable rows={shown} columns={columns} rowKey={b => b.id} defaultSort={{ key: 'name', dir: 'asc' }} caption="Brands"
                  empty={<EmptyState title={list.length ? 'No brands match this filter' : 'No brands yet'}>
                    {list.length ? 'Pick another status.' : `Request your first brand — ${sac.name} reviews it before you can use it.`}
                  </EmptyState>} />
              </>
            );
          }}
        </Query>
      </Card>
      {requesting && <RequestBrandDialog onClose={() => setRequesting(false)} />}
    </Page>
  );
}

export function RequestBrandDialog({ onClose }: { onClose: () => void }) {
  const { sac } = useOrg();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const valid = name.trim() !== '' && categoryIds.length > 0;
  const req = useMutation({
    mutationFn: () => advertiserApi.requestBrand({ name: name.trim(), categoryIds }),
    onSuccess: b => {
      qc.invalidateQueries({ queryKey: qk.brands });
      notifySuccess(`${b.name} sent to ${sac.name} for approval.`);
      onClose();
    }
  });
  return (
    <Dialog isOpen onOpenChange={o => !o && onClose()} width={460}>
      <Dialog.Header>Request a brand</Dialog.Header>
      <Dialog.Body>
        <form id="brand-form" className="sl-stack" onSubmit={e => { e.preventDefault(); if (valid && !req.isPending) req.mutate(); }}>
          <Input label="Brand name" value={name} onChange={setName} isRequired autoFocus />
          <CategoryField label="Categories" required value={categoryIds} onChange={setCategoryIds} description="Pick every category this brand advertises under. Your SAC may refine them." />
          <p className="sl-muted sl-small" style={{ margin: 0 }}>{sac.name} reviews the request. The brand becomes available for media and campaigns once approved.</p>
          {req.error && <Alert variant="negative" closable={false}>{errorText(req.error)}</Alert>}
        </form>
      </Dialog.Body>
      <Dialog.Footer>
        <Button variant="default" onPress={onClose}>Cancel</Button>
        <Button variant="primary" type="submit" form="brand-form" isDisabled={!valid} isPending={req.isPending}>Send request</Button>
      </Dialog.Footer>
    </Dialog>
  );
}
