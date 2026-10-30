import { useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  AppliedFilters, FilterButton, FilterGroup, FilterOptions, FilterPanel, ListFooter, TableControls, useFilterDraft, usePage, type AppliedFilter
} from '@slate/ui';
import { PrototypeNote } from '../components/PrototypeNote';
import { compositions, routeTitles } from '../data/mockData';
import { fmtDate } from '../data/helpers';
import { EmptyState, PageHeader, StatusTag, Table, Td, Th } from '../components/ui/primitives';

const UNMAPPED = 'Unmapped';
const INGESTED = [{ id: '7', label: 'Last 7 days' }, { id: '30', label: 'Last 30 days' }, { id: '90', label: 'Last 90 days' }] as const;

interface CompFilters { status: string[]; format: string[]; duration: string[]; campaign: string[]; ingested: string }
const NO_FILTERS: CompFilters = { status: [], format: [], duration: [], campaign: [], ingested: '' };
const GROUP_LABEL: Record<Exclude<keyof CompFilters, 'ingested'>, string> = { status: 'Status', format: 'Format', duration: 'Duration', campaign: 'Campaign' };

const uniqueSorted = (xs: string[], numeric = false) =>
  [...new Set(xs)].sort((a, b) => (numeric ? Number(a) - Number(b) : a.localeCompare(b)));
const secLabel = (s: string) => `${s}s`;

/** Library, Unmapped and Archived share this page; keying by route gives each its own search, filters and page. */
export function Compositions() {
  const { pathname } = useLocation();
  return <CompositionList key={pathname} pathname={pathname} />;
}

