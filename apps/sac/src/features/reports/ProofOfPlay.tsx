import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sacApi, type ProofOfPlayRow } from '@slate/api';
import { deliveryTone, groupBy, num, pct } from '@slate/domain';
import { Card, DataTable, EmptyState, Page, PageHeader, Query, Select, StatCard, StatusTag } from '@slate/ui';

const sum = (rows: ProofOfPlayRow[]) => {
  const planned = rows.reduce((s, r) => s + r.planned, 0);
  const played = rows.reduce((s, r) => s + r.played, 0);
  const failed = rows.reduce((s, r) => s + r.failed, 0);
  return { planned, played, failed, rate: planned ? played / planned : 0 };
};

const RateTag = ({ planned, rate }: { planned: number; rate: number }) => planned ? <StatusTag tone={deliveryTone(rate)}>{pct(rate)}</StatusTag> : <span className="sl-muted">—</span>;

export function ProofOfPlay() {
  const q = useQuery({ queryKey: ['sac', 'proof-of-play'], queryFn: sacApi.proofOfPlay });
  const [campaign, setCampaign] = useState('all');

  const view = useMemo(() => {
    const rows = q.data ?? [];
    const byCampaign = Object.values(groupBy(rows, r => r.campaignId)).map(rs => ({ id: rs[0]!.campaignId, name: rs[0]!.campaignName, advertiser: rs[0]!.companyName, ...sum(rs) }));
    const filtered = campaign === 'all' ? rows : rows.filter(r => r.campaignId === campaign);
    return { byCampaign, filtered, totals: sum(filtered) };
  }, [q.data, campaign]);

  return (
    <Page>
      <PageHeader title="Proof of Play" description="Planned versus played spots from theatre play logs, per campaign and theatre." />
      <Query q={q}>
        {data => (
          <>
            <div style={{ width: 340 }}>
              <Select label="Campaign" selectedKey={campaign} onSelectionChange={k => setCampaign(String(k))}>
                <Select.Option id="all">All campaigns</Select.Option>
                {view.byCampaign.map(c => <Select.Option key={c.id} id={c.id}>{c.name}</Select.Option>)}
              </Select>
            </div>
            <div className="sl-grid sl-grid--4">
              <StatCard label="Planned" value={num(view.totals.planned)} />
              <StatCard label="Played" value={num(view.totals.played)} />
              <StatCard label="Failed" value={num(view.totals.failed)} tone={view.totals.failed ? 'negative' : undefined} />
              <StatCard label="Delivery rate" value={view.totals.planned ? pct(view.totals.rate) : '—'} tone={view.totals.planned ? deliveryTone(view.totals.rate) : undefined} />
            </div>
            {campaign === 'all' && (
              <Card title="By campaign" description="Select a row to drill into its theatres." flush>
                <DataTable
                  rows={view.byCampaign}
                  rowKey={c => c.id}
                  caption="Delivery by campaign"
                  onRowClick={c => setCampaign(c.id)}
                  empty={<EmptyState title="No play logs yet">Delivery appears once theatres report plays.</EmptyState>}
                  columns={[
                    { key: 'name', header: 'Campaign', sort: c => c.name, cell: c => <><div className="sl-table__primary">{c.name}</div><div className="sl-table__secondary">{c.advertiser}</div></> },
                    { key: 'planned', header: 'Planned', align: 'right', sort: c => c.planned, cell: c => num(c.planned) },
                    { key: 'played', header: 'Played', align: 'right', sort: c => c.played, cell: c => num(c.played) },
                    { key: 'failed', header: 'Failed', align: 'right', sort: c => c.failed, cell: c => num(c.failed) },
                    { key: 'rate', header: 'Rate', align: 'right', sort: c => c.rate, cell: c => <RateTag planned={c.planned} rate={c.rate} /> }
                  ]}
                />
              </Card>
            )}
            <Card title="Placements by theatre" flush>
              <DataTable
                rows={view.filtered}
                rowKey={r => r.placementId + r.theatreId}
                caption="Proof of play by placement and theatre"
                pageSize={20}
                empty={<EmptyState title="No play logs yet">{data.length ? 'No rows for this campaign.' : 'Delivery appears once theatres report plays.'}</EmptyState>}
                columns={[
                  { key: 'placement', header: 'Placement', sort: r => r.placementCode, cell: r => <><div className="sl-table__primary">{r.placementCode}</div><div className="sl-table__secondary">{r.campaignName}</div></> },
                  { key: 'theatre', header: 'Theatre', sort: r => r.theatre, cell: r => <>{r.theatre}<div className="sl-table__secondary">{r.city}</div></> },
                  { key: 'planned', header: 'Planned', align: 'right', sort: r => r.planned, cell: r => num(r.planned) },
                  { key: 'played', header: 'Played', align: 'right', sort: r => r.played, cell: r => num(r.played) },
                  { key: 'failed', header: 'Failed', align: 'right', sort: r => r.failed, cell: r => num(r.failed) },
                  { key: 'rate', header: 'Rate', align: 'right', sort: r => (r.planned ? r.played / r.planned : 0), cell: r => <RateTag planned={r.planned} rate={r.planned ? r.played / r.planned : 0} /> }
                ]}
              />
            </Card>
          </>
        )}
      </Query>
    </Page>
  );
}
