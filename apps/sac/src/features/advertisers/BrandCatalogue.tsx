import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sacApi } from '@slate/api';
import { APPROVAL_TONE, dateTime } from '@slate/domain';
import { Card, DataTable, EmptyState, Input, Page, PageHeader, Query, Select, StatusTag } from '@slate/ui';

export function BrandCatalogue() {
  const q = useQuery({ queryKey: ['sac', 'brands'], queryFn: sacApi.brands });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const rows = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (q.data ?? []).filter(b => (status === 'all' || b.status === status) && (!s || `${b.name} ${b.category} ${b.companyName}`.toLowerCase().includes(s)));
  }, [q.data, search, status]);
  return (
    <Page>
      <PageHeader title="Brands" description="Every brand your advertisers have requested, with its approval status." />
      <div className="sl-row" style={{ alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 280px', maxWidth: 420 }}><Input label="Search" placeholder="Brand, category or advertiser" value={search} onChange={setSearch} /></div>
        <div style={{ width: 200 }}>
          <Select label="Status" selectedKey={status} onSelectionChange={k => setStatus(String(k))}>
            <Select.Option id="all">All</Select.Option>
            <Select.Option id="approved">Approved</Select.Option>
            <Select.Option id="pending">Pending</Select.Option>
            <Select.Option id="rejected">Rejected</Select.Option>
          </Select>
        </div>
      </div>
      <Card flush>
        <Query q={q}>
          {() => (
            <DataTable
              rows={rows}
              rowKey={b => b.id}
              caption="Brands"
              empty={<EmptyState title="No brands match">{q.data?.length ? 'Try a different search or status.' : 'No brands have been requested yet.'}</EmptyState>}
              columns={[
                { key: 'name', header: 'Brand', sort: b => b.name, cell: b => <div className="sl-table__primary">{b.name}</div> },
                { key: 'category', header: 'Category', sort: b => b.category, cell: b => b.category },
                { key: 'advertiser', header: 'Advertiser', sort: b => b.companyName, cell: b => b.companyName },
                { key: 'status', header: 'Status', sort: b => b.status, cell: b => <StatusTag tone={APPROVAL_TONE[b.status] ?? 'default'}>{b.status[0]!.toUpperCase() + b.status.slice(1)}</StatusTag> },
                { key: 'requested', header: 'Requested', sort: b => b.requestedAt, cell: b => dateTime(b.requestedAt) },
                { key: 'note', header: 'Note', cell: b => b.note || '—' }
              ]}
            />
          )}
        </Query>
      </Card>
    </Page>
  );
}
