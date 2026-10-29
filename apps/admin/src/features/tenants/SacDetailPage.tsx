import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSession } from '@slate/api';
import { EmptyState, Page, PageHeader, Query } from '@slate/ui';
import { SacStatusTag } from '../../components/SacStatusTag';
import { SectionTabs } from '../../components/Tabs';
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
              <SectionTabs label="SAC sections" value={tab} onChange={setTab} tabs={[
                { value: 'profile', label: 'Profile' }, { value: 'exhibitors', label: 'Linked exhibitors' },
                { value: 'gateway', label: 'Payment gateway' }, { value: 'users', label: 'Users' }
              ]} />
              {tab === 'profile' && <SacProfileCard sac={sac} canEdit={can('tenants.manage')} />}
              {tab === 'exhibitors' && <SacExhibitorsCard sac={sac} canEdit={can('tenants.manage')} />}
              {tab === 'gateway' && <SacGatewayCard sac={sac} canEdit={can('gateway.manage')} />}
              {tab === 'users' && <SacUsersCard sac={sac} />}
            </>
          );
        }}
      </Query>
    </Page>
  );
}
