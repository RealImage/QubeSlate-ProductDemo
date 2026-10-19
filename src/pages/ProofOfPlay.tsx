import { useMemo } from 'react';
import { useAppState } from '../state/AppStateContext';
import { proofRows } from '../data/mockData';
import { Card, KpiGrid, PageHeader, StatusTag, Table, TableCard, Td, Th } from '../components/ui/primitives';

export function ProofOfPlay() {
  const { state, patch } = useAppState();
  const popCampaign = state.popCampaign || 'all';

  const popCampaigns = useMemo(() => ['all', ...Array.from(new Set(proofRows.map(r => r.campaign)))], []);
  const filtered = useMemo(() => proofRows.filter(r => popCampaign === 'all' || r.campaign === popCampaign), [popCampaign]);

  const rows = filtered.map(r => ({
    creative: r.creative, campaign: r.campaign, screen: r.screen, show: r.show,
    scheduled: r.scheduled, actual: r.actual, state: r.state,
    tone: r.state === 'Played' ? 'positive' : r.state === 'Missed' ? 'negative' : 'notice',
    actualColor: r.actual === '—' ? 'var(--text-negative)' : 'var(--text-default)'
  }));

  const played = filtered.filter(r => r.state === 'Played').length;
  const late = filtered.filter(r => r.state === 'Late').length;
  const missed = filtered.filter(r => r.state === 'Missed').length;
  const stats = [
    { label: 'Scheduled plays', value: String(filtered.length), color: 'var(--text-default)' },
    { label: 'Played as booked', value: String(played), color: 'var(--text-positive-alt)' },
    { label: 'Played late', value: String(late), color: 'var(--orange-600)' },
    { label: 'Missed', value: String(missed), color: 'var(--text-negative)' },
    { label: 'Delivery rate', value: filtered.length ? `${Math.round(((played + late) / filtered.length) * 100)}%` : '—', color: 'var(--text-product)' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1400 }}>
      <PageHeader title="Proof of Play" description="Creative, screen, show and timestamp — the playback record campaigns are reconciled against." />
      <KpiGrid items={stats} minWidth={170} />
      <Card padding="14px 16px" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--grey-600)' }}>Campaign</span>
        <select value={popCampaign} onChange={e => patch({ popCampaign: e.target.value })} style={{ flex: '0 1 320px', height: 36, padding: '0 10px', border: '1px solid var(--border-default-subtle)', borderRadius: 6, fontFamily: 'inherit', fontSize: 13, color: 'var(--text-default)', background: 'var(--surface-white)', outline: 'none' }}>
          {popCampaigns.map(c => <option key={c} value={c}>{c === 'all' ? 'All campaigns' : c}</option>)}
        </select>
      </Card>
      <TableCard>
        <Table>
          <thead>
            <tr>
              <Th>Creative</Th><Th>Screen</Th><Th>Show</Th>
              <Th align="right">Scheduled</Th><Th align="right">Actual</Th><Th>Result</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <Td>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-default)' }}>{r.creative}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{r.campaign}</div>
                </Td>
                <Td style={{ fontSize: 13, color: 'var(--grey-600)' }}>{r.screen}</Td>
                <Td style={{ fontSize: 13, color: 'var(--grey-600)' }}>{r.show}</Td>
                <Td align="right" style={{ fontFamily: 'var(--font-family-mono)' }}>{r.scheduled}</Td>
                <Td align="right" style={{ color: r.actualColor, fontFamily: 'var(--font-family-mono)' }}>{r.actual}</Td>
                <Td><StatusTag tone={r.tone}>{r.state}</StatusTag></Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableCard>
    </div>
  );
}
