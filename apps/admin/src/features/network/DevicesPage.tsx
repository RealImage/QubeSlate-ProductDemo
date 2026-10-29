import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@slate/api';
import { dateTime } from '@slate/domain';
import { Card, DataTable, Page, PageHeader, Query } from '@slate/ui';
import { ALL, FilterBar, SearchFilter, SelectFilter, optionsOf } from '../../components/Filters';
import { HealthTag, healthRank } from '../../components/Health';

export function DevicesPage() {
  const q = useQuery({ queryKey: ['admin', 'devices'], queryFn: adminApi.devices });
  const [exhibitor, setExhibitor] = useState(ALL);
  const [kind, setKind] = useState(ALL);
  const [health, setHealth] = useState(ALL);
  const [search, setSearch] = useState('');
  const rows = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (q.data ?? []).filter(d =>
      (exhibitor === ALL || d.exhibitorName === exhibitor) && (kind === ALL || d.kind === kind) && (health === ALL || d.health === health) &&
      (!s || [d.theatreName, d.city, d.serial, d.model].some(x => x.toLowerCase().includes(s)))
    );
  }, [q.data, exhibitor, kind, health, search]);
  return (
    <Page>
      <PageHeader eyebrow="Network" title="Devices" description="Cinema servers and DOOH players that upload play logs." />
      <Card flush>
        <FilterBar>
          <SelectFilter label="Exhibitor" value={exhibitor} onChange={setExhibitor} options={optionsOf((q.data ?? []).map(d => d.exhibitorName))} allLabel="All exhibitors" />
          <SelectFilter label="Type" value={kind} onChange={setKind} allLabel="All types" options={[{ value: 'cinema-server', label: 'Cinema server' }, { value: 'dooh-player', label: 'DOOH player' }]} />
          <SelectFilter label="Health" value={health} onChange={setHealth} allLabel="Any health" options={[{ value: 'online', label: 'Online' }, { value: 'stale', label: 'Stale' }, { value: 'offline', label: 'Offline' }]} />
          <SearchFilter label="Search" value={search} onChange={setSearch} placeholder="Theatre, city, serial or model" />
        </FilterBar>
        <Query q={q}>
          {() => (
            <DataTable caption="Devices" rows={rows} rowKey={d => d.id} defaultSort={{ key: 'health', dir: 'asc' }}
              empty={<div className="sl-empty"><strong>No devices match</strong></div>}
              columns={[
                { key: 'health', header: 'Health', sort: d => healthRank(d.health), cell: d => <HealthTag health={d.health} /> },
                { key: 'device', header: 'Device', sort: d => d.model, cell: d => <><div className="sl-table__primary">{d.model}</div><div className="sl-table__secondary sl-mono">{d.serial}</div></> },
                { key: 'kind', header: 'Type', sort: d => d.kind, cell: d => (d.kind === 'cinema-server' ? 'Cinema server' : 'DOOH player') },
                { key: 'theatre', header: 'Theatre', sort: d => d.theatreName, cell: d => <>{d.theatreName}<div className="sl-table__secondary">{d.city} · {d.exhibitorName}</div></> },
                { key: 'seen', header: 'Last seen', sort: d => d.lastSeenAt, cell: d => dateTime(d.lastSeenAt) },
                { key: 'log', header: 'Last log', sort: d => d.lastLogAt ?? '', cell: d => dateTime(d.lastLogAt) }
              ]} />
          )}
        </Query>
      </Card>
    </Page>
  );
}
