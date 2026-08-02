import { Suspense, ReactNode, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';
import { usePresenceTracker } from '@/hooks/use-presence';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useUserScopedPrefs } from '@/hooks/useUserScopedPrefs';
import { useGlobalSettingsSync } from '@/hooks/useGlobalSettings';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import TopBar from '@/components/TopBar';
import EstoqueSidebar from '@/components/EstoqueSidebar';
import BottomTabBar from '@/components/BottomTabBar';
import NavRail from '@/components/NavRail';
import Breadcrumbs from '@/components/Breadcrumbs';
import UndoBanner from '@/components/UndoBanner';
import ResumeBanner from '@/components/ResumeBanner';
import CommandPalette from '@/components/CommandPalette';
import ShortcutsModal from '@/components/ShortcutsModal';
import ErrorBoundary from '@/components/ErrorBoundary';
import AugeCredentialsGate from '@/components/auge/AugeCredentialsGate';
import { SidebarProvider } from '@/components/ui/sidebar';

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

export interface MainLayoutProps {
  /** Sidebar renderizada no breakpoint desktop. Default: EstoqueSidebar. */
  sidebar?: ReactNode;
  /** Bottom tab bar (mobile/tablet portrait). Default: BottomTabBar do Estoque. */
  bottomNav?: ReactNode;
  /** Rail lateral (tablet landscape). Default: NavRail do Estoque. */
  navRail?: ReactNode;
  /** Mostrar ResumeBanner (specifico de fluxo de conferência). Default: true. */
  showResumeBanner?: boolean;
  /** Mostrar UndoBanner. Default: true (exceto em rotas de registro). */
  showUndoBanner?: boolean;
}

export default function MainLayout({
  sidebar = <EstoqueSidebar />,
  bottomNav = <BottomTabBar />,
  navRail = <NavRail />,
  showResumeBanner = true,
  showUndoBanner = true,
}: MainLayoutProps) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const location = useLocation();
  const navigate = useNavigate();
  usePresenceTracker();
  useNetworkStatus();
  useUserScopedPrefs();
  useGlobalSettingsSync();

  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  useKeyboardShortcuts({
    shortcutsOpen,
    setShortcutsOpen,
    configOpen: false,
    setConfigOpen: (open) => {
      if (open) {
        const isExpedicao = location.pathname.startsWith('/expedicao');
        navigate(isExpedicao ? '/expedicao/configuracoes' : '/estoque/configuracoes');
      }
    },
  });

  const prefStartCollapsed = typeof window !== 'undefined' && localStorage.getItem('pref_sidebar_collapsed') === 'true';
  const defaultOpen = !isMobile && !isTablet && !prefStartCollapsed;

  // Renderização mutuamente exclusiva dos shells de navegação: em desktop só
  // mostramos a Sidebar; em tablet landscape só o NavRail; em mobile só a BottomTabBar.
  // Antes, sidebar+navRail ficavam empilhados no DOM em janelas entre 1024–1365px de
  // dispositivos touch (Surface Pro), gerando duas barras verticais lado a lado.
  const renderSidebar = !isMobile && !isTablet;
  const renderNavRail = isTablet; // tablet-landscape (já tem sua media query interna)
  const renderBottomNav = isMobile;
  // Padding-bottom no <main>: só vale a pena quando há BottomTabBar fixa embaixo.
  // Antes era sempre `pb-16`, deixando 4rem de espaço morto em rotas que não tinham BottomTabBar.
  const mainPaddingBottom = renderBottomNav
    ? 'pb-[calc(4rem+env(safe-area-inset-bottom,0px))]'
    : 'pb-0';

  const handleOpenChange = (open: boolean) => {
    try {
      localStorage.setItem('pref_sidebar_collapsed', open ? 'false' : 'true');
    } catch { /* ignore */ }
  };

  const showUndo = showUndoBanner && !['/estoque/tecido', '/estoque/madeira', '/estoque/motor'].includes(location.pathname);

  return (
    <SidebarProvider defaultOpen={defaultOpen} onOpenChange={handleOpenChange}>
      <div className="h-[100dvh] flex flex-row w-full bg-background overflow-hidden relative app-bg-pattern">
        {renderSidebar && sidebar}

        {renderNavRail && navRail}

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <TopBar />
          <Breadcrumbs />
          {showResumeBanner && <ResumeBanner />}

          <main id="main-content" tabIndex={-1} className={`flex-1 overflow-y-auto bg-background/50 custom-scrollbar relative overscroll-contain ${mainPaddingBottom} tablet-landscape:pb-0 desktop:pb-0 focus:outline-none`}>
            <div className="min-h-full w-full max-w-full mx-auto">
              <Suspense fallback={<PageSkeleton />}>
                <div className="p-2 sm:p-4 lg:p-6 xl:p-8 2xl:p-10 w-full max-w-[1600px] 2xl:max-w-[1800px] mx-auto min-w-0">
                  <ErrorBoundary>
                    <Outlet />
                  </ErrorBoundary>
                </div>
                
              </Suspense>
            </div>
          </main>
        </div>
        {renderBottomNav && bottomNav}
        
      </div>
      {showUndo && <UndoBanner />}
      <CommandPalette />
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <AugeCredentialsGate />
    </SidebarProvider>
  );
}
