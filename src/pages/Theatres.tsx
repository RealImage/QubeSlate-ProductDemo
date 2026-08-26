import { useMemo } from 'react';
import { useAppState } from '../state/AppStateContext';
import { getTheatres } from '../data/helpers';
import { Card, PageHeader, ProgressBar, Table, TableCard, Td, Th } from '../components/ui/primitives';

export function Theatres() {
  const { state, patch } = useAppState();
  const { thSearch } = state;
  const theatres = useMemo(() => getTheatres(), []);

  const rows = useMemo(() => {
    const q = thSearch.toLowerCase();
    return theatres.filter(t => !q || t.name.toLowerCase().includes(q) || t.city.toLowerCase().includes(q) || t.circuit.toLowerCase().includes(q)).map(t => {
      const cap = t.screens.reduce((a, s) => a + s.cap, 0);
      const sold = t.screens.reduce((a, s) => a + s.sold, 0);
      const pct = Math.round((sold / cap) * 100);
      const formats = Array.from(new Set(t.screens.map(s => s.format))).join(', ');
      return {
        id: t.id, name: t.name, circuit: t.circuit, city: t.city,
        screens: t.screens.length, seats: t.screens.reduce((a, s) => a + s.seats, 0).toLocaleString('en-US'),
        formats, util: `${pct}%`, pct: `${pct}%`,
        color: pct > 85 ? '#CF1322' : pct > 65 ? '#E65C00' : '#0F7B3F'
      };
    });
  }, [theatres, thSearch]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1400 }}>
      <PageHeader title="Network Theatres & Screens" description="Every theatre carrying Qube Slate inventory, with this week's utilisation." />
      <Card padding="14px 16px">
        <input
          value={thSearch}
          onChange={e => patch({ thSearch: e.target.value })}
          placeholder="Search theatres, circuits or cities…"
          style={{ width: '100%', height: 36, padding: '0 12px', border: '1px solid #D3DAE2', borderRadius: 6, fontFamily: 'inherit', fontSize: 13.5, color: '#08090A', outline: 'none' }}
        />
      </Card>
      <TableCard>
        <Table>
          <thead>
            <tr>
              <Th>Theatre</Th><Th>Circuit</Th><Th>Formats</Th>
              <Th align="right">Screens</Th><Th align="right">Seats</Th>
              <Th style={{ minWidth: 180 }}>Utilisation</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map(t => (
              <tr key={t.id}>
                <Td>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: '#08090A' }}>{t.name}</div>
                  <div style={{ fontSize: 11.5, color: '#677A90' }}>{t.city} · {t.id}</div>
                </Td>
                <Td style={{ fontSize: 13, color: '#4A5A6C' }}>{t.circuit}</Td>
                <Td style={{ fontSize: 12.5, color: '#677A90' }}>{t.formats}</Td>
                <Td align="right" style={{ fontVariantNumeric: 'tabular-nums' }}>{t.screens}</Td>
                <Td align="right" style={{ fontVariantNumeric: 'tabular-nums' }}>{t.seats}</Td>
                <Td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: '1 1 auto' }}><ProgressBar pct={t.pct} color={t.color} /></div>
                    <span style={{ fontSize: 12.5, color: '#4A5A6C', fontVariantNumeric: 'tabular-nums', width: 38, textAlign: 'right' }}>{t.util}</span>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableCard>
    </div>
  );
}
