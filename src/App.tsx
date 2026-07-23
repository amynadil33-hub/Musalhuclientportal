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
import ComposerListPage from "./pages/composer/page.tsx";
import ComposerEditorPage from "./pages/composer/[compositionId]/page.tsx";
import DhivehiPhrasesPage from "./pages/dhivehi-phrases/page.tsx";
import DhivehiFontsPage from "./pages/settings/dhivehi-fonts/page.tsx";

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
            <Route path="/composer" element={<ComposerListPage />} />
            <Route
              path="/composer/:compositionId"
              element={<ComposerEditorPage />}
            />
            <Route path="/dhivehi-phrases" element={<DhivehiPhrasesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route
              path="/settings/dhivehi-fonts"
              element={<DhivehiFontsPage />}
            />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </DefaultProviders>
  );
}
