import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell, RequireSession, SignInPage, ToastRegion, type NavEntry } from '@slate/ui';
import {
  CompaniesIcon, DashboardIcon, OrganisationIcon
} from 'prefab/icons';
import { OverviewPage } from './features/overview/OverviewPage';
import { ExhibitorsPage } from './features/tenants/ExhibitorsPage';
import { SacDetailPage } from './features/tenants/SacDetailPage';
import { SacsPage } from './features/tenants/SacsPage';

const nav: NavEntry[] = [
  { label: 'Overview', to: '/', icon: <DashboardIcon /> },
  { label: 'Tenants', icon: <OrganisationIcon />, items: [
    { label: 'Exhibitors', to: '/tenants/exhibitors', icon: <CompaniesIcon /> },
    { label: 'SACs', to: '/tenants/sacs', icon: <OrganisationIcon /> }
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <ToastRegion />
    </RequireSession>
  );
}
