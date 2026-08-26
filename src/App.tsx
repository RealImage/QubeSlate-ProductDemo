import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { CampaignManagement } from './pages/CampaignManagement';
import { CreateCampaign } from './pages/CreateCampaign';
import { InventoryAvailability } from './pages/InventoryAvailability';
import { TargetGroups } from './pages/TargetGroups';
import { Theatres } from './pages/Theatres';
import { PlaylistTemplates } from './pages/PlaylistTemplates';
import { PreShowPlaylist } from './pages/PreShowPlaylist';
import { Compositions } from './pages/Compositions';
import { ProofOfPlay } from './pages/ProofOfPlay';
import { DistributionStatus } from './pages/DistributionStatus';
import { ReportsAnalytics } from './pages/ReportsAnalytics';
import { Approvals } from './pages/Approvals';
import { RateBias } from './pages/RateBias';
import { BrandCatalogue } from './pages/BrandCatalogue';
import { ClientDirectory } from './pages/ClientDirectory';
import { UserManagement } from './pages/UserManagement';
import { PlatformSettings } from './pages/PlatformSettings';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/campaigns" element={<CampaignManagement />} />
        <Route path="/campaigns/create" element={<CreateCampaign />} />
        <Route path="/campaigns/rate-bias" element={<RateBias />} />
        <Route path="/target-groups" element={<TargetGroups />} />
        <Route path="/approvals/campaigns" element={<Approvals />} />
        <Route path="/approvals/brands" element={<Approvals />} />
        <Route path="/approvals/clients" element={<Approvals />} />
        <Route path="/content/compositions" element={<Compositions />} />
        <Route path="/content/unmapped" element={<Compositions />} />
        <Route path="/content/archived" element={<Compositions />} />
        <Route path="/inventory/availability" element={<InventoryAvailability />} />
        <Route path="/inventory/theatres" element={<Theatres />} />
        <Route path="/inventory/templates" element={<PlaylistTemplates />} />
        <Route path="/inventory/playlist" element={<PreShowPlaylist />} />
        <Route path="/catalogue/brands" element={<BrandCatalogue />} />
        <Route path="/catalogue/clients" element={<ClientDirectory />} />
        <Route path="/reports" element={<ReportsAnalytics />} />
        <Route path="/reports/proof-of-play" element={<ProofOfPlay />} />
        <Route path="/reports/distribution" element={<DistributionStatus />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/settings" element={<PlatformSettings />} />
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}

export default App;
