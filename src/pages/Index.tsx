import { useEffect, useState, lazy, Suspense, useMemo, memo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { useIsMobile } from '@/hooks/use-mobile';
import TopBar from '@/components/TopBar';
import AppSidebar from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

const LeftPanel = lazy(() => import('@/components/LeftPanel'));
const RightPanel = lazy(() => import('@/components/RightPanel'));
const HistoryPanel = lazy(() => import('@/components/HistoryPanel'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const MotorControlePage = lazy(() => import('@/pages/MotorControlePage'));
const EstoquePage = lazy(() => import('@/pages/EstoquePage'));
const SaidaPage = lazy(() => import('@/pages/SaidaPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const ShortcutsModal = lazy(() => import('@/components/ShortcutsModal'));

const PageSkeleton = memo(() => (
  <div className="p-8 space-y-4">
    <div className="h-8 bg-muted rounded w-1/4" />
    <div className="h-32 bg-muted rounded w-full" />
    <div className="grid grid-cols-3 gap-4">
      <div className="h-24 bg-muted rounded" />
      <div className="h-24 bg-muted rounded" />
      <div className="h-24 bg-muted rounded" />
    </div>
  </div>
));

const TabRenderer = memo(({ activeTab, isWide, isMobile }: { activeTab: string; isWide?: boolean; isMobile: boolean }) => {
  const isFormTab = useMemo(() => ['tecido', 'madeira', 'motor'].includes(activeTab), [activeTab]);
  
  if (isWide && isFormTab && !isMobile) {
    return (
      <div className="flex flex-col xl:flex-row h-full gap-4 xl:gap-8">
        <div className="w-full xl:w-[480px] 2xl:w-[580px] shrink-0 h-full">
          {activeTab === 'motor' ? <MotorControlePage /> : <LeftPanel />}
        </div>
        <div className="flex-1 min-w-0 h-full border-l border-border/10 pl-4 xl:pl-8 hidden xl:block">
          <RightPanel />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full max-w-full overflow-x-hidden">
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
  );
});

TabRenderer.displayName = 'TabRenderer';

export default function Index() {
  const loadHistory = useAppStore(s => s.loadHistory);
  const { activeTab, handleTabChange } = useAppNavigation();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useKeyboardShortcuts({
    shortcutsOpen,
    setShortcutsOpen,
    configOpen: activeTab === 'settings',
    setConfigOpen: () => handleTabChange('settings'),
  });

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-[100dvh] flex w-full flex-col xl:flex-row bg-background overflow-hidden relative">
        <AppSidebar 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-[100dvh] relative">
          <TopBar />

          <main className="flex-1 overflow-y-auto bg-background custom-scrollbar relative">
            <div key={activeTab} className="h-full w-full max-w-[2000px] mx-auto">
              <Suspense fallback={<PageSkeleton />}>
                <div className="p-2 sm:p-4 xl:p-8 h-full">
                  <TabRenderer activeTab={activeTab} isWide={true} isMobile={isMobile} />
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
