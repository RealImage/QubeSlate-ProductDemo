import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { advertiserApi, type CampaignDetail, type CheckoutInput } from '@slate/api';
import { Alert, Button, Card, ChoiceCards, Dialog, KeyValue, Loading, Progress } from '@slate/ui';
import { inr, withGst } from '@slate/domain';
import { errorText, notifySuccess, qk, useOrg } from '../../../components/org';
import { Field } from '../../../components/controls';

const PROVIDER: Record<string, string> = { razorpay: 'Razorpay', payu: 'PayU', ccavenue: 'CCAvenue', stub: 'Test gateway' };

/** Step 5: card advertisers pay through their SAC's gateway; contracted advertisers submit against credit. */
export function StepPayment({ campaign }: { campaign: CampaignDetail }) {
  const { sac, can } = useOrg();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const totals = withGst(campaign.bookedValue);
  const missing = campaign.checklist.filter(i => !i.done);
  const allowed = can('campaign.checkout');

  const done = (d: CampaignDetail) => {
    qc.setQueryData(qk.campaign(d.id), d);
    qc.invalidateQueries({ queryKey: qk.campaigns });
    qc.invalidateQueries({ queryKey: qk.dashboard });
    qc.invalidateQueries({ queryKey: qk.invoices });
    qc.invalidateQueries({ queryKey: qk.billing });
    notifySuccess(`Submitted — pending approval by ${sac.name}.`);
    navigate(`/campaigns/${d.id}`, { replace: true });
  };

  const summary = (
    <Card title="Order summary">
      <KeyValue items={[
        ['Placements', `${campaign.placements.length} · ${inr(totals.net)}`],
        ['Platform fee', 'Included'],
        ['GST @ 18%', inr(totals.gst)],
        [<strong>Total payable</strong>, <strong>{inr(totals.total)}</strong>]
      ]} />
    </Card>
  );

  if (campaign.path === 'locked') {
    return (
      <>
        <Alert variant="notice" closable={false} title="Checkout locked until KYC approval">
          The campaign is saved as a draft and holds no inventory. Once {sac.name} approves your company KYC, you can pay or submit it here.
        </Alert>
        {summary}
      </>
    );
  }

  const blockers = (
    <>
      {!allowed && <Alert variant="primary" closable={false}>Only company admins can {campaign.path === 'pay' ? 'pay for' : 'submit'} campaigns. Save the draft and ask an admin to finish checkout.</Alert>}
      {missing.length > 0 && <Alert variant="notice" closable={false} title="Not ready yet">Still to do: {missing.map(i => i.label.toLowerCase()).join(', ')}.</Alert>}
      {campaign.bookedValue > campaign.budget && campaign.budget > 0 && (
        <Alert variant="notice" closable={false}>Placements ({inr(campaign.bookedValue)}) exceed the campaign budget of {inr(campaign.budget)}.</Alert>
      )}
    </>
  );

  return campaign.path === 'pay'
    ? <PayPanel campaign={campaign} total={totals.total} summary={summary} blockers={blockers} disabled={!allowed || missing.length > 0} onDone={done} />
    : <SubmitPanel campaign={campaign} total={totals.total} summary={summary} blockers={blockers} disabled={!allowed || missing.length > 0} onDone={done} />;
}

interface PanelProps {
  campaign: CampaignDetail;
  total: number;
  summary: ReactNode;
  blockers: ReactNode;
  disabled: boolean;
  onDone: (d: CampaignDetail) => void;
}

