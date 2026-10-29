import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@slate/api';
import { inrShort, num } from '@slate/domain';
import { Button, Card, DataTable, Page, PageHeader, Query } from '@slate/ui';
import { AddIcon } from 'prefab/icons';
import { GatewayTag, SacStatusTag } from '../../components/SacStatusTag';
import { useSacs } from '../../components/queries';
import { OnboardSacSheet } from './OnboardSacSheet';

export function SacsPage() {
  const q = useSacs();
  const nav = useNavigate();
  const { can } = useSession();
  const [open, setOpen] = useState(false);
  return (
    <Page>
      <PageHeader eyebrow="Tenants" title="SACs" description="Screen Advertising Consolidators selling exhibitor inventory to advertisers."
        actions={can('tenants.manage') && <Button variant="primary" onPress={() => setOpen(true)}><AddIcon />Onboard SAC</Button>} />
      <Card flush>
        <Query q={q}>
          {rows => (
            <DataTable caption="SACs" rows={rows} rowKey={r => r.id} onRowClick={r => nav(`/tenants/sacs/${r.id}`)} defaultSort={{ key: 'name', dir: 'asc' }}
              empty={<div className="sl-empty"><strong>No SACs yet</strong></div>}
              columns={[
                { key: 'name', header: 'SAC', sort: r => r.name, cell: r => <><div className="sl-table__primary">{r.name}</div><div className="sl-table__secondary">{r.slug}</div></> },
                { key: 'ex', header: 'Exhibitors sold', cell: r => r.exhibitorNames.join(', ') || '—' },
                { key: 'adv', header: 'Advertisers', align: 'right', sort: r => r.advertisers, cell: r => num(r.advertisers) },
                { key: 'users', header: 'Users', align: 'right', sort: r => r.users, cell: r => num(r.users) },
                { key: 'booked', header: 'Booked value', align: 'right', sort: r => r.bookedValue, cell: r => inrShort(r.bookedValue) },
                { key: 'gw', header: 'Gateway', cell: r => <GatewayTag gateway={r.gateway} /> },
                { key: 'status', header: 'Status', sort: r => r.status, cell: r => <SacStatusTag status={r.status} /> }
              ]} />
          )}
        </Query>
      </Card>
      <OnboardSacSheet open={open} onClose={() => setOpen(false)} />
    </Page>
  );
}
