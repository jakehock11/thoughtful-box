import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProductProvider } from "@/contexts/ProductContext";
import { QuickCaptureProvider } from "@/contexts/QuickCaptureContext";
import { AppShell } from "@/components/layout";
import { CommandPalette } from "@/components/CommandPalette";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import ProductsHome from "./pages/ProductsHome";
import ProblemsPage from "./pages/ProblemsPage";
import ProblemDetailPage from "./pages/ProblemDetailPage";
import HypothesesPage from "./pages/HypothesesPage";
import HypothesisDetailPage from "./pages/HypothesisDetailPage";
import ExperimentsPage from "./pages/ExperimentsPage";
import ExperimentDetailPage from "./pages/ExperimentDetailPage";
import DecisionsPage from "./pages/DecisionsPage";
import DecisionDetailPage from "./pages/DecisionDetailPage";
import ArtifactsPage from "./pages/ArtifactsPage";
import ArtifactDetailPage from "./pages/ArtifactDetailPage";
import TimelinePage from "./pages/TimelinePage";
import { SwimLaneTimeline } from "./components/timeline";
import TaxonomyPage from "./pages/TaxonomyPage";
import ExportsPage from "./pages/ExportsPage";
import SettingsPage from "./pages/SettingsPage";
import QuickCaptureDetailPage from "./pages/QuickCaptureDetailPage";
import CapturesPage from "./pages/CapturesPage";
import NotFound from "./pages/NotFound";
// Bucket pages
import InboxPage from "./pages/InboxPage";
import ThinkingPage from "./pages/ThinkingPage";
import WorkPage from "./pages/WorkPage";
import EvidencePage from "./pages/EvidencePage";
// New entity detail pages
import FeedbackDetailPage from "./pages/FeedbackDetailPage";
import FeatureRequestDetailPage from "./pages/FeatureRequestDetailPage";
import FeatureDetailPage from "./pages/FeatureDetailPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <ProductProvider>
            <QuickCaptureProvider>
              <CommandPalette />
              <ErrorBoundary>
                <Routes>
                <Route element={<AppShell />}>
                <Route path="/" element={<Navigate to="/products" replace />} />
                <Route path="/products" element={<ProductsHome />} />
                {/* Redirect old /home to /inbox */}
                <Route path="/product/:productId/home" element={<Navigate to="../inbox" replace />} />
                <Route path="/product/:productId/problems" element={<ProblemsPage />} />
                <Route path="/product/:productId/problems/:id" element={<ProblemDetailPage />} />
                <Route path="/product/:productId/hypotheses" element={<HypothesesPage />} />
                <Route path="/product/:productId/hypotheses/:id" element={<HypothesisDetailPage />} />
                <Route path="/product/:productId/experiments" element={<ExperimentsPage />} />
                <Route path="/product/:productId/experiments/:id" element={<ExperimentDetailPage />} />
                <Route path="/product/:productId/decisions" element={<DecisionsPage />} />
                <Route path="/product/:productId/decisions/:id" element={<DecisionDetailPage />} />
                <Route path="/product/:productId/artifacts" element={<ArtifactsPage />} />
                <Route path="/product/:productId/artifacts/:id" element={<ArtifactDetailPage />} />
                <Route path="/product/:productId/timeline" element={<TimelinePage />} />
                <Route path="/product/:productId/swimlane" element={<div className="p-6 h-[calc(100vh-4rem)]"><SwimLaneTimeline /></div>} />
                <Route path="/product/:productId/taxonomy" element={<TaxonomyPage />} />
                <Route path="/product/:productId/exports" element={<ExportsPage />} />
                <Route path="/product/:productId/settings" element={<SettingsPage />} />
                <Route path="/product/:productId/captures/:id" element={<QuickCaptureDetailPage />} />
                <Route path="/product/:productId/captures" element={<CapturesPage />} />
                {/* Bucket pages */}
                <Route path="/product/:productId/inbox" element={<InboxPage />} />
                <Route path="/product/:productId/thinking" element={<ThinkingPage />} />
                <Route path="/product/:productId/work" element={<WorkPage />} />
                <Route path="/product/:productId/evidence" element={<EvidencePage />} />
                {/* New entity detail pages */}
                <Route path="/product/:productId/feedback/:id" element={<FeedbackDetailPage />} />
                <Route path="/product/:productId/feature-requests/:id" element={<FeatureRequestDetailPage />} />
                <Route path="/product/:productId/features/:id" element={<FeatureDetailPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
                </Routes>
              </ErrorBoundary>
            </QuickCaptureProvider>
          </ProductProvider>
        </HashRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
