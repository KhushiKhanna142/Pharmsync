import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import IncomingScripts from "./pages/IncomingScripts";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import ForecastingDashboard from "./pages/ForecastingDashboard";
import NotFound from "./pages/NotFound";

import OutbreakIntel from "./pages/OutbreakIntel";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <MainLayout>
                <Dashboard />
              </MainLayout>
            }
          />
          <Route
            path="/inventory"
            element={
              <MainLayout>
                <Inventory />
              </MainLayout>
            }
          />
          <Route
            path="/forecasting"
            element={
              <MainLayout>
                <ForecastingDashboard />
              </MainLayout>
            }
          />
          <Route
            path="/outbreak"
            element={
              <MainLayout>
                <OutbreakIntel />
              </MainLayout>
            }
          />
          <Route
            path="/scripts"
            element={
              <MainLayout>
                <IncomingScripts />
              </MainLayout>
            }
          />
          <Route
            path="/analytics"
            element={
              <MainLayout>
                <Analytics />
              </MainLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <MainLayout>
                <Settings />
              </MainLayout>
            }
          />
          <Route
            path="/forecasting"
            element={
              <MainLayout>
                <ForecastingDashboard />
              </MainLayout>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
