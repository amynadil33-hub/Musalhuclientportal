import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
import AppLayout from "./pages/layout/AppLayout.tsx";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import ClientsPage from "./pages/clients/page.tsx";
import ClientProjectPage from "./pages/clients/[clientId]/page.tsx";
import CampaignsPage from "./pages/campaigns/page.tsx";
import CampaignDetailPage from "./pages/campaigns/[campaignId]/page.tsx";
import ImageStudioPage from "./pages/image-studio/page.tsx";
import ReelStudioPage from "./pages/reel-studio/page.tsx";
import GeneratedLibraryPage from "./pages/library/page.tsx";
import SettingsPage from "./pages/settings/page.tsx";

export default function App() {
  return (
    <DefaultProviders>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/clients/:clientId" element={<ClientProjectPage />} />
            <Route path="/campaigns" element={<CampaignsPage />} />
            <Route
              path="/campaigns/:campaignId"
              element={<CampaignDetailPage />}
            />
            <Route path="/image-studio" element={<ImageStudioPage />} />
            <Route path="/reel-studio" element={<ReelStudioPage />} />
            <Route path="/library" element={<GeneratedLibraryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </DefaultProviders>
  );
}
