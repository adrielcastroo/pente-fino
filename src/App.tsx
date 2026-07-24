
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
const ComponentesPage = lazy(() => import("@/pages/ComponentesPage"));
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
const ExpedicaoPainelPage = lazy(() => import("@/pages/expedicao/PainelPage"));
const ExpedicaoCarrinhosPage = lazy(() => import("@/pages/expedicao/CarrinhosPage"));


const ExpedicaoConferenciaPage = lazy(() => import("@/pages/expedicao/ConferenciaPage"));
const ExpedicaoRomaneioPage = lazy(() => import("@/pages/expedicao/RomaneioPage"));

const ExpedicaoDashboardOperacionalPage = lazy(() => import("@/pages/expedicao/DashboardOperacionalPage"));
const ExpedicaoDashboardLogisticoPage = lazy(() => import("@/pages/expedicao/DashboardLogisticoPage"));
const ExpedicaoHistoricoPage = lazy(() => import("@/pages/expedicao/HistoricoPage"));
const ExpedicaoRelatoriosPage = lazy(() => import("@/pages/expedicao/RelatoriosPage"));

const ExpedicaoEtiquetasPage = lazy(() => import("@/pages/expedicao/EtiquetasPage"));
const ImprimirEtiquetaPage = lazy(() => import("@/pages/expedicao/etiquetas/ImprimirEtiquetaPage"));
const HistoricoEtiquetasPage = lazy(() => import("@/pages/expedicao/etiquetas/HistoricoEtiquetasPage"));
const ExpedicaoOperacaoHomePage = lazy(() => import("@/pages/expedicao/OperacaoHomePage"));
const ExpedicaoDoubleCheckPage = lazy(() => import("@/pages/expedicao/DoubleCheckPage"));
const EtiquetasPage = ExpedicaoEtiquetasPage; // alias compartilhado entre módulos
const ComprasLayout = lazy(() => import("@/components/compras/ComprasLayout"));
const ComprasAcompanhamentosPage = lazy(() => import("@/pages/compras/AcompanhamentosPage"));
const ComprasStarcolorPage = lazy(() => import("@/pages/compras/StarcolorPage"));
const ComprasRomaneiosStarcolorPage = lazy(() => import("@/pages/compras/RomaneiosStarcolorPage"));
const ComprasRomaneioStarcolorEditorPage = lazy(() => import("@/pages/compras/RomaneioStarcolorEditorPage"));

const EntradasPage = lazy(() => import("@/pages/EntradasPage"));
const AcabamentosPage = lazy(() => import("@/pages/estoque/AcabamentosPage"));

const TransferenciasPage = lazy(() => import("@/pages/TransferenciasPage"));

import RoleHomeRedirect from "@/components/auth/RoleHomeRedirect";
import { RequireRole } from "@/components/auth/RequireRole";
import { UpdateAvailableBanner } from "@/components/admin/UpdateAvailableBanner";
import { ReleaseRegistrar } from "@/components/admin/ReleaseRegistrar";
import { AgentChatWidget } from "@/components/agent/AgentChatWidget";

const AdminPanelPage = lazy(() => import("@/pages/admin/AdminPanelPage"));
const N8nMonitorPage = lazy(() => import("@/pages/N8nMonitorPage"));
const HarTransferenciasPage = lazy(() => import("@/pages/admin/HarTransferenciasPage"));
const DepositosAdminPage = lazy(() => import("@/pages/admin/DepositosAdminPage"));
const AutomacoesPage = lazy(() => import("@/pages/admin/AutomacoesPage"));

import RequireModule from "@/components/auth/RequireModule";
import PageAccessOutlet from "@/components/auth/PageAccessOutlet";
import { PageAccessProvider } from "@/hooks/use-page-access";

const EquipesPage = lazy(() => import("@/pages/EquipesPage"));


