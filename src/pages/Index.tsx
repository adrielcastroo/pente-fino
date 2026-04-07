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
import { PenLine, Table, FolderClock } from 'lucide-react';

export default function Index() {
  const { loadFromStorage, undo, loadHistory } = useAppStore();
  const registros = useAppStore(s => s.registros);
  const addToast = useToastStore(s => s.addToast);
  const [configOpen, setConfigOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'table' | 'history'>('form');
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

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

  const showTabs = isMobile || isTablet;

  const tabs = [
    { key: 'form' as const, label: 'Conferir', icon: PenLine },
    { key: 'table' as const, label: 'Tabela', icon: Table, badge: registros.length || undefined },
    { key: 'history' as const, label: 'Histórico', icon: FolderClock },
  ];

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden">
      <TopBar onOpenConfig={() => setConfigOpen(true)} />

      {showTabs && (
        <div className="flex border-b border-border bg-card flex-shrink-0">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === tab.key
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.badge && tab.badge > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {showTabs ? (
        <div className="flex-1 overflow-hidden">
          {activeTab === 'form' && <LeftPanel />}
          {activeTab === 'table' && <RightPanel />}
          {activeTab === 'history' && <HistoryPanel />}
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-[420px_1fr] overflow-hidden">
          <LeftPanel />
          <div className="flex flex-col overflow-hidden">
            <div className="flex border-b border-border bg-card flex-shrink-0">
              <button
                onClick={() => setActiveTab('table')}
                className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab !== 'history' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'
                }`}
              >
                <Table className="w-3.5 h-3.5" /> Tabela
                {registros.length > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[16px] h-[16px] rounded-full bg-primary text-primary-foreground text-[9px] font-bold px-1">{registros.length}</span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'history' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'
                }`}
              >
                <FolderClock className="w-3.5 h-3.5" /> Histórico
              </button>
            </div>
            {activeTab === 'history' ? <HistoryPanel /> : <RightPanel />}
          </div>
        </div>
      )}

      <ToastContainer />
      <ConfigModal open={configOpen} onClose={() => setConfigOpen(false)} />
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}