function PayPanel({ campaign, total, summary, blockers, disabled, onDone }: PanelProps) {
  const { sac } = useOrg();
  const [method, setMethod] = useState<CheckoutInput['method']>('upi');
  const [gatewayOpen, setGatewayOpen] = useState(false);
  const pay = useMutation({ mutationFn: () => advertiserApi.checkout(campaign.id, { method }), onSuccess: onDone });
  const provider = PROVIDER[sac.gateway.provider] ?? sac.gateway.provider;
  return (
    <>
      {blockers}
      {summary}
      <Card title="Payment method" description={`Paid through ${sac.name}’s payment gateway. After payment the campaign goes to ${sac.name} for approval; a rejection refunds it in full.`}>
        <div className="sl-stack">
          {!sac.gateway.enabled && <Alert variant="negative" closable={false}>{sac.name} has not enabled online payments yet. Contact {sac.supportEmail}.</Alert>}
          <Field label="Pay with">
            <ChoiceCards label="Pay with" value={method} onChange={setMethod} options={[
              { value: 'upi', title: 'UPI', hint: 'Any UPI app' },
              { value: 'card', title: 'Card', hint: 'Credit or debit card' },
              { value: 'netbanking', title: 'Netbanking', hint: 'All major banks' }
            ]} />
          </Field>
          {pay.error && <Alert variant="negative" closable={false}>{errorText(pay.error)}</Alert>}
          <div><Button variant="primary" size="large" isDisabled={disabled || !sac.gateway.enabled} onPress={() => setGatewayOpen(true)}>Pay {inr(total)}</Button></div>
        </div>
      </Card>
      {/* Mocked gateway hand-off: a real integration redirects to the SAC's gateway and confirms via webhook. */}
      <Dialog isOpen={gatewayOpen} onOpenChange={setGatewayOpen} width={420}>
        <Dialog.Header>{provider}{sac.gateway.mode === 'test' ? ' · test mode' : ''}</Dialog.Header>
        <Dialog.Body>
          <div className="sl-stack" style={{ gap: 8 }}>
            <span className="sl-muted sl-small">Paying {sac.legalName}</span>
            <div className="adv-total">{inr(total)}</div>
            <span className="sl-small">{campaign.name} · {method === 'upi' ? 'UPI' : method === 'card' ? 'Card' : 'Netbanking'}</span>
            {pay.error && <Alert variant="negative" closable={false}>{errorText(pay.error)}</Alert>}
          </div>
        </Dialog.Body>
        <Dialog.Footer>
          <Button variant="default" onPress={() => setGatewayOpen(false)}>Cancel</Button>
          <Button variant="primary" isPending={pay.isPending} onPress={() => pay.mutate()}>Confirm payment</Button>
        </Dialog.Footer>
      </Dialog>
    </>
  );
}

function SubmitPanel({ campaign, total, summary, blockers, disabled, onDone }: PanelProps) {
  const { sac, company, can } = useOrg();
  const billing = useQuery({ queryKey: qk.billing, queryFn: advertiserApi.billing, enabled: can('billing.view') });
  const submit = useMutation({ mutationFn: () => advertiserApi.submit(campaign.id), onSuccess: onDone });
  const contract = billing.data?.contract ?? company.contract;
  const outstanding = billing.data?.outstanding;
  const headroom = contract && outstanding !== undefined ? contract.creditLimit - outstanding : null;
  return (
    <>
      {blockers}
      {summary}
      <Card title="Contract credit" description={`No payment now — ${sac.legalName} invoices this campaign against your contract once it is approved.`}>
        <div className="sl-stack">
          {!contract ? <Alert variant="notice" closable={false}>No contract on file. Contact {sac.supportEmail}.</Alert>
            : billing.isLoading ? <Loading rows={2} />
            : (
              <>
                <KeyValue items={[
                  ['Contract', contract.ref],
                  ['Credit limit', inr(contract.creditLimit)],
                  ...(headroom !== null ? [
                    ['Already committed', inr(outstanding!)],
                    ['Available now', inr(headroom)],
                    ['This campaign', inr(total)],
                    ['Available after', <strong style={{ color: headroom - total < 0 ? 'var(--text-negative)' : undefined }}>{inr(headroom - total)}</strong>]
                  ] as [string, ReactNode][] : [['This campaign', inr(total)] as [string, string]])
                ]} />
                {headroom !== null && <Progress label="Contract credit used including this campaign" value={(outstanding! + total) / contract.creditLimit} tone={headroom - total < 0 ? 'negative' : undefined} />}
              </>
            )}
          {submit.error && <Alert variant="negative" closable={false}>{errorText(submit.error)}</Alert>}
          <div><Button variant="primary" size="large" isDisabled={disabled} isPending={submit.isPending} onPress={() => submit.mutate()}>Submit for approval</Button></div>
        </div>
      </Card>
    </>
  );
}
