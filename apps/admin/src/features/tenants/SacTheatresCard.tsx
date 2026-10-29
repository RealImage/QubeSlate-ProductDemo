import { useEffect, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, type SacRow, type SacTheatreRow } from '@slate/api';
import { dateTime, num, type TheatreStatus } from '@slate/domain';
import { Button, Card, DataTable, EmptyState, ErrorState, Loading, Pagination, StatusTag, toast, type Column } from '@slate/ui';
import { ALL, FilterBar, SearchFilter, SelectFilter } from '../../components/Filters';
import { errorMessage } from '../../components/errors';

const PAGE_SIZE = 25;
const STATUS: Record<TheatreStatus, { label: string; tone: 'positive' | 'notice' | 'secondary' }> = {
  active: { label: 'Active', tone: 'positive' },
  inactive: { label: 'Inactive', tone: 'notice' },
  closed: { label: 'Closed', tone: 'secondary' }
};

const columns: Column<SacTheatreRow>[] = [
  {
    key: 'theatre', header: 'Theatre', cell: t => <>
      <div className="sl-table__primary">{t.name}</div>
      <div className="sl-table__secondary">{t.city}, {t.state}, {t.country}</div>
    </>
  },
  { key: 'chain', header: 'Chain', cell: t => t.chain },
  {
    key: 'screens', header: 'Screens', align: 'right', cell: t => t.screensForSac === t.screensTotal
      ? num(t.screensForSac)
      : <span title={`${t.screensTotal - t.screensForSac} of this theatre’s screens are sold by another SAC or not mapped yet`}>{num(t.screensForSac)} <span className="sl-muted">of {num(t.screensTotal)}</span></span>
  },
  {
    key: 'attributes', header: 'Attributes', cell: t => (
      <span className="sl-row" style={{ gap: 4 }}>
        <StatusTag tone={t.category === 'Premium' ? 'primary-secondary' : 'default'} size="xsmall">{t.category}</StatusTag>
        {t.formats.map(f => <StatusTag key={f} tone="secondary" size="xsmall">{f}</StatusTag>)}
      </span>
    )
  },
  {
    key: 'dooh', header: 'DOOH screens', align: 'right', cell: t => t.doohScreens
      ? <span title={`${t.doohGroups} display group${t.doohGroups === 1 ? '' : 's'}`}>{num(t.doohScreens)}</span>
      : <span className="sl-muted">—</span>
  },
  { key: 'status', header: 'Status', cell: t => <StatusTag tone={STATUS[t.status].tone}>{STATUS[t.status].label}</StatusTag> }
];

/**
 * Theatres and screens this SAC sells. The mapping is owned by CinemaDB (screen → SAC);
 * Sync pulls it. Search, filters and pagination run on the server: large SACs have 1,000+ theatres.
 */
export function SacTheatresCard({ sac, canSync }: { sac: SacRow; canSync: boolean }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [chain, setChain] = useState(ALL);
  const [location, setLocation] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => { setQ(search.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);
  const filter = (set: (v: string) => void) => (v: string) => { set(v); setPage(1); };

  const query = { q: q || undefined, chain: chain === ALL ? undefined : chain, location: location === ALL ? undefined : location, status: status === ALL ? undefined : (status as TheatreStatus), page, pageSize: PAGE_SIZE };
  const theatres = useQuery({
    queryKey: ['admin', 'sac-theatres', sac.id, query],
    queryFn: () => adminApi.sacTheatres(sac.id, query),
    placeholderData: keepPreviousData
  });

  const sync = useMutation({
    mutationFn: () => adminApi.syncSac(sac.id),
    onSuccess: r => {
      void qc.invalidateQueries({ queryKey: ['admin', 'sac-theatres', sac.id] });
      void qc.invalidateQueries({ queryKey: ['admin', 'sacs'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'exhibitors'] });
      toast.add({ variant: 'positive', message: `Synced with CinemaDB: ${r.added} screen${r.added === 1 ? '' : 's'} mapped, ${r.removed} released.` });
    },
    onError: e => toast.add({ variant: 'negative', message: errorMessage(e) })
  });

  const d = theatres.data;
  const pages = d ? Math.max(1, Math.ceil(d.total / d.pageSize)) : 1;
  const filtered = q !== '' || chain !== ALL || location !== ALL || status !== ALL;

  return (
    <Card flush title="Linked exhibitors"
      description={d ? `${num(d.totals.theatres)} theatres (${num(d.totals.activeTheatres)} active) · ${num(d.totals.screens)} screens · ${num(d.totals.doohScreens)} DOOH screens · mapped in CinemaDB` : 'Theatres and screens mapped to this SAC in CinemaDB.'}
      actions={
        <span className="sl-row" style={{ flexWrap: 'nowrap' }}>
          <span className="sl-muted sl-small">{d?.lastSyncedAt ? `Last synced ${dateTime(d.lastSyncedAt)}` : 'Never synced'}</span>
          {canSync && <Button variant="secondary" size="small" onPress={() => sync.mutate()} isPending={sync.isPending}>Sync theatres</Button>}
        </span>
      }>
      <FilterBar>
        <SearchFilter label="Search" value={search} onChange={setSearch} placeholder="Theatre name or location" />
        <SelectFilter label="Chain" value={chain} onChange={filter(setChain)} allLabel="All chains"
          options={(d?.facets.chains ?? []).map(f => ({ value: f.value, label: `${f.value} (${num(f.count)})` }))} />
        <SelectFilter label="Location" value={location} onChange={filter(setLocation)} allLabel="All locations"
          options={(d?.facets.locations ?? []).map(f => ({ value: f.value, label: `${f.value} (${num(f.count)})` }))} />
        <SelectFilter label="Status" value={status} onChange={filter(setStatus)} allLabel="All statuses"
          options={(d?.facets.statuses ?? []).map(f => ({ value: f.value, label: `${STATUS[f.value].label} (${num(f.count)})` }))} />
      </FilterBar>
      {!d ? (theatres.isLoading ? <Loading rows={6} /> : <ErrorState error={theatres.error} onRetry={() => void theatres.refetch()} />) : (
        <>
          <div style={{ opacity: theatres.isFetching && theatres.isPlaceholderData ? 0.6 : 1 }}>
            <DataTable rows={d.rows} columns={columns} rowKey={t => t.theatreId} pageSize={PAGE_SIZE} caption={`Theatres sold by ${sac.name}`}
              empty={filtered
                ? <EmptyState title="No theatres match">Try a different search or clear a filter.</EmptyState>
                : <EmptyState title="No theatres mapped yet">Map screens to {sac.name} in CinemaDB, then sync.</EmptyState>} />
          </div>
          {d.total > 0 && (
            <div className="sl-table-foot">
              <span>{num((d.page - 1) * d.pageSize + 1)}–{num(Math.min(d.page * d.pageSize, d.total))} of {num(d.total)} theatres</span>
              {pages > 1 && <Pagination totalPages={pages} currentPage={d.page} onPageChange={setPage} />}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
