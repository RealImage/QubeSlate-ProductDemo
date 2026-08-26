import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppState } from '../state/AppStateContext';
import { compositions, routeTitles } from '../data/mockData';
import { fmtDate } from '../data/helpers';
import { ChipRow, chipTone, CountLabel, FilterBar, PageHeader, StatusTag, Table, TableCard, Td, Th } from '../components/ui/primitives';

const CHIP_VALUES = ['all', 'Available', 'Missing', 'In Certification'];

export function Compositions() {
  const { pathname } = useLocation();
  const { state, patch } = useAppState();
  const compFilter = state.compFilter || 'all';
  const [, crumbLeaf, stubDescription] = routeTitles[pathname] || ['', '', ''];

  const rows = useMemo(() => {
    const compStates = pathname === '/content/archived' ? ['Archived'] : ['Available', 'Missing', 'In Certification'];
    let comps = compositions.filter(c => compStates.indexOf(c.state) >= 0);
    if (pathname === '/content/unmapped') comps = comps.filter(c => !c.campaign);
    if (pathname === '/content/compositions') comps = comps.filter(c => c.state !== 'Archived');
    return comps.filter(c => compFilter === 'all' || c.state === compFilter).map(c => ({
      name: c.name, cpl: c.cpl, len: `${c.sec}s`, format: c.format, size: c.size,
      campaign: c.campaign || 'Unmapped', ingested: c.ingested === '—' ? '—' : fmtDate(c.ingested),
      state: c.state,
      tone: c.state === 'Available' ? 'positive' : c.state === 'Missing' ? 'negative' : c.state === 'Archived' ? 'default' : 'notice',
      campaignColor: c.campaign ? '#08090A' : '#E65C00'
    }));
  }, [pathname, compFilter]);

  const chips = CHIP_VALUES.map(v => ({ value: v, label: v === 'all' ? 'All' : v, ...chipTone(compFilter === v) }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1400 }}>
      <PageHeader title={crumbLeaf} description={stubDescription} />
      <FilterBar>
        <ChipRow chips={chips} onSelect={v => patch({ compFilter: v })} />
        <CountLabel>{rows.length} compositions</CountLabel>
      </FilterBar>
      <TableCard>
        <Table>
          <thead>
            <tr>
              <Th>Composition</Th><Th>Format</Th>
              <Th align="right">Duration</Th><Th align="right">Size</Th>
              <Th>Campaign</Th><Th>Ingested</Th><Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c, i) => (
              <tr key={i}>
                <Td>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: '#08090A' }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: '#677A90', fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>{c.cpl}</div>
                </Td>
                <Td style={{ fontSize: 12.5, color: '#4A5A6C' }}>{c.format}</Td>
                <Td align="right" style={{ fontVariantNumeric: 'tabular-nums' }}>{c.len}</Td>
                <Td align="right" style={{ fontSize: 13, color: '#4A5A6C', fontVariantNumeric: 'tabular-nums' }}>{c.size}</Td>
                <Td style={{ fontSize: 13, color: c.campaignColor }}>{c.campaign}</Td>
                <Td style={{ fontSize: 12.5, color: '#677A90', whiteSpace: 'nowrap' }}>{c.ingested}</Td>
                <Td><StatusTag tone={c.tone}>{c.state}</StatusTag></Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableCard>
    </div>
  );
}
