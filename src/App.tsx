import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import CreateCampaign from "./pages/CreateCampaign";
import CampaignManagement from "./pages/CampaignManagement";
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/campaigns" element={<CampaignManagement />} />
            <Route path="/campaigns/create" element={<CreateCampaign />} />
            <Route path="/campaigns/rate-bias" element={
              <PlaceholderPage 
                title="Campaign Rate Bias" 
                description="Manage pricing adjustments by geography, theatre type, segment, or daypart."
                backLink="/campaigns"
                backText="Back to Campaigns"
              />
            } />
            <Route path="/approvals/campaigns" element={
              <PlaceholderPage 
                title="Campaign Approvals" 
                description="Review and approve campaigns for release to the network."
              />
            } />
            <Route path="/approvals/brands" element={
              <PlaceholderPage 
                title="Brand Approvals" 
                description="Manage creative approvals from brand partners."
              />
            } />
            <Route path="/approvals/clients" element={
              <PlaceholderPage 
                title="Client Approvals" 
                description="Handle advertiser and agency approvals before scheduling."
              />
            } />
            <Route path="/content/compositions" element={
              <PlaceholderPage 
                title="Compositions Library" 
                description="Browse and manage your approved and active content assets."
              />
            } />
            <Route path="/content/unmapped" element={
              <PlaceholderPage 
                title="Unmapped Compositions" 
                description="Review uploaded content that hasn't been assigned to campaigns."
              />
            } />
            <Route path="/content/archived" element={
              <PlaceholderPage 
                title="Archived Content" 
                description="Access expired and past-use content kept for records."
              />
            } />
            <Route path="/inventory/theatres" element={
              <PlaceholderPage 
                title="Network Theatres & Screens" 
                description="Searchable directory of theatres with filters by region, format, and capacity."
              />
            } />
            <Route path="/inventory/templates" element={
              <PlaceholderPage 
                title="Playlist Templates" 
                description="Manage predefined ad block layouts for various slots and theatre types."
              />
            } />
            <Route path="/catalogue/brands" element={
              <PlaceholderPage 
                title="Brand Catalogue" 
                description="Master brand list with linked creatives and metadata."
              />
            } />
            <Route path="/catalogue/clients" element={
              <PlaceholderPage 
                title="Client Directory" 
                description="Master advertiser and agency list with contact info and history."
              />
            } />
            <Route path="/reports" element={
              <PlaceholderPage 
                title="Reports & Analytics" 
                description="Campaign performance, inventory utilization, and approval turnaround reports."
              />
            } />
            <Route path="/users" element={
              <PlaceholderPage 
                title="User Management" 
                description="Manage users, roles, permissions, and access levels."
              />
            } />
            <Route path="/settings" element={
              <PlaceholderPage 
                title="Platform Settings" 
                description="Configure time zones, default rates, content formats, and theatre network settings."
              />
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
