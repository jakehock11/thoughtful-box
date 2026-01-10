import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProductProvider } from "@/contexts/ProductContext";
import { AppShell } from "@/components/layout";

import ProductsHome from "./pages/ProductsHome";
import ProductHome from "./pages/ProductHome";
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
import TaxonomyPage from "./pages/TaxonomyPage";
import ExportsPage from "./pages/ExportsPage";
import SettingsPage from "./pages/SettingsPage";
import QuickCaptureDetailPage from "./pages/QuickCaptureDetailPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ProductProvider>
            <Routes>
              <Route element={<AppShell />}>
                <Route path="/" element={<Navigate to="/products" replace />} />
                <Route path="/products" element={<ProductsHome />} />
                <Route path="/product/:productId/home" element={<ProductHome />} />
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
                <Route path="/product/:productId/taxonomy" element={<TaxonomyPage />} />
                <Route path="/product/:productId/exports" element={<ExportsPage />} />
                <Route path="/product/:productId/settings" element={<SettingsPage />} />
                <Route path="/product/:productId/quick-captures/:id" element={<QuickCaptureDetailPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ProductProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
