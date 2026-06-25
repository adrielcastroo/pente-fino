
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Suspense, lazy } from "react";
import { AuthProvider, useAuth } from "@/hooks/use-auth";

const MainLayout = lazy(() => import("@/components/MainLayout"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const TecidoPage = lazy(() => import("@/pages/TecidoPage"));
const MadeiraPage = lazy(() => import("@/pages/MadeiraPage"));
const MotorControlePage = lazy(() => import("@/pages/MotorControlePage"));
const EstoquePage = lazy(() => import("@/pages/EstoquePage"));
const SaidaPage = lazy(() => import("@/pages/SaidaPage"));
const ReservasPage = lazy(() => import("@/pages/ReservasPage"));
const HistoricoPage = lazy(() => import("@/pages/HistoricoPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const CadastrosPage = lazy(() => import("@/pages/CadastrosPage"));
const AuditoriaPage = lazy(() => import("@/pages/AuditoriaPage"));
const MinhaAtividadePage = lazy(() => import("@/pages/MinhaAtividadePage"));
const OperacaoHomePage = lazy(() => import("@/pages/OperacaoHomePage"));
const ConferenciaHubPage = lazy(() => import("@/pages/ConferenciaHubPage"));
const SelecionarModuloPage = lazy(() => import("@/pages/SelecionarModuloPage"));
const ExpedicaoLayout = lazy(() => import("@/components/expedicao/ExpedicaoLayout"));
const ExpedicaoPlaceholder = lazy(() => import("@/pages/expedicao/ExpedicaoPlaceholder"));
import RoleHomeRedirect from "@/components/auth/RoleHomeRedirect";
import { RequireRole } from "@/components/auth/RequireRole";

const LoginPage = lazy(() => import("@/pages/LoginPage"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const VerifyOtp = lazy(() => import("@/pages/VerifyOtp"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const NotFound = lazy(() => import("@/pages/NotFound"));

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
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
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
                
                <Route path="/selecionar-modulo" element={<ProtectedRoute><SelecionarModuloPage /></ProtectedRoute>} />

                {/* ===== MÓDULO ESTOQUE (app atual) ===== */}
                <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                  <Route path="/" element={<RoleHomeRedirect />} />
                  <Route path="/operacao" element={<OperacaoHomePage />} />
                  <Route
                    path="/dashboard"
                    element={
                      <RequireRole role="supervisor" fallback={<Navigate to="/operacao" replace />}>
                        <DashboardPage />
                      </RequireRole>
                    }
                  />
                  <Route path="/conferencia" element={<ConferenciaHubPage />} />
                  <Route path="/tecido" element={<TecidoPage />} />
                  <Route path="/madeira" element={<MadeiraPage />} />
                  <Route path="/motor" element={<MotorControlePage />} />
                  <Route path="/motor-controle" element={<Navigate to="/motor" replace />} />
                  <Route path="/estoque" element={<EstoquePage />} />
                  <Route path="/saida" element={<SaidaPage />} />
                  <Route path="/reservas" element={<ReservasPage />} />
                  <Route path="/historico" element={<HistoricoPage />} />
                  <Route path="/configuracoes" element={<SettingsPage />} />
                  <Route path="/cadastros" element={<CadastrosPage />} />
                  <Route
                    path="/auditoria"
                    element={
                      <RequireRole action="view:auditoria" fallback={<Navigate to="/" replace />}>
                        <AuditoriaPage />
                      </RequireRole>
                    }
                  />
                  <Route path="/minha-atividade" element={<MinhaAtividadePage />} />

                  {/* Aliases canônicos /estoque/* (rotas antigas permanecem ativas) */}
                  <Route path="/estoque/dashboard" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/estoque/operacao" element={<Navigate to="/operacao" replace />} />
                  <Route path="/estoque/conferencia" element={<Navigate to="/conferencia" replace />} />
                  <Route path="/estoque/tecido" element={<Navigate to="/tecido" replace />} />
                  <Route path="/estoque/madeira" element={<Navigate to="/madeira" replace />} />
                  <Route path="/estoque/motor" element={<Navigate to="/motor" replace />} />
                  <Route path="/estoque/mapa" element={<Navigate to="/estoque" replace />} />
                  <Route path="/estoque/saida" element={<Navigate to="/saida" replace />} />
                  <Route path="/estoque/reservas" element={<Navigate to="/reservas" replace />} />
                  <Route path="/estoque/historico" element={<Navigate to="/historico" replace />} />
                  <Route path="/estoque/cadastros" element={<Navigate to="/cadastros" replace />} />
                  <Route path="/estoque/configuracoes" element={<Navigate to="/configuracoes" replace />} />
                  <Route path="/estoque/minha-atividade" element={<Navigate to="/minha-atividade" replace />} />
                </Route>

                {/* ===== MÓDULO EXPEDIÇÃO (novo) ===== */}
                <Route
                  path="/expedicao"
                  element={
                    <ProtectedRoute>
                      <RequireRole action="view:auditoria" fallback={<Navigate to="/" replace />}>
                        <ExpedicaoLayout />
                      </RequireRole>
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/expedicao/painel" replace />} />
                  <Route path="painel" element={<ExpedicaoPlaceholder title="Painel da expedição" description="Pickings aguardando movimentação e conferência." />} />
                  <Route path="pickings" element={<ExpedicaoPlaceholder title="Pickings" description="Associação picking ↔ carrinho por dupla bipagem." />} />
                  <Route path="conferencia" element={<ExpedicaoPlaceholder title="Conferência de peças" description="Bipagem de peças por QR Code." />} />
                  <Route path="romaneio" element={<ExpedicaoPlaceholder title="Romaneio" description="Transportadora → Região → Cidade → Cliente." />} />
                  <Route path="faturamento" element={<ExpedicaoPlaceholder title="Faturamento" description="Fila de pickings liberados para faturar." />} />
                  <Route path="dashboard" element={<ExpedicaoPlaceholder title="Dashboard operacional" description="KPIs do dia, produtividade e tempos por etapa." />} />
                  <Route path="logistica" element={<ExpedicaoPlaceholder title="Dashboard logístico" description="Volumes por transportadora, região e cidade." />} />
                  <Route path="carrinhos" element={<ExpedicaoPlaceholder title="Carrinhos" description="Gestão dos carrinhos da expedição." />} />
                  <Route path="configuracoes" element={<ExpedicaoPlaceholder title="Configurações da expedição" description="SLAs, transportadoras, regiões e alertas." />} />
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
