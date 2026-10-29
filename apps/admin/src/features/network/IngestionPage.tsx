import { useMemo, useState } from 'react';
import { dateTime, num } from '@slate/domain';
import { Card, DataTable, Page, PageHeader, Query, StatusTag } from '@slate/ui';
import { ALL, FilterBar, SelectFilter, optionsOf } from '../../components/Filters';
import { type Health } from '../../components/Health';
import { useIngestion } from '../../components/queries';

/** A theatre is as healthy as its worst device state. */
function theatreHealth(r: { devices: number; online: number; stale: number; offline: number }): Health {
  if (r.devices === 0) return 'offline';
  if (r.online === 0 && r.offline > 0) return 'offline';
  if (r.offline > 0 || r.stale > 0) return 'stale';
  return 'online';
}
const RANK: Record<Health, number> = { offline: 0, stale: 1, online: 2 };
const TAG = { online: ['positive', 'Healthy'], stale: ['notice', 'Degraded'], offline: ['negative', 'Not reporting'] } as const;

export function IngestionPage() {
  const q = useIngestion();
  const [exhibitor, setExhibitor] = useState(ALL);
  const rows = useMemo(() => (q.data ?? []).filter(r => exhibitor === ALL || r.exhibitorName === exhibitor), [q.data, exhibitor]);
  return (
    <Page>
      <PageHeader eyebrow="Network" title="Play-log ingestion" description="Per-theatre device check-ins and play logs received in the last 24 hours. Worst first." />
      <Card flush>
        <FilterBar>
          <SelectFilter label="Exhibitor" value={exhibitor} onChange={setExhibitor} options={optionsOf((q.data ?? []).map(r => r.exhibitorName))} allLabel="All exhibitors" />
        </FilterBar>
        <Query q={q}>
          {() => (
            <DataTable caption="Play-log ingestion" rows={rows} rowKey={r => r.theatreId} defaultSort={{ key: 'health', dir: 'asc' }}
              empty={<div className="sl-empty"><strong>No theatres match</strong></div>}
              columns={[
                { key: 'health', header: 'Health', sort: r => RANK[theatreHealth(r)] * 1000 - r.offline * 10 - r.stale, cell: r => { const [tone, label] = TAG[theatreHealth(r)]; return <StatusTag tone={tone}>{label}</StatusTag>; } },
                { key: 'theatre', header: 'Theatre', sort: r => r.theatreName, cell: r => <><div className="sl-table__primary">{r.theatreName}</div><div className="sl-table__secondary">{r.city} · {r.exhibitorName}</div></> },
                { key: 'devices', header: 'Devices', align: 'right', sort: r => r.devices, cell: r => num(r.devices) },
                { key: 'online', header: 'Online', align: 'right', sort: r => r.online, cell: r => num(r.online) },
                { key: 'stale', header: 'Stale', align: 'right', sort: r => r.stale, cell: r => (r.stale ? <span style={{ color: 'var(--text-notice)' }}>{num(r.stale)}</span> : '0') },
                { key: 'offline', header: 'Offline', align: 'right', sort: r => r.offline, cell: r => (r.offline ? <span style={{ color: 'var(--text-negative)' }}>{num(r.offline)}</span> : '0') },
                { key: 'last', header: 'Last log', sort: r => r.lastLogAt ?? '', cell: r => dateTime(r.lastLogAt) },
                { key: 'plays', header: 'Plays logged (24h)', align: 'right', sort: r => r.logsLast24h, cell: r => num(r.logsLast24h) }
              ]} />
          )}
        </Query>
      </Card>
    </Page>
  );
}