function CompositionList({ pathname }: { pathname: string }) {
  const [, crumbLeaf, stubDescription] = routeTitles[pathname] || ['', '', ''];

  const [search, setSearch] = useState('');
  const [filters, setFiltersState] = useState<CompFilters>(NO_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [panelOpen, setPanelOpen] = useState(false);
  const [draft, setDraft] = useFilterDraft(filters, panelOpen);
  // Any change to what is shown starts again from the first page.
  const setFilters = (f: CompFilters) => { setFiltersState(f); setPage(1); };
  // Paging from the footer brings the top of the new page into view.
  const listRef = useRef<HTMLElement>(null);
  const goToPage = (p: number) => { setPage(p); listRef.current?.scrollIntoView({ block: 'start' }); };

  // The library this route shows, before search and filters.
  const library = useMemo(() => {
    if (pathname === '/content/archived') return compositions.filter(c => c.state === 'Archived');
    const live = compositions.filter(c => c.state !== 'Archived');
    return pathname === '/content/unmapped' ? live.filter(c => !c.campaign) : live;
  }, [pathname]);

  const options = useMemo(() => ({
    status: uniqueSorted(library.map(c => c.state)),
    format: uniqueSorted(library.map(c => c.format)),
    duration: uniqueSorted(library.map(c => String(c.sec)), true),
    campaign: uniqueSorted(library.map(c => c.campaign ?? UNMAPPED))
  }), [library]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const since = filters.ingested ? Date.now() - Number(filters.ingested) * 24 * 3600 * 1000 : null;
    const has = (picked: string[], v: string) => !picked.length || picked.includes(v);
    return library.filter(c =>
      (!term || c.name.toLowerCase().includes(term) || c.cpl.toLowerCase().includes(term)) &&
      has(filters.status, c.state) && has(filters.format, c.format) && has(filters.duration, String(c.sec)) &&
      has(filters.campaign, c.campaign ?? UNMAPPED) &&
      (since === null || (c.ingested !== '—' && new Date(c.ingested + 'T00:00:00').getTime() >= since)));
  }, [library, search, filters]);

  const { current, slice } = usePage(rows, pageSize, page);

  // Groups with a single option (e.g. Status on Archived) can't narrow anything, so they're hidden.
  const groups = (Object.keys(GROUP_LABEL) as (keyof typeof GROUP_LABEL)[]).filter(k => options[k].length > 1);
  const applied: AppliedFilter[] = [
    ...groups.flatMap(k => filters[k].map(v => ({
      key: `${k}:${v}`, label: GROUP_LABEL[k], value: k === 'duration' ? secLabel(v) : v,
      onRemove: () => setFilters({ ...filters, [k]: filters[k].filter(x => x !== v) })
    }))),
    ...(filters.ingested ? [{
      key: 'ingested', label: 'Ingested', value: INGESTED.find(o => o.id === filters.ingested)!.label,
      onRemove: () => setFilters({ ...filters, ingested: '' })
    }] : [])
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1400 }}>
      <PageHeader title={crumbLeaf} description={stubDescription} />
      <PrototypeNote />
      <section className="sl-card" ref={listRef} style={{ scrollMarginTop: 16 }}>
        <div className="sl-listbar">
          <div className="sl-listbar__search">
            <TableControls.Search placeholder="Search by name or CPL ID" value={search}
              onChange={v => { setSearch(v); setPage(1); }} onClear={() => { setSearch(''); setPage(1); }} />
          </div>
          <span className="sl-listbar__count" aria-live="polite">{rows.length.toLocaleString('en-IN')} of {library.length.toLocaleString('en-IN')} compositions</span>
          <FilterButton count={applied.length} onPress={() => setPanelOpen(true)} />
        </div>
        <AppliedFilters filters={applied} onClearAll={() => setFilters(NO_FILTERS)} />
        <div style={{ overflowX: 'auto' }}>
          <Table>
            <thead>
              <tr>
                <Th>Composition</Th><Th>Format</Th>
                <Th align="right">Duration</Th><Th align="right">Size</Th>
                <Th>Campaign</Th><Th>Ingested</Th><Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {slice.map(c => (
                <tr key={c.id}>
                  <Td>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-default)' }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-family-mono)' }}>{c.cpl}</div>
                  </Td>
                  <Td style={{ fontSize: 12.5, color: 'var(--grey-600)' }}>{c.format}</Td>
                  <Td align="right" style={{ fontVariantNumeric: 'tabular-nums' }}>{c.sec}s</Td>
                  <Td align="right" style={{ fontSize: 13, color: 'var(--grey-600)', fontVariantNumeric: 'tabular-nums' }}>{c.size}</Td>
                  <Td style={{ fontSize: 13, color: c.campaign ? 'var(--text-default)' : 'var(--orange-600)' }}>{c.campaign ?? UNMAPPED}</Td>
                  <Td style={{ fontSize: 12.5, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{c.ingested === '—' ? '—' : fmtDate(c.ingested)}</Td>
                  <Td><StatusTag tone={c.state === 'Available' ? 'positive' : c.state === 'Missing' ? 'negative' : c.state === 'Archived' ? 'default' : 'notice'}>{c.state}</StatusTag></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
        {rows.length === 0 && <EmptyState title="No compositions match" detail="Try a different search, or remove a filter." />}
        <ListFooter total={rows.length} page={current} pageSize={pageSize} noun="compositions"
          onPageChange={goToPage} onPageSizeChange={s => { setPageSize(s); goToPage(1); }} />
      </section>

      <FilterPanel isOpen={panelOpen} onOpenChange={setPanelOpen} onApply={() => setFilters(draft)}
        onClear={() => { setDraft(NO_FILTERS); setFilters(NO_FILTERS); }}>
        {groups.map(k => (
          <FilterGroup key={k} title={GROUP_LABEL[k]}>
            <FilterOptions options={options[k]} selected={draft[k]} onChange={v => setDraft({ ...draft, [k]: v })}
              labelOf={k === 'duration' ? secLabel : undefined} />
          </FilterGroup>
        ))}
        <FilterGroup title="Ingested">
          <div className="sl-row">
            {INGESTED.map(o => (
              <button key={o.id} type="button" className="sl-chip" aria-pressed={draft.ingested === o.id}
                onClick={() => setDraft({ ...draft, ingested: draft.ingested === o.id ? '' : o.id })}>{o.label}</button>
            ))}
          </div>
        </FilterGroup>
      </FilterPanel>
    </div>
  );
}
