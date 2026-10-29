import { useQuery } from '@tanstack/react-query';
import { advertiserApi, type DeliveryBreakdown } from '@slate/api';
import { Card, DataTable, EmptyState, Progress, Query, type Column } from '@slate/ui';
import { dateShort, deliveryTone, num, pct } from '@slate/domain';
import { qk } from '../../components/org';

type TheatreRow = DeliveryBreakdown['byTheatre'][number];

const theatreColumns: Column<TheatreRow>[] = [
  {
    key: 'theatre', header: 'Cinema', sort: t => t.theatre, cell: t => (
      <span style={{ display: 'flex', flexDirection: 'column' }}><span className="sl-table__primary">{t.theatre}</span><span className="sl-table__secondary">{t.city}</span></span>
    )
  },
  { key: 'planned', header: 'Planned', align: 'right', sort: t => t.planned, cell: t => num(t.planned) },
  { key: 'played', header: 'Played', align: 'right', sort: t => t.played, cell: t => num(t.played) },
  { key: 'failed', header: 'Failed', align: 'right', sort: t => t.failed, cell: t => (t.failed ? <span style={{ color: 'var(--text-negative)' }}>{num(t.failed)}</span> : '0') },
  {
    key: 'rate', header: 'Delivery', sort: t => (t.planned ? t.played / t.planned : 0), width: 180, cell: t => {
      const r = t.planned ? t.played / t.planned : 0;
      return <span className="sl-row" style={{ flexWrap: 'nowrap' }}><span style={{ flex: 1 }}><Progress value={r} tone={deliveryTone(r)} /></span><span className="sl-small">{pct(r)}</span></span>;
    }
  }
];

/** Delivery tab: play-log roll-up by day (bars) and by cinema (table). */
export function DeliveryPanel({ campaignId }: { campaignId: string }) {
  const q = useQuery({ queryKey: qk.campaignDelivery(campaignId), queryFn: () => advertiserApi.campaignDelivery(campaignId) });
  return (
    <Query q={q}>
      {d => !d.summary.planned ? (
        <Card><EmptyState title="No delivery yet">Play logs appear here once placements start running in cinemas.</EmptyState></Card>
      ) : (
        <div className="sl-stack">
          <Card title="Plays by day" description={`${num(d.summary.played)} of ${num(d.summary.planned)} planned plays delivered (${pct(d.summary.rate)}) · ${num(d.summary.failed)} failed`}>
            <DayBars days={d.byDay} />
          </Card>
          <Card title="By cinema" flush>
            <DataTable rows={d.byTheatre} columns={theatreColumns} rowKey={t => t.theatreId} pageSize={10} caption="Delivery by cinema" defaultSort={{ key: 'planned', dir: 'desc' }} />
          </Card>
        </div>
      )}
    </Query>
  );
}

function DayBars({ days }: { days: DeliveryBreakdown['byDay'] }) {
  const max = Math.max(1, ...days.map(d => d.planned));
  const first = days[0];
  const last = days.at(-1);
  return (
    <div>
      <div className="adv-legend" aria-hidden>
        <span><i style={{ background: 'var(--fill-product, var(--sl-brand))' }} />Played</span>
        <span><i style={{ background: 'var(--fill-default, #eef1f4)' }} />Planned</span>
      </div>
      <div className="adv-bars" role="img" aria-label={`Daily plays from ${first ? dateShort(first.date) : ''} to ${last ? dateShort(last.date) : ''}. Peak planned ${num(max)} plays per day.`}>
        {days.map(d => (
          <div key={d.date} className="adv-bars__col" title={`${dateShort(d.date)} · ${num(d.played)} of ${num(d.planned)} played${d.failed ? `, ${num(d.failed)} failed` : ''}`}>
            <span className="adv-bars__planned" style={{ height: `${(d.planned / max) * 100}%` }} />
            <span className="adv-bars__played" style={{ height: `${(d.played / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="adv-bars__axis" aria-hidden><span>{first && dateShort(first.date)}</span><span>{last && dateShort(last.date)}</span></div>
    </div>
  );
}
