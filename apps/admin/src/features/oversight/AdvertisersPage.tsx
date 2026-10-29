import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@slate/api';
import { APPROVAL_TONE, inrShort, num } from '@slate/domain';
import { Card, DataTable, Page, PageHeader, Query, StatusTag } from '@slate/ui';
import { ALL, FilterBar, SearchFilter, SelectFilter, optionsOf } from '../../components/Filters';

export function AdvertisersPage() {
  const q = useQuery({ queryKey: ['admin', 'advertisers'], queryFn: adminApi.advertisers });
  const [sac, setSac] = useState(ALL);
  const [search, setSearch] = useState('');
  const rows = useMemo(() => (q.data ?? []).filter(a =>
    (sac === ALL || a.sacName === sac) && (!search.trim() || (a.name + a.code).toLowerCase().includes(search.trim().toLowerCase()))
  ), [q.data, sac, search]);
  return (
    <Page>
      <PageHeader eyebrow="Oversight" title="Advertisers" description="Advertiser companies across all SACs (read-only)." />
      <Card flush>
        <FilterBar>
          <SelectFilter label="SAC" value={sac} onChange={setSac} options={optionsOf((q.data ?? []).map(a => a.sacName))} allLabel="All SACs" />
          <SearchFilter label="Search" value={search} onChange={setSearch} placeholder="Name or code" />
        </FilterBar>
        <Query q={q}>
          {() => (
            <DataTable caption="Advertisers" rows={rows} rowKey={a => a.id} defaultSort={{ key: 'name', dir: 'asc' }}
              empty={<div className="sl-empty"><strong>No advertisers match</strong></div>}
              columns={[
                { key: 'name', header: 'Advertiser', sort: a => a.name, cell: a => <><div className="sl-table__primary">{a.name}</div><div className="sl-table__secondary">{a.code}</div></> },
                { key: 'sac', header: 'SAC', sort: a => a.sacName, cell: a => a.sacName },
                { key: 'kyc', header: 'KYC', sort: a => a.kycStatus, cell: a => <StatusTag tone={APPROVAL_TONE[a.kycStatus] ?? 'default'}>{a.kycStatus}</StatusTag> },
                { key: 'billing', header: 'Billing', sort: a => a.billingType ?? '', cell: a => (a.billingType === 'card' ? 'Card / Prepaid' : a.billingType === 'contracted' ? 'Contracted' : '—') },
                { key: 'camps', header: 'Active campaigns', align: 'right', sort: a => a.activeCampaigns, cell: a => num(a.activeCampaigns) },
                { key: 'booked', header: 'Booked value', align: 'right', sort: a => a.bookedValue, cell: a => inrShort(a.bookedValue) }
              ]} />
          )}
        </Query>
      </Card>
    </Page>
  );
}
