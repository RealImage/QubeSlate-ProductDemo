import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { advertiserApi, type CampaignRow } from '@slate/api';
import { Card, DataTable, EmptyState, Input, Page, PageHeader, Query, type Column } from '@slate/ui';
import { AddIcon, SearchIcon } from 'prefab/icons';
import { CAMPAIGN_STATUS, flight, inrShort, type CampaignStatus } from '@slate/domain';
import { qk, useOrg } from '../../components/org';
import { ButtonLink, FilterChips } from '../../components/controls';
import { CampaignStatusTag, channelsLabel, DeliveryCell } from './shared';

type Filter = 'all' | CampaignStatus;
const FILTERS: Filter[] = ['all', 'active', 'scheduled', 'pending_approval', 'paused', 'draft', 'completed', 'rejected'];

const columns: Column<CampaignRow>[] = [
  {
    key: 'name', header: 'Campaign', sort: c => c.name, cell: c => (
      <span style={{ display: 'flex', flexDirection: 'column' }}>
        <span className="sl-table__primary">{c.name}</span>
        <span className="sl-table__secondary">{c.code} · {c.placementCount} placements · {c.screens} screens · {channelsLabel(c.channels)}</span>
      </span>
    )
  },
  { key: 'brand', header: 'Brand', sort: c => c.brandName, cell: c => c.brandName },
  { key: 'flight', header: 'Flight', sort: c => c.start, cell: c => flight(c.start, c.end) },
  { key: 'status', header: 'Status', sort: c => c.status, cell: c => <CampaignStatusTag status={c.status} /> },
  { key: 'delivery', header: 'Delivery', sort: c => c.delivered.rate, cell: c => <DeliveryCell row={c} /> },
  {
    key: 'value', header: 'Booked / Budget', align: 'right', sort: c => c.bookedValue, cell: c => (
      <span style={{ display: 'flex', flexDirection: 'column' }}>
        <span className="sl-table__primary">{inrShort(c.bookedValue)}</span>
        <span className="sl-table__secondary">of {inrShort(c.budget)}</span>
      </span>
    )
  }
];

export function CampaignsPage() {
  const { can } = useOrg();
  const q = useQuery({ queryKey: qk.campaigns, queryFn: advertiserApi.campaigns });
  return (
    <Page>
      <PageHeader title="Campaign Management" description={q.data ? `${q.data.length} campaigns` : undefined}
        actions={can('campaign.edit') && <ButtonLink to="/campaigns/new"><AddIcon width={16} height={16} />Create campaign</ButtonLink>} />
      <Card flush><Query q={q}>{rows => <CampaignTable rows={rows} />}</Query></Card>
    </Page>
  );
}

function CampaignTable({ rows }: { rows: CampaignRow[] }) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const raw = params.get('status');
  const filter: Filter = FILTERS.includes(raw as Filter) ? (raw as Filter) : 'all';
  const setFilter = (f: Filter) => setParams(f === 'all' ? {} : { status: f }, { replace: true });

  const shown = useMemo(() => {
    const s = search.trim().toLowerCase();
    return rows.filter(c => (filter === 'all' || c.status === filter) &&
      (!s || [c.name, c.brandName, c.code].some(x => x.toLowerCase().includes(s))));
  }, [rows, filter, search]);

  return (
    <>
      <div className="adv-toolbar">
        <div className="adv-toolbar__search">
          <Input aria-label="Search campaigns" placeholder="Search campaigns or brands" value={search} onChange={setSearch} prefix={<SearchIcon width={16} height={16} />} />
        </div>
        <FilterChips label="Status" value={filter} onChange={setFilter} options={FILTERS
          .map(f => ({ value: f, label: f === 'all' ? 'All' : CAMPAIGN_STATUS[f].label, count: f === 'all' ? rows.length : rows.filter(r => r.status === f).length }))
          .filter(o => o.value === 'all' || o.count > 0 || o.value === filter)} />
        <div className="adv-toolbar__spacer" />
        <span className="sl-muted sl-small">{shown.length} of {rows.length} shown</span>
      </div>
      <DataTable rows={shown} columns={columns} rowKey={c => c.id} caption="Campaigns"
        onRowClick={c => navigate(c.status === 'draft' ? `/campaigns/${c.id}/edit` : `/campaigns/${c.id}`)}
        empty={<EmptyState title={rows.length ? 'No campaigns match' : 'No campaigns yet'}>
          {rows.length ? 'Try a different search or status.' : 'Create a campaign to start booking cinema and DOOH inventory.'}
        </EmptyState>} />
    </>
  );
}
