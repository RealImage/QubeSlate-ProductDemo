import { useAppState } from '../state/AppStateContext';
import { distRows } from '../data/mockData';
import { PageHeader, ProgressBar, StatusTag, Table, TableCard, Td, Th } from '../components/ui/primitives';

export function DistributionStatus() {
  const { state, patch } = useAppState();
  const retried = state.retried || [];

  const rows = distRows.map(r => {
    const isRetried = retried.indexOf(r.id) >= 0;
    const rowState = isRetried ? 'In Transit' : r.state;
    const pct = isRetried ? 12 : r.pct;
    return {
      id: r.id, theatre: r.theatre, content: r.content, screens: r.screens,
      state: rowState, pct: `${pct}%`,
      tone: rowState === 'Delivered' ? 'positive' : rowState === 'Failed' ? 'negative' : 'notice',
      color: rowState === 'Delivered' ? '#0F7B3F' : rowState === 'Failed' ? '#CF1322' : '#084782',
      canRetry: rowState === 'Failed'
    };
  });
  const distFailed = rows.filter(r => r.state === 'Failed').length;

  const onRetry = (id: string) => patch(s => ({ retried: (s.retried || []).concat([id]) }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1300 }}>
      <PageHeader
        title="Distribution Status"
        description="Whether the content behind each placement actually reached the theatre."
        action={<StatusTag tone="negative" size="medium">{distFailed} of {rows.length} deliveries failed</StatusTag>}
      />
      <TableCard>
        <Table>
          <thead>
            <tr>
              <Th>Theatre</Th><Th>Content</Th><Th align="right">Screens</Th>
              <Th style={{ minWidth: 200 }}>Delivery</Th><Th>Status</Th><Th></Th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <Td style={{ fontWeight: 500 }}>{r.theatre}</Td>
                <Td style={{ fontSize: 13, color: '#4A5A6C' }}>{r.content}</Td>
                <Td align="right" style={{ fontVariantNumeric: 'tabular-nums' }}>{r.screens}</Td>
                <Td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: '1 1 auto' }}><ProgressBar pct={r.pct} color={r.color} /></div>
                    <span style={{ fontSize: 12.5, color: '#4A5A6C', fontVariantNumeric: 'tabular-nums', width: 38, textAlign: 'right' }}>{r.pct}</span>
                  </div>
                </Td>
                <Td><StatusTag tone={r.tone}>{r.state}</StatusTag></Td>
                <Td align="right">
                  {r.canRetry && (
                    <button
                      onClick={() => onRetry(r.id)}
                      style={{ border: '1px solid #D3DAE2', borderRadius: 6, background: '#FFFFFF', padding: '6px 11px', fontFamily: 'inherit', fontSize: 12, fontWeight: 500, color: '#084782', cursor: 'pointer' }}
                    >
                      Retry delivery
                    </button>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableCard>
    </div>
  );
}
