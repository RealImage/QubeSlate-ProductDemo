import { useState, type ReactNode } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { advertiserApi, type CampaignDetail } from '@slate/api';
import { Alert, Card, KeyValue, Page, PageHeader, Query, StatCard } from '@slate/ui';
import { date, dateTime, flight, inr, inrShort, num, pct, withGst } from '@slate/domain';
import { qk, useOrg } from '../../components/org';
import { TabPanel, Tabs } from '../../components/controls';
import { CampaignStatusTag, channelsLabel } from './shared';
import { PlacementsTable } from './PlacementsTable';
import { DeliveryPanel } from './DeliveryPanel';

type Tab = 'placements' | 'delivery' | 'billing';
const METHOD: Record<string, string> = { card: 'Card', upi: 'UPI', netbanking: 'Netbanking' };

export function CampaignDetailPage() {
  const { id = '' } = useParams();
  const q = useQuery({ queryKey: qk.campaign(id), queryFn: () => advertiserApi.campaign(id) });
  const { can } = useOrg();
  return (
    <Page>
      <p className="sl-eyebrow"><Link to="/campaigns">Campaign Management</Link> / {q.data?.code ?? id}</p>
      <Query q={q} rows={8}>{c => (c.status === 'draft' && can('campaign.edit') ? <Navigate to={`/campaigns/${c.id}/edit`} replace /> : <Detail c={c} />)}</Query>
    </Page>
  );
}

function Detail({ c }: { c: CampaignDetail }) {
  const { sac } = useOrg();
  const [tab, setTab] = useState<Tab>('placements');
  // Once paid, show what was actually charged; booked value can change later (cancellations, rejection).
  const totals = c.payment
    ? { net: c.payment.amount - c.payment.gst, gst: c.payment.gst, total: c.payment.amount }
    : withGst(c.bookedValue);
  return (
    <>
      <PageHeader title={<span className="sl-row" style={{ gap: 12 }}>{c.name}<CampaignStatusTag status={c.status} size="medium" /></span>}
        description={`${c.brandName} · ${flight(c.start, c.end)} · ${channelsLabel(c.channels)} · ${c.type}`} />

      {c.status === 'pending_approval' && (
        <Alert variant="notice" closable={false} title={`Pending approval by ${sac.name}`}>
          Submitted {dateTime(c.submittedAt)}. {c.billingType === 'card' ? 'Your payment is held; a rejection refunds it in full.' : 'Once approved, placements are scheduled and invoiced against your contract.'}
        </Alert>
      )}
      {c.status === 'rejected' && (
        <Alert variant="negative" closable={false} title={`Rejected by ${sac.name}`}>
          {c.review?.note ? `“${c.review.note}”` : 'No reason given.'}
          {c.payment?.refundedAt ? ` Your payment of ${inr(c.payment.amount)} was refunded on ${date(c.payment.refundedAt)}.` : ''}
        </Alert>
      )}

      <div className="sl-grid sl-grid--4">
        <StatCard label="Booked value" value={inrShort(c.bookedValue)} hint={`of ${inrShort(c.budget)} budget · excl. GST`} />
        <StatCard label="Screens" value={num(c.screens)} hint={`${c.placementCount} placement${c.placementCount === 1 ? '' : 's'}`} />
        <StatCard label="Plays delivered" value={num(c.delivered.played)} hint={c.delivered.planned ? `${pct(c.delivered.rate)} of ${num(c.delivered.planned)} planned to date` : 'No plays yet'} />
        <StatCard label="Flight" value={<span style={{ fontSize: 18 }}>{flight(c.start, c.end)}</span>} hint={c.code} />
      </div>

      <Tabs label="Campaign sections" value={tab} onChange={setTab} tabs={[
        { id: 'placements', label: `Placements (${c.placements.length})` },
        { id: 'delivery', label: 'Delivery' },
        { id: 'billing', label: 'Payment & approval' }
      ]} />

      {tab === 'placements' && (
        <TabPanel id="placements">
          <Card title="Placements" description="Pause, resume, cancel or delete individual placements without touching the rest of the campaign." flush>
            <PlacementsTable campaign={c} />
          </Card>
        </TabPanel>
      )}
      {tab === 'delivery' && <TabPanel id="delivery"><DeliveryPanel campaignId={c.id} /></TabPanel>}
      {tab === 'billing' && (
        <TabPanel id="billing">
          <div className="sl-grid sl-grid--2">
            <Card title="Payment">
              <KeyValue items={[
                ['Billing type', c.billingType === 'card' ? 'Card / Prepaid' : c.billingType === 'contracted' ? 'Contracted' : '—'],
                ['Placements (net)', inr(totals.net)],
                ['GST @ 18%', inr(totals.gst)],
                ['Total', inr(totals.total)],
                ...(c.payment ? [
                  ['Paid', `${inr(c.payment.amount)} by ${METHOD[c.payment.method] ?? c.payment.method}`],
                  ['Paid on', dateTime(c.payment.paidAt)],
                  ['Gateway reference', <span className="sl-mono">{c.payment.gatewayRef}</span>],
                  ['Refunded', c.payment.refundedAt ? dateTime(c.payment.refundedAt) : '—']
                ] as [string, ReactNode][] : c.billingType === 'contracted' ? [['Invoicing', `Invoiced by ${sac.legalName} against your contract`] as [string, string]] : [])
              ]} />
            </Card>
            <Card title="Approval">
              <KeyValue items={[
                ['Submitted', dateTime(c.submittedAt)],
                ['Reviewed by', c.review ? `${c.review.by} · ${sac.name}` : `Awaiting ${sac.name}`],
                ['Reviewed on', dateTime(c.review?.at)],
                ['Note', c.review?.note ?? '—'],
                ['Created', `${dateTime(c.createdAt)} by ${c.createdBy}`]
              ]} />
            </Card>
          </div>
        </TabPanel>
      )}
    </>
  );
}
