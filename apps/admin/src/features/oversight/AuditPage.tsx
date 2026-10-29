import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@slate/api';
import { dateTime } from '@slate/domain';
import { Card, DataTable, Page, PageHeader, Query, StatusTag } from '@slate/ui';
import { ALL, FilterBar, SearchFilter, SelectFilter } from '../../components/Filters';

export function AuditPage() {
  const q = useQuery({ queryKey: ['admin', 'audit'], queryFn: () => adminApi.audit() });
  const [portal, setPortal] = useState(ALL);
  const [action, setAction] = useState('');
  const rows = useMemo(() => (q.data ?? []).filter(e =>
    (portal === ALL || e.portal === portal) && (!action.trim() || e.action.toLowerCase().includes(action.trim().toLowerCase()))
  ), [q.data, portal, action]);
  return (
    <Page>
      <PageHeader eyebrow="Oversight" title="Audit log" description="Latest 500 actions across all portals, including support sessions." />
      <Card flush>
        <FilterBar>
          <SelectFilter label="Portal" value={portal} onChange={setPortal} allLabel="All portals"
            options={[{ value: 'advertiser', label: 'Advertiser' }, { value: 'sac', label: 'SAC' }, { value: 'admin', label: 'Admin' }]} />
          <SearchFilter label="Action" value={action} onChange={setAction} placeholder="e.g. gateway, campaign" />
        </FilterBar>
        <Query q={q}>
          {() => (
            <DataTable caption="Audit log" rows={rows} rowKey={e => e.id} defaultSort={{ key: 'at', dir: 'desc' }}
              empty={<div className="sl-empty"><strong>No events match</strong></div>}
              columns={[
                { key: 'at', header: 'Time', sort: e => e.at, cell: e => dateTime(e.at) },
                { key: 'actor', header: 'Actor', sort: e => e.actorName, cell: e => (
                  <>{e.actorName}{e.impersonatedBy && <div className="sl-table__secondary">via {e.impersonatedBy}</div>}</>
                ) },
                { key: 'portal', header: 'Portal', sort: e => e.portal, cell: e => <StatusTag tone="secondary">{e.portal}</StatusTag> },
                { key: 'action', header: 'Action', sort: e => e.action, cell: e => <span className="sl-mono">{e.action}</span> },
                { key: 'entity', header: 'Entity', sort: e => e.entity, cell: e => <>{e.entity}<div className="sl-table__secondary sl-mono">{e.entityId}</div></> },
                { key: 'detail', header: 'Detail', cell: e => e.detail }
              ]} />
          )}
        </Query>
      </Card>
    </Page>
  );
}
