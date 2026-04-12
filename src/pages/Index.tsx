import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useToastStore } from '@/hooks/useToast';
import TopBar from '@/components/TopBar';
import LeftPanel from '@/components/LeftPanel';
import RightPanel from '@/components/RightPanel';
import HistoryPanel from '@/components/HistoryPanel';
import ToastContainer from '@/components/ToastContainer';
import ConfigModal from '@/components/ConfigModal';
import ShortcutsModal from '@/components/ShortcutsModal';
import AppSidebar from '@/components/AppSidebar';
import DashboardPage from '@/components/DashboardPage';
import MotorControlePage from '@/components/MotorControlePage';
import EstoquePage from '@/components/EstoquePage';
import { SidebarProvider } from '@/components/ui/sidebar';
import { motion, AnimatePresence } from 'framer-motion';

type AppTab = 'inicio' | 'tecido' | 'madeira' | 'motor' | 'estoque' | 'table' | 'history';

export default function Index() {
  const { loadFromStorage, undo, loadHistory, setMode } = useAppStore();
  const addToast = useToastStore(s => s.addToast);
  const [configOpen, setConfigOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { formData, setFormData } = useAppStore();
  const activeTab = formData.activeTab;
  const setActiveTab = (tab: AppTab) => setFormData({ activeTab: tab });

  useEffect(() => {
    loadFromStorage();
    loadHistory();
  }, [loadFromStorage, loadHistory]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA';
      if (shortcutsOpen || configOpen) {
        if (e.key === 'Escape') { setShortcutsOpen(false); setConfigOpen(false); }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); const r = undo(); if (r) addToast('Rolo restaurado', 'ok'); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && !typing) {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('[placeholder*="Filtrar"]')?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setShortcutsOpen(true); }
      if ((e.ctrlKey || e.metaKey) && e.key === ',') { e.preventDefault(); setConfigOpen(true); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [undo, addToast, configOpen, shortcutsOpen]);

  const handleTabChange = (tab: AppTab) => {
    setActiveTab(tab);
    if (tab === 'tecido') {
      const currentMode = useAppStore.getState().currentMode;
      if (currentMode === 'madeira') setMode('manual');
    } else if (tab === 'madeira') {
      setMode('madeira');
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        <AppSidebar activeTab={activeTab} onTabChange={handleTabChange} onOpenConfig={() => setConfigOpen(true)} />

        <div className="flex-1 flex flex-col overflow-hidden h-[100dvh]">
          <TopBar />

          <div className="flex-1 overflow-y-auto bg-background/50">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="h-full"
              >
                {activeTab === 'inicio' && <DashboardPage />}
                {activeTab === 'tecido' && <LeftPanel />}
                {activeTab === 'madeira' && <LeftPanel />}
                {activeTab === 'motor' && <MotorControlePage />}
                {activeTab === 'estoque' && <EstoquePage />}
                {activeTab === 'table' && <RightPanel />}
                {activeTab === 'history' && <HistoryPanel />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <ToastContainer />
      <ConfigModal open={configOpen} onClose={() => setConfigOpen(false)} />
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </SidebarProvider>
  );
}
