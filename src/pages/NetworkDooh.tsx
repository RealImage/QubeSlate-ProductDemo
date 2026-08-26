import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useAppState } from '../state/AppStateContext';
import {
  theatreDefs, doohTypes, doohDayDefs, doohLoopHints, doohModeHints, doohSeed
} from '../data/mockData';
import type { DoohTheatreConfig, DoohGroup } from '../data/mockData';
import { doohPlace, doohGroupScreens, fmtDate } from '../data/helpers';
import type { DoohEditorState } from '../state/types';
import { Icon } from '../components/Icon';
import {
  Card, PageHeader, KpiGrid, Table, TableCard, Th, Td, StatusTag, Modal, chipTone
} from '../components/ui/primitives';

const inputStyle = { height: 36, padding: '0 12px', border: '1px solid #D3DAE2', borderRadius: 6, fontFamily: 'inherit', fontSize: 13.5, color: '#08090A', outline: 'none' } as const;
const fieldLabel = { fontSize: 12.5, fontWeight: 500, color: '#08090A' } as const;
const PAGE_SIZE = 100;

const SORT_FIELD: Record<string, 'name' | 'circuit' | 'count' | 'statusLabel' | 'updatedRaw' | 'updatedBy'> = {
  name: 'name', circuit: 'circuit', count: 'count', status: 'statusLabel', updatedOn: 'updatedRaw', updatedBy: 'updatedBy'
};

function formatUpdated(raw: string): string {
  if (!raw) return '—';
  return `${fmtDate(raw.slice(0, 10))} · ${raw.slice(11, 16)}`;
}

