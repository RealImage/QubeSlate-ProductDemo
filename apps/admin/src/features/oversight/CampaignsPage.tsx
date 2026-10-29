import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@slate/api';
import { CAMPAIGN_STATUS, flight, inrShort } from '@slate/domain';
import { Card, DataTable, Page, PageHeader, Query, StatusTag } from '@slate/ui';
import { ALL, FilterBar, SearchFilter, SelectFilter, optionsOf } from '../../components/Filters';

export function CampaignsPage() {
  const q = useQuery({ queryKey: ['admin', 'campaigns'], queryFn: adminApi.campaigns });
  const [status, setStatus] = useState(ALL);
  const [sac, setSac] = useState(ALL);
  const [search, setSearch] = useState('');
  const rows = useMemo(() => (q.data ?? []).filter(c =>
    (status === ALL || c.status === status) && (sac === ALL || c.sacName === sac) &&
    (!search.trim() || (c.name + c.code + c.companyName).toLowerCase().includes(search.trim().toLowerCase()))
  ), [q.data, status, sac, search]);
  return (
    <Page>
      <PageHeader eyebrow="Oversight" title="Campaigns" description="Campaigns across all SACs (read-only)." />
      <Card flush>
        <FilterBar>
          <SelectFilter label="Status" value={status} onChange={setStatus} allLabel="All statuses"
            options={Object.entries(CAMPAIGN_STATUS).map(([value, s]) => ({ value, label: s.label }))} />
          <SelectFilter label="SAC" value={sac} onChange={setSac} options={optionsOf((q.data ?? []).map(c => c.sacName))} allLabel="All SACs" />
          <SearchFilter label="Search" value={search} onChange={setSearch} placeholder="Campaign, code or advertiser" />
        </FilterBar>
        <Query q={q}>
          {() => (
            <DataTable caption="Campaigns" rows={rows} rowKey={c => c.id} defaultSort={{ key: 'start', dir: 'desc' }}
              empty={<div className="sl-empty"><strong>No campaigns match</strong></div>}
              columns={[
                { key: 'name', header: 'Campaign', sort: c => c.name, cell: c => <><div className="sl-table__primary">{c.name}</div><div className="sl-table__secondary">{c.code}</div></> },
                { key: 'adv', header: 'Advertiser', sort: c => c.companyName, cell: c => <>{c.companyName}<div className="sl-table__secondary">{c.brandName}</div></> },
                { key: 'sac', header: 'SAC', sort: c => c.sacName, cell: c => c.sacName },
                { key: 'status', header: 'Status', sort: c => c.status, cell: c => <StatusTag tone={CAMPAIGN_STATUS[c.status].tone}>{CAMPAIGN_STATUS[c.status].label}</StatusTag> },
                { key: 'start', header: 'Flight', sort: c => c.start, cell: c => flight(c.start, c.end) },
                { key: 'booked', header: 'Booked value', align: 'right', sort: c => c.bookedValue, cell: c => inrShort(c.bookedValue) }
              ]} />
          )}
        </Query>
      </Card>
    </Page>
  );
}
