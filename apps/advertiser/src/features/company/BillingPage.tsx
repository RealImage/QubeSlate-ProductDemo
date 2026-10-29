import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { advertiserApi, type BillingOverview } from '@slate/api';
import { Alert, Card, EmptyState, KeyValue, Page, PageHeader, Progress, Query, StatusTag } from '@slate/ui';
import { date, inr, type Company } from '@slate/domain';
import { qk, useCompany, useOrg } from '../../components/org';

const PROVIDER: Record<string, string> = { razorpay: 'Razorpay', payu: 'PayU', ccavenue: 'CCAvenue', stub: 'Test gateway' };

export function BillingPage() {
  const { sac, can } = useOrg();
  const allowed = can('billing.view');
  const q = useQuery({ queryKey: qk.billing, queryFn: advertiserApi.billing, enabled: allowed });
  const company = useCompany().data;
  return (
    <Page>
      <PageHeader title="Billing Details" description={`Billing profile, credit and payment set-up used at campaign checkout. Maintained by ${sac.name}.`} />
      {!allowed
        ? <Card><EmptyState title="Only company admins can view billing">Ask an admin on your account for billing details.</EmptyState></Card>
        : <Query q={q}>{b => <BillingBody billing={b} company={company} />}</Query>}
    </Page>
  );
}

function BillingBody({ billing: b, company }: { billing: BillingOverview; company: Company }) {
  const billingContact = company.contacts.find(c => c.role === 'Billing') ?? company.contacts.find(c => c.role === 'Primary');
  const used = b.contract ? b.outstanding / b.contract.creditLimit : 0;
  return (
    <>
      {!b.billingType && (
        <Alert variant="notice" closable={false} title="Billing type not set yet">
          {b.sac.name} sets your billing type — card/prepaid or contracted — when it approves your KYC.
        </Alert>
      )}
      <div className="sl-grid sl-grid--aside">
        <div className="sl-stack">
          <Card title="Billing profile" description={`Set by ${b.sac.name} — read-only here.`}>
            <KeyValue items={[
              ['Billing type', b.billingType === 'card' ? 'Card / Prepaid' : b.billingType === 'contracted' ? 'Contracted' : 'Pending approval'],
              ['Payment terms', b.billingType === 'card' ? 'Prepaid · checkout per campaign' : b.contract ? `Invoiced · ${b.contract.paymentTermsDays} days` : '—'],
              ['Company billing name', company.name],
              ['Billing address', company.address || '—'],
              ['GSTIN', <span className="sl-mono">{company.gstin || '—'}</span>],
              ['Billing contact', billingContact ? `${billingContact.name} · ${billingContact.email}` : '—'],
              ['Preferred currency', 'INR — Indian Rupee (₹)']
            ]} />
          </Card>
          <Card title="Billed by" description="Invoices and GST credit notes are raised by your sales house.">
            <KeyValue items={[
              ['Legal entity', b.sac.legalName],
              ['GSTIN', <span className="sl-mono">{b.sac.gstin}</span>],
              ['Billing support', <a href={`mailto:${b.sac.supportEmail}`}>{b.sac.supportEmail}</a>]
            ]} />
          </Card>
        </div>
        <div className="sl-stack">
          {b.billingType === 'contracted' && (
            <Card title="Contract & credit">
              {b.contract ? (
                <div className="sl-stack" style={{ gap: 12 }}>
                  <div>
                    <div className="adv-total">{inr(b.contract.creditLimit - b.outstanding)}</div>
                    <span className="sl-muted sl-small">credit available</span>
                  </div>
                  <Progress value={used} tone={used > 0.9 ? 'negative' : used > 0.75 ? 'notice' : undefined} />
                  <KeyValue items={[
                    ['Contract', b.contract.ref],
                    ['Credit used', inr(b.outstanding)],
                    ['Credit limit', inr(b.contract.creditLimit)],
                    ['Payment terms', `${b.contract.paymentTermsDays} days`],
                    ['Valid until', date(b.contract.validUntil)]
                  ]} />
                  <p className="sl-muted sl-small" style={{ margin: 0 }}>Credit used counts campaigns pending approval or running, including GST.</p>
                </div>
              ) : <span className="sl-muted">No contract on file yet.</span>}
            </Card>
          )}
          {b.billingType === 'card' && (
            <Card title="Online payments">
              {b.gateway ? (
                <div className="sl-stack" style={{ gap: 12 }}>
                  <div className="sl-row">
                    <StatusTag tone={b.gateway.enabled ? 'positive' : 'notice'}>{b.gateway.enabled ? 'Enabled' : 'Not enabled'}</StatusTag>
                    {b.gateway.mode === 'test' && <StatusTag tone="secondary">Test mode</StatusTag>}
                  </div>
                  <KeyValue items={[['Gateway', `${PROVIDER[b.gateway.provider] ?? b.gateway.provider} via ${b.sac.name}`], ['Methods', 'Card · UPI · Netbanking']]} />
                  <p className="sl-muted sl-small" style={{ margin: 0 }}>
                    {b.gateway.enabled ? 'You pay per campaign at checkout. Cards are tokenised by the gateway; Slate never stores card numbers.'
                      : `${b.sac.name} has not enabled online payments yet. Contact ${b.sac.supportEmail}.`}
                  </p>
                </div>
              ) : <span className="sl-muted">No gateway configured.</span>}
            </Card>
          )}
          <Card>
            <div className="sl-stack" style={{ gap: 8 }}>
              <span className="sl-muted sl-small">Invoice history and GST invoices are in Reports → Billing.</span>
              <Link to="/reports/billing">Open billing report</Link>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
