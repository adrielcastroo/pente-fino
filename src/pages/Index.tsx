import { useEffect, useState, lazy, Suspense } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import TopBar from '@/components/TopBar';
import AppSidebar from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { motion, AnimatePresence } from 'framer-motion';

const LeftPanel = lazy(() => import('@/components/LeftPanel'));
const RightPanel = lazy(() => import('@/components/RightPanel'));
const HistoryPanel = lazy(() => import('@/components/HistoryPanel'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const MotorControlePage = lazy(() => import('@/pages/MotorControlePage'));
const EstoquePage = lazy(() => import('@/pages/EstoquePage'));
const SaidaPage = lazy(() => import('@/pages/SaidaPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
// ... keep existing code
const ShortcutsModal = lazy(() => import('@/components/ShortcutsModal'));

const PageSkeleton = () => (
  <div className="p-8 space-y-4 animate-pulse">
    <div className="h-8 bg-muted rounded w-1/4" />
    <div className="h-32 bg-muted rounded w-full" />
    <div className="grid grid-cols-3 gap-4">
      <div className="h-24 bg-muted rounded" />
      <div className="h-24 bg-muted rounded" />
      <div className="h-24 bg-muted rounded" />
    </div>
  </div>
);

const TabRenderer = ({ activeTab, isWide }: { activeTab: string; isWide?: boolean }) => {
  const isFormTab = ['tecido', 'madeira', 'motor', 'manual'].includes(activeTab);
  
  if (isWide && isFormTab) {
    return (
      <div className="flex flex-col xl:flex-row h-full gap-6">
        <div className="w-full xl:w-[450px] 2xl:w-[550px] shrink-0 h-full">
          {activeTab === 'motor' ? <MotorControlePage /> : <LeftPanel />}
        </div>
        <div className="flex-1 min-w-0 h-full border-l border-border/20 pl-6 hidden xl:block">
          <RightPanel />
        </div>
      </div>
    );
  }

  switch (activeTab) {
    case 'inicio': return <DashboardPage />;
    case 'tecido':
    case 'madeira': return <LeftPanel />;
    case 'motor': return <MotorControlePage />;
    case 'estoque': return <EstoquePage />;
    case 'saida': return <SaidaPage />;
    case 'table': return <RightPanel />;
    case 'history': return <HistoryPanel />;
    case 'settings': return <SettingsPage />;
    default: return <DashboardPage />;
  }
};

export default function Index() {
  const loadHistory = useAppStore(s => s.loadHistory);
  const { activeTab, handleTabChange } = useAppNavigation();
  // configOpen removed
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

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
      <div className="min-h-[100dvh] flex w-full flex-col lg:flex-row bg-background/30 overflow-hidden relative">
        <AppSidebar 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-[100dvh] relative">
          <TopBar />

          <main className="flex-1 overflow-y-auto bg-background/20 custom-scrollbar relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="h-full w-full max-w-[2000px] mx-auto"
              >
                <Suspense fallback={<PageSkeleton />}>
                  <div className="p-2 sm:p-6 lg:p-8 h-full">
                    <TabRenderer activeTab={activeTab} isWide={true} />
                  </div>
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      <Suspense fallback={null}>
        {/* <ConfigModal open={configOpen} onClose={() => setConfigOpen(false)} /> */}
        <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      </Suspense>
    </SidebarProvider>
  );
}
