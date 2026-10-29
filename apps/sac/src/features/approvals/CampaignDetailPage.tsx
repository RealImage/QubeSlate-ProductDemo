import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sacApi, useSession, type CampaignDetail } from '@slate/api';
import { CAMPAIGN_STATUS, PLACEMENT_STATUS, date, dateTime, deliveryTone, flight, inr, num, pct } from '@slate/domain';
import { Button, Card, ConfirmDialog, DataTable, KeyValue, Page, PageHeader, Query, StatCard, StatusTag, toast } from '@slate/ui';
import { BillingTag, NoteDialog, errorText } from '../shared';

/** Read-only campaign detail. Approve / Reject appear only while the campaign is pending and the user may decide. */
export function CampaignDetailView({ c, actions }: { c: CampaignDetail; actions?: React.ReactNode }) {
  const status = CAMPAIGN_STATUS[c.status];
  const refundable = c.billingType === 'card' && !!c.payment && !c.payment.refundedAt;
  return (
    <>
      <PageHeader
        eyebrow={c.code}
        title={c.name}
        description={`${c.companyName} · ${c.brandName}`}
        actions={<div className="sl-row"><StatusTag tone={status.tone} size="medium">{status.label}</StatusTag>{actions}</div>}
      />
      <div className="sl-grid sl-grid--4">
        <StatCard label="Booked value" value={inr(c.bookedValue)} hint={`${c.placementCount} placement${c.placementCount === 1 ? '' : 's'}`} />
        <StatCard label="Screens" value={num(c.screens)} hint={c.channels.join(' + ')} />
        <StatCard label="Planned plays" value={num(c.delivered.planned)} hint={`${num(c.delivered.played)} played · ${num(c.delivered.failed)} failed`} />
        <StatCard label="Delivery rate" value={c.delivered.planned ? pct(c.delivered.rate) : '—'} tone={c.delivered.planned ? deliveryTone(c.delivered.rate) : undefined} hint={c.delivered.planned ? undefined : 'Not started'} />
      </div>
      <div className="sl-grid sl-grid--2">
        <Card title="Campaign">
          <KeyValue items={[
            ['Type', c.type],
            ['Channels', c.channels.map(x => (x === 'cinema' ? 'Cinema' : 'DOOH')).join(', ')],
            ['Flight', flight(c.start, c.end)],
            ['Budget', inr(c.budget)],
            ['Submitted', dateTime(c.submittedAt)],
            ['Created by', c.createdBy]
          ]} />
        </Card>
        <Card title="Billing and payment">
          <KeyValue items={[
            ['Billing type', <BillingTag key="b" type={c.billingType} />],
            ...(c.payment ? [
              ['Paid via', c.payment.method.toUpperCase()],
              ['Amount (incl. GST)', inr(c.payment.amount)],
              ['Gateway reference', <span key="g" className="sl-mono">{c.payment.gatewayRef}</span>],
              ['Paid on', dateTime(c.payment.paidAt)],
              ['Refund', c.payment.refundedAt ? `Refunded ${dateTime(c.payment.refundedAt)}` : 'None']
            ] as [string, React.ReactNode][] : [['Payment', c.billingType === 'contracted' ? 'Invoiced against contract' : 'Not paid']] as [string, React.ReactNode][])
          ]} />
          {c.status === 'pending_approval' && refundable && <p className="sl-muted sl-small" style={{ margin: '12px 0 0' }}>Rejecting this campaign will refund the card payment.</p>}
        </Card>
      </div>
      {c.review && (
        <Card title="Review">
          <KeyValue items={[['Decided by', c.review.by], ['Decided on', dateTime(c.review.at)], ['Note', c.review.note || '—']]} />
        </Card>
      )}
      <Card title="Placements" description="Media, targeting and cost as booked by the advertiser." flush>
        <DataTable
          rows={c.placements}
          rowKey={p => p.id}
          caption="Placements"
          empty={<div className="sl-empty"><strong>No placements</strong>This campaign has no placements.</div>}
          columns={[
            { key: 'code', header: 'Placement', sort: p => p.code, cell: p => <><div className="sl-table__primary">{p.code}</div><div className="sl-table__secondary">{p.mediaName}</div></> },
            { key: 'tg', header: 'Target group', cell: p => p.targetGroupName },
            { key: 'window', header: 'Window', cell: p => <>{flight(p.from, p.to)}<div className="sl-table__secondary">{p.timeBand}</div></> },
            { key: 'status', header: 'Status', cell: p => <StatusTag tone={PLACEMENT_STATUS[p.status].tone}>{PLACEMENT_STATUS[p.status].label}</StatusTag> },
            { key: 'screens', header: 'Screens', align: 'right', sort: p => p.screens, cell: p => num(p.screens) },
            { key: 'plays', header: 'Planned plays', align: 'right', sort: p => p.plannedPlays, cell: p => num(p.plannedPlays) },
            { key: 'cost', header: 'Cost', align: 'right', sort: p => p.cost, cell: p => inr(p.cost) }
          ]}
        />
      </Card>
      <p className="sl-muted sl-small" style={{ margin: 0 }}>Flight {date(c.start)} to {date(c.end)}. All amounts in INR; dates in Asia/Kolkata.</p>
    </>
  );
}

