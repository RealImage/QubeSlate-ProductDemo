import { Link } from 'react-router-dom';
import { checkoutGateway, dateTime } from '@slate/domain';
import { Card, EmptyState, Loading, StatusTag } from '@slate/ui';
import { useIngestion, useSacs } from '../../components/queries';
import { ErrorState } from '@slate/ui';

interface Item { key: string; to: string; title: string; detail: string; tag: string; tone: 'negative' | 'notice' }

export function NeedsAttention() {
  const ing = useIngestion();
  const sacs = useSacs();
  const loading = ing.isLoading || sacs.isLoading;
  const error = ing.error ?? sacs.error;

  const items: Item[] = [];
  for (const r of ing.data ?? []) {
    if (r.devices > 0 && r.offline > 0) {
      const down = r.online === 0;
      items.push({
        key: 'T' + r.theatreId, to: '/network/ingestion', title: `${r.theatreName}, ${r.city}`,
        detail: `${r.exhibitorName} · ${r.offline} of ${r.devices} devices offline · last log ${dateTime(r.lastLogAt)}`,
        tag: down ? 'Theatre offline' : 'Devices offline', tone: down ? 'negative' : 'notice'
      });
    }
  }
  for (const s of sacs.data ?? []) {
    if (s.status === 'active' && !checkoutGateway(s.gateways)) {
      items.push({ key: 'G' + s.id, to: `/tenants/sacs/${s.id}`, title: s.name, detail: 'No enabled default payment gateway: card/prepaid advertisers cannot pay', tag: 'No gateway', tone: 'negative' });
    }
    if (s.status === 'onboarding') {
      items.push({ key: 'O' + s.id, to: `/tenants/sacs/${s.id}`, title: s.name, detail: `Onboarding since ${dateTime(s.createdAt)}`, tag: 'Onboarding', tone: 'notice' });
    }
  }
  items.sort((a, b) => (a.tone === b.tone ? 0 : a.tone === 'negative' ? -1 : 1));

  return (
    <Card title="Needs attention" description="Offline theatres, SACs without an enabled default gateway and SACs still onboarding." flush>
      {loading ? <Loading rows={3} /> : error ? <ErrorState error={error} onRetry={() => { void ing.refetch(); void sacs.refetch(); }} /> : items.length === 0 ? (
        <EmptyState title="All clear">No offline theatres, SACs without a gateway or pending onboardings.</EmptyState>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {items.map(i => (
            <li key={i.key} className="sl-row" style={{ padding: '12px 20px', borderTop: '1px solid var(--sl-border, #e5e9ef)', justifyContent: 'space-between' }}>
              <div>
                <Link to={i.to} className="sl-table__primary">{i.title}</Link>
                <div className="sl-table__secondary">{i.detail}</div>
              </div>
              <StatusTag tone={i.tone}>{i.tag}</StatusTag>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
