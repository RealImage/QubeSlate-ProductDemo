import { useMemo } from 'react';
import { useAppState } from '../state/AppStateContext';
import { campaigns } from '../data/mockData';
import { money, fmtDate } from '../data/helpers';
import { Button } from '../components/Button';
import { ChipRow, chipTone, CountLabel, EmptyState, FilterBar, PageHeader, SearchInput, StatusTag, Table, TableCard, Td, Th } from '../components/ui/primitives';

const STATUSES = ['all', 'Active', 'Pending Approval', 'In Review', 'Draft'];

export function CampaignManagement() {
  const { state, patch, navigateTo } = useAppState();
  const { campSearch, campStatus } = state;

  const filtered = useMemo(() => {
    const q = campSearch.toLowerCase();
    return campaigns.filter(c => {
      const okQ = !q || c.name.toLowerCase().includes(q) || c.client.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
      const okS = campStatus === 'all' || c.status === campStatus;
      return okQ && okS;
    }).map(c => ({
      ...c,
      flight: `${fmtDate(c.start)} – ${fmtDate(c.end)}`,
      budgetLabel: money(c.budget),
      playsLabel: c.plays.toLocaleString('en-US')
    }));
  }, [campSearch, campStatus]);

  const chips = STATUSES.map(v => ({ value: v, label: v === 'all' ? 'All' : v, ...chipTone(campStatus === v) }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1400 }}>
      <PageHeader
        title="Campaign Management"
        description="Every theatrical advertising campaign booked on the network."
        action={<Button variant="primary" size="medium" onClick={() => navigateTo('/campaigns/create')}>Create Campaign</Button>}
      />

      <FilterBar>
        <SearchInput value={campSearch} onChange={v => patch({ campSearch: v })} placeholder="Search campaigns, clients or IDs…" />
        <ChipRow chips={chips} onSelect={v => patch({ campStatus: v })} />
        <CountLabel>{filtered.length} of {campaigns.length} campaigns</CountLabel>
      </FilterBar>

      <TableCard>
        <Table>
          <thead>
            <tr>
              <Th>Campaign</Th><Th>Client</Th><Th>Status</Th><Th>Flight</Th>
              <Th align="right">Screens</Th><Th align="right">Weekly plays</Th><Th align="right">Budget</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id}>
                <Td>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: '#08090A' }}>{c.name}</div>
                  <div style={{ fontSize: 11.5, color: '#677A90', fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>{c.id}</div>
                </Td>
                <Td style={{ color: '#4A5A6C' }}>{c.client}</Td>
                <Td><StatusTag tone={c.tone}>{c.status}</StatusTag></Td>
                <Td style={{ fontSize: 12.5, color: '#677A90', whiteSpace: 'nowrap' }}>{c.flight}</Td>
                <Td align="right" style={{ fontVariantNumeric: 'tabular-nums' }}>{c.screens}</Td>
                <Td align="right" style={{ fontVariantNumeric: 'tabular-nums' }}>{c.playsLabel}</Td>
                <Td align="right" style={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{c.budgetLabel}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
        {filtered.length === 0 && <EmptyState title="No campaigns match that search" detail="Try a different name, client or status filter." />}
      </TableCard>
    </div>
  );
}
