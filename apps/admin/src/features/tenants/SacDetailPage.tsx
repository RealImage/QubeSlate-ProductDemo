import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useSession } from '@slate/api';
import { sacSubdomain } from '@slate/domain';
import { EmptyState, Page, PageHeader, Query, TabPanel, Tabs } from '@slate/ui';
import { SacStatusTag } from '../../components/SacStatusTag';
import { useSacs } from '../../components/queries';
import { SacActionsMenu } from './SacActionsMenu';
import { SacBillingTab } from './SacBillingTab';
import { SacCollectionsTab } from './SacCollectionsTab';
import { SacProfileTab } from './SacProfileTab';
import { SacTheatresCard } from './SacTheatresCard';
import { SacUsersCard } from './SacUsersCard';

type Tab = 'profile' | 'exhibitors' | 'billing' | 'collections' | 'users';
const TABS: Tab[] = ['profile', 'exhibitors', 'billing', 'collections', 'users'];

export function SacDetailPage() {
  const { id } = useParams();
  const q = useSacs();
  const { can } = useSession();
  const [params] = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => TABS.find(t => t === params.get('tab')) ?? 'profile');
  return (
    <Page>
      <Query q={q} rows={3}>
        {sacs => {
          const sac = sacs.find(s => s.id === id);
          if (!sac) return <EmptyState title="SAC not found" action={<Link to="/tenants/sacs">Back to SACs</Link>}>No SAC with id {id}.</EmptyState>;
          return (
            <>
              <PageHeader eyebrow={<><Link to="/tenants/sacs">SACs</Link> / {sacSubdomain(sac.url) || sac.id}</>} title={<>{sac.name} <SacStatusTag status={sac.status} /></>} description={sac.legalName}
                actions={<SacActionsMenu sac={sac} canManage={can('tenants.manage')} />} />
              <Tabs name="sac" label="SAC sections" value={tab} onChange={setTab} tabs={[
                { id: 'profile', label: 'Profile' }, { id: 'exhibitors', label: 'Exhibitors' }, { id: 'billing', label: 'Billing Information' },
                { id: 'collections', label: 'Collections Management' }, { id: 'users', label: 'Users' }
              ]} />
              <TabPanel of="sac" id={tab}>
                {tab === 'profile' && <SacProfileTab sac={sac} sacs={sacs} canEdit={can('tenants.manage')} />}
                {tab === 'exhibitors' && <SacTheatresCard sac={sac} canSync={can('tenants.manage')} />}
                {tab === 'billing' && <SacBillingTab sac={sac} canEdit={can('tenants.manage')} />}
                {tab === 'collections' && <SacCollectionsTab sac={sac} canEditCompany={can('tenants.manage')} canManageGateways={can('gateway.manage')} />}
                {tab === 'users' && <SacUsersCard sac={sac} />}
              </TabPanel>
            </>
          );
        }}
      </Query>
    </Page>
  );
}
