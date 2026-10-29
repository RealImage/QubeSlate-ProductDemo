import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { sacApi } from '@slate/api';
import { CAMPAIGN_STATUS, deliveryTone, flight, inr, pct, type CampaignStatus } from '@slate/domain';
import { Card, DataTable, EmptyState, Input, Page, PageHeader, Query, Select, StatusTag } from '@slate/ui';
import { BillingTag } from '../shared';

const STATUSES = (Object.keys(CAMPAIGN_STATUS) as CampaignStatus[]).filter(s => s !== 'draft');

export function CampaignManagement() {
  const navigate = useNavigate();
  const q = useQuery({ queryKey: ['sac', 'campaigns'], queryFn: sacApi.campaigns });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | CampaignStatus>('all');
  const rows = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (q.data ?? []).filter(c =>
      (status === 'all' || c.status === status) &&
      (!s || `${c.name} ${c.code} ${c.companyName} ${c.brandName}`.toLowerCase().includes(s)));
  }, [q.data, search, status]);

  return (
    <Page>
      <PageHeader title="Campaign Management" description="Every campaign booked by your advertisers. Advertisers create and submit campaigns; approvals happen under Approvals." />
      <div className="sl-row" style={{ alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 280px', maxWidth: 420 }}><Input label="Search" placeholder="Campaign, code, advertiser or brand" value={search} onChange={setSearch} /></div>
        <div style={{ width: 220 }}>
          <Select label="Status" selectedKey={status} onSelectionChange={k => setStatus(k as 'all' | CampaignStatus)}>
            <Select.Option id="all">All statuses</Select.Option>
            {STATUSES.map(s => <Select.Option key={s} id={s}>{CAMPAIGN_STATUS[s].label}</Select.Option>)}
          </Select>
        </div>
        {q.data && <span className="sl-muted sl-small" style={{ marginLeft: 'auto' }}>{rows.length} of {q.data.length} campaigns</span>}
      </div>
      <Card flush>
        <Query q={q}>
          {() => (
            <DataTable
              rows={rows}
              rowKey={c => c.id}
              caption="Campaigns"
              onRowClick={c => navigate(`/campaigns/${c.id}`)}
              empty={<EmptyState title="No campaigns match">{q.data?.length ? 'Try a different search or status.' : 'Advertisers have not submitted any campaigns yet.'}</EmptyState>}
              columns={[
                { key: 'name', header: 'Campaign', sort: c => c.name, cell: c => <><div className="sl-table__primary">{c.name}</div><div className="sl-table__secondary">{c.code}</div></> },
                { key: 'advertiser', header: 'Advertiser', sort: c => c.companyName, cell: c => <>{c.companyName}<div className="sl-table__secondary">{c.brandName}</div></> },
                { key: 'status', header: 'Status', sort: c => c.status, cell: c => <StatusTag tone={CAMPAIGN_STATUS[c.status].tone}>{CAMPAIGN_STATUS[c.status].label}</StatusTag> },
                { key: 'flight', header: 'Flight', sort: c => c.start, cell: c => flight(c.start, c.end) },
                { key: 'billing', header: 'Billing', cell: c => <BillingTag type={c.billingType} /> },
                { key: 'screens', header: 'Screens', align: 'right', sort: c => c.screens, cell: c => c.screens },
                { key: 'value', header: 'Booked value', align: 'right', sort: c => c.bookedValue, cell: c => inr(c.bookedValue) },
                { key: 'rate', header: 'Delivery', align: 'right', sort: c => c.delivered.rate, cell: c => c.delivered.planned ? <StatusTag tone={deliveryTone(c.delivered.rate)}>{pct(c.delivered.rate)}</StatusTag> : <span className="sl-muted">—</span> }
              ]}
            />
          )}
        </Query>
      </Card>
    </Page>
  );
}
