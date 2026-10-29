import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { adminApi, useSession, type SacRow, type SacSortKey } from '@slate/api';
import { dateTime, num, orDash } from '@slate/domain';
import { Button, Card, DataTable, EmptyState, ErrorState, Loading, Page, PageHeader, Pagination, type Column, type SortState } from '@slate/ui';
import { AddIcon } from 'prefab/icons';
import { FilterBar, SearchFilter } from '../../components/Filters';
import { SacStatusTag } from '../../components/SacStatusTag';
import { OnboardSacSheet } from './OnboardSacSheet';
import { SacActionsMenu } from './SacActionsMenu';

const PAGE_SIZE = 100;

const locationOf = (r: SacRow) => [r.location.city, r.location.country].filter(Boolean).join(', ');

/** Search boxes wait for a pause in typing before querying the server. */
function useDebounced(value: string, ms = 300) {
  const [v, setV] = useState(value.trim());
  useEffect(() => {
    const t = setTimeout(() => setV(value.trim()), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function SacsPage() {
  const nav = useNavigate();
  const { can } = useSession();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [place, setPlace] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState>({ key: 'name', dir: 'asc' });
  const q = useDebounced(search);
  const location = useDebounced(place);
  useEffect(() => setPage(1), [q, location, sort]);

  // Column keys double as the server's sort keys, so sorting covers every SAC, not just this page.
  const query = { q: q || undefined, location: location || undefined, sort: sort.key as SacSortKey, dir: sort.dir, page, pageSize: PAGE_SIZE };
  const list = useQuery({ queryKey: ['admin', 'sacs', 'page', query], queryFn: () => adminApi.sacs(query), placeholderData: keepPreviousData });
  const d = list.data;
  const pages = d ? Math.max(1, Math.ceil(d.total / d.pageSize)) : 1;
  // If the total shrinks (a filter, or a SAC changed elsewhere) the current page may no longer exist.
  useEffect(() => { if (d && page > pages) setPage(pages); }, [d, page, pages]);
  const filtered = q !== '' || location !== '';
  const canManage = can('tenants.manage');

  const columns: Column<SacRow>[] = [
    { key: 'name', header: 'SAC', sort: r => r.name, cell: r => <><div className="sl-table__primary">{r.name}</div><div className="sl-table__secondary">{orDash(locationOf(r))}</div></> },
    { key: 'theatres', header: 'Theatres', align: 'right', sort: r => r.theatres, cell: r => num(r.theatres) },
    { key: 'screens', header: 'Screens', align: 'right', sort: r => r.screens, cell: r => num(r.screens) },
    { key: 'advertisers', header: 'Advertisers', align: 'right', sort: r => r.advertisers, cell: r => num(r.advertisers) },
    { key: 'users', header: 'Users', align: 'right', sort: r => r.users, cell: r => num(r.users) },
    { key: 'connectedTheatres', header: 'Connected theatres', align: 'right', sort: r => r.connectedTheatres, cell: r => num(r.connectedTheatres) },
    { key: 'status', header: 'Status', sort: r => r.status, cell: r => <SacStatusTag status={r.status} /> },
    { key: 'createdAt', header: 'Created on', sort: r => r.createdAt, cell: r => dateTime(r.createdAt) },
    { key: 'updatedAt', header: 'Updated on', sort: r => r.updatedAt, cell: r => dateTime(r.updatedAt) },
    { key: 'updatedBy', header: 'Updated by', sort: r => r.updatedBy, cell: r => orDash(r.updatedBy) },
    {
      key: 'actions', header: <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Actions</span>, width: 56,
      cell: r => <SacActionsMenu sac={r} canManage={canManage} onView={() => nav(`/tenants/sacs/${r.id}`)} onEdit={() => nav(`/tenants/sacs/${r.id}?tab=profile&edit=details`)} />
    }
  ];

  return (
    <Page>
      <PageHeader eyebrow="Tenants" title="SACs" description="Screen Advertising Consolidators selling exhibitor inventory to advertisers."
        actions={canManage && <Button variant="primary" onPress={() => setOpen(true)}><AddIcon />Onboard SAC</Button>} />
      <Card flush>
        <FilterBar>
          <SearchFilter label="Search" value={search} onChange={setSearch} placeholder="SAC name" />
          <SearchFilter label="Location" value={place} onChange={setPlace} placeholder="City or country" />
        </FilterBar>
        {!d ? (list.isLoading ? <Loading rows={6} /> : <ErrorState error={list.error} onRetry={() => void list.refetch()} />) : (
          <>
            <div style={{ opacity: list.isFetching && list.isPlaceholderData ? 0.6 : 1 }}>
              <DataTable caption="SACs" rows={d.rows} columns={columns} rowKey={r => r.id} pageSize={PAGE_SIZE} onRowClick={r => nav(`/tenants/sacs/${r.id}`)} sort={sort} onSortChange={setSort}
                empty={filtered ? <EmptyState title="No SACs match">Try a different name or location.</EmptyState> : <EmptyState title="No SACs yet">Onboard the first SAC to get started.</EmptyState>} />
            </div>
            {d.total > PAGE_SIZE && (
              <div className="sl-table-foot">
                <span>{num((d.page - 1) * d.pageSize + 1)}–{num(Math.min(d.page * d.pageSize, d.total))} of {num(d.total)} SACs</span>
                <Pagination totalPages={pages} currentPage={d.page} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </Card>
      {/* Mounted only while open: the sheet loads every SAC to check URL uniqueness. */}
      {open && <OnboardSacSheet open onClose={() => setOpen(false)} />}
    </Page>
  );
}