// LoginPage é estático — é o LCP da rota /login e não deve pagar um round-trip
// extra de lazy import (economiza ~500–1500ms no render delay).
import LoginPage from "@/pages/LoginPage";
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
            <PageAccessProvider>
            <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-background"><div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>}>

              <Routes>
                <Route path="/login" element={<LoginRoute><LoginPage /></LoginRoute>} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/verify-otp" element={<VerifyOtp />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                
                <Route path="/selecionar-modulo" element={<ProtectedRoute><SelecionarModuloPage /></ProtectedRoute>} />
                


                {/* Home redirect fora de qualquer guard de módulo — evita loop para usuários sem estoque */}
                <Route path="/" element={<ProtectedRoute><RoleHomeRedirect /></ProtectedRoute>} />

                {/* ===== MÓDULO ESTOQUE (canônico /estoque/*) ===== */}
                <Route element={<ProtectedRoute><RequireModule module="estoque"><MainLayout /></RequireModule></ProtectedRoute>}>
                <Route element={<PageAccessOutlet />}>


                  {/* Rotas canônicas /estoque/* */}
                  <Route path="/estoque/operacao" element={<OperacaoHomePage />} />
                  <Route
                    path="/estoque/dashboard"
                    element={
                      <RequireRole role="supervisor" fallback={<Navigate to="/estoque/operacao" replace />}>
                        <DashboardPage />
                      </RequireRole>
                    }
                  />
                  <Route path="/estoque/conferencia" element={<ConferenciaHubPage />} />
                  <Route path="/estoque/tecido" element={<TecidoPage />} />
                  <Route path="/estoque/madeira" element={<MadeiraPage />} />
                  <Route path="/estoque/motor" element={<MotorControlePage />} />
                  <Route path="/estoque/componentes" element={<ComponentesPage />} />
                  <Route path="/estoque/mapa" element={<EstoquePage />} />
                  <Route path="/estoque/saida" element={<SaidaPage />} />
                  <Route path="/estoque/reservas" element={<ReservasPage />} />
                  <Route path="/estoque/historico" element={<HistoricoPage />} />
                  <Route path="/estoque/configuracoes" element={<SettingsPage />} />
                  <Route path="/estoque/cadastros" element={<CadastrosPage />} />
                  <Route
                    path="/estoque/auditoria"
                    element={
                      <RequireRole action="view:auditoria" fallback={<Navigate to="/" replace />}>
                        <AuditoriaPage />
                      </RequireRole>
                    }
                  />
                  <Route path="/estoque/minha-atividade" element={<MinhaAtividadePage />} />
                 <Route path="/estoque/entradas" element={<EntradasPage />} />
                 <Route path="/estoque/acabamentos" element={<RequireRole role="supervisor" fallback={<Navigate to="/estoque/operacao" replace />}><AcabamentosPage /></RequireRole>} />
                 
                  <Route path="/estoque/auge" element={<Navigate to="/estoque/cadastros" replace />} />
                  <Route path="/estoque/transferencias" element={<TransferenciasPage />} />
                  <Route path="/transferencias" element={<Navigate to="/estoque/transferencias" replace />} />
                  <Route path="/estoque/etiquetas" element={<Navigate to="/expedicao/etiquetas" replace />} />

                  {/* Redirects 301 — rotas legadas → /estoque/* */}
                  <Route path="/operacao" element={<Navigate to="/estoque/operacao" replace />} />
                  <Route path="/dashboard" element={<Navigate to="/estoque/dashboard" replace />} />
                  <Route path="/conferencia" element={<Navigate to="/estoque/conferencia" replace />} />
                  <Route path="/tecido" element={<Navigate to="/estoque/tecido" replace />} />
                  <Route path="/madeira" element={<Navigate to="/estoque/madeira" replace />} />
                  <Route path="/motor" element={<Navigate to="/estoque/motor" replace />} />
                  <Route path="/motor-controle" element={<Navigate to="/estoque/motor" replace />} />
                  <Route path="/estoque" element={<Navigate to="/estoque/mapa" replace />} />
                  <Route path="/saida" element={<Navigate to="/estoque/saida" replace />} />
                  <Route path="/reservas" element={<Navigate to="/estoque/reservas" replace />} />
                  <Route path="/historico" element={<Navigate to="/estoque/historico" replace />} />
                  <Route path="/configuracoes" element={<Navigate to="/estoque/configuracoes" replace />} />
                  <Route path="/cadastros" element={<Navigate to="/estoque/cadastros" replace />} />
                  <Route path="/auditoria" element={<Navigate to="/estoque/auditoria" replace />} />
                  <Route path="/minha-atividade" element={<Navigate to="/estoque/minha-atividade" replace />} />
                </Route>
                </Route>

                {/* ===== EQUIPES (top-level, supervisor+) ===== */}
                <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                  <Route
                    path="/equipes"
                    element={
                      <RequireRole role="supervisor" fallback={<Navigate to="/" replace />}>
                        <EquipesPage />
                      </RequireRole>
                    }
                  />
                </Route>




                {/* ===== MÓDULO EXPEDIÇÃO (novo) ===== */}
                <Route
                  path="/expedicao"
                  element={
                    <ProtectedRoute>
                      <ExpedicaoLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route element={<PageAccessOutlet />}>
                  <Route index element={<Navigate to="/expedicao/operacao" replace />} />

                  <Route path="operacao" element={<ExpedicaoOperacaoHomePage />} />
                  <Route path="painel" element={<ExpedicaoPainelPage />} />
                  
                  <Route path="conferencia" element={<ExpedicaoConferenciaPage />} />
                  <Route path="romaneio" element={<ExpedicaoRomaneioPage />} />
                  
                  <Route path="dashboard" element={<ExpedicaoDashboardOperacionalPage />} />
                  <Route path="logistica" element={<ExpedicaoDashboardLogisticoPage />} />
                  <Route path="carrinhos" element={<ExpedicaoCarrinhosPage />} />
                  <Route path="historico" element={<ExpedicaoHistoricoPage />} />
                  <Route path="relatorios" element={<ExpedicaoRelatoriosPage />} />
                  <Route path="configuracoes" element={<SettingsPage />} />
                  <Route path="etiquetas" element={<ExpedicaoEtiquetasPage />} />
                  <Route path="etiquetas/nova" element={<Navigate to="/expedicao/etiquetas" replace />} />
                  <Route path="etiquetas/historico" element={<HistoricoEtiquetasPage />} />
                  <Route path="etiquetas/:id/imprimir" element={<ImprimirEtiquetaPage />} />
                  <Route path="etiquetas/:id/editar" element={<Navigate to="/expedicao/etiquetas" replace />} />
                  <Route path="double-check" element={<ExpedicaoDoubleCheckPage />} />
                  </Route>
                </Route>


                {/* ===== MÓDULO COMPRAS ===== */}
                <Route
                  path="/compras"
                  element={
                    <ProtectedRoute>
                      <ComprasLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route element={<PageAccessOutlet />}>
                  <Route index element={<Navigate to="/compras/acompanhamentos" replace />} />
                  <Route path="acompanhamentos" element={<ComprasAcompanhamentosPage />} />

                  <Route path="acompanhamentos/starcolor" element={<ComprasStarcolorPage />} />
                  <Route path="acompanhamentos/starcolor/romaneios" element={<ComprasRomaneiosStarcolorPage />} />
                  <Route path="acompanhamentos/starcolor/romaneios/novo" element={<ComprasRomaneioStarcolorEditorPage />} />
                  <Route path="acompanhamentos/starcolor/romaneios/:id" element={<ComprasRomaneioStarcolorEditorPage />} />
                  <Route path="configuracoes" element={<SettingsPage />} />
                  </Route>
                </Route>


                {/* ===== ADMIN (dentro do MainLayout — sidebar principal preservada) ===== */}
                <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                  <Route path="/admin" element={<AdminPanelPage />} />
                  <Route path="/admin/n8n" element={<N8nMonitorPage />} />
                  <Route path="/admin/har-transferencias" element={<HarTransferenciasPage />} />
                  <Route path="/admin/depositos" element={<RequireRole role="admin" fallback={<Navigate to="/admin" replace />}><DepositosAdminPage /></RequireRole>} />
                  <Route path="/admin/automacoes" element={<RequireRole role="admin" fallback={<Navigate to="/admin" replace />}><AutomacoesPage /></RequireRole>} />
                </Route>

                <Route path="/admin/flags" element={<Navigate to="/admin?tab=flags" replace />} />
                <Route path="/admin/releases" element={<Navigate to="/admin?tab=releases" replace />} />
                <Route path="/n8n" element={<Navigate to="/admin/n8n" replace />} />


                <Route path="*" element={<NotFound />} />
              </Routes>
              <UpdateAvailableBanner />
              <ReleaseRegistrar />
              <AgentChatWidget />
            </Suspense>
            </PageAccessProvider>
          </AuthProvider>

          <Toaster position="top-right" closeButton duration={2000} visibleToasts={1} />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
