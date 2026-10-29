import { useState } from 'react';
import { useSession } from '@slate/api';
import { date, num } from '@slate/domain';
import { Button, Card, DataTable, Page, PageHeader, Query } from '@slate/ui';
import { AddIcon } from 'prefab/icons';
import { useExhibitors } from '../../components/queries';
import { AddExhibitorDialog } from './AddExhibitorDialog';

export function ExhibitorsPage() {
  const q = useExhibitors();
  const { can } = useSession();
  const [open, setOpen] = useState(false);
  return (
    <Page>
      <PageHeader eyebrow="Tenants" title="Exhibitors" description="Theatre chains and DOOH owners whose play logs feed the platform."
        actions={can('tenants.manage') && <Button variant="primary" onPress={() => setOpen(true)}><AddIcon />Add exhibitor</Button>} />
      <Card flush>
        <Query q={q}>
          {rows => (
            <DataTable caption="Exhibitors" rows={rows} rowKey={r => r.id} defaultSort={{ key: 'name', dir: 'asc' }}
              empty={<div className="sl-empty"><strong>No exhibitors yet</strong></div>}
              columns={[
                { key: 'name', header: 'Exhibitor', sort: r => r.name, cell: r => <><div className="sl-table__primary">{r.name}</div><div className="sl-table__secondary">{r.code}</div></> },
                { key: 'hq', header: 'HQ', sort: r => r.hq, cell: r => r.hq },
                { key: 'theatres', header: 'Theatres', align: 'right', sort: r => r.theatres, cell: r => num(r.theatres) },
                { key: 'screens', header: 'Screens', align: 'right', sort: r => r.screens, cell: r => num(r.screens) },
                { key: 'dooh', header: 'DOOH groups', align: 'right', sort: r => r.doohGroups, cell: r => num(r.doohGroups) },
                { key: 'sacs', header: 'Sold by', cell: r => r.sacs.join(', ') || '—' },
                { key: 'created', header: 'Added', sort: r => r.createdAt, cell: r => date(r.createdAt) }
              ]} />
          )}
        </Query>
      </Card>
      <AddExhibitorDialog open={open} onClose={() => setOpen(false)} />
    </Page>
  );
}
