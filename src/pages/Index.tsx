import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useToastStore } from '@/hooks/useToast';
import { useIsMobile, useIsTablet, useIsLandscape } from '@/hooks/use-mobile';
import TopBar from '@/components/TopBar';
import LeftPanel from '@/components/LeftPanel';
import RightPanel from '@/components/RightPanel';
import HistoryPanel from '@/components/HistoryPanel';
import ToastContainer from '@/components/ToastContainer';
import ConfigModal from '@/components/ConfigModal';
import ShortcutsModal from '@/components/ShortcutsModal';
import { Construction } from 'lucide-react';

type AppTab = 'tecido' | 'madeira' | 'motor' | 'table' | 'history';

export default function Index() {
  const { loadFromStorage, undo, loadHistory, setMode } = useAppStore();
  const registros = useAppStore(s => s.registros);
  const addToast = useToastStore(s => s.addToast);
  const [configOpen, setConfigOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('tecido');
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isLandscape = useIsLandscape();

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

  // Sync mode when switching tabs
  const handleTabChange = (tab: AppTab) => {
    setActiveTab(tab);
    if (tab === 'tecido') {
      const currentMode = useAppStore.getState().currentMode;
      if (currentMode === 'madeira') setMode('manual');
    } else if (tab === 'madeira') {
      setMode('madeira');
    }
  };

  const showTabs = (isMobile || isTablet) && !isLandscape;
  const isFormTab = activeTab === 'tecido' || activeTab === 'madeira' || activeTab === 'motor';

  const tabs: { key: AppTab; label: string; badge?: number }[] = [
    { key: 'tecido', label: 'Tecido' },
    { key: 'madeira', label: 'Madeira' },
    { key: 'motor', label: 'Motor/Controle' },
    { key: 'table', label: 'Tabela', badge: registros.length || undefined },
    { key: 'history', label: 'Histórico' },
  ];

  // Desktop right panel tab (table vs history) — only relevant in desktop mode
  const [desktopRightTab, setDesktopRightTab] = useState<'table' | 'history'>('table');

  // When clicking table/history in desktop, update the right panel
  const handleDesktopTab = (tab: AppTab) => {
    if (tab === 'table' || tab === 'history') {
      setDesktopRightTab(tab);
      setActiveTab(tab);
    } else {
      handleTabChange(tab);
    }
  };

  const renderNavBar = () => (
    <div className={`flex border-b border-border bg-card flex-shrink-0 ${showTabs ? 'overflow-x-auto scrollbar-none' : ''}`}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => showTabs ? handleTabChange(tab.key) : handleDesktopTab(tab.key)}
          className={`whitespace-nowrap px-4 py-3 text-sm font-medium uppercase tracking-wider transition-colors relative ${
            (showTabs ? activeTab === tab.key : (
              // Desktop: highlight form tabs OR right panel tabs
              (tab.key === 'table' || tab.key === 'history')
                ? desktopRightTab === tab.key
                : activeTab === tab.key
            ))
              ? 'text-foreground font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {tab.label}
          {tab.badge && tab.badge > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1">
              {tab.badge}
            </span>
          )}
          {(showTabs ? activeTab === tab.key : (
            (tab.key === 'table' || tab.key === 'history')
              ? desktopRightTab === tab.key
              : activeTab === tab.key
          )) && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      ))}
    </div>
  );

  const renderMotorPlaceholder = () => (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground p-8">
      <Construction className="w-12 h-12 opacity-30" />
      <div className="text-center">
        <div className="text-lg font-semibold mb-1">Motor / Controle</div>
        <div className="text-sm opacity-70">Em breve</div>
      </div>
    </div>
  );

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden">
      <TopBar onOpenConfig={() => setConfigOpen(true)} />
      {renderNavBar()}

      {showTabs ? (
        <div className="flex-1 overflow-hidden">
          {activeTab === 'tecido' && <LeftPanel />}
          {activeTab === 'madeira' && <LeftPanel />}
          {activeTab === 'motor' && renderMotorPlaceholder()}
          {activeTab === 'table' && <RightPanel />}
          {activeTab === 'history' && <HistoryPanel />}
        </div>
      ) : (
        <div className={`flex-1 grid overflow-hidden ${(isMobile || isTablet) && isLandscape ? 'grid-cols-[360px_1fr]' : 'grid-cols-[420px_1fr]'}`}>
          {/* Left: always show form panel based on activeTab */}
          {activeTab === 'motor' ? renderMotorPlaceholder() : <LeftPanel />}
          {/* Right: table or history */}
          <div className="flex flex-col overflow-hidden">
            {desktopRightTab === 'history' ? <HistoryPanel /> : <RightPanel />}
          </div>
        </div>
      )}

      <ToastContainer />
      <ConfigModal open={configOpen} onClose={() => setConfigOpen(false)} />
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}
