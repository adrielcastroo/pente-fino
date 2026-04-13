import { useEffect, useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { AppTab } from '@/types';
import { toast } from 'sonner';
import TopBar from '@/components/TopBar';
import AppSidebar from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { motion, AnimatePresence } from 'framer-motion';

// Lazy loading components for better initial load performance
const LeftPanel = lazy(() => import('@/components/LeftPanel'));
const RightPanel = lazy(() => import('@/components/RightPanel'));
const HistoryPanel = lazy(() => import('@/components/HistoryPanel'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const MotorControlePage = lazy(() => import('@/pages/MotorControlePage'));
const EstoquePage = lazy(() => import('@/pages/EstoquePage'));
const SaidaPage = lazy(() => import('@/pages/SaidaPage'));
const ConfigModal = lazy(() => import('@/components/ConfigModal'));
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

export default function Index() {
  const loadHistory = useAppStore(s => s.loadHistory);
  const setMode = useAppStore(s => s.setMode);
  const currentMode = useAppStore(s => s.currentMode);
  
  const [configOpen, setConfigOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const activeTab = useAppStore(s => s.formData.activeTab);
  const setFormData = useAppStore(s => s.setFormData);
  
  const setActiveTab = useCallback((tab: AppTab) => setFormData({ activeTab: tab }), [setFormData]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useKeyboardShortcuts({
    shortcutsOpen,
    setShortcutsOpen,
    configOpen,
    setConfigOpen,
  });

  const handleTabChange = useCallback((tab: AppTab) => {
    setActiveTab(tab);
    if (tab === 'tecido') {
      if (currentMode === 'madeira') setMode('manual');
    } else if (tab === 'madeira') {
      setMode('madeira');
    }
  }, [setActiveTab, currentMode, setMode]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'inicio': return <DashboardPage />;
      case 'tecido':
      case 'madeira': return <LeftPanel />;
      case 'motor': return <MotorControlePage />;
      case 'estoque': return <EstoquePage />;
      case 'saida': return <SaidaPage />;
      case 'table': return <RightPanel />;
      case 'history': return <HistoryPanel />;
      default: return <DashboardPage />;
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        <AppSidebar 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
          onOpenConfig={() => setConfigOpen(true)} 
        />

        <div className="flex-1 flex flex-col overflow-hidden h-[100dvh]">
          <TopBar />

          <div className="flex-1 overflow-y-auto bg-background/50">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="h-full"
              >
                <Suspense fallback={<PageSkeleton />}>
                  {renderActiveTab()}
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        <ConfigModal open={configOpen} onClose={() => setConfigOpen(false)} />
        <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      </Suspense>
    </SidebarProvider>
  );
}
