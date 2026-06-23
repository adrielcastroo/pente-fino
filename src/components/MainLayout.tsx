
import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';
import { usePresenceTracker } from '@/hooks/use-presence';
import { useNetworkStatus } from '@/hooks/use-network-status';
import TopBar from '@/components/TopBar';
import AppSidebar from '@/components/AppSidebar';
import BottomTabBar from '@/components/BottomTabBar';
import NavRail from '@/components/NavRail';
import Breadcrumbs from '@/components/Breadcrumbs';
import UndoBanner from '@/components/UndoBanner';
import CommandPalette from '@/components/CommandPalette';
import ErrorBoundary from '@/components/ErrorBoundary';
import { LATEST_VERSION } from '@/lib/changelog';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useLocation } from 'react-router-dom';
import { AppTab } from '@/types';


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
  useNetworkStatus();

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
    if (p === 'cadastros') return 'cadastros';
    
    return 'inicio';

  };

  const activeTab = getActiveTab(location.pathname);

  const prefStartCollapsed = typeof window !== 'undefined' && localStorage.getItem('pref_sidebar_collapsed') === 'true';
  const defaultOpen = !isMobile && !isTablet && !prefStartCollapsed;

  const handleOpenChange = (open: boolean) => {
    try {
      localStorage.setItem('pref_sidebar_collapsed', open ? 'false' : 'true');
    } catch { /* ignore */ }
  };

  return (
    <SidebarProvider defaultOpen={defaultOpen} onOpenChange={handleOpenChange}>
      <div className="h-[100dvh] flex flex-row w-full bg-background overflow-hidden relative app-bg-pattern">
        {/* Sidebar: desktop real (mouse + hover). Tablets touch recebem NavRail; portrait/mobile usam BottomTabBar */}
        <div className="hidden desktop:contents">
          <AppSidebar activeTab={activeTab} onTabChange={() => {}} />
        </div>

        <NavRail />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <TopBar />
          <Breadcrumbs />

          <main className="flex-1 overflow-y-auto bg-background/50 custom-scrollbar relative overscroll-contain pb-16 tablet-landscape:pb-0 desktop:pb-0">

            <div className="min-h-full w-full max-w-full mx-auto">
              <Suspense fallback={<PageSkeleton />}>
                <div className="p-2 sm:p-4 lg:p-6 xl:p-8 2xl:p-10 max-w-[1600px] 2xl:max-w-[1800px] mx-auto">
                  <ErrorBoundary>
                    <Outlet />
                  </ErrorBoundary>
                </div>
                <footer className="mt-auto border-t border-border/40 bg-background/60 px-4 py-2 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" aria-hidden="true" />
                    Sistema operacional
                  </span>
                  <span>Pente Fino · v{LATEST_VERSION}</span>
                </footer>
              </Suspense>
            </div>
          </main>
        </div>
        <BottomTabBar />
      </div>
      {!['/tecido', '/madeira', '/motor'].includes(location.pathname) && <UndoBanner />}
      <CommandPalette />


    </SidebarProvider>
  );
}
