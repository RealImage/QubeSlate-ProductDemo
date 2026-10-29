import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { sacApi } from '@slate/api';
import { BillingTag } from '../shared';
import { dateTime, flight, inr } from '@slate/domain';
import { Card, DataTable, EmptyState, Page, PageHeader, Query, StatusTag } from '@slate/ui';

export function CampaignApprovals() {
  const navigate = useNavigate();
  const q = useQuery({ queryKey: ['sac', 'campaigns'], queryFn: sacApi.campaigns });
  return (
    <Page>
      <PageHeader title="Campaign Approvals" description="Campaigns submitted by advertisers and waiting for your decision." actions={q.data && <StatusTag tone="notice" size="medium">{q.data.filter(c => c.status === 'pending_approval').length} awaiting decision</StatusTag>} />
      <Card flush>
        <Query q={q}>
          {all => {
            const rows = all.filter(c => c.status === 'pending_approval');
            return (
              <DataTable
                rows={rows}
                rowKey={c => c.id}
                caption="Campaigns pending approval"
                onRowClick={c => navigate(`/approvals/campaigns/${c.id}`)}
                defaultSort={{ key: 'submitted', dir: 'asc' }}
                empty={<EmptyState title="Nothing to approve">No campaigns are waiting for approval.</EmptyState>}
                columns={[
                  { key: 'name', header: 'Campaign', sort: c => c.name, cell: c => <><div className="sl-table__primary">{c.name}</div><div className="sl-table__secondary">{c.code}</div></> },
                  { key: 'advertiser', header: 'Advertiser', sort: c => c.companyName, cell: c => <>{c.companyName}<div className="sl-table__secondary">{c.brandName}</div></> },
                  { key: 'flight', header: 'Flight', sort: c => c.start, cell: c => flight(c.start, c.end) },
                  { key: 'billing', header: 'Billing', cell: c => <BillingTag type={c.billingType} /> },
                  { key: 'screens', header: 'Screens', align: 'right', sort: c => c.screens, cell: c => c.screens },
                  { key: 'value', header: 'Booked value', align: 'right', sort: c => c.bookedValue, cell: c => inr(c.bookedValue) },
                  { key: 'submitted', header: 'Submitted', sort: c => c.submittedAt ?? '', cell: c => dateTime(c.submittedAt) }
                ]}
              />
            );
          }}
        </Query>
      </Card>
    </Page>
  );
}
