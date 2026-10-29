import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi, useSession } from '@slate/api';
import { dateTime, ROLE_LABEL, type User } from '@slate/domain';
import { Button, Card, DataTable, Page, PageHeader, Query, StatusTag } from '@slate/ui';
import { SupportIcon } from 'prefab/icons';
import { ALL, FilterBar, SearchFilter, SelectFilter } from '../../components/Filters';
import { useAdminUsers, useSacs } from '../../components/queries';
import { SupportSessionDialog } from './SupportSessionDialog';

export function UsersPage() {
  const q = useAdminUsers();
  const sacs = useSacs();
  const advertisers = useQuery({ queryKey: ['admin', 'advertisers'], queryFn: adminApi.advertisers });
  const { can } = useSession();
  const [portal, setPortal] = useState(ALL);
  const [org, setOrg] = useState(ALL);
  const [search, setSearch] = useState('');
  const [target, setTarget] = useState<User | null>(null);

  const orgName = useMemo(() => {
    const m = new Map<string, string>([['qube', 'Qube Cinema']]);
    sacs.data?.forEach(s => m.set(s.id, s.name));
    advertisers.data?.forEach(a => m.set(a.id, a.name));
    return (u: User) => m.get(u.orgId) ?? u.orgId;
  }, [sacs.data, advertisers.data]);

  const orgOptions = useMemo(() => {
    const seen = new Map<string, string>();
    (q.data ?? []).filter(u => portal === ALL || u.portal === portal).forEach(u => seen.set(u.orgId, orgName(u)));
    return [...seen].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
  }, [q.data, portal, orgName]);

  const rows = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (q.data ?? []).filter(u =>
      (portal === ALL || u.portal === portal) && (org === ALL || u.orgId === org) && (!s || (u.name + u.email).toLowerCase().includes(s))
    );
  }, [q.data, portal, org, search]);

  const canImpersonate = can('impersonate');
  return (
    <Page>
      <PageHeader eyebrow="Oversight" title="Users" description="Every user across all portals. Support sessions are audited." />
      <Card flush>
        <FilterBar>
          <SelectFilter label="Portal" value={portal} onChange={v => { setPortal(v); setOrg(ALL); }} allLabel="All portals"
            options={[{ value: 'advertiser', label: 'Advertiser' }, { value: 'sac', label: 'SAC' }, { value: 'admin', label: 'Admin' }]} />
          <SelectFilter label="Organisation" value={org} onChange={setOrg} options={orgOptions} allLabel="All organisations" />
          <SearchFilter label="Search" value={search} onChange={setSearch} placeholder="Name or email" />
        </FilterBar>
        <Query q={q}>
          {() => (
            <DataTable caption="Users" rows={rows} rowKey={u => u.id} defaultSort={{ key: 'name', dir: 'asc' }}
              empty={<div className="sl-empty"><strong>No users match</strong></div>}
              columns={[
                { key: 'name', header: 'User', sort: u => u.name, cell: u => <><div className="sl-table__primary">{u.name}</div><div className="sl-table__secondary">{u.email}</div></> },
                { key: 'portal', header: 'Portal', sort: u => u.portal, cell: u => <StatusTag tone="secondary">{u.portal}</StatusTag> },
                { key: 'org', header: 'Organisation', sort: orgName, cell: orgName },
                { key: 'role', header: 'Role', sort: u => u.role, cell: u => ROLE_LABEL[u.role] },
                { key: 'status', header: 'Status', sort: u => u.status, cell: u => <StatusTag tone={u.status === 'active' ? 'positive' : u.status === 'invited' ? 'notice' : 'secondary'}>{u.status}</StatusTag> },
                { key: 'last', header: 'Last active', sort: u => u.lastActiveAt ?? '', cell: u => dateTime(u.lastActiveAt) },
                { key: 'act', header: <span className="sr-only">Actions</span>, cell: u => {
                  if (u.portal === 'admin') return null;
                  const btn = (
                    <Button variant="default" size="small" isDisabled={!canImpersonate} onPress={() => setTarget(u)}><SupportIcon />Start support session</Button>
                  );
                  return canImpersonate ? btn : <span title="Your role cannot start support sessions.">{btn}</span>;
                } }
              ]} />
          )}
        </Query>
      </Card>
      <SupportSessionDialog user={target} onClose={() => setTarget(null)} />
    </Page>
  );
}
