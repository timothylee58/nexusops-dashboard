import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip.tsx";
import { ThemeProvider } from "@/components/theme-provider.tsx";
import { AuthProvider } from "@/context/AuthContext";
import { TransactionsProvider } from "@/context/TransactionsContext";
import GlobalCommandPalette from "@/components/GlobalCommandPalette.tsx";
import Index from "./pages/Index.tsx";
import Audit from "./pages/Audit.tsx";
import Unauthorized from "./pages/Unauthorized.tsx";
import NotFound from "./pages/NotFound.tsx";

const Analytics = lazy(() => import("./pages/Analytics.tsx"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <TransactionsProvider>
              <GlobalCommandPalette />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/audit" element={<Audit />} />
              <Route
                path="/analytics"
                element={
                  <Suspense
                    fallback={
                      <div className="min-h-[40vh] p-16 text-center text-muted-foreground font-mono text-sm">
                        Loading analytics…
                      </div>
                    }
                  >
                    <Analytics />
                  </Suspense>
                }
              />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </TransactionsProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
