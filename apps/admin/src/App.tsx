import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell, RequireSession, SignInPage, ToastRegion, type NavEntry } from '@slate/ui';
import { DashboardIcon, HeartbeatBoxIcon, OrganisationIcon, SecurityIcon } from 'prefab/icons';
import { OverviewPage } from './features/overview/OverviewPage';
import { ExhibitorsPage } from './features/tenants/ExhibitorsPage';
import { SacDetailPage } from './features/tenants/SacDetailPage';
import { SacsPage } from './features/tenants/SacsPage';
import { DevicesPage } from './features/network/DevicesPage';
import { IngestionPage } from './features/network/IngestionPage';
import { TheatresPage } from './features/network/TheatresPage';
import { AdvertisersPage } from './features/oversight/AdvertisersPage';
import { AuditPage } from './features/oversight/AuditPage';
import { CampaignsPage } from './features/oversight/CampaignsPage';
import { UsersPage } from './features/oversight/UsersPage';

const nav: NavEntry[] = [
  { label: 'Overview', to: '/', icon: <DashboardIcon /> },
  { label: 'Tenants', icon: <OrganisationIcon />, items: [
    { label: 'Exhibitors', to: '/tenants/exhibitors' },
    { label: 'SACs', to: '/tenants/sacs' }
  ] },
  { label: 'Network', icon: <HeartbeatBoxIcon />, items: [
    { label: 'Theatres', to: '/network/theatres' },
    { label: 'Devices', to: '/network/devices' },
    { label: 'Play-log ingestion', to: '/network/ingestion' }
  ] },
  { label: 'Oversight', icon: <SecurityIcon />, items: [
    { label: 'Advertisers', to: '/oversight/advertisers' },
    { label: 'Campaigns', to: '/oversight/campaigns' },
    { label: 'Users', to: '/oversight/users' },
    { label: 'Audit log', to: '/oversight/audit' }
  ] }
];

export function App() {
  return (
    <RequireSession signIn={<SignInPage headline="Qube Slate platform administration." />}>
      <Routes>
        <Route element={<AppShell nav={nav} portalLabel="Admin" orgName="Qube Cinema" orgMeta="Platform administration" />}>
          <Route index element={<OverviewPage />} />
          <Route path="tenants/exhibitors" element={<ExhibitorsPage />} />
          <Route path="tenants/sacs" element={<SacsPage />} />
          <Route path="tenants/sacs/:id" element={<SacDetailPage />} />
          <Route path="network/theatres" element={<TheatresPage />} />
          <Route path="network/devices" element={<DevicesPage />} />
          <Route path="network/ingestion" element={<IngestionPage />} />
          <Route path="oversight/advertisers" element={<AdvertisersPage />} />
          <Route path="oversight/campaigns" element={<CampaignsPage />} />
          <Route path="oversight/users" element={<UsersPage />} />
          <Route path="oversight/audit" element={<AuditPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <ToastRegion />
    </RequireSession>
  );
}
