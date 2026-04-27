

import { Suspense, lazy, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';
import { usePresenceTracker } from '@/hooks/use-presence';
import TopBar from '@/components/TopBar';
import AppSidebar from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppTab } from '@/types';

// Lazy load all pages for the single-page experience
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const TecidoPage = lazy(() => import('@/pages/TecidoPage'));
const MadeiraPage = lazy(() => import('@/pages/MadeiraPage'));
const MotorControlePage = lazy(() => import('@/pages/MotorControlePage'));
const EstoquePage = lazy(() => import('@/pages/EstoquePage'));
const SaidaPage = lazy(() => import('@/pages/SaidaPage'));
const TabelaPage = lazy(() => import('@/pages/TabelaPage'));
const HistoricoPage = lazy(() => import('@/pages/HistoricoPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const ShortcutsModal = lazy(() => import('@/components/ShortcutsModal'));

const PageSkeleton = () => (
  <div className="p-4 sm:p-8 space-y-4">
    <div className="h-8 bg-muted rounded w-1/4" />
    <div className="h-32 bg-muted rounded w-full" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="h-24 bg-muted rounded" />
      <div className="h-24 bg-muted rounded" />
      <div className="h-24 bg-muted rounded" />
    </div>
  </div>
);

export default function MainLayout() {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const location = useLocation();
  const navigate = useNavigate();
  usePresenceTracker();

  // Map path to active tab
  const getTabFromPath = (path: string): AppTab => {
    const p = path.replace('/', '');
    if (!p || p === 'dashboard') return 'inicio';
    if (p === 'tecido') return 'tecido';
    if (p === 'madeira') return 'madeira';
    if (p === 'motor') return 'motor';
    if (p === 'estoque') return 'estoque';
    if (p === 'saida') return 'saida';
    if (p === 'tabela') return 'table';
    if (p === 'historico') return 'history';
    if (p === 'configuracoes') return 'settings';
    return 'inicio';
  };

  const [activeTab, setActiveTab] = useState<AppTab>(getTabFromPath(location.pathname));

  // Sync state with URL on initial load and back/forward navigation
  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  const handleTabChange = (tab: AppTab) => {
    setActiveTab(tab);
    // Sync URL without full navigation if possible, or just use navigate for compatibility
    const pathMap: Record<AppTab, string> = {
      inicio: '/dashboard',
      tecido: '/tecido',
      madeira: '/madeira',
      motor: '/motor',
      estoque: '/estoque',
      saida: '/saida',
      table: '/tabela',
      history: '/historico',
      settings: '/configuracoes'
    };
    navigate(pathMap[tab] || '/dashboard');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'inicio': return <DashboardPage />;
      case 'tecido': return <TecidoPage />;
      case 'madeira': return <MadeiraPage />;
      case 'motor': return <MotorControlePage />;
      case 'estoque': return <EstoquePage />;
      case 'saida': return <SaidaPage />;
      case 'table': return <TabelaPage />;
      case 'history': return <HistoricoPage />;
      case 'settings': return <SettingsPage />;
      default: return <DashboardPage />;
    }
  };

  const prefStartCollapsed = typeof window !== 'undefined' && localStorage.getItem('pref_sidebar_collapsed') === 'true';
  const defaultOpen = !isMobile && !isTablet && !prefStartCollapsed;

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <div className="h-[100dvh] flex w-full bg-background overflow-hidden relative app-bg-pattern">
        <AppSidebar activeTab={activeTab} onTabChange={handleTabChange} />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <TopBar />

          <main className="flex-1 overflow-y-auto bg-background/50 custom-scrollbar relative">
            <div className="min-h-full w-full max-w-[2000px] mx-auto">
              <Suspense fallback={<PageSkeleton />}>
                <div className="p-3 sm:p-5 lg:p-6 xl:p-8 2xl:p-10">
                  {renderContent()}
                </div>
              </Suspense>
            </div>
          </main>
        </div>
      </div>

      <Suspense fallback={null}>
        <ShortcutsModal open={false} onClose={() => {}} />
      </Suspense>
    </SidebarProvider>
  );
}
