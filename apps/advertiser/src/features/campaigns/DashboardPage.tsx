import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { advertiserApi, type Dashboard } from '@slate/api';
import { Card, EmptyState, Page, PageHeader, Progress, Query, StatCard } from '@slate/ui';
import { AddIcon } from 'prefab/icons';
import { deliveryTone, flight, inrShort, num, pct } from '@slate/domain';
import { qk, useOrg } from '../../components/org';
import { ButtonLink } from '../../components/controls';
import { CampaignStatusTag, DeliveryCell } from './shared';

export function DashboardPage() {
  const { can, company } = useOrg();
  const q = useQuery({ queryKey: qk.dashboard, queryFn: advertiserApi.dashboard });
  return (
    <Page>
      <PageHeader title="Overview" description={`${company.name} · campaigns, delivery and spend`}
        actions={can('campaign.edit') && <ButtonLink to="/campaigns/new"><AddIcon width={16} height={16} />Create campaign</ButtonLink>} />
      <Query q={q} rows={6}>{d => <DashboardBody d={d} />}</Query>
    </Page>
  );
}

function DashboardBody({ d }: { d: Dashboard }) {
  const { can } = useOrg();
  return (
    <>
      <div className="sl-grid sl-grid--4">
        <StatCard label="Active campaigns" value={num(d.activeCampaigns)} hint={`${d.scheduledCampaigns} scheduled · ${d.pendingApprovals} pending approval`} />
        <StatCard label="Screens live" value={num(d.screensLive)} hint="Across active placements" />
        <StatCard label="Plays delivered" value={num(d.playsDelivered)} hint={`${pct(d.deliveryRate)} of planned to date`} tone={d.playsDelivered ? deliveryTone(d.deliveryRate) : undefined} />
        <StatCard label="Spend to date" value={inrShort(d.spendToDate)} hint="Invoiced, incl. GST" />
      </div>
      <div className="sl-grid sl-grid--aside">
        <Card title="Recent campaigns" actions={<Link to="/campaigns">View all</Link>} flush>
          {d.recent.length === 0 ? (
            <EmptyState title="No campaigns yet" action={can('campaign.edit') && <Link to="/campaigns/new">Create your first campaign</Link>}>
              Pick a brand, attach target groups and media, then book placements.
            </EmptyState>
          ) : (
            <div className="adv-list">
              {d.recent.map(c => (
                <Link key={c.id} to={`/campaigns/${c.id}`} className="adv-list__item">
                  <div className="adv-list__main">
                    <span className="sl-table__primary">{c.name}</span>
                    <span className="sl-table__secondary">{c.brandName} · {flight(c.start, c.end)}</span>
                  </div>
                  <CampaignStatusTag status={c.status} />
                  <div style={{ width: 140 }}><DeliveryCell row={c} /></div>
                  <div style={{ width: 90, textAlign: 'right' }}>
                    <div className="sl-table__primary">{inrShort(c.bookedValue)}</div>
                    <div className="sl-table__secondary">of {inrShort(c.budget)}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
        <Card title="Delivery to date">
          <div className="sl-stack" style={{ gap: 12 }}>
            <div className="adv-total">{pct(d.deliveryRate)}</div>
            <Progress label="Plays delivered vs planned" value={d.deliveryRate} tone={d.playsDelivered ? deliveryTone(d.deliveryRate) : undefined} />
            <span className="sl-muted sl-small">{num(d.playsDelivered)} plays confirmed by theatre play logs against planned plays to date.</span>
            {d.pendingApprovals > 0 && <Link to="/campaigns?status=pending_approval">{d.pendingApprovals} campaign{d.pendingApprovals === 1 ? '' : 's'} awaiting approval</Link>}
          </div>
        </Card>
      </div>
    </>
  );
}