export function NetworkDooh() {
  const { state, patch, setNavGuard, pendingRoute, resolvePendingNav } = useAppState();
  const {
    doohSel, doohSearch, doohOpen, doohHover, doohEditor, doohDelete, doohDirty, doohSaved,
    doohData, doohPanel, doohSort, doohDir, doohPage, doohFilter
  } = state;
  const [localLeaveOpen, setLocalLeaveOpen] = useState(false);

  useEffect(() => {
    setNavGuard(() => doohDirty);
    return () => setNavGuard(null);
  }, [doohDirty, setNavGuard]);

  const store: Record<string, DoohTheatreConfig> = doohData || doohSeed;
  const total = (id: string) => doohGroupScreens(store[id]);

  const leaveOpen = localLeaveOpen || pendingRoute != null;
  const keepEditing = () => {
    if (pendingRoute != null) resolvePendingNav(false);
    else setLocalLeaveOpen(false);
  };
  const discard = () => {
    const hadPendingRoute = pendingRoute != null;
    patch({ doohDirty: false, doohSaved: false, doohData: null, doohEditor: null, doohSel: null });
    setLocalLeaveOpen(false);
    if (hadPendingRoute) resolvePendingNav(true);
  };
  const requestLeaveConfig = () => {
    if (doohDirty) setLocalLeaveOpen(true);
    else patch({ doohSel: null });
  };

  const mutate = (fn: (t: DoohTheatreConfig) => DoohTheatreConfig) => {
    if (!doohSel) return;
    patch({ doohData: { ...store, [doohSel]: fn(store[doohSel]) }, doohDirty: true, doohSaved: false });
  };

  /* ---------- list view ---------- */

  const listCalc = useMemo(() => {
    const q = doohSearch.trim().toLowerCase();
    const loc = doohFilter.location.trim().toLowerCase();
    const num = (v: string) => (v === '' ? null : Number(v));
    const minS = num(doohFilter.minScreens), maxS = num(doohFilter.maxScreens);
    const minG = num(doohFilter.minGroups), maxG = num(doohFilter.maxGroups);

    const rows = theatreDefs
      .filter(t => !q || `${t.name} ${t.circuit} ${t.city} ${t.id}`.toLowerCase().includes(q))
      .filter(t => {
        const n = total(t.id), gs = store[t.id] ? store[t.id].groups : [];
        if (doohFilter.status === 'configured' && n === 0) return false;
        if (doohFilter.status === 'pending' && n > 0) return false;
        if (loc) {
          const p = doohPlace(t);
          if (!`${p.city} ${p.state} ${p.country}`.toLowerCase().includes(loc)) return false;
        }
        if (minS != null && n < minS) return false;
        if (maxS != null && n > maxS) return false;
        if (minG != null && gs.length < minG) return false;
        if (maxG != null && gs.length > maxG) return false;
        if (doohFilter.types.length && !doohFilter.types.some(ty => gs.some(g => g.type === ty))) return false;
        return true;
      })
      .map(t => {
        const n = total(t.id);
        const groups = store[t.id] ? store[t.id].groups : [];
        const breakdown = doohTypes
          .map(ty => ({ label: ty, n: groups.filter(g => g.type === ty).reduce((a, g) => a + Number(g.screens), 0) }))
          .filter(b => b.n > 0);
        const meta = store[t.id];
        return {
          id: t.id, name: t.name, city: t.city, circuit: t.circuit, groupCount: groups.length,
          updatedRaw: meta ? meta.updatedOn : '',
          updatedOn: meta ? formatUpdated(meta.updatedOn) : '—',
          updatedBy: meta ? meta.updatedBy : '—',
          count: n, breakdown, noBreakdown: breakdown.length === 0,
          statusLabel: n > 0 ? 'Configured' : 'Pending',
          tone: n > 0 ? 'positive' : 'default',
          actionLabel: n > 0 ? 'Configure' : 'Configure DOOH'
        };
      });

    const sortField = SORT_FIELD[doohSort] || 'updatedRaw';
    const mul = doohDir === 'asc' ? 1 : -1;
    const sorted = rows.slice().sort((a, b) => {
      const x = a[sortField], y = b[sortField];
      return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))) * mul;
    });

    const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    const page = Math.min(doohPage, pageCount);
    const pageRows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const fActive: { key: string; label: string }[] = [];
    if (doohFilter.status !== 'all') fActive.push({ key: 'status', label: `Status: ${doohFilter.status === 'configured' ? 'Configured' : 'Pending'}` });
    if (loc) fActive.push({ key: 'location', label: `Location: ${doohFilter.location.trim()}` });
    if (minS != null || maxS != null) fActive.push({ key: 'screens', label: `Screens: ${minS ?? 0}–${maxS ?? '∞'}` });
    if (minG != null || maxG != null) fActive.push({ key: 'groups', label: `Groups: ${minG ?? 0}–${maxG ?? '∞'}` });
    if (doohFilter.types.length) fActive.push({ key: 'types', label: `${doohFilter.types.length} display type${doohFilter.types.length === 1 ? '' : 's'}` });

    const netTotal = theatreDefs.reduce((a, t) => a + total(t.id), 0);
    const netGroups = theatreDefs.reduce((a, t) => a + (store[t.id] ? store[t.id].groups.length : 0), 0);
    const allTotals = theatreDefs.map(t => total(t.id));

    const suggestions = Array.from(new Set(
      theatreDefs.flatMap(t => { const p = doohPlace(t); return [p.city, p.state, p.country]; }).filter(Boolean)
    ));

    const typeRows = doohTypes.map(ty => {
      const withType = theatreDefs.filter(t => (store[t.id] ? store[t.id].groups : []).some(g => g.type === ty));
      return {
        type: ty, on: doohFilter.types.includes(ty),
        color: withType.length ? '#08090A' : '#97A5B5',
        meta: withType.length ? `${withType.length} theatre${withType.length === 1 ? '' : 's'}` : 'none configured'
      };
    });

    return {
      pageRows, sorted, pageCount, page, fActive, netTotal, netGroups, allTotals, suggestions, typeRows
    };
  }, [doohSearch, doohFilter, doohSort, doohDir, doohPage, store]);

  const arrow = (key: string) => (doohSort === key ? (doohDir === 'asc' ? ' ▲' : ' ▼') : '');
  const onSort = (key: string) => patch(s => ({ doohSort: key, doohDir: s.doohSort === key && s.doohDir === 'desc' ? 'asc' : 'desc', doohPage: 1 }));
  const setFilter = (p: Partial<typeof doohFilter>) => patch(s => ({ doohFilter: { ...s.doohFilter, ...p } }));
  const clearFilter = (key: string) => {
    if (key === 'status') setFilter({ status: 'all' });
    else if (key === 'location') setFilter({ location: '' });
    else if (key === 'screens') setFilter({ minScreens: '', maxScreens: '' });
    else if (key === 'groups') setFilter({ minGroups: '', maxGroups: '' });
    else setFilter({ types: [] });
  };
  const clearAllFilters = () => setFilter({ status: 'all', location: '', minScreens: '', maxScreens: '', minGroups: '', maxGroups: '', types: [] });
  const toggleFilterType = (ty: string) => patch(s => ({
    doohFilter: { ...s.doohFilter, types: s.doohFilter.types.includes(ty) ? s.doohFilter.types.filter(x => x !== ty) : s.doohFilter.types.concat([ty]) }
  }));

  if (!doohSel) {
    const { pageRows, sorted, pageCount, page, fActive, netTotal, netGroups, allTotals, suggestions, typeRows } = listCalc;
    const kpis = [
      { label: 'Theatres configured', value: `${theatreDefs.filter(t => total(t.id) > 0).length} of ${theatreDefs.length}` },
      { label: 'DOOH screens', value: netTotal.toLocaleString('en-US') },
      { label: 'Display groups', value: String(netGroups) }
    ];
    const statusChips = ['all', 'configured', 'pending'].map(v => ({
      value: v, label: v === 'all' ? 'All' : v === 'configured' ? 'Configured' : 'Pending', ...chipTone(doohFilter.status === v)
    }));

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1400 }}>
        <PageHeader title="Network DOOH" description="Digital advertising surfaces configured inside each theatre — LED walls, foyer, lobby, concession and corridor screens. This is physical inventory only; sellable capacity is derived later by campaign booking." />
        <KpiGrid items={kpis} minWidth={200} />

        <Card padding="14px 16px" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            value={doohSearch}
            onChange={e => patch({ doohSearch: e.target.value })}
            placeholder="Search theatres, circuits or theatre IDs…"
            style={{ ...inputStyle, flex: '1 1 auto', minWidth: 0 }}
          />
          <button
            onClick={() => patch({ doohPanel: true })}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flex: '0 0 auto', height: 36, padding: '0 14px', border: `1px solid ${fActive.length ? '#084782' : '#D3DAE2'}`, borderRadius: 6, background: fActive.length ? '#F0F5FA' : '#FFFFFF', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: '#084782', cursor: 'pointer' }}
          >
            Filter
            {fActive.length > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 18, height: 18, padding: '0 5px', borderRadius: 1000, background: '#084782', fontSize: 11, fontWeight: 600, color: '#FFFFFF' }}>{fActive.length}</span>
            )}
          </button>
        </Card>

        {fActive.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {fActive.map(c => (
              <span key={c.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid #CFDCEA', borderRadius: 1000, background: '#F0F5FA', padding: '4px 6px 4px 12px', fontSize: 12, color: '#084782' }}>
                {c.label}
                <button onClick={() => clearFilter(c.key)} style={{ border: 'none', background: 'none', padding: '0 4px', fontFamily: 'inherit', fontSize: 13, lineHeight: 1, color: '#084782', cursor: 'pointer' }}>×</button>
              </span>
            ))}
            <button onClick={clearAllFilters} style={{ border: 'none', background: 'none', padding: '4px 6px', fontFamily: 'inherit', fontSize: 12, fontWeight: 500, color: '#677A90', cursor: 'pointer' }}>Clear all</button>
          </div>
        )}

        <TableCard>
          <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
            <Table>
              <thead>
                <tr>
                  {([['name', 'Theatre', 'left'], ['circuit', 'Circuit / Chain', 'left'], ['count', 'Screen Count', 'right'], ['status', 'Status', 'left'], ['updatedOn', 'Updated On', 'left'], ['updatedBy', 'Updated By', 'left']] as const).map(([key, label, align]) => (
                    <Th key={key} align={align}>
                      <button onClick={() => onSort(key)} style={{ border: 0, background: 'transparent', font: 'inherit', color: 'inherit', cursor: 'pointer', padding: 0 }}>{label}{arrow(key)}</button>
                    </Th>
                  ))}
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map(r => (
                  <tr key={r.id}>
                    <Td>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: '#08090A' }}>{r.name}</div>
                      <div style={{ fontSize: 11.5, color: '#677A90' }}>{r.city}</div>
                      <div style={{ fontSize: 11.5, color: '#97A5B5', fontVariantNumeric: 'tabular-nums' }}>{r.id}</div>
                    </Td>
                    <Td style={{ fontSize: 13, color: '#4A5A6C' }}>{r.circuit}</Td>
                    <Td
                      align="right"
                      style={{ position: 'relative' }}
                      onMouseEnter={() => patch({ doohHover: r.id })}
                      onMouseLeave={() => patch({ doohHover: null })}
                    >
                      <span style={{ fontVariantNumeric: 'tabular-nums', borderBottom: '1px dotted #B9C4D0', cursor: 'default' }}>{r.count}</span>
                      {doohHover === r.id && (
                        <div style={{ position: 'absolute', right: 16, top: 'calc(100% - 4px)', zIndex: 30, minWidth: 250, background: '#FFFFFF', border: '1px solid #E1E4E9', borderRadius: 8, boxShadow: '0 6px 20px rgba(4,38,82,.12)', padding: '12px 14px', textAlign: 'left' }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#08090A', paddingBottom: 8, borderBottom: '1px solid #EDF0F3' }}>Total Screens: {r.count}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 8 }}>
                            {r.breakdown.map(b => (
                              <div key={b.label} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 20 }}>
                                <span style={{ fontSize: 12, color: '#677A90' }}>{b.label}</span>
                                <span style={{ fontSize: 12, color: '#08090A', fontVariantNumeric: 'tabular-nums' }}>{b.n}</span>
                              </div>
                            ))}
                            {r.noBreakdown && <span style={{ fontSize: 12, color: '#97A5B5' }}>No display groups configured yet.</span>}
                          </div>
                        </div>
                      )}
                    </Td>
                    <Td><StatusTag tone={r.tone}>{r.statusLabel}</StatusTag></Td>
                    <Td style={{ fontSize: 12.5, color: '#4A5A6C', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{r.updatedOn}</Td>
                    <Td style={{ fontSize: 12.5, color: '#677A90', whiteSpace: 'nowrap' }}>{r.updatedBy}</Td>
                    <Td align="right">
                      <button
                        onClick={() => patch({ doohSel: r.id, doohSaved: false, doohHover: null })}
                        style={{ border: '1px solid #084782', borderRadius: 6, background: '#084782', padding: '6px 12px', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500, color: '#FFFFFF', cursor: 'pointer' }}
                      >
                        {r.actionLabel}
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          {sorted.length === 0 && (
            <div style={{ padding: '40px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#08090A' }}>No theatres match these filters</div>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#677A90' }}>Widen the screen-count range or clear a filter to see more theatres.</p>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '12px 20px', borderTop: '1px solid #EDF0F3' }}>
            <span style={{ fontSize: 12.5, color: '#677A90' }}>
              {sorted.length === 0 ? 'No theatres' : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, sorted.length)} of ${sorted.length} theatres · 100 per page`}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12.5, color: '#97A5B5' }}>Page {page} of {pageCount}</span>
              <button disabled={page <= 1} onClick={() => patch(s => ({ doohPage: Math.max(1, s.doohPage - 1) }))} style={{ border: '1px solid #D3DAE2', borderRadius: 6, background: '#FFFFFF', padding: '5px 11px', fontFamily: 'inherit', fontSize: 12.5, color: '#4A5A6C', cursor: 'pointer' }}>Previous</button>
              <button disabled={page >= pageCount} onClick={() => patch(s => ({ doohPage: s.doohPage + 1 }))} style={{ border: '1px solid #D3DAE2', borderRadius: 6, background: '#FFFFFF', padding: '5px 11px', fontFamily: 'inherit', fontSize: 12.5, color: '#4A5A6C', cursor: 'pointer' }}>Next</button>
            </div>
          </div>
        </TableCard>

        {doohPanel && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', justifyContent: 'flex-end', background: 'rgba(4,38,82,.24)' }}>
            <div style={{ width: 380, maxWidth: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#FFFFFF', boxShadow: '-8px 0 32px rgba(4,38,82,.18)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, padding: '20px 24px', borderBottom: '1px solid #EDF0F3' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#08090A' }}>Filter theatres</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#677A90' }}>{sorted.length} of {theatreDefs.length} theatres match</p>
                </div>
                <button onClick={() => patch({ doohPanel: false })} style={{ border: 'none', background: 'none', padding: '0 2px', fontFamily: 'inherit', fontSize: 18, lineHeight: 1, color: '#677A90', cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ flex: '1 1 auto', overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: '#677A90' }}>Theatre status</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {statusChips.map(c => (
                      <button key={c.value} onClick={() => setFilter({ status: c.value })} style={{ border: `1px solid ${c.border}`, borderRadius: 1000, background: c.bg, padding: '6px 14px', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500, color: c.color, cursor: 'pointer' }}>{c.label}</button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: '#677A90' }}>Location</span>
                  <input value={doohFilter.location} onChange={e => setFilter({ location: e.target.value })} placeholder="City, state or country" style={inputStyle} />
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {suggestions.map(l => (
                      <button key={l} onClick={() => setFilter({ location: l })} style={{ border: '1px solid #E1E4E9', borderRadius: 1000, background: '#FFFFFF', padding: '4px 10px', fontFamily: 'inherit', fontSize: 11.5, color: '#4A5A6C', cursor: 'pointer' }}>{l}</button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: '#677A90' }}>Screen count</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="number" min={0} value={doohFilter.minScreens} onChange={e => setFilter({ minScreens: e.target.value })} placeholder="Min" style={{ ...inputStyle, width: '100%' }} />
                    <span style={{ fontSize: 12.5, color: '#97A5B5' }}>to</span>
                    <input type="number" min={0} value={doohFilter.maxScreens} onChange={e => setFilter({ maxScreens: e.target.value })} placeholder="Max" style={{ ...inputStyle, width: '100%' }} />
                  </div>
                  <span style={{ fontSize: 11.5, color: '#97A5B5' }}>Network range: {Math.min(...allTotals)} – {Math.max(...allTotals)} screens</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: '#677A90' }}>Available groups</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="number" min={0} value={doohFilter.minGroups} onChange={e => setFilter({ minGroups: e.target.value })} placeholder="Min" style={{ ...inputStyle, width: '100%' }} />
                    <span style={{ fontSize: 12.5, color: '#97A5B5' }}>to</span>
                    <input type="number" min={0} value={doohFilter.maxGroups} onChange={e => setFilter({ maxGroups: e.target.value })} placeholder="Max" style={{ ...inputStyle, width: '100%' }} />
                  </div>
                  <span style={{ fontSize: 11.5, color: '#97A5B5' }}>Number of display groups configured at the theatre.</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: '#677A90' }}>Display types configured</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {typeRows.map(t => (
                      <label key={t.type} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '7px 8px', borderRadius: 6, background: t.on ? '#F0F5FA' : 'transparent', cursor: 'pointer' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <input type="checkbox" checked={t.on} onChange={() => toggleFilterType(t.type)} style={{ width: 16, height: 16, accentColor: '#084782', cursor: 'pointer' }} />
                          <span style={{ fontSize: 13, color: t.color }}>{t.type}</span>
                        </span>
                        <span style={{ fontSize: 11.5, color: '#97A5B5', fontVariantNumeric: 'tabular-nums' }}>{t.meta}</span>
                      </label>
                    ))}
                  </div>
                  <span style={{ fontSize: 11.5, color: '#97A5B5' }}>Matches theatres configured with any selected display type.</span>
                </div>
              </div>
              <div style={{ padding: '16px 24px', borderTop: '1px solid #EDF0F3', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <button onClick={clearAllFilters} style={{ border: 'none', background: 'none', padding: 0, fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: '#677A90', cursor: 'pointer' }}>Clear all</button>
                <button onClick={() => patch({ doohPanel: false })} style={{ border: '1px solid #084782', borderRadius: 6, background: '#084782', padding: '9px 18px', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: '#FFFFFF', cursor: 'pointer' }}>Show {sorted.length} theatres</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ---------- config view ---------- */

  const theatre = theatreDefs.find(t => t.id === doohSel)!;
  const rec = store[doohSel];
  const place = doohPlace(theatre);
  const dTotal = rec.groups.reduce((a, g) => a + Number(g.screens), 0);
  const dHoursError = doohDayDefs.every(d => !rec.hours[d.key][2]);

  const days = doohDayDefs.map(d => {
    const [start, end, on] = rec.hours[d.key];
    const crosses = on && end <= start;
    return {
      key: d.key, label: d.label, on, start, end,
      note: !on ? 'Closed' : crosses ? 'crosses midnight' : '',
      textColor: on ? '#08090A' : '#97A5B5', inputBg: on ? '#FFFFFF' : '#F7FAFC'
    };
  });

  const typeSections = doohTypes.map(ty => {
    const groups = rec.groups.filter(g => g.type === ty);
    const n = groups.reduce((a, g) => a + Number(g.screens), 0);
    const open = doohOpen.includes(ty);
    return {
      type: ty, open, headBg: open ? '#F7FAFC' : '#FFFFFF',
      countLabel: `${n} ${n === 1 ? 'Screen' : 'Screens'}`, countColor: n > 0 ? '#4A5A6C' : '#97A5B5',
      groups: groups.map(g => ({ ...g, loopLabel: g.loop === 'Scheduled' ? `Scheduled — ${g.loopSecs}s` : g.loop }))
    };
  });

  const onHours = (day: string, field: 'on' | 'start' | 'end', value: string | boolean) => mutate(t => {
    const hours = { ...t.hours };
    const row: [string, string, boolean] = [...hours[day]];
    if (field === 'on') row[2] = value as boolean; else if (field === 'start') row[0] = value as string; else row[1] = value as string;
    hours[day] = row;
    return { ...t, hours };
  });

  const toggleType = (ty: string) => patch(s => ({ doohOpen: s.doohOpen.includes(ty) ? s.doohOpen.filter(x => x !== ty) : s.doohOpen.concat([ty]) }));

  const addGroup = (ty: string) => {
    patch(s => ({ doohOpen: s.doohOpen.includes(ty) ? s.doohOpen : s.doohOpen.concat([ty]) }));
    patch({ doohEditor: { id: null, type: ty, name: '', screens: 1, orientation: 'Horizontal', mode: 'Independent Screens', loop: 'Scheduled', loopSecs: 60, errors: [] } });
  };
  const editGroup = (g: DoohGroup) => patch({ doohEditor: { ...g, errors: [] } });
  const onEditorField = (field: keyof DoohEditorState, value: string) => patch(s => ({ doohEditor: s.doohEditor ? { ...s.doohEditor, [field]: value } : s.doohEditor }));
  const cancelGroup = () => patch({ doohEditor: null });

  const saveGroup = () => {
    if (!doohEditor) return;
    const ed = doohEditor;
    const name = String(ed.name || '').trim();
    const screens = Number(ed.screens);
    const errors: string[] = [];
    if (!name) errors.push('Group Name is required.');
    else if (rec.groups.some(g => g.id !== ed.id && g.name.toLowerCase() === name.toLowerCase())) errors.push('Group Name must be unique within this theatre.');
    if (!Number.isInteger(screens) || screens < 1) errors.push('Screen Count must be a whole number of 1 or more.');
    if (ed.loop === 'Scheduled' && !(Number(ed.loopSecs) > 0)) errors.push('Scheduled loop duration must be greater than 0 seconds.');
    if (errors.length) { patch({ doohEditor: { ...ed, errors } }); return; }
    const record: DoohGroup = {
      id: ed.id || `dg-${Date.now()}`, type: ed.type, name, screens,
      orientation: ed.orientation, mode: ed.mode, loop: ed.loop, loopSecs: Number(ed.loopSecs) || 60
    };
    mutate(t => ({ ...t, groups: ed.id ? t.groups.map(g => (g.id === ed.id ? record : g)) : t.groups.concat([record]) }));
    patch({ doohEditor: null });
  };

  const askDelete = (g: DoohGroup) => patch({ doohDelete: { id: g.id, name: g.name, screens: g.screens } });
  const cancelDelete = () => patch({ doohDelete: null });
  const confirmDelete = () => {
    if (!doohDelete) return;
    const id = doohDelete.id;
    mutate(t => ({ ...t, groups: t.groups.filter(g => g.id !== id) }));
    patch({ doohDelete: null });
  };

  const saveConfig = () => {
    if (!doohSel) return;
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const updatedOn = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
    patch({
      doohData: { ...store, [doohSel]: { ...store[doohSel], updatedOn, updatedBy: 'You' } },
      doohDirty: false, doohSaved: true
    });
  };

  const loopOptions = ['Scheduled', 'Synchronized with Screen', 'Free Duration'].map(v => ({
    value: v, hint: doohLoopHints[v], on: !!doohEditor && doohEditor.loop === v,
    border: doohEditor && doohEditor.loop === v ? '#084782' : '#E7EBF0',
    bg: doohEditor && doohEditor.loop === v ? '#F0F5FA' : '#FFFFFF'
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1180 }}>
      <button onClick={requestLeaveConfig} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: 'none', padding: 0, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500, color: '#084782', cursor: 'pointer' }}>
        <Icon name="ChevronLeft" size={14} /> Network DOOH
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.015em', color: '#08090A' }}>{theatre.name}</h1>
          <p style={{ margin: '5px 0 0', fontSize: 13.5, color: '#677A90' }}>{place.city} · {theatre.id} · {theatre.circuit}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {doohDirty && <span style={{ fontSize: 12.5, color: '#E65C00' }}>Unsaved changes</span>}
          {doohSaved && !doohDirty && <span style={{ fontSize: 12.5, color: '#0F7B3F' }}>Changes saved</span>}
          <button onClick={requestLeaveConfig} style={{ border: '1px solid #D3DAE2', borderRadius: 6, background: '#FFFFFF', padding: '8px 14px', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: '#4A5A6C', cursor: 'pointer' }}>Cancel</button>
          <button onClick={saveConfig} style={{ border: '1px solid #084782', borderRadius: 6, background: '#084782', padding: '8px 14px', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: '#FFFFFF', cursor: 'pointer' }}>Save Changes</button>
        </div>
      </div>

      {rec.groups.length === 0 && (
        <Card padding="44px 32px" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#08090A' }}>No Network DOOH inventory configured for this theatre.</div>
          <p style={{ margin: '8px auto 18px', maxWidth: 420, fontSize: 13, color: '#677A90', lineHeight: 1.6 }}>Add display groups under a display type to record the digital surfaces this theatre operates.</p>
          <button onClick={() => addGroup('Lobby')} style={{ border: '1px solid #084782', borderRadius: 6, background: '#084782', padding: '9px 16px', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: '#FFFFFF', cursor: 'pointer' }}>Configure DOOH Inventory</button>
        </Card>
      )}

      <Card>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: '#08090A' }}>Daily Operating Hours</h3>
            <p style={{ margin: 0, fontSize: 12.5, color: '#677A90' }}>Configured once per theatre. Periods crossing midnight are supported (18:00 – 01:00).</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => mutate(t => ({ ...t, hoursMode: 'Scheduled' }))} style={{ border: '1px solid #084782', borderRadius: 6, background: '#F0F5FA', padding: '7px 13px', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500, color: '#084782', cursor: 'pointer' }}>Scheduled</button>
            <span title="Version 2 — Coming Soon" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px dashed #D3DAE2', borderRadius: 6, background: '#F7FAFC', padding: '7px 13px', fontSize: 12.5, color: '#97A5B5', cursor: 'not-allowed' }}>
              Synchronized with Theatre POS<StatusTag tone="default">V2</StatusTag>
            </span>
          </div>
        </div>
        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {days.map(d => (
            <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '7px 0', borderBottom: '1px solid #F2F5F8' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, width: 150, cursor: 'pointer' }}>
                <input type="checkbox" checked={d.on} onChange={e => onHours(d.key, 'on', e.target.checked)} style={{ width: 16, height: 16, accentColor: '#084782', cursor: 'pointer' }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: '#08090A' }}>{d.label}</span>
              </label>
              <input type="time" value={d.start} disabled={!d.on} onChange={e => onHours(d.key, 'start', e.target.value)} style={{ height: 32, padding: '0 8px', border: '1px solid #D3DAE2', borderRadius: 6, fontFamily: 'inherit', fontSize: 12.5, color: d.textColor, background: d.inputBg, outline: 'none' }} />
              <span style={{ fontSize: 12.5, color: '#97A5B5' }}>to</span>
              <input type="time" value={d.end} disabled={!d.on} onChange={e => onHours(d.key, 'end', e.target.value)} style={{ height: 32, padding: '0 8px', border: '1px solid #D3DAE2', borderRadius: 6, fontFamily: 'inherit', fontSize: 12.5, color: d.textColor, background: d.inputBg, outline: 'none' }} />
              <span style={{ fontSize: 12, color: '#677A90' }}>{d.note}</span>
            </div>
          ))}
          {dHoursError && <div style={{ marginTop: 6, padding: '10px 12px', border: '1px solid #F0C4C7', borderRadius: 6, background: '#FDF2F2', fontSize: 12.5, color: '#CF1322' }}>At least one operating day must be configured.</div>}
        </div>
      </Card>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#08090A' }}>Display Types</h3>
        <span style={{ fontSize: 13, color: '#677A90' }}>Theatre Screen Count <strong style={{ color: '#08090A', fontVariantNumeric: 'tabular-nums' }}>{dTotal.toLocaleString('en-US')}</strong> · calculated from display groups</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {typeSections.map(t => (
          <Card key={t.type} padding={0} style={{ overflow: 'hidden' }}>
            <button onClick={() => toggleType(t.type)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, width: '100%', border: 'none', background: t.headBg, padding: '14px 20px', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, color: '#677A90', width: 10 }}>{t.open ? '▾' : '▸'}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#08090A' }}>{t.type}</span>
              </span>
              <span style={{ fontSize: 12.5, color: t.countColor, fontVariantNumeric: 'tabular-nums' }}>{t.countLabel}</span>
            </button>
            {t.open && (
              <div style={{ borderTop: '1px solid #EDF0F3', padding: '16px 20px' }}>
                {t.groups.length > 0 && (
                  <Table>
                    <thead>
                      <tr>
                        <Th style={{ padding: '6px 12px 8px 0' }}>Display Group</Th>
                        <Th align="right" style={{ padding: '6px 12px 8px' }}>Screens</Th>
                        <Th style={{ padding: '6px 12px 8px' }}>Orientation</Th>
                        <Th style={{ padding: '6px 12px 8px' }}>Mode</Th>
                        <Th style={{ padding: '6px 12px 8px' }}>Loop</Th>
                        <Th align="right" style={{ padding: '6px 0 8px 12px' }}>Actions</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {t.groups.map(g => (
                        <tr key={g.id}>
                          <td style={{ padding: '10px 12px 10px 0', borderTop: '1px solid #F2F5F8', fontSize: 13, fontWeight: 500, color: '#08090A' }}>{g.name}</td>
                          <td style={{ padding: '10px 12px', borderTop: '1px solid #F2F5F8', fontSize: 13, color: '#08090A', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{g.screens}</td>
                          <td style={{ padding: '10px 12px', borderTop: '1px solid #F2F5F8', fontSize: 12.5, color: '#4A5A6C' }}>{g.orientation}</td>
                          <td style={{ padding: '10px 12px', borderTop: '1px solid #F2F5F8', fontSize: 12.5, color: '#4A5A6C' }}>{g.mode}</td>
                          <td style={{ padding: '10px 12px', borderTop: '1px solid #F2F5F8', fontSize: 12.5, color: '#677A90' }}>{g.loopLabel}</td>
                          <td style={{ padding: '10px 0 10px 12px', borderTop: '1px solid #F2F5F8', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <span style={{ display: 'inline-flex', gap: 8 }}>
                              <button onClick={() => editGroup(g)} style={{ border: '1px solid #D3DAE2', borderRadius: 6, background: '#FFFFFF', padding: '5px 10px', fontFamily: 'inherit', fontSize: 12, fontWeight: 500, color: '#084782', cursor: 'pointer' }}>Edit</button>
                              <button onClick={() => askDelete(g)} style={{ border: '1px solid #D3DAE2', borderRadius: 6, background: '#FFFFFF', padding: '5px 10px', fontFamily: 'inherit', fontSize: 12, fontWeight: 500, color: '#CF1322', cursor: 'pointer' }}>Delete</button>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
                {t.groups.length === 0 && <p style={{ margin: '0 0 14px', fontSize: 13, color: '#677A90' }}>No display groups configured.</p>}
                <button onClick={() => addGroup(t.type)} style={{ marginTop: 14, border: '1px solid #D3DAE2', borderRadius: 6, background: '#FFFFFF', padding: '7px 12px', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500, color: '#084782', cursor: 'pointer' }}>+ Add Display Group</button>
              </div>
            )}
          </Card>
        ))}
      </div>

      <p style={{ margin: 0, fontSize: 12, color: '#97A5B5', lineHeight: 1.6, maxWidth: 760 }}>Screen Count is physical inventory. A synchronized group of 8 screens may be sold as a single advertising unit — available seconds, loop position and sellable capacity are resolved by campaign booking, not here.</p>

      {doohEditor && (
        <Modal maxWidth={520}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #EDF0F3' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#08090A' }}>{doohEditor.id ? 'Edit Display Group' : 'New Display Group'}</h3>
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#677A90' }}>{doohEditor.type} · {theatre.name}</p>
          </div>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={fieldLabel}>Group Name</span>
              <input value={doohEditor.name} onChange={e => onEditorField('name', e.target.value)} placeholder="Main Foyer LED Wall" style={inputStyle} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={fieldLabel}>Screen Count</span>
              <input type="number" min={1} value={doohEditor.screens} onChange={e => onEditorField('screens', e.target.value)} style={inputStyle} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={fieldLabel}>Screen Orientation</span>
              <select value={doohEditor.orientation} onChange={(e: ChangeEvent<HTMLSelectElement>) => onEditorField('orientation', e.target.value)} style={{ ...inputStyle, background: '#FFFFFF' }}>
                <option value="Horizontal">Horizontal</option>
                <option value="Vertical">Vertical</option>
                <option value="Full Container">Full Container</option>
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={fieldLabel}>Screen Mode</span>
              <select value={doohEditor.mode} onChange={(e: ChangeEvent<HTMLSelectElement>) => onEditorField('mode', e.target.value)} style={{ ...inputStyle, background: '#FFFFFF' }}>
                <option value="Independent Screens">Independent Screens</option>
                <option value="Synchronized Screens">Synchronized Screens</option>
                <option value="Single Canvas">Single Canvas</option>
              </select>
              <span style={{ fontSize: 11.5, color: '#677A90', lineHeight: 1.5 }}>{doohModeHints[doohEditor.mode]}</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={fieldLabel}>Loop Duration</span>
              {loopOptions.map(o => (
                <label key={o.value} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, border: `1px solid ${o.border}`, borderRadius: 6, background: o.bg, padding: '10px 12px', cursor: 'pointer' }}>
                  <input type="radio" name="doohLoop" checked={o.on} onChange={() => onEditorField('loop', o.value)} style={{ marginTop: 2, accentColor: '#084782', cursor: 'pointer' }} />
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#08090A' }}>{o.value}</span>
                    <span style={{ fontSize: 11.5, color: '#677A90', lineHeight: 1.5 }}>{o.hint}</span>
                  </span>
                </label>
              ))}
              {doohEditor.loop === 'Scheduled' && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="number" min={1} value={doohEditor.loopSecs} onChange={e => onEditorField('loopSecs', e.target.value)} style={{ ...inputStyle, width: 100, textAlign: 'right' }} />
                  <span style={{ fontSize: 12.5, color: '#677A90' }}>seconds</span>
                </label>
              )}
            </div>
            {doohEditor.errors.length > 0 && (
              <div style={{ padding: '10px 12px', border: '1px solid #F0C4C7', borderRadius: 6, background: '#FDF2F2' }}>
                {doohEditor.errors.map((err, i) => <div key={i} style={{ fontSize: 12.5, color: '#CF1322', lineHeight: 1.6 }}>{err}</div>)}
              </div>
            )}
          </div>
          <div style={{ padding: '16px 24px', borderTop: '1px solid #EDF0F3', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button onClick={cancelGroup} style={{ border: '1px solid #D3DAE2', borderRadius: 6, background: '#FFFFFF', padding: '8px 14px', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: '#4A5A6C', cursor: 'pointer' }}>Cancel</button>
            <button onClick={saveGroup} style={{ border: '1px solid #084782', borderRadius: 6, background: '#084782', padding: '8px 14px', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: '#FFFFFF', cursor: 'pointer' }}>{doohEditor.id ? 'Save Group' : 'Add Group'}</button>
          </div>
        </Modal>
      )}

      {doohDelete && (
        <Modal>
          <div style={{ padding: 24 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600, color: '#08090A' }}>Delete "{doohDelete.name}"?</h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#677A90', lineHeight: 1.6 }}>This will remove {doohDelete.screens} configured screens from this theatre's Network DOOH inventory. The theatre itself is not affected.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={cancelDelete} style={{ border: '1px solid #D3DAE2', borderRadius: 6, background: '#FFFFFF', padding: '8px 14px', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: '#4A5A6C', cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmDelete} style={{ border: '1px solid #CF1322', borderRadius: 6, background: '#CF1322', padding: '8px 14px', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: '#FFFFFF', cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </Modal>
      )}

      {leaveOpen && (
        <Modal maxWidth={420}>
          <div style={{ padding: 24 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600, color: '#08090A' }}>You have unsaved changes.</h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#677A90', lineHeight: 1.6 }}>Discard changes?</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={keepEditing} style={{ border: '1px solid #D3DAE2', borderRadius: 6, background: '#FFFFFF', padding: '8px 14px', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: '#4A5A6C', cursor: 'pointer' }}>Keep editing</button>
              <button onClick={discard} style={{ border: '1px solid #084782', borderRadius: 6, background: '#084782', padding: '8px 14px', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: '#FFFFFF', cursor: 'pointer' }}>Discard</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
