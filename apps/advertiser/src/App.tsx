import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell, RequireSession, SignInPage, ToastRegion, type NavEntry } from '@slate/ui';
import { AdGroupIcon, CampaignIcon, CompaniesIcon, DashboardIcon, FolderIcon, ReportsIcon } from 'prefab/icons';
import { useSession } from '@slate/api';
import { KycBanner } from './features/company/KycBanner';
import { SignUpEntry } from './features/company/SignUp';
import { CompanyPage } from './features/company/CompanyPage';
import { BrandsPage } from './features/company/BrandsPage';
import { UsersPage } from './features/company/UsersPage';
import { BillingPage } from './features/company/BillingPage';
import { BillingReportPage } from './features/company/BillingReportPage';
import { TargetGroupsPage } from './features/planning/TargetGroupsPage';
import { TargetGroupBuilder } from './features/planning/TargetGroupBuilder';
import { MediaLibraryPage } from './features/planning/MediaLibraryPage';
import { CreateMediaPage } from './features/planning/CreateMediaPage';
import { DashboardPage } from './features/campaigns/DashboardPage';
import { CampaignsPage } from './features/campaigns/CampaignsPage';
import { CampaignDetailPage } from './features/campaigns/CampaignDetailPage';
import { CampaignWizard } from './features/campaigns/wizard/CampaignWizard';

function useNav(): NavEntry[] {
  const { can } = useSession();
  return [
    { label: 'Dashboard', to: '/', icon: <DashboardIcon /> },
    { label: 'Campaign Management', to: '/campaigns', icon: <CampaignIcon /> },
    { label: 'Media Management', icon: <FolderIcon />, items: [{ label: 'Media Library', to: '/media' }, { label: 'Create Media', to: '/media/new' }] },
    { label: 'Target Groups', to: '/target-groups', icon: <AdGroupIcon /> },
    {
      label: 'Company Management', icon: <CompaniesIcon />, items: [
        { label: 'Company Information', to: '/company' },
        { label: 'Brands', to: '/company/brands' },
        { label: 'Users & Roles', to: '/company/users' },
        ...(can('billing.view') ? [{ label: 'Billing Details', to: '/company/billing' }] : [])
      ]
    },
    ...(can('billing.view') ? [{ label: 'Reports', icon: <ReportsIcon />, items: [{ label: 'Billing', to: '/reports/billing' }] }] : [])
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
              <Route index element={<DashboardPage />} />
              <Route path="campaigns" element={<CampaignsPage />} />
              <Route path="campaigns/new" element={<CampaignWizard />} />
              <Route path="campaigns/:id" element={<CampaignDetailPage />} />
              <Route path="campaigns/:id/edit" element={<CampaignWizard />} />
              <Route path="target-groups" element={<TargetGroupsPage />} />
              <Route path="target-groups/new" element={<TargetGroupBuilder />} />
              <Route path="target-groups/:id" element={<TargetGroupBuilder />} />
              <Route path="media" element={<MediaLibraryPage />} />
              <Route path="media/new" element={<CreateMediaPage />} />
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
