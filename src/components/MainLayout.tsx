
import { Suspense, lazy } from 'react';
import { Outlet } from 'react-router-dom';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';
import { usePresenceTracker } from '@/hooks/use-presence';
import TopBar from '@/components/TopBar';
import AppSidebar from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useLocation } from 'react-router-dom';
import { AppTab } from '@/types';

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
  usePresenceTracker();

  // Map path to active tab
  const getActiveTab = (path: string): AppTab => {
    const p = path.replace('/', '');
    if (!p || p === 'dashboard') return 'inicio';
    if (p === 'tecido') return 'tecido';
    if (p === 'madeira') return 'madeira';
    if (p === 'motor') return 'motor';
    if (p === 'estoque') return 'estoque';
    if (p === 'saida') return 'saida';
    if (p === 'reservas') return 'reservas';
    if (p === 'historico') return 'history';
    if (p === 'configuracoes') return 'settings';
    if (p === 'inventario-ciclico') return 'ciclico';
    return 'inicio';

  };

  const activeTab = getActiveTab(location.pathname);

  const prefStartCollapsed = typeof window !== 'undefined' && localStorage.getItem('pref_sidebar_collapsed') === 'true';
  const defaultOpen = !isMobile && !isTablet && !prefStartCollapsed;

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <div className="h-[100dvh] flex w-full bg-background overflow-hidden relative app-bg-pattern">
        <AppSidebar activeTab={activeTab} onTabChange={() => {}} />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <TopBar />

          <main className="flex-1 overflow-y-auto bg-background/50 custom-scrollbar relative overscroll-contain">
            <div className="min-h-full w-full max-w-[2000px] mx-auto">
              <Suspense fallback={<PageSkeleton />}>
                <div className="p-2 sm:p-6 lg:p-8 xl:p-10 2xl:p-12 3xl:p-16">
                  <Outlet />
                </div>
              </Suspense>
            </div>
          </main>
        </div>
      </div>

      <Suspense fallback={null}>
        {/* We might need a way to trigger shortcuts modal, but for now just include it */}
        <ShortcutsModal open={false} onClose={() => {}} />
      </Suspense>
    </SidebarProvider>
  );
}
