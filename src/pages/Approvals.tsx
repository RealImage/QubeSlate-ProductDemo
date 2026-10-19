import { useLocation } from 'react-router-dom';
import { useAppState } from '../state/AppStateContext';
import { approvalQueues, routeTitles } from '../data/mockData';
import { Card, PageHeader, StatusTag } from '../components/ui/primitives';

export function Approvals() {
  const { pathname } = useLocation();
  const { state, patch } = useAppState();
  const decisions = state.decisions || {};
  const [, crumbLeaf, stubDescription] = routeTitles[pathname] || ['', '', ''];

  const queue = (approvalQueues[pathname] || []).map(a => ({
    id: a.id, title: a.title, meta: a.meta, note: a.note,
    decided: !!decisions[a.id],
    pending: !decisions[a.id],
    verdict: decisions[a.id] || '',
    tone: decisions[a.id] === 'Approved' ? 'positive' : 'negative'
  }));
  const pendingCount = queue.filter(q => !q.decided).length;

  const decide = (id: string, verdict: string) => patch(s => ({ decisions: { ...s.decisions, [id]: verdict } }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1000 }}>
      <PageHeader
        title={crumbLeaf}
        description={stubDescription}
        action={<StatusTag tone="notice" size="medium">{pendingCount} awaiting decision</StatusTag>}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {queue.map(a => (
          <Card key={a.id} padding="18px 20px" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ flex: '1 1 auto', minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-default)' }}>{a.title}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 3 }}>{a.meta}</div>
              <div style={{ fontSize: 12.5, color: 'var(--orange-600)', marginTop: 6 }}>{a.note}</div>
            </div>
            {a.decided && <StatusTag tone={a.tone} size="medium">{a.verdict}</StatusTag>}
            {a.pending && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '0 0 auto' }}>
                <button
                  onClick={() => decide(a.id, 'Rejected')}
                  style={{ border: '1px solid var(--border-default-subtle)', borderRadius: 6, background: 'var(--surface-white)', padding: '8px 14px', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: 'var(--text-negative)', cursor: 'pointer' }}
                >
                  Reject
                </button>
                <button
                  onClick={() => decide(a.id, 'Approved')}
                  style={{ border: 0, borderRadius: 6, background: 'var(--fill-product)', padding: '8px 14px', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: 'var(--text-white)', cursor: 'pointer' }}
                >
                  Approve
                </button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
