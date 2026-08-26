import { useAppState } from '../state/AppStateContext';
import { biasRules, ratePerSecond } from '../data/mockData';
import { money } from '../data/helpers';
import { Card, PageHeader, Table, TableCard, Td, Th } from '../components/ui/primitives';

export function RateBias() {
  const { state, patch } = useAppState();
  const bias = state.bias || {};

  const rows = biasRules.map(r => {
    const m = bias[r.id] != null ? bias[r.id] : r.mult;
    return {
      id: r.id, dimension: r.dimension, value: r.value, mult: m,
      effective: money(ratePerSecond * m * 1000),
      color: m > 1 ? '#0F7B3F' : m < 1 ? '#E65C00' : '#4A5A6C'
    };
  });

  const onBias = (id: string, v: string) => {
    const parsed = parseFloat(v);
    patch(s => ({ bias: { ...s.bias, [id]: isNaN(parsed) ? 0 : parsed } }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1100 }}>
      <PageHeader title="Campaign Rate Bias" description="Multipliers applied to the base rate card by geography, theatre type, daypart or segment." />
      <Card padding="14px 18px" style={{ background: '#F0F5FA', border: '1px solid #CFE0EE', fontSize: 13, color: '#084782' }}>
        Base rate card: <strong style={{ fontWeight: 600 }}>{money(ratePerSecond * 1000)} per 1,000 seconds per screen</strong>
      </Card>
      <TableCard>
        <Table>
          <thead>
            <tr>
              <Th>Dimension</Th><Th>Applies to</Th>
              <Th align="right">Multiplier</Th><Th align="right">Effective rate / 1,000s</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <Td style={{ fontSize: 13, color: '#677A90', fontWeight: 400 }}>{r.dimension}</Td>
                <Td style={{ fontWeight: 500 }}>{r.value}</Td>
                <Td align="right">
                  <input
                    type="number" step={0.05} value={r.mult}
                    onChange={e => onBias(r.id, e.target.value)}
                    style={{ width: 84, height: 34, padding: '0 10px', border: '1px solid #D3DAE2', borderRadius: 6, fontFamily: 'inherit', fontSize: 13, color: '#08090A', textAlign: 'right', outline: 'none' }}
                  />
                </Td>
                <Td align="right" style={{ fontSize: 14, fontWeight: 600, color: r.color }}>{r.effective}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableCard>
    </div>
  );
}
