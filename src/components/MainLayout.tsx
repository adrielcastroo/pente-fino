
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
  <div className="p-4 sm:p-8 space-y-8 animate-pulse">
    <div className="flex items-center gap-4">
       <div className="h-12 w-12 bg-muted rounded-2xl" />
       <div className="space-y-2">
         <div className="h-8 bg-muted rounded-xl w-48" />
         <div className="h-4 bg-muted rounded-lg w-32 opacity-50" />
       </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="h-48 bg-muted rounded-[2rem]" />
      <div className="h-48 bg-muted rounded-[2rem]" />
      <div className="h-48 bg-muted rounded-[2rem]" />
    </div>
    <div className="h-96 bg-muted rounded-[2rem] w-full" />
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
    
    return 'inicio';

  };

  const activeTab = getActiveTab(location.pathname);

  const prefStartCollapsed = typeof window !== 'undefined' && localStorage.getItem('pref_sidebar_collapsed') === 'true';
  const defaultOpen = !isMobile && !isTablet && !prefStartCollapsed;

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <div className="h-[100dvh] flex w-full bg-background overflow-hidden relative app-bg-pattern flex-col lg:flex-row">
        <AppSidebar activeTab={activeTab} onTabChange={() => {}} />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <TopBar />

          <main className="flex-1 overflow-y-auto bg-background/50 custom-scrollbar relative overscroll-contain">
            <div className="min-h-full w-full max-w-full mx-auto">
              <Suspense fallback={<PageSkeleton />}>
                <div className="p-2 sm:p-4 lg:p-6 xl:p-8 2xl:p-10">
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
