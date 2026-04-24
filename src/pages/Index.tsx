import { useEffect, useState, lazy, Suspense, useMemo, memo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';
import { usePresenceTracker } from '@/hooks/use-presence';
import TopBar from '@/components/TopBar';
import AppSidebar from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import DashboardPage from '@/pages/DashboardPage';

const LeftPanel = lazy(() => import('@/components/LeftPanel'));
const RightPanel = lazy(() => import('@/components/RightPanel'));
const HistoryPanel = lazy(() => import('@/components/HistoryPanel'));
const MotorControlePage = lazy(() => import('@/pages/MotorControlePage'));
const EstoquePage = lazy(() => import('@/pages/EstoquePage'));
const SaidaPage = lazy(() => import('@/pages/SaidaPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const ShortcutsModal = lazy(() => import('@/components/ShortcutsModal'));

const PageSkeleton = memo(() => (
  <div className="p-4 sm:p-8 space-y-4">
    <div className="h-8 bg-muted rounded w-1/4" />
    <div className="h-32 bg-muted rounded w-full" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="h-24 bg-muted rounded" />
      <div className="h-24 bg-muted rounded" />
      <div className="h-24 bg-muted rounded" />
    </div>
  </div>
));

const TabRenderer = memo(({ activeTab, isWide, isMobile, isTablet }: { activeTab: string; isWide?: boolean; isMobile: boolean; isTablet: boolean }) => {
  const isFormTab = useMemo(() => ['tecido', 'madeira', 'motor'].includes(activeTab), [activeTab]);
  
  // Show dual panel on lg screens and up when it's a form tab
  if (isWide && isFormTab && !isMobile) {
    return (
      <div className="flex flex-col lg:flex-row h-full gap-4 lg:gap-6 xl:gap-8 2xl:gap-10">
        <div className="w-full lg:w-[380px] xl:w-[460px] 2xl:w-[540px] shrink-0 h-full overflow-y-auto custom-scrollbar pr-1">
          {activeTab === 'motor' ? <MotorControlePage /> : <LeftPanel />}
        </div>
        <div className="flex-1 min-w-0 h-full hidden lg:block animate-in fade-in slide-in-from-right-4 duration-500 overflow-hidden">
          <RightPanel />
        </div>
      </div>
    );
  }


  // Mobile/Tablet or non-form tabs
  return (
    <div className="h-full w-full max-w-full overflow-x-hidden animate-in fade-in duration-300">
      <div className="space-y-4">
        {activeTab === 'inicio' && <DashboardPage />}
        {(activeTab === 'tecido' || activeTab === 'madeira') && <LeftPanel />}
        {activeTab === 'motor' && <MotorControlePage />}
        {activeTab === 'estoque' && <EstoquePage />}
        {activeTab === 'saida' && <SaidaPage />}
        {activeTab === 'table' && <RightPanel />}
        {activeTab === 'history' && <HistoryPanel />}
        {activeTab === 'settings' && <SettingsPage />}
        {!['inicio', 'tecido', 'madeira', 'motor', 'estoque', 'saida', 'table', 'history', 'settings'].includes(activeTab) && <DashboardPage />}
      </div>
    </div>
  );
});

TabRenderer.displayName = 'TabRenderer';

export default function Index() {
  const loadHistory = useAppStore(s => s.loadHistory);
  const { activeTab, handleTabChange } = useAppNavigation();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  usePresenceTracker();

  useEffect(() => {
    loadHistory();
    // Apply default tab preference once per session
    if (typeof window !== 'undefined' && !sessionStorage.getItem('pref_default_tab_applied')) {
      const defaultTab = localStorage.getItem('pref_default_tab');
      if (defaultTab) handleTabChange(defaultTab as any);
      sessionStorage.setItem('pref_default_tab_applied', '1');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadHistory]);

  useKeyboardShortcuts({
    shortcutsOpen,
    setShortcutsOpen,
    configOpen: activeTab === 'settings',
    setConfigOpen: () => handleTabChange('settings'),
  });

  const prefStartCollapsed = typeof window !== 'undefined' && localStorage.getItem('pref_sidebar_collapsed') === 'true';
  const defaultOpen = !isMobile && !isTablet && !prefStartCollapsed;

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <div className="h-[100dvh] flex w-full bg-background overflow-hidden relative app-bg-pattern">
        <AppSidebar 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <TopBar />

          <main className="flex-1 overflow-y-auto bg-background/50 custom-scrollbar relative">
            <div className="min-h-full w-full max-w-[2000px] mx-auto">
              <Suspense fallback={<PageSkeleton />}>
                <div className="p-4 sm:p-6 lg:p-8 xl:p-10">
                  <TabRenderer activeTab={activeTab} isWide={true} isMobile={isMobile} isTablet={isTablet} />
                </div>
              </Suspense>
            </div>
          </main>
        </div>
      </div>

      <Suspense fallback={null}>
        <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      </Suspense>
    </SidebarProvider>
  );
}