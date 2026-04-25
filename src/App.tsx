
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Suspense, lazy } from "react";
import { AuthProvider, useAuth } from "@/hooks/use-auth";

const MainLayout = lazy(() => import("./components/MainLayout.tsx"));
const DashboardPage = lazy(() => import("./pages/DashboardPage.tsx"));
const TecidoPage = lazy(() => import("./pages/TecidoPage.tsx"));
const MadeiraPage = lazy(() => import("./pages/MadeiraPage.tsx"));
const MotorControlePage = lazy(() => import("./pages/MotorControlePage.tsx"));
const EstoquePage = lazy(() => import("./pages/EstoquePage.tsx"));
const SaidaPage = lazy(() => import("./pages/SaidaPage.tsx"));
const TabelaPage = lazy(() => import("./pages/TabelaPage.tsx"));
const HistoricoPage = lazy(() => import("./pages/HistoricoPage.tsx"));
const SettingsPage = lazy(() => import("./pages/SettingsPage.tsx"));

const LoginPage = lazy(() => import("./pages/LoginPage.tsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.tsx"));
const VerifyOtp = lazy(() => import("./pages/VerifyOtp.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const LoginRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isGuest } = useAuth();
  
  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-background">
      <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
  
  if (user || isGuest) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isGuest } = useAuth();
  
  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-background">
      <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
  
  if (!user && !isGuest) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-background"><div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>}>
              <Routes>
                <Route path="/login" element={<LoginRoute><LoginPage /></LoginRoute>} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/verify-otp" element={<VerifyOtp />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                
                <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/tecido" element={<TecidoPage />} />
                  <Route path="/madeira" element={<MadeiraPage />} />
                  <Route path="/motor" element={<MotorControlePage />} />
                  <Route path="/estoque" element={<EstoquePage />} />
                  <Route path="/saida" element={<SaidaPage />} />
                  <Route path="/tabela" element={<TabelaPage />} />
                  <Route path="/historico" element={<HistoricoPage />} />
                  <Route path="/configuracoes" element={<SettingsPage />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
          <Toaster position="top-right" closeButton duration={2000} visibleToasts={1} />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
