import { useMemo } from 'react';
import { useAppState } from '../state/AppStateContext';
import { targetGroups } from '../data/mockData';
import { fmtDate } from '../data/helpers';
import { ChipRow, chipTone, CountLabel, FilterBar, KpiGrid, PageHeader, SearchInput, StatusTag, Table, TableCard, Td, Th } from '../components/ui/primitives';

const STATUS_VALUES = ['all', 'active', 'upcoming', 'expired'];
const HEAD_DEFS: { field: 'name' | 'screens' | 'theatres' | 'createdOn' | 'createdBy' | 'validFrom' | 'validTill'; label: string; align: 'left' | 'right' }[] = [
  { field: 'name', label: 'TG Name', align: 'left' },
  { field: 'screens', label: 'Screens', align: 'right' },
  { field: 'theatres', label: 'Theatres', align: 'right' },
  { field: 'createdOn', label: 'Created On', align: 'left' },
  { field: 'createdBy', label: 'Created By', align: 'left' },
  { field: 'validFrom', label: 'Valid From', align: 'left' },
  { field: 'validTill', label: 'Valid Till', align: 'left' }
];

export function TargetGroups() {
  const { state, patch } = useAppState();
  const { tgSearch, tgStatus, tgSort, tgDir } = state;

  const filtered = useMemo(() => {
    const q = tgSearch.toLowerCase();
    return targetGroups.filter(t => {
      const okQ = !q || t.name.toLowerCase().includes(q) || t.createdBy.toLowerCase().includes(q);
      return okQ && (tgStatus === 'all' || t.status === tgStatus);
    }).slice().sort((a, b) => {
      const x = a[tgSort as keyof typeof a], y = b[tgSort as keyof typeof b];
      const r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
      return tgDir === 'asc' ? r : -r;
    }).map(t => ({
      name: t.name, screens: t.screens, theatres: t.theatres,
      createdOn: fmtDate(t.createdOn), createdBy: t.createdBy,
      validFrom: fmtDate(t.validFrom), validTill: fmtDate(t.validTill),
      statusLabel: t.status === 'active' ? 'Active' : t.status === 'expired' ? 'Expired' : 'Upcoming',
      tone: t.status === 'active' ? 'positive' : t.status === 'expired' ? 'default' : 'notice'
    }));
  }, [tgSearch, tgStatus, tgSort, tgDir]);

  const statusChips = STATUS_VALUES.map(v => ({ value: v, label: v === 'all' ? 'All' : v[0].toUpperCase() + v.slice(1), ...chipTone(tgStatus === v) }));

  const onSort = (field: string) => patch(s => ({ tgSort: field, tgDir: s.tgSort === field && s.tgDir === 'asc' ? 'desc' : 'asc' }));

  const kpis = [
    { label: 'Target groups', value: String(targetGroups.length) },
    { label: 'Active', value: String(targetGroups.filter(t => t.status === 'active').length) },
    { label: 'Screens covered', value: targetGroups.reduce((a, t) => a + t.screens, 0).toLocaleString('en-US') },
    { label: 'Theatres covered', value: targetGroups.reduce((a, t) => a + t.theatres, 0).toLocaleString('en-US') }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1400 }}>
      <PageHeader title="Target Groups" description="Theatre and screen groupings used for campaign targeting." />
      <KpiGrid items={kpis} />
      <FilterBar>
        <SearchInput value={tgSearch} onChange={v => patch({ tgSearch: v })} placeholder="Search by group name or owner…" />
        <ChipRow chips={statusChips} onSelect={v => patch({ tgStatus: v })} />
        <CountLabel>{filtered.length} of {targetGroups.length} groups</CountLabel>
      </FilterBar>
      <TableCard>
        <Table>
          <thead>
            <tr>
              {HEAD_DEFS.map(h => {
                const active = tgSort === h.field;
                const label = h.label + (active ? (tgDir === 'asc' ? ' ↑' : ' ↓') : '');
                return (
                  <th key={h.field} style={{ textAlign: h.align, padding: 0, borderBottom: '2px solid #E1E4E9' }}>
                    <button
                      onClick={() => onSort(h.field)}
                      style={{ width: '100%', padding: '11px 20px', border: 0, background: 'transparent', fontFamily: 'inherit', fontSize: 11, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: active ? '#084782' : '#677A90', textAlign: h.align, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      {label}
                    </button>
                  </th>
                );
              })}
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, i) => (
              <tr key={i}>
                <Td style={{ fontWeight: 500 }}>{t.name}</Td>
                <Td align="right" style={{ fontVariantNumeric: 'tabular-nums' }}>{t.screens}</Td>
                <Td align="right" style={{ fontVariantNumeric: 'tabular-nums' }}>{t.theatres}</Td>
                <Td style={{ fontSize: 12.5, color: '#677A90', whiteSpace: 'nowrap' }}>{t.createdOn}</Td>
                <Td style={{ fontSize: 13, color: '#4A5A6C' }}>{t.createdBy}</Td>
                <Td style={{ fontSize: 12.5, color: '#677A90', whiteSpace: 'nowrap' }}>{t.validFrom}</Td>
                <Td style={{ fontSize: 12.5, color: '#677A90', whiteSpace: 'nowrap' }}>{t.validTill}</Td>
                <Td><StatusTag tone={t.tone}>{t.statusLabel}</StatusTag></Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableCard>
    </div>
  );
}
