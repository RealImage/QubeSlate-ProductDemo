import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell, RequireSession, SignInPage, ToastRegion, type NavEntry } from '@slate/ui';
import { CompaniesIcon, ReportsIcon } from 'prefab/icons';
import { useSession } from '@slate/api';
import { KycBanner } from './features/company/KycBanner';
import { SignUpEntry } from './features/company/SignUp';
import { CompanyPage } from './features/company/CompanyPage';
import { BrandsPage } from './features/company/BrandsPage';
import { UsersPage } from './features/company/UsersPage';
import { BillingPage } from './features/company/BillingPage';
import { BillingReportPage } from './features/company/BillingReportPage';

function useNav(): NavEntry[] {
  const { can } = useSession();
  return [
    {
      label: 'Company Management', icon: <CompaniesIcon />, items: [
        { label: 'Company Information', to: '/company' },
        { label: 'Brands', to: '/company/brands' },
        { label: 'Users & Roles', to: '/company/users' },
        ...(can('billing.view') ? [{ label: 'Billing Details', to: '/company/billing' }] : [])
      ]
    },
    { label: 'Reports', icon: <ReportsIcon />, items: [{ label: 'Billing', to: '/reports/billing' }] }
  ];
}

/** Puts the KYC banner above every screen except Company Information, which shows its own status. */
function KycFrame() {
  const { pathname } = useLocation();
  return <>{pathname !== '/company' && <KycBanner />}<Outlet /></>;
}

export function App() {
  const { session } = useSession();
  const org = session?.org.kind === 'company' ? session.org : null;
  const nav = useNav();
  return (
    <>
      <ToastRegion />
      <RequireSession signIn={<SignInPage headline="Plan, book and run cinema and DOOH campaigns."><SignUpEntry /></SignInPage>}>
        <Routes>
          <Route element={<AppShell nav={nav} portalLabel="Advertiser" orgName={org?.company.name} orgMeta={org && `${org.company.code} · via ${org.sac.name}`} />}>
            <Route element={<KycFrame />}>
              <Route index element={<Navigate to="/company" replace />} />
              <Route path="company" element={<CompanyPage />} />
              <Route path="company/brands" element={<BrandsPage />} />
              <Route path="company/users" element={<UsersPage />} />
              <Route path="company/billing" element={<BillingPage />} />
              <Route path="reports/billing" element={<BillingReportPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </RequireSession>
    </>
  );
}
