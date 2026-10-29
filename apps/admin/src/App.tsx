import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell, RequireSession, SignInPage, ToastRegion, type NavEntry } from '@slate/ui';
import {
  CampaignIcon, CompaniesIcon, DashboardIcon, DeviceIcon, HeartbeatBoxIcon, ListIcon, LogsIcon, MultipleUsersIcon, OrganisationIcon, SecurityIcon, TheatreIcon
} from 'prefab/icons';
import { BrandsPage } from './features/catalog/BrandsPage';
import { CategoriesPage } from './features/catalog/CategoriesPage';
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
    { label: 'Exhibitors', to: '/tenants/exhibitors', icon: <CompaniesIcon /> },
    { label: 'SACs', to: '/tenants/sacs', icon: <OrganisationIcon /> }
  ] },
  { label: 'Catalog', icon: <ListIcon />, items: [
    { label: 'Brands', to: '/catalog/brands', icon: <CompaniesIcon /> },
    { label: 'Category Lists', to: '/catalog/categories', icon: <ListIcon /> }
  ] },
  { label: 'Network', icon: <HeartbeatBoxIcon />, items: [
    { label: 'Theatres', to: '/network/theatres', icon: <TheatreIcon /> },
    { label: 'Devices', to: '/network/devices', icon: <DeviceIcon /> },
    { label: 'Play-log ingestion', to: '/network/ingestion', icon: <HeartbeatBoxIcon /> }
  ] },
  { label: 'Oversight', icon: <SecurityIcon />, items: [
    { label: 'Advertisers', to: '/oversight/advertisers', icon: <CompaniesIcon /> },
    { label: 'Campaigns', to: '/oversight/campaigns', icon: <CampaignIcon /> },
    { label: 'Users', to: '/oversight/users', icon: <MultipleUsersIcon /> },
    { label: 'Audit log', to: '/oversight/audit', icon: <LogsIcon /> }
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
          <Route path="catalog/brands" element={<BrandsPage />} />
          <Route path="catalog/categories" element={<CategoriesPage />} />
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
