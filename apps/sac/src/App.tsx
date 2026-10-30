import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AppShell, RequireSession, SignInPage, ToastRegion, type NavEntry } from '@slate/ui';
import { CampaignApprovalIcon, CampaignIcon, ContentIcon, DashboardIcon, ListIcon, MoviesIcon, MultipleUsersIcon, ReportsIcon, SettingsIcon } from 'prefab/icons';
import { useSession } from '@slate/api';
import { Dashboard } from './features/reports/Dashboard';
import { ProofOfPlay } from './features/reports/ProofOfPlay';
import { CampaignApprovals } from './features/approvals/CampaignApprovals';
import { BrandApprovals } from './features/approvals/BrandApprovals';
import { ClientApprovals } from './features/approvals/ClientApprovals';
import { CampaignDetailPage } from './features/approvals/CampaignDetailPage';
import { CampaignManagement } from './features/approvals/CampaignManagement';
import { ClientDirectory } from './features/advertisers/ClientDirectory';
import { BrandCatalogue } from './features/advertisers/BrandCatalogue';
import { Theatres } from './features/inventory/Theatres';
import { NetworkDooh } from './features/inventory/NetworkDooh';
import { UserManagement } from './features/users/UserManagement';
import { InventoryAvailability } from './pages/InventoryAvailability';
import { PlaylistTemplates } from './pages/PlaylistTemplates';
import { PreShowPlaylist } from './pages/PreShowPlaylist';
import { Compositions } from './pages/Compositions';
import { DistributionStatus } from './pages/DistributionStatus';
import { ReportsAnalytics } from './pages/ReportsAnalytics';
import { RateBias } from './pages/RateBias';
import { PlatformSettings } from './pages/PlatformSettings';

const nav: NavEntry[] = [
  { label: 'Dashboard', to: '/', icon: <DashboardIcon /> },
  { label: 'Approvals', icon: <CampaignApprovalIcon />, items: [
    { label: 'Campaign', to: '/approvals/campaigns' },
    { label: 'Brand', to: '/approvals/brands' },
    { label: 'Client / KYC', to: '/approvals/clients' }
  ] },
  { label: 'Campaigns', icon: <CampaignIcon />, items: [
    { label: 'Campaign Management', to: '/campaigns' },
    { label: 'Campaign Rate Bias', to: '/campaigns/rate-bias' }
  ] },
  { label: 'Content', icon: <ContentIcon />, items: [
    { label: 'Compositions', to: '/content/compositions' },
    { label: 'Unmapped', to: '/content/unmapped' },
    { label: 'Archived', to: '/content/archived' }
  ] },
  { label: 'Inventory', icon: <MoviesIcon />, items: [
    { label: 'Availability', to: '/inventory/availability' },
    { label: 'Network Theatres & Screens', to: '/inventory/theatres' },
    { label: 'Network DOOH', to: '/inventory/dooh' },
    { label: 'Playlist Templates', to: '/inventory/templates' },
    { label: 'Pre-Show Playlist', to: '/inventory/playlist' }
  ] },
  { label: 'Catalogue', icon: <ListIcon />, items: [
    { label: 'Brands', to: '/catalogue/brands' },
    { label: 'Clients', to: '/catalogue/clients' }
  ] },
  { label: 'Reports', icon: <ReportsIcon />, items: [
    { label: 'Reports & Analytics', to: '/reports' },
    { label: 'Proof of Play', to: '/reports/proof-of-play' },
    { label: 'Distribution Status', to: '/reports/distribution' }
  ] },
  { label: 'User Management', to: '/users', icon: <MultipleUsersIcon /> },
  { label: 'Settings', to: '/settings', icon: <SettingsIcon /> }
];

/** Padding for pages that still use the legacy markup. */
function LegacyPage() {
  return <div style={{ padding: '28px 28px 64px' }}><Outlet /></div>;
}

function App() {
  const { session } = useSession();
  const org = session?.org.kind === 'sac' ? session.org : null;
  return (
    <>
      <RequireSession signIn={<SignInPage headline="Sell exhibitor inventory and keep every advertiser approved and on contract." />}>
        <Routes>
          <Route element={<AppShell nav={nav} portalLabel="SAC" orgName={org?.sac.name} orgMeta={org?.sac.legalName} logo={org?.sac.branding.logo} />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/approvals/campaigns" element={<CampaignApprovals />} />
            <Route path="/approvals/campaigns/:id" element={<CampaignDetailPage backTo="/approvals/campaigns" backLabel="Campaign approvals" />} />
            <Route path="/approvals/brands" element={<BrandApprovals />} />
            <Route path="/approvals/clients" element={<ClientApprovals />} />
            <Route path="/campaigns" element={<CampaignManagement />} />
            <Route path="/campaigns/:id" element={<CampaignDetailPage backTo="/campaigns" backLabel="Campaign management" />} />
            <Route path="/inventory/theatres" element={<Theatres />} />
            <Route path="/inventory/dooh" element={<NetworkDooh />} />
            <Route path="/catalogue/brands" element={<BrandCatalogue />} />
            <Route path="/catalogue/clients" element={<ClientDirectory />} />
            <Route path="/reports/proof-of-play" element={<ProofOfPlay />} />
            <Route path="/users" element={<UserManagement />} />
            <Route element={<LegacyPage />}>
              <Route path="/campaigns/rate-bias" element={<RateBias />} />
              <Route path="/content/compositions" element={<Compositions />} />
              <Route path="/content/unmapped" element={<Compositions />} />
              <Route path="/content/archived" element={<Compositions />} />
              <Route path="/inventory/availability" element={<InventoryAvailability />} />
              <Route path="/inventory/templates" element={<PlaylistTemplates />} />
              <Route path="/inventory/playlist" element={<PreShowPlaylist />} />
              <Route path="/reports" element={<ReportsAnalytics />} />
              <Route path="/reports/distribution" element={<DistributionStatus />} />
              <Route path="/settings" element={<PlatformSettings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </RequireSession>
      <ToastRegion />
    </>
  );
}

export default App;
