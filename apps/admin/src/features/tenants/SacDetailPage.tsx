import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSession } from '@slate/api';
import { EmptyState, Page, PageHeader, Query, TabPanel, Tabs } from '@slate/ui';
import { SacStatusTag } from '../../components/SacStatusTag';
import { useSacs } from '../../components/queries';
import { SacExhibitorsCard } from './SacExhibitorsCard';
import { SacGatewayCard } from './SacGatewayCard';
import { SacProfileCard } from './SacProfileCard';
import { SacUsersCard } from './SacUsersCard';

type Tab = 'profile' | 'exhibitors' | 'gateway' | 'users';

export function SacDetailPage() {
  const { id } = useParams();
  const q = useSacs();
  const { can } = useSession();
  const [tab, setTab] = useState<Tab>('profile');
  return (
    <Page>
      <Query q={q} rows={3}>
        {sacs => {
          const sac = sacs.find(s => s.id === id);
          if (!sac) return <EmptyState title="SAC not found" action={<Link to="/tenants/sacs">Back to SACs</Link>}>No SAC with id {id}.</EmptyState>;
          return (
            <>
              <PageHeader eyebrow={<><Link to="/tenants/sacs">SACs</Link> / {sac.slug}</>} title={<>{sac.name} <SacStatusTag status={sac.status} /></>} description={sac.legalName} />
              <Tabs name="sac" label="SAC sections" value={tab} onChange={setTab} tabs={[
                { id: 'profile', label: 'Profile' }, { id: 'exhibitors', label: 'Linked exhibitors' },
                { id: 'gateway', label: 'Payment gateway' }, { id: 'users', label: 'Users' }
              ]} />
              <TabPanel of="sac" id={tab}>
                {tab === 'profile' && <SacProfileCard sac={sac} canEdit={can('tenants.manage')} />}
                {tab === 'exhibitors' && <SacExhibitorsCard sac={sac} canEdit={can('tenants.manage')} />}
                {tab === 'gateway' && <SacGatewayCard sac={sac} canEdit={can('gateway.manage')} />}
                {tab === 'users' && <SacUsersCard sac={sac} />}
              </TabPanel>
            </>
          );
        }}
      </Query>
    </Page>
  );
}
