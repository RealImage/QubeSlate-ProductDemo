import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { sacApi } from '@slate/api';
import { CAMPAIGN_STATUS, deliveryTone, flight, inr, inrShort, num, pct } from '@slate/domain';
import { Card, DataTable, EmptyState, Page, PageHeader, Query, StatCard, StatusTag } from '@slate/ui';

export function Dashboard() {
  const navigate = useNavigate();
  const q = useQuery({ queryKey: ['sac', 'dashboard'], queryFn: sacApi.dashboard });
  return (
    <Page>
      <PageHeader title="Dashboard" description="Approvals waiting on you, and how your advertisers' campaigns are performing." />
      <Query q={q} rows={6}>
        {d => {
          const attention = [
            { n: d.pendingKyc, label: 'advertiser KYC reviews', to: '/approvals/clients' },
            { n: d.pendingBrands, label: 'brand requests', to: '/approvals/brands' },
            { n: d.pendingCampaigns, label: 'campaigns', to: '/approvals/campaigns' }
          ];
          return (
            <>
              <div className="sl-grid sl-grid--4">
                <StatCard label="Pending KYC" value={d.pendingKyc} hint="Advertisers awaiting review" tone={d.pendingKyc ? 'notice' : undefined} />
                <StatCard label="Pending brands" value={d.pendingBrands} hint="Brand requests to decide" tone={d.pendingBrands ? 'notice' : undefined} />
                <StatCard label="Pending campaigns" value={d.pendingCampaigns} hint="Submitted for approval" tone={d.pendingCampaigns ? 'notice' : undefined} />
                <StatCard label="Live campaigns" value={d.activeCampaigns} hint={`${num(d.theatres)} theatres · ${num(d.screens)} screens`} />
              </div>
              <div className="sl-grid sl-grid--3">
                <StatCard label="Booked value" value={inrShort(d.bookedValue)} hint="Excludes draft, rejected and cancelled" />
                <StatCard label="Delivery rate" value={d.delivery.planned ? pct(d.delivery.rate) : '—'} tone={d.delivery.planned ? deliveryTone(d.delivery.rate) : undefined} hint={`${num(d.delivery.played)} of ${num(d.delivery.planned)} planned plays`} />
                <StatCard label="Failed plays" value={num(d.delivery.failed)} hint="Across all campaigns to date" tone={d.delivery.failed ? 'negative' : undefined} />
              </div>
              <div className="sl-grid sl-grid--aside">
                <Card title="Recent campaigns" actions={<Link to="/campaigns">View all</Link>} flush>
                  <DataTable
                    rows={d.recent}
                    rowKey={c => c.id}
                    caption="Recent campaigns"
                    onRowClick={c => navigate(`/campaigns/${c.id}`)}
                    empty={<EmptyState title="No campaigns yet">Campaigns submitted by advertisers will show here.</EmptyState>}
                    columns={[
                      { key: 'name', header: 'Campaign', cell: c => <><div className="sl-table__primary">{c.name}</div><div className="sl-table__secondary">{c.companyName}</div></> },
                      { key: 'status', header: 'Status', cell: c => <StatusTag tone={CAMPAIGN_STATUS[c.status].tone}>{CAMPAIGN_STATUS[c.status].label}</StatusTag> },
                      { key: 'flight', header: 'Flight', cell: c => flight(c.start, c.end) },
                      { key: 'value', header: 'Booked value', align: 'right', cell: c => inr(c.bookedValue) }
                    ]}
                  />
                </Card>
                <Card title="Needs attention">
                  {attention.every(a => !a.n) ? <p className="sl-muted" style={{ margin: 0 }}>Nothing is waiting on you.</p> : (
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {attention.filter(a => a.n > 0).map(a => <li key={a.to}><Link to={a.to}><strong>{a.n}</strong> {a.label} to review</Link></li>)}
                    </ul>
                  )}
                </Card>
              </div>
            </>
          );
        }}
      </Query>
    </Page>
  );
}
