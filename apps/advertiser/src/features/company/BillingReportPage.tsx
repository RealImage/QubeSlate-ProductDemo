import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { advertiserApi, type InvoiceRow } from '@slate/api';
import { Card, DataTable, EmptyState, Page, PageHeader, Query, StatCard, StatusTag, type Column } from '@slate/ui';
import { date, inr, inrShort } from '@slate/domain';
import { qk, useOrg } from '../../components/org';

const TONE: Record<InvoiceRow['status'], 'positive' | 'notice' | 'negative' | 'secondary'> = { paid: 'positive', due: 'notice', overdue: 'negative', refunded: 'secondary' };
const LABEL: Record<InvoiceRow['status'], string> = { paid: 'Paid', due: 'Due', overdue: 'Overdue', refunded: 'Refunded' };

const columns: Column<InvoiceRow>[] = [
  { key: 'number', header: 'Invoice', sort: i => i.number, cell: i => <span className="sl-table__primary sl-mono">{i.number}</span> },
  { key: 'date', header: 'Date', sort: i => i.issuedAt, cell: i => date(i.issuedAt) },
  { key: 'campaign', header: 'Campaign', sort: i => i.campaignName, cell: i => <Link to={`/campaigns/${i.campaignId}`} onClick={e => e.stopPropagation()}>{i.campaignName}</Link> },
  { key: 'gst', header: 'GST', align: 'right', sort: i => i.gst, cell: i => inr(i.gst) },
  { key: 'amount', header: 'Amount (incl. GST)', align: 'right', sort: i => i.amount, cell: i => <strong>{inr(i.amount)}</strong> },
  { key: 'status', header: 'Status', sort: i => i.status, cell: i => <StatusTag tone={TONE[i.status]}>{LABEL[i.status]}</StatusTag> }
];

export function BillingReportPage() {
  const { sac } = useOrg();
  const q = useQuery({ queryKey: qk.invoices, queryFn: advertiserApi.invoices });
  return (
    <Page>
      <PageHeader title="Billing report" description={`Invoices raised by ${sac.legalName} against your campaigns.`} />
      <Query q={q}>
        {list => {
          const sum = (pred: (i: InvoiceRow) => boolean) => list.filter(pred).reduce((s, i) => s + i.amount, 0);
          const open = list.filter(i => i.status === 'due' || i.status === 'overdue');
          return (
            <>
              <div className="sl-grid sl-grid--4">
                <StatCard label="Invoiced" value={inrShort(sum(i => i.status !== 'refunded'))} hint={`${list.length} invoices`} />
                <StatCard label="Paid" value={inrShort(sum(i => i.status === 'paid'))} />
                <StatCard label="Outstanding" value={inrShort(sum(i => i.status === 'due' || i.status === 'overdue'))}
                  hint={open.length ? `${open.length} open` : 'All settled'} tone={open.some(i => i.status === 'overdue') ? 'negative' : undefined} />
                <StatCard label="Refunded" value={inrShort(sum(i => i.status === 'refunded'))} hint="Rejected prepaid campaigns" />
              </div>
              <Card title="Invoices" description={`${list.length} invoices`} flush>
                <DataTable rows={list} columns={columns} rowKey={i => i.id} defaultSort={{ key: 'date', dir: 'desc' }} caption="Invoices"
                  empty={<EmptyState title="No invoices yet">Invoices appear here once a campaign is paid for or invoiced by {sac.name}.</EmptyState>} />
              </Card>
            </>
          );
        }}
      </Query>
    </Page>
  );
}