/** Route target for /approvals/campaigns/:id (with decision actions) and /campaigns/:id (read-only unless pending). */
export function CampaignDetailPage({ backTo, backLabel }: { backTo: string; backLabel: string }) {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { can } = useSession();
  const q = useQuery({ queryKey: ['sac', 'campaign', id], queryFn: () => sacApi.campaign(id) });
  const [mode, setMode] = useState<'approve' | 'reject' | null>(null);

  const decide = useMutation({
    mutationFn: (b: { decision: 'approve' | 'reject'; note: string | null }) => sacApi.decideCampaign(id, b),
    onSuccess: (c, b) => {
      void qc.invalidateQueries({ queryKey: ['sac'] });
      setMode(null);
      toast.add({ variant: 'positive', message: b.decision === 'approve' ? `${c.name} approved.` : `${c.name} rejected${c.billingType === 'card' && c.payment ? '; payment refunded' : ''}.` });
      navigate(backTo);
    },
    onError: e => toast.add({ variant: 'negative', message: errorText(e) })
  });

  return (
    <Page>
      <div><Link to={backTo}>← {backLabel}</Link></div>
      <Query q={q} rows={8}>
        {c => {
          const refund = c.billingType === 'card' && !!c.payment && !c.payment.refundedAt;
          const actions = c.status === 'pending_approval' && can('approvals.decide') && (
            <>
              <Button variant="default" onPress={() => { decide.reset(); setMode('reject'); }}>Reject</Button>
              <Button variant="primary" onPress={() => { decide.reset(); setMode('approve'); }}>Approve</Button>
            </>
          );
          return (
            <>
              <CampaignDetailView c={c} actions={actions} />
              <ConfirmDialog open={mode === 'approve'} title={`Approve ${c.name}?`} confirmLabel="Approve" busy={decide.isPending}
                onConfirm={() => decide.mutate({ decision: 'approve', note: null })} onCancel={() => setMode(null)}>
                Placements will be scheduled for {flight(c.start, c.end)}. Booked value {inr(c.bookedValue)}.
                {decide.error && <p role="alert" style={{ color: 'var(--text-negative)' }}>{errorText(decide.error)}</p>}
              </ConfirmDialog>
              <NoteDialog open={mode === 'reject'} title={`Reject ${c.name}?`} label="Reason for the advertiser" confirmLabel="Reject campaign"
                busy={decide.isPending} error={decide.error}
                description={refund ? `The card payment of ${inr(c.payment!.amount)} will be refunded.` : 'The advertiser will see this reason.'}
                onConfirm={note => decide.mutate({ decision: 'reject', note })} onCancel={() => setMode(null)} />
            </>
          );
        }}
      </Query>
    </Page>
  );
}
